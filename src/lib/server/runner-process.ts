import { spawn } from "node:child_process";
import { delimiter, resolve } from "node:path";

export interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timedOut: boolean;
  systemErrorCode?: string;
}

export function runnerEnvironment(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  const pathKey =
    Object.keys(env).find((key) => key.toLowerCase() === "path") ?? "PATH";
  env[pathKey] = [resolve(process.cwd(), "node_modules/.bin"), env[pathKey]]
    .filter(Boolean)
    .join(delimiter);
  delete env.FORCE_COLOR;
  env.NO_COLOR = "1";
  env.CI = "true";
  env.PAGER = "cat";
  return env;
}

/** A separate process group lets timeouts terminate compiler/runtime children too. */
export function runProcess(
  command: string,
  args: string[],
  options: {
    cwd: string;
    env?: NodeJS.ProcessEnv;
    timeoutMs: number;
    stage: string;
  },
): Promise<ProcessResult> {
  return new Promise((resolveResult) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let systemErrorCode: string | undefined;
    let closed = false;
    let terminated = false;
    let exitCode = 1;
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? runnerEnvironment(),
      windowsHide: true,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });

    const finish = () => {
      if (!closed || (timedOut && !terminated)) return;
      clearTimeout(timeout);
      resolveResult({ stdout, stderr, exitCode, timedOut, systemErrorCode });
    };
    const killTree = (signal: NodeJS.Signals) => {
      if (!child.pid) return;
      if (process.platform === "win32") {
        const killer = spawn(
          "taskkill",
          ["/PID", String(child.pid), "/T", "/F"],
          {
            windowsHide: true,
            stdio: "ignore",
          },
        );
        killer.on("error", () => child.kill("SIGKILL"));
      } else {
        try {
          process.kill(-child.pid, signal);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ESRCH") {
            stderr += `\n[终止进程失败] ${String(error)}`;
          }
        }
      }
    };
    const timeout = setTimeout(() => {
      timedOut = true;
      stderr += `\n[${options.stage}超时] 超过 ${options.timeoutMs / 1000} 秒，已终止进程及其子进程。`;
      killTree("SIGTERM");
      setTimeout(() => {
        killTree("SIGKILL");
        terminated = true;
        finish();
      }, 250);
    }, options.timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (error: NodeJS.ErrnoException) => {
      systemErrorCode = error.code;
      stderr += `\n[系统执行错误] ${error.message}`;
    });
    child.on("close", (code) => {
      closed = true;
      exitCode = timedOut
        ? 124
        : systemErrorCode === "ENOENT"
          ? 127
          : (code ?? 1);
      finish();
    });
  });
}
