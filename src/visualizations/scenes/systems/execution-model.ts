export type WaitMode = "blocking" | "nonblocking";
export type CompletionMode = "sync" | "async";
export type TaskStatus =
  | "pending"
  | "ready"
  | "running"
  | "blocked"
  | "waiting"
  | "done";

export interface ExecutionTask {
  id: string;
  label: string;
  startTick: number;
  computeBefore: number;
  waitDuration: number;
  computeAfter: number;
  waitMode: WaitMode;
  completion: CompletionMode;
}

export interface TaskSnapshot {
  taskId: string;
  status: TaskStatus;
  phase: "before" | "wait" | "after" | "done";
  threadId: number | null;
  cpuId: number | null;
}

export interface ExecutionSnapshot {
  tick: number;
  tasks: TaskSnapshot[];
  /** FIFO order after the currently running threads have been selected. */
  readyQueue: string[];
}

export interface ExecutionSegment extends TaskSnapshot {
  start: number;
  end: number;
}

export interface ExecutionResult {
  duration: number;
  cpuCount: number;
  threadCount: number;
  snapshots: ExecutionSnapshot[];
  segments: ExecutionSegment[];
  completedAt: Record<string, number>;
  concurrent: boolean;
  parallel: boolean;
  maxRunning: number;
  computeTicks: number;
  blockedTicks: number;
}

export const CPU_PRESETS = [
  { id: "single", label: "1 CPU／2 线程", cpuCount: 1, threadCount: 2 },
  { id: "dual", label: "2 CPU／2 线程", cpuCount: 2, threadCount: 2 },
  {
    id: "oversubscribed",
    label: "4 CPU／10 线程",
    cpuCount: 4,
    threadCount: 10,
  },
] as const;

export const INITIAL_TASKS: readonly ExecutionTask[] = [
  {
    id: "download",
    label: "A：网络下载",
    startTick: 0,
    computeBefore: 2,
    waitDuration: 5,
    computeAfter: 2,
    waitMode: "nonblocking",
    completion: "async",
  },
  {
    id: "geometry",
    label: "B：几何计算",
    startTick: 0,
    computeBefore: 6,
    waitDuration: 0,
    computeAfter: 0,
    waitMode: "blocking",
    completion: "sync",
  },
  {
    id: "log",
    label: "C：日志写入",
    startTick: 2,
    computeBefore: 1,
    waitDuration: 3,
    computeAfter: 1,
    waitMode: "blocking",
    completion: "sync",
  },
];

export function createCpuTasks(threadCount: number): ExecutionTask[] {
  return Array.from({ length: threadCount }, (_, index) => ({
    id: `thread-${index + 1}`,
    label: `T${index + 1}`,
    startTick: 0,
    computeBefore: 4,
    waitDuration: 0,
    computeAfter: 0,
    waitMode: "blocking",
    completion: "sync",
  }));
}

interface TaskState {
  task: ExecutionTask;
  status: TaskStatus;
  phase: TaskSnapshot["phase"];
  before: number;
  after: number;
  wakeAt: number;
  threadId: number | null;
}

/**
 * A deterministic teaching model, not Linux's actual scheduling algorithm.
 * A task leases a worker until completion or a nonblocking wait. Runnable
 * workers share CPUs using a one-tick round-robin quantum. With one worker,
 * computation cannot switch to another task until it finishes or waits.
 */
