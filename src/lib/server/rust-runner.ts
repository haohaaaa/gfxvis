import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { withCacheLock } from "./cache-lock";
import {
  runProcess,
  runnerEnvironment,
  type ProcessResult,
} from "./runner-process";

export interface RustRunOptions {
  code: string;
  cargoToml?: string;
  projectRoot?: string;
  compileTimeoutMs?: number;
  runTimeoutMs?: number;
  env?: NodeJS.ProcessEnv;
}

export function rustCacheKey(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function parseCargoOutput(stdout: string, manifestPath: string) {
  const executables = new Set<string>();
  const diagnostics: string[] = [];
  const otherOutput: string[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      otherOutput.push(line);
      continue;
    }
    if (
      message?.reason === "compiler-message" &&
      typeof message.message?.rendered === "string"
    ) {
      diagnostics.push(message.message.rendered);
    }
    if (
      message?.reason === "compiler-artifact" &&
      typeof message.manifest_path === "string" &&
      resolve(message.manifest_path) === resolve(manifestPath) &&
      Array.isArray(message.target?.kind) &&
      message.target.kind.includes("bin") &&
      typeof message.executable === "string"
    ) {
      executables.add(message.executable);
    }
  }
  return {
    executables: [...executables],
    diagnostics: diagnostics.join(""),
    stdout: otherOutput.join("\n"),
  };
}

async function writeIfChanged(path: string, contents: string) {
  try {
    if ((await readFile(path, "utf8")) === contents) return;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  await writeFile(path, contents, "utf8");
}

function failure(stderr: string, exitCode = 1): ProcessResult {
  return { stdout: "", stderr, exitCode, timedOut: false };
}

export async function runRust(options: RustRunOptions): Promise<ProcessResult> {
  const root = resolve(options.projectRoot ?? process.cwd(), "temp/rust");
  const runDir = join(root, "runs", randomUUID());
  const binPath = join(
    runDir,
    process.platform === "win32" ? "main.exe" : "main",
  );
  const env = { ...(options.env ?? runnerEnvironment()) };
  const runTimeoutMs = options.runTimeoutMs ?? 8_000;
  await mkdir(runDir, { recursive: true });
  try {
    if (options.cargoToml === undefined) {
      const source = join(runDir, "main.rs");
      await writeFile(source, options.code, "utf8");
      const compiled = await runProcess(
        "rustc",
        ["--edition=2024", "-O", source, "-o", binPath],
        {
          cwd: runDir,
          env,
          timeoutMs: options.compileTimeoutMs ?? 8_000,
          stage: "编译",
        },
      );
      if (compiled.systemErrorCode === "ENOENT")
        return failure(
          "[环境缺失] 未检测到 rustc，请安装 Rust 工具链并确认 PATH 配置。",
          127,
        );
      if (compiled.exitCode !== 0) return compiled;
      const result = await runProcess(binPath, [], {
        cwd: runDir,
        env,
        timeoutMs: runTimeoutMs,
        stage: "运行",
      });
      return { ...result, stderr: compiled.stderr + result.stderr };
    }

    env.CARGO_HOME = join(root, "cargo-home");
    await mkdir(env.CARGO_HOME, { recursive: true });
    const compileTimeoutMs = options.compileTimeoutMs ?? 180_000;
    const cargo = await runProcess("cargo", ["--version"], {
      cwd: runDir,
      env,
      timeoutMs: 8_000,
      stage: "工具检测",
    });
    if (cargo.systemErrorCode === "ENOENT")
      return failure(
        "[环境缺失] 提供 Cargo.toml 的 Rust 示例需要 Cargo，请安装 Rust 工具链并确认 PATH 配置。",
        127,
      );
    if (cargo.exitCode !== 0) return cargo;
    const rustc = await runProcess("rustc", ["-vV"], {
      cwd: runDir,
      env,
      timeoutMs: 8_000,
      stage: "工具检测",
    });
    if (rustc.systemErrorCode === "ENOENT")
      return failure(
        "[环境缺失] 未检测到 rustc，请安装 Rust 工具链并确认 PATH 配置。",
        127,
      );
    if (rustc.exitCode !== 0) return rustc;
    const manifest = options.cargoToml;
    const manifestKey = rustCacheKey(manifest);
    const projectDir = join(root, "projects", manifestKey);
    const manifestPath = join(projectDir, "Cargo.toml");
    const targetDir = join(
      root,
      "targets",
      rustCacheKey(`${cargo.stdout}\n${rustc.stdout}\n${manifestKey}`),
    );
    env.CARGO_TARGET_DIR = targetDir;
    const compiled = await withCacheLock(
      join(root, "locks", manifestKey),
      async () => {
        await mkdir(join(projectDir, "src"), { recursive: true });
        await writeIfChanged(manifestPath, manifest);
        await writeIfChanged(join(projectDir, "src/main.rs"), options.code);
        const result = await runProcess(
          "cargo",
          [
            "build",
            "--quiet",
            "--release",
            "--message-format=json",
            "--manifest-path",
            manifestPath,
            "--target-dir",
            targetDir,
          ],
          {
            cwd: projectDir,
            env,
            timeoutMs: compileTimeoutMs,
            stage: "依赖下载或编译",
          },
        );
        const output = parseCargoOutput(result.stdout, manifestPath);
        const buildResult = {
          ...result,
          stdout: output.stdout,
          stderr: output.diagnostics + result.stderr,
        };
        if (result.exitCode !== 0) {
          if (!result.timedOut)
            buildResult.stderr = `[Cargo 清单、依赖或编译失败]\n${buildResult.stderr}`;
          return buildResult;
        }
        if (output.executables.length !== 1)
          return failure(
            "[Cargo 执行目标错误] 清单的根包必须且只能生成一个可运行 binary，源码由执行器保存为 src/main.rs。",
          );
        await copyFile(output.executables[0], binPath);
        return buildResult;
      },
    );
    if (compiled.exitCode !== 0) return compiled;
    const result = await runProcess(binPath, [], {
      cwd: runDir,
      env,
      timeoutMs: runTimeoutMs,
      stage: "运行",
    });
    return { ...result, stderr: compiled.stderr + result.stderr };
  } catch (error) {
    return failure(
      `[Rust 执行失败] ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    await rm(runDir, { recursive: true, force: true });
  }
}
