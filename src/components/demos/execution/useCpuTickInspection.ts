import { useMemo, useState, type KeyboardEvent } from "react";
import type { Plot2D } from "../../../visualizations/core/2d/plot2d";
import type {
  ExecutionResult,
  ExecutionTask,
} from "../../../visualizations/scenes/systems/execution-model";
import { TIMELINE_WIDTH } from "../../../visualizations/scenes/systems/execution-model-canvas";
import {
  deriveComputeTicks,
  describeComputeTick,
  moveTickPosition,
  type TickPosition,
} from "../../../visualizations/scenes/systems/execution-ticks";

interface Inspection {
  result: ExecutionResult;
  resetKey: number;
  hover: TickPosition | null;
  pinned: TickPosition | null;
}

function samePosition(a: TickPosition | null, b: TickPosition | null) {
  return a?.tick === b?.tick && a?.cpuId === b?.cpuId;
}

export function useCpuTickInspection(
  tasks: readonly ExecutionTask[],
  result: ExecutionResult,
  tick: number,
  enabled: boolean,
  resetKey: number,
) {
  const cells = useMemo(
    () => (enabled ? deriveComputeTicks(tasks, result) : []),
    [tasks, result, enabled],
  );
  const [stored, setStored] = useState<Inspection | null>(null);
  const current =
    stored?.result === result && stored.resetKey === resetKey ? stored : null;
  const selected = current?.hover ?? current?.pinned ?? null;
  const cell = selected
    ? cells.find(
        (item) => item.start === selected.tick && item.cpuId === selected.cpuId,
      )
    : undefined;
  const description = cell
    ? describeComputeTick(cell)
    : selected
      ? `CPU ${selected.cpuId}：全局 t=${selected.tick}→${selected.tick + 1} 未执行任务`
      : "格内为线程自身的计算 tick；悬停或点选查看，方向键选择时间格与 CPU。";

  function update(kind: "hover" | "pinned", position: TickPosition | null) {
    setStored((previous) => {
      const base =
        previous?.result === result && previous.resetKey === resetKey
          ? previous
          : { result, resetKey, hover: null, pinned: null };
      if (
        samePosition(base[kind], position) &&
        (kind !== "pinned" || base.hover === null)
      )
        return base;
      return {
        ...base,
        [kind]: position,
        ...(kind === "pinned" ? { hover: null } : {}),
      };
    });
  }

  function hitTest(event: PointerEvent, plot: Plot2D): TickPosition | null {
    const target = event.currentTarget as HTMLCanvasElement;
    const rect = target.getBoundingClientRect();
    const px = event.clientX - rect.left;
    const py = event.clientY - rect.top;
    const time = Math.floor(
      (plot.toWorldX(px) / TIMELINE_WIDTH) * Math.max(1, result.duration),
    );
    const cpuId = Math.round(result.cpuCount - plot.toWorldY(py));
    const height = Math.min(
      26,
      Math.abs(plot.toScreenY(0.7) - plot.toScreenY(0)),
    );
    if (
      time < 0 ||
      time >= result.duration ||
      cpuId < 0 ||
      cpuId >= result.cpuCount ||
      Math.abs(py - plot.toScreenY(result.cpuCount - cpuId)) > height / 2
    )
      return null;
    return { tick: time, cpuId };
  }

  return {
    cells,
    selected,
    description,
    clear: () => setStored(null),
    onHover(event: PointerEvent, plot: Plot2D) {
      if (enabled) update("hover", hitTest(event, plot));
    },
    onPointerLeave() {
      if (enabled) update("hover", null);
    },
    onLeftDown(event: PointerEvent, plot: Plot2D) {
      if (!enabled) return false;
      const position = hitTest(event, plot);
      if (!position) return false;
      update("pinned", position);
      (event.currentTarget as HTMLCanvasElement).focus({ preventScroll: true });
      return true;
    },
    onLeftMove(event: PointerEvent, plot: Plot2D) {
      if (enabled) update("pinned", hitTest(event, plot));
    },
    onKeyDown(event: KeyboardEvent<HTMLCanvasElement>) {
      if (
        !enabled ||
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
      )
        return;
      event.preventDefault();
      update(
        "pinned",
        moveTickPosition(
          selected ?? {
            tick: Math.min(tick, Math.max(0, result.duration - 1)),
            cpuId: 0,
          },
          event.key,
          result.duration,
          result.cpuCount,
        ),
      );
    },
  };
}
