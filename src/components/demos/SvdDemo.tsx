import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useCanvas2D } from "../framework/useCanvas2D";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import ParamSlider from "../framework/ParamSlider";
import PresetSelector from "../framework/PresetSelector";
import {
  drawAdaptiveAxes,
  type Bounds2,
} from "../../visualizations/core/2d/plot2d";

interface MatrixPreset {
  name: string;
  a: number;
  b: number;
  c: number;
  d: number;
  desc: string;
}

const PRESETS: Record<string, MatrixPreset> = {
  general: {
    name: "一般矩阵 (拉伸+旋转)",
    a: 1.5,
    b: 0.8,
    c: 0.4,
    d: 1.2,
    desc: "将单位圆变换为倾斜椭圆，奇异值 σ₁ ≈ 1.95, σ₂ ≈ 0.76",
  },
  shear: {
    name: "剪切矩阵 (不可对角化但可 SVD)",
    a: 1.0,
    b: 1.2,
    c: 0.0,
    d: 1.0,
    desc: "代数不可对角化，但 SVD 仍能完美将其分解为正交旋转与主轴拉伸",
  },
  singular: {
    name: "奇异矩阵 (Rank 1 降维压缩)",
    a: 1.2,
    b: 0.6,
    c: 0.8,
    d: 0.4,
    desc: "列线性相关 (det=0)，σ₂=0，单位圆被完全压扁为一条 1D 直线段",
  },
  symmetric: {
    name: "对称正定矩阵 (U = V)",
    a: 1.6,
    b: 0.5,
    c: 0.5,
    d: 1.0,
    desc: "实对称矩阵的 SVD 与特征值分解重合，右奇异向量与左奇异向量同向",
  },
  rotation: {
    name: "纯旋转矩阵 (σ₁ = σ₂ = 1)",
    a: 0.6,
    b: -0.8,
    c: 0.8,
    d: 0.6,
    desc: "保持所有向量长度不变，奇异值恒等于 1，单位圆保持为标准圆",
  },
};

type StepId = "0" | "1" | "2" | "3";

const STEPS: Array<{ id: StepId; label: string; stepVal: number }> = [
  { id: "0", label: "0. 输入单位圆 (基底 V)", stepVal: 0 },
  { id: "1", label: "1. 旋转对齐 (Vᵀ)", stepVal: 1 },
  { id: "2", label: "2. 轴向缩放 (Σ)", stepVal: 2 },
  { id: "3", label: "3. 旋转输出 (U)", stepVal: 3 },
];

interface SvdResult {
  sigma1: number;
  sigma2: number;
  v1: [number, number];
  v2: [number, number];
  u1: [number, number];
  u2: [number, number];
  thetaV: number;
  thetaU: number;
  detA: number;
  conditionNumber: number;
}

function compute2DSvd(a: number, b: number, c: number, d: number): SvdResult {
  const detA = a * d - b * c;
  const p = a * a + c * c;
  const q = a * b + c * d;
  const r = b * b + d * d;

  const tr = p + r;
  const diff = p - r;
  const disc = Math.sqrt(Math.max(0, diff * diff + 4 * q * q));

  const lambda1 = Math.max(0, (tr + disc) / 2);
  const lambda2 = Math.max(0, (tr - disc) / 2);

  const sigma1 = Math.sqrt(lambda1);
  const sigma2 = Math.sqrt(lambda2);

  const thetaV = 0.5 * Math.atan2(2 * q, diff);
  let v1: [number, number] = [Math.cos(thetaV), Math.sin(thetaV)];
  let v2: [number, number] = [-Math.sin(thetaV), Math.cos(thetaV)];

  const v1Check = p * v1[0] + q * v1[1];
  const lambdaCheck = lambda1 * v1[0];
  if (Math.abs(v1Check - lambdaCheck) > 0.1 && Math.abs(q) > 1e-5) {
    const temp = v1;
    v1 = v2;
    v2 = [-temp[0], -temp[1]];
  }

  const u1: [number, number] =
    sigma1 > 1e-6
      ? [(a * v1[0] + b * v1[1]) / sigma1, (c * v1[0] + d * v1[1]) / sigma1]
      : [1, 0];

  const u2: [number, number] =
    sigma2 > 1e-6
      ? [(a * v2[0] + b * v2[1]) / sigma2, (c * v2[0] + d * v2[1]) / sigma2]
      : [-u1[1], u1[0]];

  const thetaU = Math.atan2(u1[1], u1[0]);
  const conditionNumber = sigma2 > 1e-6 ? sigma1 / sigma2 : Infinity;

  return {
    sigma1,
    sigma2,
    v1,
    v2,
    u1,
    u2,
    thetaV,
    thetaU,
    detA,
    conditionNumber,
  };
}