export function simulateExecution(
  tasks: readonly ExecutionTask[],
  { threadCount, cpuCount }: { threadCount: number; cpuCount: number },
): ExecutionResult {
  if (
    !Number.isInteger(threadCount) ||
    threadCount < 1 ||
    threadCount > 12 ||
    !Number.isInteger(cpuCount) ||
    cpuCount < 1 ||
    cpuCount > 4
  ) {
    throw new RangeError("线程数须为 1～12，逻辑 CPU 数须为 1～4。");
  }
  const ids = new Set<string>();
  for (const task of tasks) {
    if (ids.has(task.id)) throw new Error("任务 ID 必须唯一。");
    ids.add(task.id);
    for (const value of [
      task.startTick,
      task.computeBefore,
      task.waitDuration,
      task.computeAfter,
    ]) {
      if (!Number.isInteger(value) || value < 0 || value > 24) {
        throw new RangeError("任务时间须为 0～24 的整数。");
      }
    }
  }

  const states: TaskState[] = tasks.map((task) => ({
    task,
    status: "pending",
    phase: "before",
    before: task.computeBefore,
    after: task.computeAfter,
    wakeAt: 0,
    threadId: null,
  }));
  const workers: Array<TaskState | null> = Array.from(
    { length: threadCount },
    () => null,
  );
  const taskQueue: TaskState[] = [];
  const runQueue: number[] = [];
  const snapshots: ExecutionSnapshot[] = [];
  const segments: ExecutionSegment[] = [];
  const lastSegments = new Map<string, ExecutionSegment>();
  const completedAt: Record<string, number> = Object.create(null);

  function release(state: TaskState) {
    if (state.threadId !== null) workers[state.threadId] = null;
    state.threadId = null;
  }

  function finish(state: TaskState, tick: number) {
    state.status = "done";
    state.phase = "done";
    completedAt[state.task.id] = tick;
    release(state);
  }

  function advance(state: TaskState, tick: number) {
    if (state.phase === "before" && state.before === 0) {
      if (state.task.waitDuration > 0) {
        state.phase = "wait";
        state.wakeAt = tick + state.task.waitDuration;
        state.status =
          state.task.waitMode === "blocking" ? "blocked" : "waiting";
        if (state.status === "waiting") release(state);
        return;
      }
      state.phase = "after";
    }
    if (state.phase === "after" && state.after === 0) finish(state, tick);
  }

  function enqueueWorker(state: TaskState) {
    if (state.threadId !== null && state.status === "ready")
      runQueue.push(state.threadId);
  }

  function snapshot(tick: number, selected: number[]): ExecutionSnapshot {
    return {
      tick,
      tasks: states.map((state) => ({
        taskId: state.task.id,
        status: state.status,
        phase: state.phase,
        threadId: state.threadId,
        cpuId:
          state.threadId === null || !selected.includes(state.threadId)
            ? null
            : selected.indexOf(state.threadId),
      })),
      readyQueue: [
        ...runQueue.map((thread) => workers[thread]!.task.id),
        ...taskQueue.map((state) => state.task.id),
      ],
    };
  }

  // A serial execution is an upper bound, including all idle arrival time.
  const limit =
    Math.max(0, ...tasks.map((task) => task.startTick)) +
    tasks.reduce(
      (sum, task) =>
        sum + task.computeBefore + task.waitDuration + task.computeAfter,
      0,
    ) +
    1;
  for (let tick = 0; tick <= limit; tick++) {
    // Wake existing waits before admitting newly arriving work at the same tick.
    for (const state of states) {
      if (state.phase !== "wait" || state.wakeAt > tick) continue;
      state.phase = "after";
      state.status = "ready";
      advance(state, tick);
      if (Object.hasOwn(completedAt, state.task.id)) continue;
      if (state.threadId === null) taskQueue.push(state);
      else enqueueWorker(state);
    }
    for (const state of states) {
      if (state.status !== "pending" || state.task.startTick > tick) continue;
      state.status = "ready";
      taskQueue.push(state);
    }

    // Zero-length phases can release a worker immediately, so keep admitting.
    while (taskQueue.length > 0) {
      const thread = workers.indexOf(null);
      if (thread < 0) break;
      const state = taskQueue.shift()!;
      state.threadId = thread;
      workers[thread] = state;
      advance(state, tick);
      enqueueWorker(state);
    }

    if (states.every((state) => state.status === "done")) {
      snapshots.push(snapshot(tick, []));
      break;
    }

    const selected = runQueue.splice(0, cpuCount);
    for (const thread of selected) workers[thread]!.status = "running";
    const frame = snapshot(tick, selected);
    snapshots.push(frame);
    for (const task of frame.tasks) {
      if (task.status === "pending" || task.status === "done") continue;
      const previous = lastSegments.get(task.taskId);
      if (
        previous &&
        previous.end === tick &&
        previous.status === task.status &&
        previous.phase === task.phase &&
        previous.threadId === task.threadId &&
        previous.cpuId === task.cpuId
      ) {
        previous.end = tick + 1;
      } else {
        const segment = { ...task, start: tick, end: tick + 1 };
        segments.push(segment);
        lastSegments.set(task.taskId, segment);
      }
    }

    for (const thread of selected) {
      const state = workers[thread]!;
      if (state.phase === "before") state.before--;
      else state.after--;
      state.status = "ready";
      advance(state, tick + 1);
      enqueueWorker(state);
    }
  }

  if (Object.keys(completedAt).length !== tasks.length)
    throw new Error("调度模型未能完成任务。");
  const duration = snapshots.at(-1)!.tick;
  const counts = snapshots.map(
    (frame) => frame.tasks.filter((task) => task.status === "running").length,
  );
  return {
    duration,
    threadCount,
    cpuCount,
    snapshots,
    segments,
    completedAt,
    concurrent: tasks.some((first, i) =>
      tasks
        .slice(i + 1)
        .some(
          (second) =>
            Math.max(first.startTick, second.startTick) <
            Math.min(completedAt[first.id], completedAt[second.id]),
        ),
    ),
    parallel: counts.some((count) => count > 1),
    maxRunning: Math.max(0, ...counts),
    computeTicks: counts.reduce((sum, count) => sum + count, 0),
    blockedTicks: snapshots.reduce(
      (sum, frame) =>
        sum + frame.tasks.filter((task) => task.status === "blocked").length,
      0,
    ),
  };
}
