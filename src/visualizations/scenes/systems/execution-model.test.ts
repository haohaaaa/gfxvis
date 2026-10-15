import { deepEqual, equal, ok, throws } from "node:assert/strict";
import { test } from "node:test";
import {
  CPU_PRESETS,
  createCpuTasks,
  simulateExecution,
  type ExecutionResult,
  type ExecutionTask,
} from "./execution-model";

function task(id: string, patch: Partial<ExecutionTask> = {}): ExecutionTask {
  return {
    id,
    label: id,
    startTick: 0,
    computeBefore: 2,
    waitDuration: 0,
    computeAfter: 0,
    waitMode: "nonblocking",
    completion: "async",
    ...patch,
  };
}

function assertResources(result: ExecutionResult, tasks: ExecutionTask[]) {
  for (const frame of result.snapshots) {
    const running = frame.tasks.filter((state) => state.status === "running");
    ok(running.length <= Math.min(result.cpuCount, result.threadCount));
    equal(new Set(running.map((state) => state.cpuId)).size, running.length);
    equal(new Set(running.map((state) => state.threadId)).size, running.length);
    const leased = frame.tasks.filter((state) => state.threadId !== null);
    equal(new Set(leased.map((state) => state.threadId)).size, leased.length);
    for (const state of frame.tasks) {
      if (state.status !== "running") equal(state.cpuId, null);
      if (state.status === "waiting") equal(state.threadId, null);
    }
    equal(new Set(frame.readyQueue).size, frame.readyQueue.length);
    for (const id of frame.readyQueue) {
      equal(frame.tasks.find((state) => state.taskId === id)?.status, "ready");
    }
  }
  for (const item of tasks) {
    const running = result.segments.filter(
      (segment) => segment.taskId === item.id && segment.status === "running",
    );
    equal(
      running.reduce((sum, segment) => sum + segment.end - segment.start, 0),
      item.computeBefore + item.computeAfter,
    );
    ok(Object.hasOwn(result.completedAt, item.id));
    equal(
      result.snapshots.at(-1)?.tasks.find((state) => state.taskId === item.id)
        ?.status,
      "done",
    );
  }
  equal(result.snapshots.at(-1)?.readyQueue.length, 0);
}

test("three CPU presets distinguish concurrency from physical-resource capacity", () => {
  for (const [index, preset] of CPU_PRESETS.entries()) {
    const tasks = createCpuTasks(preset.threadCount);
    const result = simulateExecution(tasks, preset);
    equal(result.duration, [8, 4, 10][index]);
    equal(result.maxRunning, Math.min(preset.cpuCount, preset.threadCount));
    equal(result.concurrent, true);
    equal(result.parallel, preset.cpuCount > 1);
    equal(result.computeTicks, preset.threadCount * 4);
    equal(
      result.snapshots[0].readyQueue.length,
      preset.threadCount - preset.cpuCount,
    );
    assertResources(result, tasks);
  }
});

test("sequential arrivals do not imply concurrency or parallelism", () => {
  const tasks = [task("a"), task("b", { startTick: 2 })];
  const result = simulateExecution(tasks, { threadCount: 2, cpuCount: 2 });
  equal(result.concurrent, false);
  equal(result.parallel, false);
  equal(result.duration, 4);
  assertResources(result, tasks);
});

test("blocking keeps a worker but releases the CPU; nonblocking frees the worker", () => {
  for (const waitMode of ["blocking", "nonblocking"] as const) {
    const tasks = [
      task("download", {
        computeBefore: 1,
        waitDuration: 4,
        computeAfter: 1,
        waitMode,
      }),
      task("geometry"),
    ];
    const result = simulateExecution(tasks, { threadCount: 1, cpuCount: 1 });
    const duringWait = result.snapshots[1];
    equal(
      duringWait.tasks[0].status,
      waitMode === "blocking" ? "blocked" : "waiting",
    );
    equal(
      duringWait.tasks[1].status,
      waitMode === "blocking" ? "ready" : "running",
    );
    equal(duringWait.tasks[0].threadId, waitMode === "blocking" ? 0 : null);
    equal(duringWait.tasks[0].cpuId, null);
    equal(result.duration, waitMode === "blocking" ? 8 : 6);
    equal(result.blockedTicks, waitMode === "blocking" ? 4 : 0);
    assertResources(result, tasks);
  }
});