export default function SvdDemo({ height }: { height?: string }) {
  const [matrix, setMatrix] = useState({ a: 1.5, b: 0.8, c: 0.4, d: 1.2 });
  const [presetKey, setPresetKey] = useState("general");
  const [stageProgress, setStageProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [probeAngle, setProbeAngle] = useState(Math.PI / 4);

  const svd = useMemo(() => {
    return compute2DSvd(matrix.a, matrix.b, matrix.c, matrix.d);
  }, [matrix]);

  const stateRef = useRef({
    matrix,
    stageProgress,
    probeAngle,
    svd,
  });

  useEffect(() => {
    stateRef.current = { matrix, stageProgress, probeAngle, svd };
  }, [matrix, stageProgress, probeAngle, svd]);

  useEffect(() => {
    if (!isPlaying) return;
    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      setStageProgress((prev) => {
        const next = prev + dt * 0.8;
        if (next >= 3) {
          setIsPlaying(false);
          return 3;
        }
        return next;
      });
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const handlePresetChange = (key: string) => {
    const p = PRESETS[key];
    if (!p) return;
    setPresetKey(key);
    setMatrix({ a: p.a, b: p.b, c: p.c, d: p.d });
  };

  const handleCustomParam = (k: "a" | "b" | "c" | "d", v: number) => {
    setPresetKey("custom");
    setMatrix((prev) => ({ ...prev, [k]: v }));
  };

  const initialBounds: Bounds2 = useMemo(() => {
    const maxVal = Math.max(2.6, svd.sigma1 * 1.3);
    return { xMin: -maxVal, xMax: maxVal, yMin: -maxVal, yMax: maxVal };
  }, [svd.sigma1]);

  const getTransformAtProgress = useCallback(
    (
      t: number,
      curSvd: SvdResult,
    ): ((x: number, y: number) => [number, number]) => {
      const { thetaV, thetaU, sigma1, sigma2 } = curSvd;

      return (x: number, y: number): [number, number] => {
        let curX = x;
        let curY = y;

        // Stage 1: V^T (rotate by -thetaV)
        const t1 = Math.max(0, Math.min(1, t));
        if (t1 > 0) {
          const angle1 = -thetaV * t1;
          const cos1 = Math.cos(angle1);
          const sin1 = Math.sin(angle1);
          const nx = cos1 * curX - sin1 * curY;
          const ny = sin1 * curX + cos1 * curY;
          curX = nx;
          curY = ny;
        }

        // Stage 2: Sigma (stretch x by sigma1, y by sigma2)
        const t2 = Math.max(0, Math.min(1, t - 1));
        if (t2 > 0) {
          const s1 = 1 + (sigma1 - 1) * t2;
          const s2 = 1 + (sigma2 - 1) * t2;
          curX *= s1;
          curY *= s2;
        }

        // Stage 3: U (rotate by thetaU)
        const t3 = Math.max(0, Math.min(1, t - 2));
        if (t3 > 0) {
          const angle3 = thetaU * t3;
          const cos3 = Math.cos(angle3);
          const sin3 = Math.sin(angle3);
          const nx = cos3 * curX - sin3 * curY;
          const ny = sin3 * curX + cos3 * curY;
          curX = nx;
          curY = ny;
        }

        return [curX, curY];
      };
    },
    [],
  );

  const { containerRef, canvasRef, redraw, resetBounds } = useCanvas2D({
    initialBounds,
    equalScale: true,
    draw: (ctx, plot, theme) => {
      const {
        stageProgress: curProgress,
        probeAngle: curAngle,
        svd: curSvd,
      } = stateRef.current;

      drawAdaptiveAxes(ctx, plot, theme, "x", "y");

      const transform = getTransformAtProgress(curProgress, curSvd);

      // Transformed grid
      ctx.save();
      ctx.strokeStyle = theme.border;
      ctx.lineWidth = 1;

      const gridSize = 3;
      const step = 0.5;
      for (let gx = -gridSize; gx <= gridSize; gx += step) {
        ctx.beginPath();
        for (let gy = -gridSize; gy <= gridSize; gy += 0.1) {
          const [tx, ty] = transform(gx, gy);
          const sx = plot.toScreenX(tx);
          const sy = plot.toScreenY(ty);
          if (gy === -gridSize) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

      for (let gy = -gridSize; gy <= gridSize; gy += step) {
        ctx.beginPath();
        for (let gx = -gridSize; gx <= gridSize; gx += 0.1) {
          const [tx, ty] = transform(gx, gy);
          const sx = plot.toScreenX(tx);
          const sy = plot.toScreenY(ty);
          if (gx === -gridSize) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
      ctx.restore();

      // Original unit circle
      ctx.save();
      ctx.strokeStyle = theme.muted;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.05) {
        const sx = plot.toScreenX(Math.cos(a));
        const sy = plot.toScreenY(Math.sin(a));
        if (a === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();

      // Transformed curve/ellipse
      ctx.save();
      ctx.strokeStyle = "#3b82f6";
      ctx.fillStyle = "rgba(59, 130, 246, 0.08)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2 + 0.05; a += 0.04) {
        const [tx, ty] = transform(Math.cos(a), Math.sin(a));
        const sx = plot.toScreenX(tx);
        const sy = plot.toScreenY(ty);
        if (a === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      const drawArrow = (
        toW: [number, number],
        color: string,
        width: number,
        label?: string,
      ) => {
        const x1 = plot.toScreenX(0);
        const y1 = plot.toScreenY(0);
        const x2 = plot.toScreenX(toW[0]);
        const y2 = plot.toScreenY(toW[1]);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy);
        if (len < 1) return;

        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const headLen = Math.min(10, len * 0.3);
        const angle = Math.atan2(dy, dx);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - headLen * Math.cos(angle - Math.PI / 6),
          y2 - headLen * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          x2 - headLen * Math.cos(angle + Math.PI / 6),
          y2 - headLen * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fill();

        if (label) {
          ctx.font = "bold 12px ui-sans-serif, system-ui, sans-serif";
          ctx.fillStyle = color;
          ctx.fillText(
            label,
            x2 + 8 * Math.cos(angle),
            y2 + 8 * Math.sin(angle),
          );
        }
        ctx.restore();
      };

      const { v1, v2 } = curSvd;
      const tv1 = transform(v1[0], v1[1]);
      const tv2 = transform(v2[0], v2[1]);

      drawArrow(tv1, "#ef4444", 3, curProgress >= 2 ? "σ₁u₁" : "v₁");
      drawArrow(tv2, "#10b981", 3, curProgress >= 2 ? "σ₂u₂" : "v₂");

      const probeX = Math.cos(curAngle);
      const probeY = Math.sin(curAngle);
      const tProbe = transform(probeX, probeY);

      drawArrow(tProbe, "#8b5cf6", 2.5, "x(t)");

      const psx = plot.toScreenX(probeX);
      const psy = plot.toScreenY(probeY);
      ctx.save();
      ctx.fillStyle = "#8b5cf6";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(psx, psy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    },
  });

  useEffect(() => {
    redraw();
  }, [stageProgress, probeAngle, matrix, redraw]);

  const currentStepId =
    stageProgress < 0.5
      ? "0"
      : stageProgress < 1.5
        ? "1"
        : stageProgress < 2.5
          ? "2"
          : "3";

  const probeX = Math.cos(probeAngle);
  const probeY = Math.sin(probeAngle);
  const curTransform = useMemo(
    () => getTransformAtProgress(stageProgress, svd),
    [stageProgress, svd, getTransformAtProgress],
  );
  const [currentProbeX, currentProbeY] = useMemo(
    () => curTransform(probeX, probeY),
    [curTransform, probeX, probeY],
  );

  const finalProbeX = matrix.a * probeX + matrix.b * probeY;
  const finalProbeY = matrix.c * probeX + matrix.d * probeY;

  return (
    <AutoMath>
      <ExpandableDemo id="singular-value-decomposition" height={height}>
        <KdeWindowShell
          title="奇异值分解 (SVD) 几何全景工作台"
          eyebrow="矩阵分解与正交投影"
          mark="SVD"
          modeTag="三阶段正交拉伸"
          tabs={
            <KdeTabs
              options={STEPS}
              value={currentStepId}
              onChange={(id) => {
                setIsPlaying(false);
                const found = STEPS.find((s) => s.id === id);
                if (found) {
                  setStageProgress(found.stepVal);
                  redraw();
                }
              }}
            />
          }
          display={
            <div
              ref={containerRef}
              className="relative h-[var(--demo-height,22rem)] w-full overflow-hidden rounded border border-border/70 bg-surface"
            >
              <CanvasToolbar onReset={resetBounds} />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full cursor-crosshair"
              />
              <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
            </div>
          }
          controls={
            <div className="space-y-3">
              <KdeCard title="预设矩阵场景" variant="dense">
                <PresetSelector
                  options={PRESETS}
                  value={presetKey}
                  onChange={(key) => {
                    handlePresetChange(key);
                    redraw();
                  }}
                  size="xs"
                />
                <p className="mt-2 text-[11px] text-muted leading-relaxed">
                  {PRESETS[presetKey]?.desc}
                </p>
              </KdeCard>

              <KdeCard title="三阶段动态变换" variant="dense">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (stageProgress >= 3) setStageProgress(0);
                      setIsPlaying(!isPlaying);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    {isPlaying ? "⏸ 暂停动画" : "▶ 连续播放三阶段"}
                  </button>
                  <span className="text-xs text-muted font-mono">
                    进度: {stageProgress.toFixed(2)} / 3.00
                  </span>
                </div>

                <ParamSlider
                  label="变换进度 (t: 0 ➔ 3)"
                  value={stageProgress}
                  min={0}
                  max={3}
                  step={0.02}
                  onChange={(val) => {
                    setIsPlaying(false);
                    setStageProgress(val);
                    redraw();
                  }}
                />
                <ParamSlider
                  label="探测向量角度 θ"
                  value={probeAngle}
                  min={0}
                  max={Math.PI * 2}
                  step={0.02}
                  onChange={(val) => {
                    setProbeAngle(val);
                    redraw();
                  }}
                />

                {/* Probe Vector Live Transformation */}
                <div className="mt-2.5 rounded border border-purple-500/30 bg-surface/70 p-2.5 space-y-2 text-xs">
                  <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                    {"探测向量实时映射 $\\mathbf{x} \\to A\\mathbf{x}$"}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-surface border border-border/60">
                      <span className="font-semibold text-foreground block mb-0.5">
                        原像 {"$\\mathbf{x}$"}
                      </span>
                      <div className="font-mono text-center">
                        {`$(${probeX.toFixed(2)}, ${probeY.toFixed(2)})^\\top$`}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-surface border border-purple-500/30">
                      <span className="font-semibold text-purple-600 dark:text-purple-400 block mb-0.5">
                        瞬时像 {"$\\mathbf{x}(t)$"}
                      </span>
                      <div className="font-mono text-center">
                        {`$(${currentProbeX.toFixed(2)}, ${currentProbeY.toFixed(2)})^\\top$`}
                      </div>
                    </div>
                    <div className="p-2 rounded bg-surface border border-border/60">
                      <span className="font-semibold text-foreground block mb-0.5">
                        最终像 {"$A\\mathbf{x}$"}
                      </span>
                      <div className="font-mono text-center">
                        {`$(${finalProbeX.toFixed(2)}, ${finalProbeY.toFixed(2)})^\\top$`}
                      </div>
                    </div>
                  </div>
                </div>
              </KdeCard>

              <KdeCard title="奇异值几何特征度量" variant="dense">
                <div className="grid grid-cols-2 gap-2">
                  <KdeReadout
                    label="奇异值 σ₁ (长半轴)"
                    value={svd.sigma1.toFixed(3)}
                    variant="accent"
                    dense
                  />
                  <KdeReadout
                    label="奇异值 σ₂ (短半轴)"
                    value={svd.sigma2.toFixed(3)}
                    variant="success"
                    dense
                  />
                  <KdeReadout
                    label="条件数 κ(A)"
                    value={
                      Number.isFinite(svd.conditionNumber)
                        ? svd.conditionNumber.toFixed(3)
                        : "∞ (奇异)"
                    }
                    dense
                  />
                  <KdeReadout
                    label="面积比 |det(A)|"
                    value={Math.abs(svd.detA).toFixed(3)}
                    dense
                  />
                </div>
              </KdeCard>

              <KdeCard title="2×2 自定义矩阵参数" variant="dense">
                <div className="grid grid-cols-2 gap-2">
                  <ParamSlider
                    label="a₁₁"
                    value={matrix.a}
                    min={-2.5}
                    max={2.5}
                    step={0.1}
                    onChange={(v) => {
                      handleCustomParam("a", v);
                      redraw();
                    }}
                  />
                  <ParamSlider
                    label="a₁₂"
                    value={matrix.b}
                    min={-2.5}
                    max={2.5}
                    step={0.1}
                    onChange={(v) => {
                      handleCustomParam("b", v);
                      redraw();
                    }}
                  />
                  <ParamSlider
                    label="a₂₁"
                    value={matrix.c}
                    min={-2.5}
                    max={2.5}
                    step={0.1}
                    onChange={(v) => {
                      handleCustomParam("c", v);
                      redraw();
                    }}
                  />
                  <ParamSlider
                    label="a₂₂"
                    value={matrix.d}
                    min={-2.5}
                    max={2.5}
                    step={0.1}
                    onChange={(v) => {
                      handleCustomParam("d", v);
                      redraw();
                    }}
                  />
                </div>
              </KdeCard>

              <KdeCard title="数值分解等式 A = U Σ Vᵀ" variant="dense">
                <div className="overflow-x-auto py-1 flex items-center justify-center text-center text-xs">
                  {`$\\begin{pmatrix} ${matrix.a.toFixed(2)} & ${matrix.b.toFixed(2)} \\\\ ${matrix.c.toFixed(2)} & ${matrix.d.toFixed(2)} \\end{pmatrix} = \\underbrace{\\begin{pmatrix} ${svd.u1[0].toFixed(2)} & ${svd.u2[0].toFixed(2)} \\\\ ${svd.u1[1].toFixed(2)} & ${svd.u2[1].toFixed(2)} \\end{pmatrix}}_{U} \\cdot \\underbrace{\\begin{pmatrix} ${svd.sigma1.toFixed(2)} & 0 \\\\ 0 & ${svd.sigma2.toFixed(2)} \\end{pmatrix}}_{\\Sigma} \\cdot \\underbrace{\\begin{pmatrix} ${svd.v1[0].toFixed(2)} & ${svd.v1[1].toFixed(2)} \\\\ ${svd.v2[0].toFixed(2)} & ${svd.v2[1].toFixed(2)} \\end{pmatrix}}_{V^\\top}$`}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <KdeReadout
                    label="U 正交性 det(U)"
                    value={(
                      svd.u1[0] * svd.u2[1] -
                      svd.u1[1] * svd.u2[0]
                    ).toFixed(3)}
                    dense
                  />
                  <KdeReadout label="V 正交性 det(V)" value="1.000" dense />
                </div>
                <div className="mt-2 pt-2 border-t border-border/50 space-y-1 text-[11px] font-mono">
                  <div className="text-red-600 dark:text-red-400">
                    {`$A\\mathbf{v}_1 = \\sigma_1 \\mathbf{u}_1 = (${(svd.sigma1 * svd.u1[0]).toFixed(2)}, ${(svd.sigma1 * svd.u1[1]).toFixed(2)})^\\top$`}
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400">
                    {`$A\\mathbf{v}_2 = \\sigma_2 \\mathbf{u}_2 = (${(svd.sigma2 * svd.u2[0]).toFixed(2)}, ${(svd.sigma2 * svd.u2[1]).toFixed(2)})^\\top$`}
                  </div>
                </div>
              </KdeCard>
            </div>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
