import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { after, before, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import {
  tokioYieldCargoToml,
  tokioYieldSnippet,
} from "../examples/rust-cooperative-scheduling";
import { withCacheLock } from "./cache-lock";
import { runProcess, runnerEnvironment } from "./runner-process";
import {
  parseCargoOutput,
  runRust,
  rustCacheKey,
  type RustRunOptions,
} from "./rust-runner";

const fixtureRoot = resolve("temp/rust/tests", randomUUID());
const cacheRoot = join(fixtureRoot, "temp/rust");
const manifest = `[package]\nname = "runner-test"\nversion = "0.1.0"\nedition = "2024"\n`;
const source = 'fn main() { println!("cached"); }';

before(async () => {
  await mkdir(fixtureRoot, { recursive: true });
});
after(async () => {
  await rm(fixtureRoot, { recursive: true, force: true });
});

async function childRun(code: string, timeoutMs = 60_000) {
  return runProcess(
    process.execPath,
    ["--import", "tsx", "--input-type=module", "-e", code],
    {
      cwd: process.cwd(),
      timeoutMs,
      stage: "测试",
      env: runnerEnvironment(),
    },
  );
}

async function rustInChild(options: RustRunOptions) {
  const moduleUrl = pathToFileURL(
    resolve("src/lib/server/rust-runner.ts"),
  ).href;
  const result =
    await childRun(`import { runRust } from ${JSON.stringify(moduleUrl)};
    console.log(JSON.stringify(await runRust(${JSON.stringify(options)})));`);
  assert.equal(result.exitCode, 0, result.stderr);
  return JSON.parse(result.stdout) as Awaited<ReturnType<typeof runRust>>;
}

test("cache keys preserve full manifest changes", () => {
  assert.equal(rustCacheKey(manifest), rustCacheKey(manifest));
  assert.notEqual(
    rustCacheKey(manifest),
    rustCacheKey(`${manifest}\n[profile.release]\nopt-level = 0\n`),
  );
});

test("Cargo messages select only root binary artifacts and preserve diagnostics", () => {
  const manifestPath = join(fixtureRoot, "Cargo.toml");
  const artifact = {
    reason: "compiler-artifact",
    manifest_path: manifestPath,
    target: { kind: ["bin"] },
    executable: "/target/root",
  };
  const output = parseCargoOutput(
    [
      artifact,
      artifact,
      {
        ...artifact,
        manifest_path: "/dependency/Cargo.toml",
        executable: "/target/dependency",
      },
      { ...artifact, target: { kind: ["lib"] }, executable: null },
      { reason: "compiler-message", message: { rendered: "error: example\n" } },
    ]
      .map((message) => JSON.stringify(message))
      .join("\n") + "\nnon-JSON output\n",
    manifestPath,
  );
  assert.deepEqual(output.executables, ["/target/root"]);
  assert.equal(output.diagnostics, "error: example\n");
  assert.equal(output.stdout, "non-JSON output");
  assert.deepEqual(parseCargoOutput("not JSON", manifestPath).executables, []);
});

test("lock releases after failure, serializes callers, and times out without removing live owners", async () => {
  const lockPath = join(fixtureRoot, "unit.lock");
  await assert.rejects(
    withCacheLock(lockPath, async () => {
      throw new Error("failure");
    }),
    /failure/,
  );
  let active = 0;
  await Promise.all(
    Array.from({ length: 4 }, () =>
      withCacheLock(lockPath, async () => {
        assert.equal(active++, 0);
        await delay(15);
        assert.equal(--active, 0);
      }),
    ),
  );
  await withCacheLock(lockPath, async () => {
    await assert.rejects(
      withCacheLock(lockPath, async () => {}, 10),
      /缓存锁超时/,
    );
    assert.equal((await readdir(lockPath)).length, 1);
  });
  await assert.rejects(stat(lockPath), { code: "ENOENT" });
});

test("lock recovers an owner that exited in a different process", async () => {
  const lockPath = join(fixtureRoot, "abandoned.lock");
  const moduleUrl = pathToFileURL(resolve("src/lib/server/cache-lock.ts")).href;
  const result =
    await childRun(`import { withCacheLock } from ${JSON.stringify(moduleUrl)};
    await withCacheLock(${JSON.stringify(lockPath)}, async () => process.exit(0));`);
  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal((await readdir(lockPath)).length, 1);
  assert.equal(
    await withCacheLock(lockPath, async () => "recovered"),
    "recovered",
  );
});

test("process timeout kills descendants that ignore SIGTERM", {
  skip: process.platform === "win32",
}, async () => {
  const marker = join(fixtureRoot, "escaped-child.txt");
  const childCode = `process.on("SIGTERM", () => {}); setTimeout(() => { require("node:fs").writeFileSync(${JSON.stringify(marker)}, "escaped"); }, 1000);`;
  const code = `process.on("SIGTERM", () => {}); require("node:child_process").spawn(process.execPath, ["-e", ${JSON.stringify(childCode)}], { stdio: "inherit" });`;
  const result = await runProcess(process.execPath, ["-e", code], {
    cwd: fixtureRoot,
    timeoutMs: 200,
    stage: "编译",
  });
  assert.equal(result.exitCode, 124);
  assert.equal(result.timedOut, true);
  assert.match(result.stderr, /编译超时/);
  await delay(1100);
  await assert.rejects(stat(marker), { code: "ENOENT" });
});

test("existing standard-library Rust runs through rustc without creating Cargo caches", async () => {
  const result = await runRust({ code: source, projectRoot: fixtureRoot });
  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(result.stdout, "cached\n");
  await assert.rejects(stat(join(cacheRoot, "cargo-home")), { code: "ENOENT" });
  assert.deepEqual(await readdir(join(cacheRoot, "runs")), []);
});

test("manifest and lock persist, identical source is not rewritten, and cache survives another server process", async () => {
  const options = {
    code: source,
    cargoToml: manifest,
    projectRoot: fixtureRoot,
  };
  const first = await runRust(options);
  assert.equal(first.exitCode, 0, first.stderr);
  const project = join(cacheRoot, "projects", rustCacheKey(manifest));
  assert.equal(await readFile(join(project, "Cargo.toml"), "utf8"), manifest);
  const sourceBefore = await stat(join(project, "src/main.rs"));
  const lockBefore = await readFile(join(project, "Cargo.lock"), "utf8");
  const [toolchain] = await readdir(join(cacheRoot, "targets"));
  const executable = join(
    cacheRoot,
    "targets",
    toolchain,
    "release",
    process.platform === "win32" ? "runner-test.exe" : "runner-test",
  );
  const binaryBefore = await stat(executable);
  const second = await rustInChild(options);
  assert.equal(second.exitCode, 0, second.stderr);
  assert.equal(second.stdout, "cached\n");
  assert.equal(
    (await stat(join(project, "src/main.rs"))).mtimeMs,
    sourceBefore.mtimeMs,
  );
  assert.equal((await stat(executable)).mtimeMs, binaryBefore.mtimeMs);
  assert.equal(await readFile(join(project, "Cargo.lock"), "utf8"), lockBefore);
});

test("concurrent processes editing the same manifest never mix source, output, or working files", async () => {
  const results = await Promise.all(
    ["first", "other"].map((name) =>
      rustInChild({
        projectRoot: fixtureRoot,
        cargoToml: manifest,
        code: `fn main() { std::fs::write("marker.txt", "${name}").unwrap(); std::thread::sleep(std::time::Duration::from_millis(150)); println!("{}", std::fs::read_to_string("marker.txt").unwrap()); }`,
      }),
    ),
  );
  for (const [index, result] of results.entries()) {
    assert.equal(result.exitCode, 0, result.stderr);
    assert.equal(result.stdout, `${["first", "other"][index]}\n`);
  }
  assert.deepEqual(await readdir(join(cacheRoot, "runs")), []);
});

test("manifest release profile is honored and uses a distinct cache", async () => {
  const cargoToml = `${manifest}\n[profile.release]\ndebug-assertions = true\n`;
  const result = await runRust({
    projectRoot: fixtureRoot,
    cargoToml,
    code: 'fn main() { println!("{}", cfg!(debug_assertions)); }',
  });
  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(result.stdout, "true\n");
  assert.equal(
    await readFile(
      join(cacheRoot, "projects", rustCacheKey(cargoToml), "Cargo.toml"),
      "utf8",
    ),
    cargoToml,
  );
});

test("manifest and Rust compiler diagnostics stay readable, and failed builds release locks", async () => {
  const invalidManifest = await runRust({
    projectRoot: fixtureRoot,
    cargoToml: "[package",
    code: source,
  });
  assert.notEqual(invalidManifest.exitCode, 0);
  assert.match(invalidManifest.stderr, /Cargo 清单、依赖或编译失败/);
  const invalidCode = await runRust({
    projectRoot: fixtureRoot,
    cargoToml: manifest,
    code: "fn main() { missing_symbol(); }",
  });
  assert.notEqual(invalidCode.exitCode, 0);
  assert.match(invalidCode.stderr, /missing_symbol/);
  assert.doesNotMatch(invalidCode.stdout, /compiler-message/);
  const repaired = await runRust({
    projectRoot: fixtureRoot,
    cargoToml: manifest,
    code: source,
  });
  assert.equal(repaired.exitCode, 0, repaired.stderr);
});

test("Cargo compilation and program execution have separate timeouts", async () => {
  const compiled = await runRust({
    projectRoot: fixtureRoot,
    cargoToml: manifest,
    code: source,
    compileTimeoutMs: 1,
  });
  assert.equal(compiled.exitCode, 124, compiled.stderr);
  assert.match(compiled.stderr, /依赖下载或编译超时/);
  const run = await runRust({
    projectRoot: fixtureRoot,
    cargoToml: manifest,
    code: "fn main() { std::thread::sleep(std::time::Duration::from_secs(30)); }",
    runTimeoutMs: 50,
  });
  assert.equal(run.exitCode, 124, run.stderr);
  assert.match(run.stderr, /运行超时/);
  assert.deepEqual(await readdir(join(cacheRoot, "runs")), []);
});

test("missing Cargo and rustc produce actionable messages without fallback", async () => {
  const env = { ...runnerEnvironment() };
  for (const key of Object.keys(env))
    if (key.toLowerCase() === "path") env[key] = join(fixtureRoot, "no-tools");
  const cargo = await runRust({
    projectRoot: fixtureRoot,
    cargoToml: manifest,
    code: source,
    env,
  });
  assert.equal(cargo.exitCode, 127);
  assert.match(cargo.stderr, /需要 Cargo/);
  const rustc = await runRust({ projectRoot: fixtureRoot, code: source, env });
  assert.equal(rustc.exitCode, 127);
  assert.match(rustc.stderr, /未检测到 rustc/);
});

test("root package must provide exactly one executable", async () => {
  const cargoToml = `${manifest}\nautobins = false\n[[bin]]\nname = "one"\npath = "src/main.rs"\n[[bin]]\nname = "two"\npath = "src/main.rs"\n`;
  const result = await runRust({
    projectRoot: fixtureRoot,
    cargoToml,
    code: source,
  });
  assert.notEqual(result.exitCode, 0);
  assert.match(result.stderr, /只能生成一个可运行 binary/);
});

test("article Tokio example preserves shared counts for all four yield configurations", {
  timeout: 200_000,
}, async () => {
  for (const [yieldA, yieldB] of [
    [false, false],
    [true, true],
    [false, true],
    [true, false],
  ]) {
    const code = tokioYieldSnippet
      .replace("let should_yield_a = false;", `let should_yield_a = ${yieldA};`)
      .replace(
        "let should_yield_b = false;",
        `let should_yield_b = ${yieldB};`,
      );
    const result = await runRust({ code, cargoToml: tokioYieldCargoToml });
    assert.equal(result.exitCode, 0, result.stderr);
    const increments = [
      ...result.stdout.matchAll(/Task ([AB]): total=(\d+), count=(\d+)/g),
    ];
    assert.equal(increments.length, 100);
    const counts = { A: 0, B: 0 };
    for (const [index, match] of increments.entries()) {
      const task = match[1] as "A" | "B";
      assert.equal(Number(match[2]), index + 1);
      assert.equal(Number(match[3]), ++counts[task]);
    }
    const summary = /完成：total=(\d+), Task A=(\d+), Task B=(\d+)/.exec(
      result.stdout,
    );
    assert.ok(summary);
    assert.deepEqual(summary.slice(1).map(Number), [100, counts.A, counts.B]);
    assert.equal(counts.A + counts.B, 100);
    // Neither task yields: whichever one is polled first completes all work.
    // Yielding cases must not assume alternation or a particular distribution.
    if (!yieldA && !yieldB)
      assert.deepEqual(
        [counts.A, counts.B].sort((a, b) => a - b),
        [0, 100],
      );
  }
  const project = resolve(
    "temp/rust/projects",
    rustCacheKey(tokioYieldCargoToml),
  );
  assert.ok(
    (await readFile(join(project, "Cargo.lock"), "utf8")).includes(
      'name = "tokio"',
    ),
  );
});

test("invalid crate versions return dependency resolution errors", {
  timeout: 190_000,
}, async () => {
  // Reuse the article's registry cache; no separate dependency downloads needed.
  const result = await runRust({
    cargoToml: tokioYieldCargoToml.replace("=1.54.1", "=999.0.0"),
    code: source,
  });
  assert.notEqual(result.exitCode, 0);
  assert.match(result.stderr, /999\.0\.0/);
});
