import { useState, useEffect, useRef } from "react";
import ExpandableDemo from "../framework/ExpandableDemo";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs, { type KdeTabOption } from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import KdeButton from "../framework/KdeButton";
import KdeBadge from "../framework/KdeBadge";
import ParamSlider from "../framework/ParamSlider";
import AutoMath, { M } from "../framework/AutoMath";

type DiagramViewMode = "dual" | "continuous" | "rref";

const VIEW_MODES: readonly KdeTabOption<DiagramViewMode>[] = [
  { id: "dual", label: "两阶段静态对比 (倾斜 vs 摆正)" },
  { id: "continuous", label: "连续铰链旋转 (空间剪切动效)" },
  { id: "rref", label: "Gauss-Jordan Full Decoupling (正交十字瞄准)" },
];

/** Coordinate mapping helper for SVG views: [-0.5, 4.5] x [-0.5, 5.5] */
function toScreen(
  x: number,
  y: number,
  width: number,
  height: number,
  margin = 32,
) {
  const plotW = width - 2 * margin;
  const plotH = height - 2 * margin;
  const sx = margin + ((x - -0.5) / 5.0) * plotW;
  const sy = height - margin - ((y - -0.5) / 6.0) * plotH;
  return { x: sx, y: sy };
}

function SvgGridAndAxes({
  width,
  height,
  margin = 32,
}: {
  width: number;
  height: number;
  margin?: number;
}) {
  const origin = toScreen(0, 0, width, height, margin);
  const xMinPt = toScreen(-0.5, 0, width, height, margin);
  const xMaxPt = toScreen(4.5, 0, width, height, margin);
  const yMinPt = toScreen(0, -0.5, width, height, margin);
  const yMaxPt = toScreen(0, 5.5, width, height, margin);

  const xTicks = [1, 2, 3, 4];
  const yTicks = [1, 2, 3, 4, 5];

  return (
    <g className="grid-and-axes" opacity={0.85}>
      {/* Background Subtle Grid Lines */}
      {xTicks.map((val) => {
        const top = toScreen(val, 5.5, width, height, margin);
        const bot = toScreen(val, -0.5, width, height, margin);
        return (
          <line
            key={`grid-x-${val}`}
            x1={top.x}
            y1={top.y}
            x2={bot.x}
            y2={bot.y}
            stroke="currentColor"
            className="text-border/30"
            strokeDasharray="2,3"
            strokeWidth={1}
          />
        );
      })}
      {yTicks.map((val) => {
        const left = toScreen(-0.5, val, width, height, margin);
        const right = toScreen(4.5, val, width, height, margin);
        return (
          <line
            key={`grid-y-${val}`}
            x1={left.x}
            y1={left.y}
            x2={right.x}
            y2={right.y}
            stroke="currentColor"
            className="text-border/30"
            strokeDasharray="2,3"
            strokeWidth={1}
          />
        );
      })}

      {/* Main Axes */}
      <line
        x1={xMinPt.x}
        y1={origin.y}
        x2={xMaxPt.x}
        y2={origin.y}
        stroke="currentColor"
        className="text-muted/70"
        strokeWidth={1.4}
      />
      <line
        x1={origin.x}
        y1={yMinPt.y}
        x2={origin.x}
        y2={yMaxPt.y}
        stroke="currentColor"
        className="text-muted/70"
        strokeWidth={1.4}
      />

      {/* Axis Arrows */}
      <path
        d={`M ${xMaxPt.x - 6} ${origin.y - 3} L ${xMaxPt.x} ${origin.y} L ${xMaxPt.x - 6} ${origin.y + 3}`}
        fill="none"
        stroke="currentColor"
        className="text-muted/70"
        strokeWidth={1.4}
      />
      <path
        d={`M ${origin.x - 3} ${yMaxPt.y + 6} L ${origin.x} ${yMaxPt.y} L ${origin.x + 3} ${yMaxPt.y + 6}`}
        fill="none"
        stroke="currentColor"
        className="text-muted/70"
        strokeWidth={1.4}
      />

      {/* Axis Labels */}
      <text
        x={xMaxPt.x - 2}
        y={origin.y + 14}
        className="fill-muted font-mono text-[11px] font-semibold"
        textAnchor="end"
      >
        x
      </text>
      <text
        x={origin.x - 10}
        y={yMaxPt.y + 10}
        className="fill-muted font-mono text-[11px] font-semibold"
        textAnchor="end"
      >
        y
      </text>

      {/* Tick Numbers */}
      {xTicks.map((val) => {
        const pt = toScreen(val, 0, width, height, margin);
        return (
          <text
            key={`tick-x-${val}`}
            x={pt.x}
            y={pt.y + 13}
            className="fill-muted/70 font-mono text-[9px]"
            textAnchor="middle"
          >
            {val}
          </text>
        );
      })}
      {yTicks.map((val) => {
        const pt = toScreen(0, val, width, height, margin);
        return (
          <text
            key={`tick-y-${val}`}
            x={pt.x - 7}
            y={pt.y + 3}
            className="fill-muted/70 font-mono text-[9px]"
            textAnchor="end"
          >
            {val}
          </text>
        );
      })}
    </g>
  );
}

