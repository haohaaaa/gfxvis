import { useEffect, useMemo, useRef } from "react";
import "./ExecutionDemo.css";
import CanvasViewport, {
  type CanvasViewportHandle,
} from "../../framework/CanvasViewport";
import {
  drawExecution,
  TIMELINE_WIDTH,
} from "../../../visualizations/scenes/systems/execution-model-canvas";
import type {
  ExecutionResult,
  ExecutionTask,
} from "../../../visualizations/scenes/systems/execution-model";
import { useCpuTickInspection } from "./useCpuTickInspection";

interface Props {
  id: string;
  tasks: readonly ExecutionTask[];
  result: ExecutionResult;
  tick: number;
  mode: "cpu" | "tasks";
  inspectionResetKey?: number;
}

export default function ExecutionCanvas({
  id,
  tasks,
  result,
  tick,
  mode,
  inspectionResetKey = 0,
}: Props) {
  const inspection = useCpuTickInspection(
    tasks,
    result,
    tick,
    mode === "cpu",
    inspectionResetKey,
  );
  const latest = useRef({ tasks, result, tick, mode, inspection });
  latest.current = { tasks, result, tick, mode, inspection };
  const rows = mode === "cpu" ? result.cpuCount : tasks.length;
  const bounds = useMemo(
    () => ({ xMin: 0, xMax: TIMELINE_WIDTH, yMin: 0, yMax: rows + 1 }),
    [rows],
  );

  const vpRef = useRef<CanvasViewportHandle | null>(null);

  useEffect(() => {
    vpRef.current?.setBounds(bounds);
  }, [bounds]);

  useEffect(() => {
    vpRef.current?.redraw();
  }, [tasks, result, tick, mode, inspection.selected]);

  const frame = result.snapshots[tick];
  const queue = frame.readyQueue.map(
    (taskId) => tasks.find((task) => task.id === taskId)!.label.split("：")[0],
  );
  const queueDisplay = (
    <div
      className={
        mode === "cpu"
          ? "min-w-0 overflow-x-auto whitespace-nowrap [scrollbar-width:thin]"
          : "absolute inset-x-2 bottom-5 max-h-12 overflow-y-auto rounded border border-border bg-surface/95 px-2 py-1 text-[11px] text-ink"
      }
      aria-label="当前就绪队列"
      data-testid={`${id}-queue`}
    >
      就绪队列：{queue.length ? queue.join(" → ") : "空"}
    </div>
  );

  return (
    <CanvasViewport
      ref={vpRef}
      initialBounds={bounds}
      equalScale={false}
      margin={44}
      heightClass="h-[var(--demo-height,20rem)]"
      className="execution-demo__viewport relative w-full overflow-hidden rounded-xl border border-border bg-surface"
      testId={`${id}-canvas`}
      onReset={() => {
        inspection.clear();
        vpRef.current?.setBounds(bounds);
      }}
      onHover={inspection.onHover}
      onPointerLeave={inspection.onPointerLeave}
      onLeftDown={inspection.onLeftDown}
      onLeftMove={inspection.onLeftMove}
      onDraw={(ctx, plot, theme) => {
        const data = latest.current;
        drawExecution(
          ctx,
          plot,
          theme,
          data.tasks,
          data.result,
          data.tick,
          data.mode,
          data.inspection.cells,
          data.inspection.selected,
        );
      }}
      canvasProps={{
        tabIndex: mode === "cpu" ? 0 : undefined,
        onKeyDown: mode === "cpu" ? inspection.onKeyDown : undefined,
        "aria-describedby": mode === "cpu" ? `${id}-tick-info` : undefined,
        "aria-keyshortcuts":
          mode === "cpu" ? "ArrowLeft ArrowRight ArrowUp ArrowDown" : undefined,
        "aria-label":
          mode === "cpu"
            ? "逻辑 CPU 与线程调度时间线"
            : "任务计算、就绪与等待时间线",
      }}
    >
      <div
        className={
          mode === "cpu"
            ? "absolute inset-x-2 top-2 grid grid-cols-2 gap-x-3 text-[10px] text-muted pointer-events-none"
            : "pointer-events-none absolute inset-x-2 top-2 flex flex-wrap gap-x-3 text-[10px] text-muted"
        }
      >
        {mode === "cpu" ? (
          <>
            <span className="pointer-events-none truncate">
              格内：自身 tick · 竖线：全局 tick {tick}
            </span>
            <div className="pointer-events-auto">{queueDisplay}</div>
            <span
              id={`${id}-tick-info`}
              data-testid={`${id}-tick-info`}
              className="pointer-events-none col-span-2 min-w-0 truncate"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {inspection.description}
            </span>
          </>
        ) : (
          <>
            <span>实色：执行</span>
            <span>虚线：就绪或等待</span>
            <span>竖线：当前 tick {tick}</span>
          </>
        )}
      </div>
      {mode !== "cpu" && queueDisplay}
    </CanvasViewport>
  );
}
