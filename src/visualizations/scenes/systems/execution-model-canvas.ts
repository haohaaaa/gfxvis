import {
  computeNiceTicks,
  drawAxes,
  type Plot2D,
  type ThemeColors,
} from "../../core/2d/plot2d";
import type {
  ExecutionResult,
  ExecutionTask,
  ExecutionSegment,
} from "./execution-model";
import {
  computeTickLabel,
  type ComputeTickCell,
  type TickPosition,
} from "./execution-ticks";
import { taskColorPalette } from "./execution-task-colors";

export const TIMELINE_WIDTH = 24;

export function drawExecution(
  ctx: CanvasRenderingContext2D,
  plot: Plot2D,
  theme: ThemeColors,
  tasks: readonly ExecutionTask[],
  result: ExecutionResult,
  tick: number,
  mode: "cpu" | "tasks",
  cpuTicks: readonly ComputeTickCell[] = [],
  selected: TickPosition | null = null,
) {
  const rows = mode === "cpu" ? result.cpuCount : tasks.length;
  const duration = Math.max(1, result.duration);
  const x = (time: number) =>
    plot.toScreenX((time / duration) * TIMELINE_WIDTH);
  const y = (row: number) => plot.toScreenY(rows - row);
  const styles = getComputedStyle(ctx.canvas);
  const palette = taskColorPalette(
    tasks.length,
    styles.getPropertyValue("--kde-accent").trim() || theme.accent,
    styles.getPropertyValue("--kde-canvas").trim() || theme.bg,
  );
  drawAxes(
    ctx,
    plot,
    theme,
    [],
    [],
    "时间（tick）",
    mode === "cpu" ? "" : "任务",
  );
  ctx.save();
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  for (const time of computeNiceTicks(0, duration, 7)) {
    ctx.strokeStyle = theme.border;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(x(time), y(-0.5));
    ctx.lineTo(x(time), y(rows - 0.5));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "center";
    ctx.fillText(String(time), x(time), plot.toScreenY(0) + 16);
  }
  for (let row = 0; row < rows; row++) {
    ctx.fillStyle = theme.ink;
    ctx.textAlign = "right";
    const label =
      mode === "cpu" ? `CPU ${row}` : tasks[row].label.split("：")[0];
    ctx.fillText(label, x(0) - 8, y(row) + 4);
    ctx.strokeStyle = theme.border;
    ctx.beginPath();
    ctx.moveTo(x(0), y(row) + 13);
    ctx.lineTo(x(result.duration), y(row) + 13);
    ctx.stroke();
  }

  function drawSegment(segment: ExecutionSegment, tickCell?: ComputeTickCell) {
    const taskIndex = tasks.findIndex((task) => task.id === segment.taskId);
    const row = mode === "cpu" ? segment.cpuId : taskIndex;
    if (row === null || row < 0) return;
    const left = x(segment.start);
    const width = Math.max(1, x(segment.end) - left);
    const height = Math.min(
      26,
      Math.abs(plot.toScreenY(0.7) - plot.toScreenY(0)),
    );
    const top = y(row) - height / 2;
    const color = palette[taskIndex];
    ctx.fillStyle = color;
    ctx.globalAlpha =
      segment.status === "running"
        ? 0.72
        : segment.status === "blocked"
          ? 0.3
          : 0.15;
    ctx.fillRect(left, top, width, height);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.setLineDash(segment.status === "running" ? [] : [3, 3]);
    ctx.strokeRect(left, top, width, height);
    ctx.setLineDash([]);
    const labels = [
      segment.status === "running"
        ? `T${segment.threadId! + 1}／CPU ${segment.cpuId}`
        : segment.status === "ready"
          ? "就绪排队"
          : segment.status === "blocked"
            ? "线程阻塞等待"
            : "任务挂起等待",
    ];
    const label = tickCell
      ? computeTickLabel(tickCell, width, (text) => ctx.measureText(text).width)
      : labels.find((text) => ctx.measureText(text).width + 8 < width);
    if (label && height >= 12) {
      ctx.fillStyle = theme.ink;
      ctx.textAlign = "center";
      ctx.fillText(label, left + width / 2, y(row) + 4);
    }
  }

  if (mode === "cpu") {
    cpuTicks.forEach((cell) => drawSegment(cell, cell));
    if (selected) {
      const height = Math.min(
        26,
        Math.abs(plot.toScreenY(0.7) - plot.toScreenY(0)),
      );
      ctx.strokeStyle = theme.ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(
        x(selected.tick) + 1,
        y(selected.cpuId) - height / 2 - 1,
        Math.max(1, x(selected.tick + 1) - x(selected.tick) - 2),
        height + 2,
      );
    }
  } else result.segments.forEach((segment) => drawSegment(segment));
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x(tick), y(-0.5));
  ctx.lineTo(x(tick), y(rows - 0.5));
  ctx.stroke();
  ctx.restore();
}
