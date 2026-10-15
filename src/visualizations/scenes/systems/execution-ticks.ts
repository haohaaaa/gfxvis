import type {
  ExecutionResult,
  ExecutionSegment,
  ExecutionTask,
} from "./execution-model";

export interface ComputeTickCell extends ExecutionSegment {
  cpuId: number;
  threadId: number;
  status: "running";
  taskLabel: string;
  ordinal: number;
  total: number;
}

export interface TickPosition {
  tick: number;
  cpuId: number;
}

/** Count CPU work, excluding time spent queued, blocked or waiting. */
export function deriveComputeTicks(
  tasks: readonly ExecutionTask[],
  result: ExecutionResult,
): ComputeTickCell[] {
  const definitions = new Map(tasks.map((task) => [task.id, task]));
  const counts = new Map<string, number>();
  const cells: ComputeTickCell[] = [];
  for (const frame of result.snapshots) {
    for (const state of frame.tasks) {
      if (
        state.status !== "running" ||
        state.cpuId === null ||
        state.threadId === null
      )
        continue;
      const task = definitions.get(state.taskId)!;
      const ordinal = (counts.get(state.taskId) ?? 0) + 1;
      counts.set(state.taskId, ordinal);
      cells.push({
        ...state,
        status: "running",
        cpuId: state.cpuId,
        threadId: state.threadId,
        start: frame.tick,
        end: frame.tick + 1,
        taskLabel: task.label,
        ordinal,
        total: task.computeBefore + task.computeAfter,
      });
    }
  }
  return cells;
}

export function describeComputeTick(cell: ComputeTickCell): string {
  return `${cell.taskLabel}：第 ${cell.ordinal}／${cell.total} 个计算 tick（CPU ${cell.cpuId}，全局 t=${cell.start}→${cell.end}）`;
}

export function computeTickLabel(
  cell: ComputeTickCell,
  width: number,
  measure: (text: string) => number,
): string | undefined {
  return [
    `${cell.taskLabel}·${cell.ordinal}/${cell.total}`,
    `${cell.ordinal}/${cell.total}`,
    String(cell.ordinal),
  ].find((label) => measure(label) + 4 <= width);
}

export function moveTickPosition(
  position: TickPosition,
  key: string,
  duration: number,
  cpuCount: number,
): TickPosition {
  return {
    tick: Math.max(
      0,
      Math.min(
        Math.max(0, duration - 1),
        position.tick +
          (key === "ArrowRight" ? 1 : key === "ArrowLeft" ? -1 : 0),
      ),
    ),
    cpuId: Math.max(
      0,
      Math.min(
        cpuCount - 1,
        position.cpuId + (key === "ArrowDown" ? 1 : key === "ArrowUp" ? -1 : 0),
      ),
    ),
  };
}