test("wait starts after actual CPU work, including delays caused by time slicing", () => {
  const tasks = [
    task("a", { computeBefore: 3, waitDuration: 2, computeAfter: 1 }),
    task("b", { computeBefore: 3 }),
  ];
  const result = simulateExecution(tasks, { threadCount: 2, cpuCount: 1 });
  const wait = result.segments.find(
    (segment) => segment.taskId === "a" && segment.status === "waiting",
  );
  equal(wait?.start, 5);
  equal(wait?.end, 7);
  assertResources(result, tasks);
});

test("single-worker event loop never switches tasks in the middle of a compute phase", () => {
  const tasks = [task("a", { computeBefore: 3 }), task("b")];
  const result = simulateExecution(tasks, { threadCount: 1, cpuCount: 1 });
  deepEqual(
    result.snapshots
      .slice(0, 5)
      .map(
        (frame) =>
          frame.tasks.find((state) => state.status === "running")?.taskId,
      ),
    ["a", "a", "a", "b", "b"],
  );
  equal(result.parallel, false);
  assertResources(result, tasks);
});

test("completion labels do not change scheduling or resource use", () => {
  const tasks = [task("a", { waitDuration: 3, computeAfter: 2 }), task("b")];
  const config = { threadCount: 2, cpuCount: 1 };
  deepEqual(
    simulateExecution(tasks, config),
    simulateExecution(
      tasks.map((item) => ({ ...item, completion: "sync" })),
      config,
    ),
  );
});

test("zero-length phases, idle arrivals and terminal state are handled without mutation", () => {
  const tasks = [
    task("empty", { computeBefore: 0, startTick: 2 }),
    task("wait-only", { computeBefore: 0, waitDuration: 4 }),
    task("after-only", { computeBefore: 0, computeAfter: 2 }),
  ];
  const original = structuredClone(tasks);
  const result = simulateExecution(tasks, { threadCount: 1, cpuCount: 1 });
  equal(result.completedAt.empty, 2);
  equal(result.completedAt["wait-only"], 4);
  equal(result.duration, 4);
  deepEqual(tasks, original);
  assertResources(result, tasks);
  equal(simulateExecution([], { threadCount: 1, cpuCount: 1 }).duration, 0);
});

test("schedule extends beyond 24 ticks and preserves resource invariants across configurations", () => {
  const longTasks = [
    task("a", {
      computeBefore: 24,
      waitDuration: 24,
      computeAfter: 24,
      waitMode: "blocking",
    }),
    task("b", {
      computeBefore: 24,
      waitDuration: 24,
      computeAfter: 24,
      waitMode: "blocking",
    }),
  ];
  const long = simulateExecution(longTasks, { threadCount: 1, cpuCount: 1 });
  equal(long.duration, 144);
  assertResources(long, longTasks);
  for (let threadCount = 1; threadCount <= 4; threadCount++) {
    for (let cpuCount = 1; cpuCount <= 4; cpuCount++) {
      const tasks = Array.from({ length: 8 }, (_, index) =>
        task(`t${index}`, {
          startTick: index % 3,
          computeBefore: index % 4,
          waitDuration: index % 5,
          computeAfter: (index + 1) % 3,
          waitMode: index % 2 === 0 ? "blocking" : "nonblocking",
        }),
      );
      assertResources(
        simulateExecution(tasks, { threadCount, cpuCount }),
        tasks,
      );
    }
  }
});

test("invalid resources, timings and duplicate task IDs are rejected", () => {
  throws(
    () => simulateExecution([], { threadCount: 0, cpuCount: 1 }),
    RangeError,
  );
  throws(
    () => simulateExecution([], { threadCount: 1, cpuCount: 5 }),
    RangeError,
  );
  throws(
    () =>
      simulateExecution([task("a", { waitDuration: -1 })], {
        threadCount: 1,
        cpuCount: 1,
      }),
    RangeError,
  );
  throws(() =>
    simulateExecution([task("a"), task("a")], { threadCount: 1, cpuCount: 1 }),
  );
});