function SvgHingePoint({
  width,
  height,
  margin = 32,
  label = "(2, 3)",
  position = "top-right",
}: {
  width: number;
  height: number;
  margin?: number;
  label?: string;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}) {
  const p = toScreen(2, 3, width, height, margin);
  const pxAxis = toScreen(2, 0, width, height, margin);
  const pyAxis = toScreen(0, 3, width, height, margin);

  const pillWidth = Math.max(38, label.length * 7 + 10);
  const pillHeight = 16;

  let rectX = p.x + 8;
  let rectY = p.y - 20;

  if (position === "bottom-left") {
    rectX = p.x - pillWidth - 8;
    rectY = p.y + 8;
  } else if (position === "bottom-right") {
    rectX = p.x + 8;
    rectY = p.y + 8;
  } else if (position === "top-left") {
    rectX = p.x - pillWidth - 8;
    rectY = p.y - 20;
  } else {
    // top-right
    rectX = p.x + 8;
    rectY = p.y - 20;
  }

  const textX = rectX + pillWidth / 2;
  const textY = rectY + 12;

  return (
    <g className="hinge-intersection">
      {/* Dashed projections to axes */}
      <line
        x1={p.x}
        y1={p.y}
        x2={pxAxis.x}
        y2={pxAxis.y}
        stroke="#f59e0b"
        strokeDasharray="3,3"
        strokeWidth={1.2}
        opacity={0.65}
      />
      <line
        x1={p.x}
        y1={p.y}
        x2={pyAxis.x}
        y2={pyAxis.y}
        stroke="#f59e0b"
        strokeDasharray="3,3"
        strokeWidth={1.2}
        opacity={0.65}
      />

      {/* Static soft aura ring */}
      <circle
        cx={p.x}
        cy={p.y}
        r={9}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={1.5}
        opacity={0.35}
      />
      <circle
        cx={p.x}
        cy={p.y}
        r={5}
        fill="#f59e0b"
        stroke="#ffffff"
        strokeWidth={1.5}
      />

      {/* Point Label pill */}
      <rect
        x={rectX}
        y={rectY}
        width={pillWidth}
        height={pillHeight}
        rx={4}
        fill="var(--kde-raised, #ffffff)"
        stroke="#f59e0b"
        strokeWidth={1}
        className="shadow-xs"
      />
      <text
        x={textX}
        y={textY}
        fill="#f59e0b"
        className="font-mono text-[10px] font-bold"
        textAnchor="middle"
      >
        {label}
      </text>
    </g>
  );
}

