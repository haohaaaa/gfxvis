import { useState, useEffect, useRef } from "react";
import ExpandableDemo from "../framework/ExpandableDemo";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeButton from "../framework/KdeButton";
import KdeBadge from "../framework/KdeBadge";
import ParamSlider from "../framework/ParamSlider";
import AutoMath, { M } from "../framework/AutoMath";

/** Coordinate conversion for SVG viewport: [-3.2, 4.2] x [-2.2, 5.2] */
function toScreen(
  x: number,
  y: number,
  width: number,
  height: number,
  margin = 36,
) {
  const minX = -3.2;
  const maxX = 4.2;
  const minY = -2.2;
  const maxY = 5.2;
  const plotW = width - 2 * margin;
  const plotH = height - 2 * margin;
  const sx = margin + ((x - minX) / (maxX - minX)) * plotW;
  const sy = height - margin - ((y - minY) / (maxY - minY)) * plotH;
  return { x: sx, y: sy };
}

export default function AffineSubspaceFlatDiagram() {
  // s: translation lift progress from 0 (linear subspace at origin) to 1 (full affine flat)
  const [s, setS] = useState(1.0);
  // t: parameter along nullspace ker(A)
  const [t, setT] = useState(0.8);
  const [isPlaying, setIsPlaying] = useState(false);
  const animRef = useRef<number | null>(null);

  // Direction vector spanning ker(A): v_n = (1.5, 1.0)
  const vn = { x: 1.5, y: 1.0 };
  // Fixed particular solution: x_p = (-0.6, 2.2)
  const xp = { x: -0.6, y: 2.2 };

  // Current translated base point: x_p(s) = s * x_p
  const currentBase = { x: s * xp.x, y: s * xp.y };

  // Current nullspace component: x_n = t * v_n
  const xn = { x: t * vn.x, y: t * vn.y };

  // Current general solution: x = currentBase + x_n
  const currentX = { x: currentBase.x + xn.x, y: currentBase.y + xn.y };

  // Animation loop for translation progress
  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    let direction = 1;
    let currentVal = s;

    const tick = () => {
      currentVal += direction * 0.008;
      if (currentVal >= 1.0) {
        currentVal = 1.0;
        direction = -1;
      } else if (currentVal <= 0.0) {
        currentVal = 0.0;
        direction = 1;
      }
      setS(Number(currentVal.toFixed(3)));
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [isPlaying, s]);

  // SVG dimensions
  const svgW = 600;
  const svgH = 340;
  const margin = 38;

  const originPt = toScreen(0, 0, svgW, svgH, margin);
  const xMinPt = toScreen(-3.2, 0, svgW, svgH, margin);
  const xMaxPt = toScreen(4.2, 0, svgW, svgH, margin);
  const yMinPt = toScreen(0, -2.2, svgW, svgH, margin);
  const yMaxPt = toScreen(0, 5.2, svgW, svgH, margin);

  // Nullspace line endpoints: ker(A) through origin
  const kerStart = toScreen(-3.2, (-3.2 / vn.x) * vn.y, svgW, svgH, margin);
  const kerEnd = toScreen(4.2, (4.2 / vn.x) * vn.y, svgW, svgH, margin);

  // Affine line endpoints: S = currentBase + t * vn
  const affStart = toScreen(
    -3.2,
    currentBase.y + ((-3.2 - currentBase.x) / vn.x) * vn.y,
    svgW,
    svgH,
    margin,
  );
  const affEnd = toScreen(
    4.2,
    currentBase.y + ((4.2 - currentBase.x) / vn.x) * vn.y,
    svgW,
    svgH,
    margin,
  );

  // Points on screen
  const ptXp = toScreen(currentBase.x, currentBase.y, svgW, svgH, margin);
  const ptXn = toScreen(xn.x, xn.y, svgW, svgH, margin);
  const ptX = toScreen(currentX.x, currentX.y, svgW, svgH, margin);

  return (
    <div className="not-prose my-6" data-testid="affine-subspace-flat-diagram">
      <ExpandableDemo id="affine-subspace-flat">
        <KdeWindowShell
          title="几何形态揭秘 · 齐次零空间的悬空仿射平移"
          eyebrow="AFFINE SUBSPACE · FLAT TRANSLATION MANIFOLD"
          mark="FLAT"
          modeTag={s < 0.05 ? "齐次线性空间" : "仿射子空间 (Flat)"}
          layoutPreset="bottom-split"
          display={
            <div className="relative flex flex-col items-center justify-center p-3 sm:p-4">
              {/* Header Status Bar inside Viewport */}
              <div className="w-full flex items-center justify-between border-b border-[var(--kde-border)]/50 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <KdeBadge variant={s < 0.05 ? "success" : "primary"}>
                    {s < 0.05 ? "齐次态" : "仿射悬空态"}
                  </KdeBadge>
                  <span className="text-xs font-bold text-[var(--kde-ink)]">
                    {s < 0.05 ? (
                      <>
                        零空间 <M math="\ker(A)" />
                        ：穿过原点的平坦线性空间
                      </>
                    ) : (
                      <>
                        仿射解集 <M math="S = \mathbf{x}_p + \ker(A)" />
                        ：整体悬空平移
                      </>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <M
                    math="S = \mathbf{x}_p + \ker(A)"
                    className="font-mono text-xs text-sky-600 dark:text-sky-400 font-semibold"
                  />
                </div>
              </div>

              {/* Main SVG Geometry */}
              <div className="w-full max-w-2xl">
                <svg
                  className="h-auto w-full select-none"
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  role="img"
                  aria-label="仿射子空间悬空平移几何图谱"
                >
                  <defs>
                    {/* Arrow Markers */}
                    <marker
                      id="arrow-axis"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path
                        d="M 0 1 L 10 5 L 0 9 z"
                        fill="currentColor"
                        className="text-muted/60"
                      />
                    </marker>
                    <marker
                      id="arrow-xp"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f59e0b" />
                    </marker>
                    <marker
                      id="arrow-xn"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#10b981" />
                    </marker>
                    <marker
                      id="arrow-x"
                      viewBox="0 0 10 10"
                      refX="8"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#0ea5e9" />
                    </marker>
                  </defs>

                  {/* Grid Lines */}
                  {[-3, -2, -1, 1, 2, 3, 4].map((vx) => {
                    const top = toScreen(vx, 5.2, svgW, svgH, margin);
                    const bot = toScreen(vx, -2.2, svgW, svgH, margin);
                    return (
                      <line
                        key={`gx-${vx}`}
                        x1={top.x}
                        y1={top.y}
                        x2={bot.x}
                        y2={bot.y}
                        stroke="currentColor"
                        className="text-border/25"
                        strokeDasharray="2,3"
                        strokeWidth={1}
                      />
                    );
                  })}
                  {[-2, -1, 1, 2, 3, 4, 5].map((vy) => {
                    const left = toScreen(-3.2, vy, svgW, svgH, margin);
                    const right = toScreen(4.2, vy, svgW, svgH, margin);
                    return (
                      <line
                        key={`gy-${vy}`}
                        x1={left.x}
                        y1={left.y}
                        x2={right.x}
                        y2={right.y}
                        stroke="currentColor"
                        className="text-border/25"
                        strokeDasharray="2,3"
                        strokeWidth={1}
                      />
                    );
                  })}

                  {/* Coordinate Axes */}
                  <line
                    x1={xMinPt.x}
                    y1={originPt.y}
                    x2={xMaxPt.x}
                    y2={originPt.y}
                    stroke="currentColor"
                    className="text-muted/70"
                    strokeWidth={1.4}
                    markerEnd="url(#arrow-axis)"
                  />
                  <line
                    x1={originPt.x}
                    y1={yMinPt.y}
                    x2={originPt.x}
                    y2={yMaxPt.y}
                    stroke="currentColor"
                    className="text-muted/70"
                    strokeWidth={1.4}
                    markerEnd="url(#arrow-axis)"
                  />

                  {/* Axis Labels */}
                  <foreignObject
                    x={xMaxPt.x - 24}
                    y={originPt.y + 6}
                    width={30}
                    height={24}
                    className="overflow-visible pointer-events-none"
                  >
                    <div className="text-[11px] font-bold text-muted">
                      <M math="x_1" />
                    </div>
                  </foreignObject>
                  <foreignObject
                    x={originPt.x - 24}
                    y={yMaxPt.y - 6}
                    width={30}
                    height={24}
                    className="overflow-visible pointer-events-none"
                  >
                    <div className="text-[11px] font-bold text-muted">
                      <M math="x_2" />
                    </div>
                  </foreignObject>

                  {/* 1. Nullspace ker(A) Line (Fixed through origin) */}
                  <line
                    x1={kerStart.x}
                    y1={kerStart.y}
                    x2={kerEnd.x}
                    y2={kerEnd.y}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray={s > 0.05 ? "5,4" : undefined}
                    opacity={s > 0.05 ? 0.6 : 1}
                  />

                  {/* 2. Affine Subspace S Line (Translated by s * x_p) */}
                  {s > 0.02 && (
                    <line
                      x1={affStart.x}
                      y1={affStart.y}
                      x2={affEnd.x}
                      y2={affEnd.y}
                      stroke="#0284c7"
                      strokeWidth={2.8}
                      opacity={0.9}
                    />
                  )}

                  {/* Parallelogram Addition Dashed Lines */}
                  {s > 0.05 && (
                    <>
                      {/* From x_p to x (parallel to x_n) */}
                      <line
                        x1={ptXp.x}
                        y1={ptXp.y}
                        x2={ptX.x}
                        y2={ptX.y}
                        stroke="#0ea5e9"
                        strokeWidth={1.2}
                        strokeDasharray="3,3"
                        opacity={0.8}
                      />
                      {/* From x_n to x (parallel to x_p) */}
                      <line
                        x1={ptXn.x}
                        y1={ptXn.y}
                        x2={ptX.x}
                        y2={ptX.y}
                        stroke="#f59e0b"
                        strokeWidth={1.2}
                        strokeDasharray="3,3"
                        opacity={0.7}
                      />
                    </>
                  )}

                  {/* Translation Vector x_p (Origin -> s * x_p) */}
                  {s > 0.05 && (
                    <line
                      x1={originPt.x}
                      y1={originPt.y}
                      x2={ptXp.x}
                      y2={ptXp.y}
                      stroke="#f59e0b"
                      strokeWidth={2}
                      markerEnd="url(#arrow-xp)"
                    />
                  )}

                  {/* Nullspace Component Vector x_n (Origin -> x_n) */}
                  {Math.abs(t) > 0.05 && (
                    <line
                      x1={originPt.x}
                      y1={originPt.y}
                      x2={ptXn.x}
                      y2={ptXn.y}
                      stroke="#10b981"
                      strokeWidth={1.8}
                      markerEnd="url(#arrow-xn)"
                    />
                  )}

                  {/* General Solution Vector x (Origin -> x) */}
                  {s > 0.05 && (
                    <line
                      x1={originPt.x}
                      y1={originPt.y}
                      x2={ptX.x}
                      y2={ptX.y}
                      stroke="#0ea5e9"
                      strokeWidth={2.2}
                      markerEnd="url(#arrow-x)"
                    />
                  )}

                  {/* Points */}
                  {/* Origin O */}
                  <circle
                    cx={originPt.x}
                    cy={originPt.y}
                    r={3.5}
                    className="fill-foreground"
                  />
                  <foreignObject
                    x={originPt.x + 6}
                    y={originPt.y + 2}
                    width={70}
                    height={24}
                    className="overflow-visible pointer-events-none"
                  >
                    <div className="inline-flex items-center rounded px-1 text-[10px] font-semibold text-muted bg-[var(--kde-raised,#ffffff)]/80 dark:bg-slate-900/80 border border-border/30">
                      <M math="O(0, 0)" />
                    </div>
                  </foreignObject>

                  {/* x_p point */}
                  {s > 0.05 && (
                    <>
                      <circle
                        cx={ptXp.x}
                        cy={ptXp.y}
                        r={4.5}
                        fill="#f59e0b"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                      <foreignObject
                        x={ptXp.x - 70}
                        y={ptXp.y - 28}
                        width={60}
                        height={26}
                        className="overflow-visible pointer-events-none"
                      >
                        <div className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold text-[#f59e0b] bg-[var(--kde-raised,#ffffff)]/90 dark:bg-slate-900/90 border border-amber-500/30 shadow-2xs whitespace-nowrap">
                          <M math="\mathbf{x}_p" />
                        </div>
                      </foreignObject>
                    </>
                  )}

                  {/* x_n point */}
                  {Math.abs(t) > 0.05 && (
                    <>
                      <circle
                        cx={ptXn.x}
                        cy={ptXn.y}
                        r={4}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                      <foreignObject
                        x={ptXn.x + 8}
                        y={ptXn.y + 4}
                        width={160}
                        height={28}
                        className="overflow-visible pointer-events-none"
                      >
                        <div className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold text-[#10b981] bg-[var(--kde-raised,#ffffff)]/90 dark:bg-slate-900/90 border border-emerald-500/30 shadow-2xs whitespace-nowrap">
                          <M math="\mathbf{x}_n \in \ker(A)" />
                        </div>
                      </foreignObject>
                    </>
                  )}

                  {/* x point */}
                  <circle
                    cx={ptX.x}
                    cy={ptX.y}
                    r={5.5}
                    fill="#0ea5e9"
                    stroke="#ffffff"
                    strokeWidth={1.8}
                  />
                  <foreignObject
                    x={ptX.x + 8}
                    y={ptX.y - 26}
                    width={180}
                    height={28}
                    className="overflow-visible pointer-events-none"
                  >
                    <div className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold text-[#0ea5e9] bg-[var(--kde-raised,#ffffff)]/90 dark:bg-slate-900/90 border border-sky-500/30 shadow-2xs whitespace-nowrap">
                      <M math="\mathbf{x} = \mathbf{x}_p + \mathbf{x}_n" />
                    </div>
                  </foreignObject>

                  {/* Line Text Annotations */}
                  <foreignObject
                    x={kerEnd.x - 280}
                    y={kerEnd.y + 10}
                    width={280}
                    height={28}
                    className="overflow-visible pointer-events-none"
                  >
                    <div className="flex items-center justify-end">
                      <div className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold text-[#10b981] bg-[var(--kde-raised,#ffffff)]/90 dark:bg-slate-900/90 border border-emerald-500/30 shadow-2xs whitespace-nowrap">
                        <span>齐次零空间</span>
                        <M math="\ker(A)" />
                        <span>(穿过原点)</span>
                      </div>
                    </div>
                  </foreignObject>

                  {s > 0.1 && (
                    <foreignObject
                      x={affEnd.x - 360}
                      y={affEnd.y - 28}
                      width={360}
                      height={28}
                      className="overflow-visible pointer-events-none"
                    >
                      <div className="flex items-center justify-end">
                        <div className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold text-[#0284c7] dark:text-[#38bdf8] bg-[var(--kde-raised,#ffffff)]/90 dark:bg-slate-900/90 border border-sky-500/30 shadow-2xs whitespace-nowrap">
                          <span>仿射解空间</span>
                          <M math="S = \mathbf{x}_p + \ker(A)" />
                          <span>(完全平坦，不过原点)</span>
                        </div>
                      </div>
                    </foreignObject>
                  )}
                </svg>
              </div>

              {/* Explanatory Banner */}
              <AutoMath className="w-full mt-2 rounded-lg bg-sky-500/10 border border-sky-500/30 p-2 text-xs text-sky-950 dark:text-sky-200">
                <span className="font-semibold text-sky-700 dark:text-sky-400">
                  几何实相
                </span>
                ：解集 <M math="S = \mathbf{x}_p + \ker(A)" />{" "}
                是将过原点的线性空间 <M math="\ker(A)" /> 沿着特解向量{" "}
                <M math="\mathbf{x}_p" />{" "}
                整体搬家悬空平移的结果！自由未知数对应沿零空间方向的滑动，而特解则决定了仿射子空间在几何空间中的绝对悬空锚点。
              </AutoMath>
            </div>
          }
          controls={
            <div className="space-y-3">
              <KdeCard title="仿射平移与通解交互控制" variant="dense">
                <div className="space-y-3">
                  <ParamSlider
                    label="悬空平移进度 $s$"
                    value={s}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(val) => {
                      setS(val);
                      setIsPlaying(false);
                    }}
                    display={`${(s * 100).toFixed(0)}%`}
                    widthClass="w-full"
                    labelMode="adaptive"
                  />
                  <ParamSlider
                    label="零空间分量系数 $t$"
                    value={t}
                    min={-1.5}
                    max={1.5}
                    step={0.05}
                    onChange={(val) => setT(val)}
                    display={t.toFixed(2)}
                    widthClass="w-full"
                    labelMode="adaptive"
                  />
                  <div className="flex gap-2">
                    <KdeButton
                      variant={isPlaying ? "danger" : "primary"}
                      size="sm"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? "暂停平移动效" : "播放平移动效"}
                    </KdeButton>
                    <KdeButton
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setS(1.0);
                        setT(0.8);
                        setIsPlaying(false);
                      }}
                    >
                      复位标准视角
                    </KdeButton>
                  </div>
                </div>
              </KdeCard>

              <KdeCard title="当前向量与解集流形读数" variant="dense">
                <div className="grid grid-cols-2 gap-2">
                  <KdeReadout
                    label="基准特解 $\mathbf{x}_p$"
                    value={`(${currentBase.x.toFixed(2)}, ${currentBase.y.toFixed(2)})`}
                    variant="formula"
                    dense
                  />
                  <KdeReadout
                    label="零空间分量 $\mathbf{x}_n$"
                    value={`(${xn.x.toFixed(2)}, ${xn.y.toFixed(2)})`}
                    variant="formula"
                    dense
                  />
                  <KdeReadout
                    label="合成通解点 $\mathbf{x}$"
                    value={`(${currentX.x.toFixed(2)}, ${currentX.y.toFixed(2)})`}
                    variant="formula"
                    dense
                  />
                  <KdeReadout
                    label="空间几何拓扑"
                    value={
                      s < 0.05
                        ? "穿过原点 (线性子空间)"
                        : "悬空平坦集 (仿射子空间)"
                    }
                    variant={s < 0.05 ? "success" : "accent"}
                    dense
                  />
                </div>
              </KdeCard>
            </div>
          }
        />
      </ExpandableDemo>
    </div>
  );
}
