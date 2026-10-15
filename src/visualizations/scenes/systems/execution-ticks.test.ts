import { deepEqual, equal, ok } from "node:assert/strict";
import { test } from "node:test";
import {
  createCpuTasks,
  simulateExecution,
  CPU_PRESETS,
  type ExecutionTask,
} from "./execution-model";
import {
  computeTickLabel,
  deriveComputeTicks,
  describeComputeTick,
  moveTickPosition,
} from "./execution-ticks";

test("single CPU labels count each thread's own work, not global ticks", () => {
  const tasks = createCpuTasks(2);
  const result = simulateExecution(tasks, { threadCount: 2, cpuCount: 1 });
  const original = JSON.stringify(result);
  const cells = deriveComputeTicks(tasks, result);
  deepEqual(
    cells.map((cell) => [cell.taskLabel, cell.start, cell.ordinal]),
    [
      ["T1", 0, 1],
      ["T2", 1, 1],
      ["T1", 2, 2],
      ["T2", 3, 2],
      ["T1", 4, 3],
      ["T2", 5, 3],
      ["T1", 6, 4],
      ["T2", 7, 4],
    ],
  );
  ok(cells.every((cell) => cell.total === 4 && cell.end === cell.start + 1));
  equal(
    describeComputeTick(cells[2]),
    "T1：第 2／4 个计算 tick（CPU 0，全局 t=2→3）",
  );
  equal(JSON.stringify(result), original);
});

test("continuous execution on dual CPUs splits into four labelled cells per thread", () => {
  const tasks = createCpuTasks(2);
  const result = simulateExecution(tasks, { threadCount: 2, cpuCount: 2 });
  equal(result.segments.length, 2);
  const cells = deriveComputeTicks(tasks, result);
  equal(cells.length, 8);
  for (const task of tasks) {
    deepEqual(
      cells
        .filter((cell) => cell.taskId === task.id)
        .map((cell) => cell.ordinal),
      [1, 2, 3, 4],
    );
  }
});

test("CPU migration preserves tick ordinals in the oversubscribed preset", () => {
  const preset = CPU_PRESETS[2];
  const tasks = createCpuTasks(preset.threadCount);
  const cells = deriveComputeTicks(tasks, simulateExecution(tasks, preset));
  equal(cells.length, 40);
  for (const task of tasks) {
    const own = cells.filter((cell) => cell.taskId === task.id);
    deepEqual(
      own.map((cell) => cell.ordinal),
      [1, 2, 3, 4],
    );
  }
  ok(
    new Set(
      cells
        .filter((cell) => cell.taskId === "thread-1")
        .map((cell) => cell.cpuId),
    ).size > 1,
  );
});

test("ready and waiting intervals do not increment work ordinals", () => {
  const tasks: ExecutionTask[] = [
    {
      id: "a",
      label: "A",
      startTick: 3,
      computeBefore: 1,
      waitDuration: 4,
      computeAfter: 2,
      waitMode: "nonblocking",
      completion: "async",
    },
  ];
  const cells = deriveComputeTicks(
    tasks,
    simulateExecution(tasks, { threadCount: 1, cpuCount: 1 }),
  );
  deepEqual(
    cells.map((cell) => [cell.start, cell.ordinal]),
    [
      [3, 1],
      [8, 2],
      [9, 3],
    ],
  );
  ok(cells.every((cell) => cell.total === 3));
});

test("fresh presets restart ordinals and terminal frames produce no extra cell", () => {
  for (const preset of CPU_PRESETS) {
    const tasks = createCpuTasks(preset.threadCount);
    const result = simulateExecution(tasks, preset);
    const cells = deriveComputeTicks(tasks, result);
    equal(cells[0].ordinal, 1);
    ok(cells.every((cell) => cell.start < result.duration));
  }
});

test("keyboard selection stays inside time and CPU bounds", () => {
  deepEqual(moveTickPosition({ tick: 0, cpuId: 0 }, "ArrowLeft", 8, 4), {
    tick: 0,
    cpuId: 0,
  });
  deepEqual(moveTickPosition({ tick: 7, cpuId: 3 }, "ArrowRight", 8, 4), {
    tick: 7,
    cpuId: 3,
  });
  deepEqual(moveTickPosition({ tick: 2, cpuId: 0 }, "ArrowDown", 8, 4), {
    tick: 2,
    cpuId: 1,
  });
  deepEqual(moveTickPosition({ tick: 2, cpuId: 0 }, "ArrowUp", 8, 4), {
    tick: 2,
    cpuId: 0,
  });
  deepEqual(moveTickPosition({ tick: 2, cpuId: 1 }, "ArrowRight", 8, 4), {
    tick: 3,
    cpuId: 1,
  });
});

test("narrow cells fall back to local progress or an ordinal without clipping text", () => {
  const tasks = createCpuTasks(2);
  const cell = deriveComputeTicks(
    tasks,
    simulateExecution(tasks, { threadCount: 2, cpuCount: 1 }),
  )[0];
  const measure = (text: string) => text.length * 7;
  equal(computeTickLabel(cell, 100, measure), "T1·1/4");
  equal(computeTickLabel(cell, 30, measure), "1/4");
  equal(computeTickLabel(cell, 12, measure), "1");
  equal(computeTickLabel(cell, 4, measure), undefined);
  ok(describeComputeTick(cell).includes("第 1／4 个计算 tick"));
});