export default function EliminationGeometryDiagram() {
  const [viewMode, setViewMode] = useState<DiagramViewMode>("dual");
  const [progress, setProgress] = useState<number>(0.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const animationRef = useRef<number | null>(null);

  // Continuous animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    let forward = true;
    const step = () => {
      setProgress((prev) => {
        let next = prev + (forward ? 0.012 : -0.012);
        if (next >= 1.0) {
          next = 1.0;
          forward = false;
        } else if (next <= 0.0) {
          next = 0.0;
          forward = true;
        }
        return Number(next.toFixed(3));
      });
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const p0 = toScreen(2, 3, 340, 240);

  // Line 1: 2x - y = 1 (constant baseline across all stages)
  // Endpoints at y = -0.5 (x = 0.25) and y = 5.5 (x = 3.25)
  const l1Start = (w: number, h: number) => toScreen(0.25, -0.5, w, h);
  const l1End = (w: number, h: number) => toScreen(3.25, 5.5, w, h);

  // Initial Line 2: x + y = 5
  // Endpoints at y = 5.5 (x = -0.5) and x = 4.5 (y = 0.5)
  const l2InitialStart = (w: number, h: number) => toScreen(-0.5, 5.5, w, h);
  const l2InitialEnd = (w: number, h: number) => toScreen(4.5, 0.5, w, h);

  // Eliminated Line 2': 3y = 9 <=> y = 3 (horizontal)
  const l2HorizontalStart = (w: number, h: number) => toScreen(-0.5, 3.0, w, h);
  const l2HorizontalEnd = (w: number, h: number) => toScreen(4.5, 3.0, w, h);

  // RREF Line 1': x = 2 (vertical)
  const l1VerticalStart = (w: number, h: number) => toScreen(2.0, -0.5, w, h);
  const l1VerticalEnd = (w: number, h: number) => toScreen(2.0, 5.5, w, h);

  // Dynamic continuous line L2(t): (1-t)x + y = 5 - 2t <=> y = -(1-t)(x - 2) + 3
  // At x = -0.5: y = 2.5(1-t) + 3
  // At x = 4.5: y = -2.5(1-t) + 3
  const l2DynamicStart = (w: number, h: number, t: number) =>
    toScreen(-0.5, 2.5 * (1 - t) + 3.0, w, h);
  const l2DynamicEnd = (w: number, h: number, t: number) =>
    toScreen(4.5, -2.5 * (1 - t) + 3.0, w, h);

  // Current dynamic slope k(t) = -(1 - t)
  const currentSlope = -(1 - progress);

  return (
    <div className="not-prose my-6" data-testid="elimination-geometry-diagram">
      <ExpandableDemo id="elimination-geometry">
        <KdeWindowShell
          title="消元的最终几何目的 · 保交集铰链旋转与超平面摆正"
          eyebrow="GAUSSIAN ELIMINATION · ROW PICTURE DYNAMICS"
          mark="G"
          modeTag="超平面坐标对齐"
          layoutPreset="bottom-split"
          display={
            <div className="p-3 sm:p-4 bg-[var(--kde-panel,#eff0f1)]/40 dark:bg-slate-950/70 border-b border-[var(--kde-border)]">
              {/* Mode 1: Dual View (Side-by-Side Comparison) */}
              {viewMode === "dual" && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Viewport A: Initial Slanted Oblique State */}
                  <div className="relative rounded-xl border border-[var(--kde-border)] bg-[var(--kde-raised,#ffffff)] dark:bg-slate-900/90 p-3 shadow-xs">
                    <div className="mb-2 flex items-center justify-between border-b border-[var(--kde-border)]/50 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <KdeBadge variant="warning">阶段 1</KdeBadge>
                        <span className="text-xs font-bold text-[var(--kde-ink)]">
                          初始倾斜相交 (Coupled)
                        </span>
                      </div>
                      <M
                        math="A\mathbf{x} = \mathbf{b}"
                        className="font-mono text-[11px] text-[var(--kde-muted)]"
                      />
                    </div>

                    <svg
                      className="h-auto w-full select-none"
                      viewBox="0 0 340 240"
                      role="img"
                      aria-label="初始倾斜相交几何图"
                    >
                      <SvgGridAndAxes width={340} height={240} />

                      {/* L1: 2x - y = 1 (Blue) */}
                      <line
                        x1={l1Start(340, 240).x}
                        y1={l1Start(340, 240).y}
                        x2={l1End(340, 240).x}
                        y2={l1End(340, 240).y}
                        stroke="#38bdf8"
                        strokeWidth={2.4}
                      />

                      {/* L2: x + y = 5 (Rose) */}
                      <line
                        x1={l2InitialStart(340, 240).x}
                        y1={l2InitialStart(340, 240).y}
                        x2={l2InitialEnd(340, 240).x}
                        y2={l2InitialEnd(340, 240).y}
                        stroke="#f43f5e"
                        strokeWidth={2.4}
                      />

                      {/* Labels on lines */}
                      <text
                        x={l1End(340, 240).x - 6}
                        y={l1End(340, 240).y + 12}
                        fill="#0284c7"
                        className="font-mono text-[10px] font-bold dark:fill-[#38bdf8]"
                        textAnchor="end"
                      >
                        L₁: 2x - y = 1
                      </text>
                      <text
                        x={l2InitialStart(340, 240).x + 12}
                        y={l2InitialStart(340, 240).y + 12}
                        fill="#e11d48"
                        className="font-mono text-[10px] font-bold dark:fill-[#f43f5e]"
                      >
                        L₂: x + y = 5
                      </text>

                      <SvgHingePoint width={340} height={240} />
                    </svg>

                    <AutoMath className="mt-2 rounded-lg bg-[var(--kde-panel,#f4f5f7)]/80 dark:bg-slate-800/60 p-2 text-xs text-[var(--kde-muted)]">
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        问题痛点
                      </span>
                      ：两直线斜率分别为 $k_1 = 2, k_2 = -1$，未知数 $x$ 与 $y$
                      在两式中紧密耦合，无法直接读出任一坐标。
                    </AutoMath>
                  </div>

                  {/* Viewport B: Row Echelon State After Elimination */}
                  <div className="relative rounded-xl border border-[var(--kde-border)] bg-[var(--kde-raised,#ffffff)] dark:bg-slate-900/90 p-3 shadow-xs">
                    <div className="mb-2 flex items-center justify-between border-b border-[var(--kde-border)]/50 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <KdeBadge variant="success">阶段 2</KdeBadge>
                        <span className="text-xs font-bold text-[var(--kde-ink)]">
                          高斯消元·阶梯形摆平 (Echelon)
                        </span>
                      </div>
                      <M
                        math="R_2 \leftarrow 2R_2 - R_1"
                        className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold"
                      />
                    </div>

                    <svg
                      className="h-auto w-full select-none"
                      viewBox="0 0 340 240"
                      role="img"
                      aria-label="消元后水平摆正几何图"
                    >
                      <SvgGridAndAxes width={340} height={240} />

                      {/* Ghost of initial L2 (faded dashed rose) */}
                      <line
                        x1={l2InitialStart(340, 240).x}
                        y1={l2InitialStart(340, 240).y}
                        x2={l2InitialEnd(340, 240).x}
                        y2={l2InitialEnd(340, 240).y}
                        stroke="#f43f5e"
                        strokeWidth={1.4}
                        strokeDasharray="4,4"
                        opacity={0.35}
                      />

                      {/* L1: 2x - y = 1 (Retained base line) */}
                      <line
                        x1={l1Start(340, 240).x}
                        y1={l1Start(340, 240).y}
                        x2={l1End(340, 240).x}
                        y2={l1End(340, 240).y}
                        stroke="#38bdf8"
                        strokeWidth={1.8}
                        opacity={0.8}
                      />

                      {/* L2': 3y = 9 <=> y = 3 (Strictly Horizontal Emerald) */}
                      <line
                        x1={l2HorizontalStart(340, 240).x}
                        y1={l2HorizontalStart(340, 240).y}
                        x2={l2HorizontalEnd(340, 240).x}
                        y2={l2HorizontalEnd(340, 240).y}
                        stroke="#10b981"
                        strokeWidth={3}
                      />

                      {/* Rotation sweep arc around (2, 3) */}
                      <path
                        d={`M ${p0.x + 50} ${p0.y + 45} A 65 65 0 0 0 ${p0.x + 65} ${p0.y}`}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth={1.4}
                        strokeDasharray="3,2"
                      />
                      <path
                        d={`M ${p0.x + 62} ${p0.y - 3} L ${p0.x + 65} ${p0.y} L ${p0.x + 62} ${p0.y + 3}`}
                        fill="#10b981"
                        stroke="#10b981"
                      />

                      {/* Labels */}
                      <text
                        x={l1End(340, 240).x - 6}
                        y={l1End(340, 240).y + 12}
                        fill="#0284c7"
                        className="font-mono text-[10px] font-bold dark:fill-[#38bdf8]"
                        textAnchor="end"
                        opacity={0.8}
                      >
                        L₁: 2x - y = 1 (基准)
                      </text>
                      <text
                        x={l2HorizontalEnd(340, 240).x - 8}
                        y={l2HorizontalEnd(340, 240).y - 8}
                        fill="#059669"
                        className="font-mono text-[10px] font-bold dark:fill-[#34d399]"
                        textAnchor="end"
                      >
                        L₂': 3y = 9 ➔ y = 3 (与 x 轴平行)
                      </text>

                      <SvgHingePoint width={340} height={240} />
                    </svg>

                    <AutoMath className="mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-2 text-xs text-emerald-950 dark:text-emerald-200">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        几何突破
                      </span>
                      ：以 $(2, 3)$ 为固定铰链旋转后，新方程 $L_2'$ 成为
                      <strong>水平直线</strong>（斜率为 0）！直接读出 $y =
                      3$，再回代入 $L_1$ 即可求得 $x = 2$。
                    </AutoMath>
                  </div>
                </div>
              )}

              {/* Mode 2: Continuous Pivot Animation View */}
              {viewMode === "continuous" && (
                <div className="flex flex-col items-center rounded-xl border border-[var(--kde-border)] bg-[var(--kde-raised,#ffffff)] dark:bg-slate-900/90 p-3 sm:p-4 shadow-xs">
                  <div className="w-full flex items-center justify-between border-b border-[var(--kde-border)]/50 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--kde-ink)]">
                        铰链旋转动态仿真：L₂ 连续剪切至水平
                      </span>
                      <KdeBadge
                        variant={progress === 1 ? "success" : "primary"}
                      >
                        {`剪切进度: ${(progress * 100).toFixed(0)}%`}
                      </KdeBadge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <KdeButton
                        size="xs"
                        variant="default"
                        onClick={() => {
                          setIsPlaying(false);
                          setProgress(0.0);
                        }}
                      >
                        ↺ 初始
                      </KdeButton>
                      <KdeButton
                        size="xs"
                        variant="default"
                        onClick={() => {
                          setIsPlaying(false);
                          setProgress(0.5);
                        }}
                      >
                        50%
                      </KdeButton>
                      <KdeButton
                        size="xs"
                        variant="default"
                        onClick={() => {
                          setIsPlaying(false);
                          setProgress(1.0);
                        }}
                      >
                        完全对齐
                      </KdeButton>
                      <KdeButton
                        size="xs"
                        variant="primary"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? "⏸ 暂停" : "▶ 播放动效"}
                      </KdeButton>
                    </div>
                  </div>

                  <div className="w-full max-w-2xl">
                    <svg
                      className="h-auto w-full select-none"
                      viewBox="0 0 540 260"
                      role="img"
                      aria-label="消元连续剪切动效"
                    >
                      <SvgGridAndAxes width={540} height={260} margin={36} />

                      {/* Ghost Initial L2 */}
                      <line
                        x1={l2InitialStart(540, 260).x}
                        y1={l2InitialStart(540, 260).y}
                        x2={l2InitialEnd(540, 260).x}
                        y2={l2InitialEnd(540, 260).y}
                        stroke="#f43f5e"
                        strokeWidth={1.5}
                        strokeDasharray="4,4"
                        opacity={0.3}
                      />

                      {/* L1 Base Line */}
                      <line
                        x1={l1Start(540, 260).x}
                        y1={l1Start(540, 260).y}
                        x2={l1End(540, 260).x}
                        y2={l1End(540, 260).y}
                        stroke="#38bdf8"
                        strokeWidth={2}
                        opacity={0.8}
                      />

                      {/* Target horizontal line (reference dashed) */}
                      <line
                        x1={l2HorizontalStart(540, 260).x}
                        y1={l2HorizontalStart(540, 260).y}
                        x2={l2HorizontalEnd(540, 260).x}
                        y2={l2HorizontalEnd(540, 260).y}
                        stroke="#10b981"
                        strokeWidth={1}
                        strokeDasharray="2,3"
                        opacity={0.5}
                      />

                      {/* Dynamic L2(t) */}
                      <line
                        x1={l2DynamicStart(540, 260, progress).x}
                        y1={l2DynamicStart(540, 260, progress).y}
                        x2={l2DynamicEnd(540, 260, progress).x}
                        y2={l2DynamicEnd(540, 260, progress).y}
                        stroke={progress === 1 ? "#10b981" : "#f43f5e"}
                        strokeWidth={3}
                      />

                      {/* Dynamic Labels */}
                      <text
                        x={l1End(540, 260).x - 10}
                        y={l1End(540, 260).y + 14}
                        fill="#0284c7"
                        className="font-mono text-[11px] font-bold dark:fill-[#38bdf8]"
                        textAnchor="end"
                        opacity={0.8}
                      >
                        L₁: 2x - y = 1 (基准不移)
                      </text>
                      <text
                        x={l2DynamicEnd(540, 260, progress).x - 12}
                        y={l2DynamicEnd(540, 260, progress).y - 10}
                        fill={progress === 1 ? "#059669" : "#e11d48"}
                        className="font-mono text-[11px] font-bold dark:fill-emerald-400"
                        textAnchor="end"
                      >
                        {progress === 1
                          ? "L₂': 3y = 9 (已完全平行于 x 轴!)"
                          : `L₂(t): ${(1 - progress).toFixed(2)}x + y = ${(5 - 2 * progress).toFixed(2)}`}
                      </text>

                      <SvgHingePoint width={540} height={260} margin={36} />
                    </svg>
                  </div>

                  <div className="w-full mt-3 px-2">
                    <ParamSlider
                      label="消元剪切步进进度 $t$"
                      min={0.0}
                      max={1.0}
                      step={0.01}
                      value={progress}
                      onChange={(val) => {
                        setIsPlaying(false);
                        setProgress(val);
                      }}
                      display={`${(progress * 100).toFixed(0)}%`}
                      widthClass="w-full"
                      labelMode="adaptive"
                    />
                  </div>
                </div>
              )}

              {/* Mode 3: Gauss-Jordan RREF Crosshair View */}
              {viewMode === "rref" && (
                <div className="flex flex-col items-center rounded-xl border border-[var(--kde-border)] bg-[var(--kde-raised,#ffffff)] dark:bg-slate-900/90 p-3 sm:p-4 shadow-xs">
                  <div className="w-full flex items-center justify-between border-b border-[var(--kde-border)]/50 pb-2 mb-3">
                    <div className="flex items-center gap-2">
                      <KdeBadge variant="primary">阶段 3</KdeBadge>
                      <span className="text-xs font-bold text-[var(--kde-ink)]">
                        高斯-若尔当消元 · Gauss-Jordan Full Decoupling
                        十字瞄准线 (RREF)
                      </span>
                    </div>
                    <M
                      math="R_1 \leftarrow R_1 + \frac{1}{3}R_2'"
                      className="font-mono text-xs text-purple-600 dark:text-purple-400 font-semibold"
                    />
                  </div>

                  <div className="w-full max-w-2xl">
                    <svg
                      className="h-auto w-full select-none"
                      viewBox="0 0 540 260"
                      role="img"
                      aria-label="Gauss-Jordan Full Decoupling 十字瞄准几何图"
                    >
                      <SvgGridAndAxes width={540} height={260} margin={36} />

                      {/* Ghost Lines */}
                      <line
                        x1={l1Start(540, 260).x}
                        y1={l1Start(540, 260).y}
                        x2={l1End(540, 260).x}
                        y2={l1End(540, 260).y}
                        stroke="#38bdf8"
                        strokeWidth={1}
                        strokeDasharray="3,3"
                        opacity={0.3}
                      />
                      <line
                        x1={l2InitialStart(540, 260).x}
                        y1={l2InitialStart(540, 260).y}
                        x2={l2InitialEnd(540, 260).x}
                        y2={l2InitialEnd(540, 260).y}
                        stroke="#f43f5e"
                        strokeWidth={1}
                        strokeDasharray="3,3"
                        opacity={0.3}
                      />

                      {/* Vertical L1'': x = 2 (Purple) */}
                      <line
                        x1={l1VerticalStart(540, 260).x}
                        y1={l1VerticalStart(540, 260).y}
                        x2={l1VerticalEnd(540, 260).x}
                        y2={l1VerticalEnd(540, 260).y}
                        stroke="#a855f7"
                        strokeWidth={3}
                      />

                      {/* Horizontal L2': y = 3 (Emerald) */}
                      <line
                        x1={l2HorizontalStart(540, 260).x}
                        y1={l2HorizontalStart(540, 260).y}
                        x2={l2HorizontalEnd(540, 260).x}
                        y2={l2HorizontalEnd(540, 260).y}
                        stroke="#10b981"
                        strokeWidth={3}
                      />

                      {/* Orthogonal Crosshair Right Angle Mark */}
                      <rect
                        x={toScreen(2, 3, 540, 260, 36).x + 4}
                        y={toScreen(2, 3, 540, 260, 36).y - 18}
                        width={14}
                        height={14}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth={1.2}
                        opacity={0.8}
                      />

                      {/* Labels */}
                      <text
                        x={l1VerticalStart(540, 260).x + 8}
                        y={l1VerticalEnd(540, 260).y + 14}
                        fill="#9333ea"
                        className="font-mono text-[11px] font-bold dark:fill-[#c084fc]"
                      >
                        L₁'': x = 2 (平行于 y 轴)
                      </text>
                      <text
                        x={l2HorizontalEnd(540, 260).x - 12}
                        y={l2HorizontalEnd(540, 260).y - 8}
                        fill="#059669"
                        className="font-mono text-[11px] font-bold dark:fill-[#34d399]"
                        textAnchor="end"
                      >
                        L₂': y = 3 (平行于 x 轴)
                      </text>

                      <SvgHingePoint
                        width={540}
                        height={260}
                        margin={36}
                        label="(2, 3)"
                        position="bottom-right"
                      />
                    </svg>
                  </div>

                  <AutoMath className="w-full mt-2 rounded-lg bg-purple-500/10 border border-purple-500/30 p-2 text-xs text-purple-950 dark:text-purple-200">
                    <span className="font-semibold text-purple-700 dark:text-purple-400">
                      终极状态
                    </span>
                    ：两超平面分别正交对齐到两坐标轴！矩阵被彻底对角化为单位阵
                    $I$，无需任何代数回代步骤，解坐标直接在各坐标轴上投影显现。
                  </AutoMath>
                </div>
              )}
            </div>
          }
          controls={
            <div className="space-y-3">
              <KdeCard title="消元演示视角切换" variant="dense">
                <KdeTabs
                  options={VIEW_MODES}
                  value={viewMode}
                  onChange={(m) => {
                    setViewMode(m);
                    setIsPlaying(false);
                  }}
                  size="xs"
                />
              </KdeCard>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <KdeCard title="初等行变换与几何动作" variant="dense">
                  <div className="space-y-1.5 text-xs text-[var(--kde-ink)]">
                    <div className="font-mono font-semibold rounded bg-[var(--kde-panel)] p-1.5">
                      {viewMode === "rref"
                        ? "$\\begin{pmatrix} 2 & -1 \\\\ 1 & 1 \\end{pmatrix} \\to \\begin{pmatrix} 2 & -1 \\\\ 0 & 3 \\end{pmatrix} \\to \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$"
                        : "$\\begin{pmatrix} 2 & -1 \\\\ 1 & 1 \\end{pmatrix} \\xrightarrow{R_2 \\leftarrow 2R_2 - R_1} \\begin{pmatrix} 2 & -1 \\\\ 0 & 3 \\end{pmatrix}$"}
                    </div>
                    <p className="text-[11px] text-[var(--kde-muted)] leading-relaxed">
                      消元的本质并不是“消灭未知数”，而是
                      <strong>以交点 $(2, 3)$ 为固定铰链</strong>
                      ，通过空间剪切将倾斜相交的超平面逐一旋转到与各坐标轴平行！
                    </p>
                  </div>
                </KdeCard>

                <KdeCard title="几何读数与解耦状态" variant="dense">
                  <div className="grid grid-cols-2 gap-2">
                    <KdeReadout
                      label="不变铰链交点"
                      value="(2.00, 3.00)"
                      variant="accent"
                      dense
                    />
                    <KdeReadout
                      label="L₂' 当前斜率"
                      value={
                        viewMode === "dual"
                          ? "0.00 (水平)"
                          : viewMode === "rref"
                            ? "0.00 (水平)"
                            : `${currentSlope.toFixed(2)}`
                      }
                      variant={
                        viewMode === "rref" ||
                        viewMode === "dual" ||
                        progress === 1
                          ? "success"
                          : "default"
                      }
                      dense
                    />
                    <KdeReadout
                      label="未知数解耦度"
                      value={
                        viewMode === "rref"
                          ? "100% 完全解耦"
                          : viewMode === "dual" || progress === 1
                            ? "单未知数解耦 (y=3)"
                            : `${(progress * 50).toFixed(0)}% 剪切中`
                      }
                      variant={
                        viewMode === "rref"
                          ? "accent"
                          : viewMode === "dual" || progress === 1
                            ? "success"
                            : "warning"
                      }
                      dense
                    />
                    <KdeReadout
                      label="解集流形验证"
                      value="恒定封闭成立"
                      variant="formula"
                      dense
                    />
                  </div>
                </KdeCard>
              </div>
            </div>
          }
        />
      </ExpandableDemo>
    </div>
  );
}
