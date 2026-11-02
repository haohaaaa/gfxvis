import { useState, useMemo } from "react";
import {
  fitLeastSquaresLinear2D,
  type LeastSquaresResult2D,
  svd2x2,
  type Matrix2x2,
} from "../../math/index";
import ExpandableDemo from "../framework/ExpandableDemo";
import CanvasViewport from "../framework/CanvasViewport";
import Viewer3DViewport from "../framework/Viewer3DViewport";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import KdeCheckbox from "../framework/KdeCheckbox";
import PresetSelector from "../framework/PresetSelector";
import ParamSlider from "../framework/ParamSlider";
import { createLeastSquares3DScene } from "../../visualizations/scenes/linear-algebra/leastSquares3d";
import type { Bounds2 } from "../../visualizations/core/2d/plot2d";

type FitMethod = "normal" | "qr" | "svd" | "ridge";

const METHOD_TABS = [
  { id: "normal", label: "1. 正规方程法 (Normal)" },
  { id: "qr", label: "2. QR 分解法 (QR)" },
  { id: "svd", label: "3. SVD 伪逆法 (SVD)" },
  { id: "ridge", label: "4. Ridge 正则化" },
] as const;

interface Point2D {
  id: number;
  x: number;
  y: number;
  name: string;
}

const PRESETS: Record<
  string,
  {
    name: string;
    desc: string;
    points: Point2D[];
    defaultMethod?: FitMethod;
  }
> = {
  standard: {
    name: "标准 3 点拟合",
    desc: "经典教科书算例：(1,1), (2,2), (3,2)，拟合 y = 2/3 + 1/2 x，残差非零",
    points: [
      { id: 1, x: 1, y: 1, name: "P₁" },
      { id: 2, x: 2, y: 2, name: "P₂" },
      { id: 3, x: 3, y: 2, name: "P₃" },
    ],
  },
  collinear: {
    name: "完美共线 (零残差)",
    desc: "三点严格共线 y = x，目标向量 b 恰好落在列空间 col(A) 内部，||e|| = 0",
    points: [
      { id: 1, x: 1, y: 1, name: "P₁" },
      { id: 2, x: 2, y: 2, name: "P₂" },
      { id: 3, x: 3, y: 3, name: "P₃" },
    ],
  },
  ill_conditioned: {
    name: "病态近共线 (高条件数)",
    desc: "x 坐标极其接近密集，导致列空间基向量几乎共线，kappa(A^T A) 发生平方爆炸",
    points: [
      { id: 1, x: 1.0, y: 1.0, name: "P₁" },
      { id: 2, x: 1.05, y: 1.05, name: "P₂" },
      { id: 3, x: 1.1, y: 1.15, name: "P₃" },
    ],
  },
  outlier: {
    name: "严重离群点 (Outlier)",
    desc: "P₃ 包含强噪声异常值，平方损失使得回归直线被显著往下拉扯",
    points: [
      { id: 1, x: 1, y: 1, name: "P₁" },
      { id: 2, x: 2, y: 2, name: "P₂" },
      { id: 3, x: 3, y: 6, name: "P₃" },
    ],
  },
};

const INITIAL_2D_BOUNDS: Bounds2 = {
  xMin: -0.5,
  xMax: 4.5,
  yMin: -0.5,
  yMax: 5.5,
};

export default function LeastSquaresDemo({ height }: { height?: string }) {
  const [presetKey, setPresetKey] = useState<string>("standard");
  const [points, setPoints] = useState<Point2D[]>(PRESETS.standard.points);
  const [method, setMethod] = useState<FitMethod>("normal");
  const [lambda, setLambda] = useState<number>(0.5);
  const [showSquares, setShowSquares] = useState<boolean>(true);
  const [showColPlane, setShowColPlane] = useState<boolean>(true);

  // Fit Result
  const fitResult: LeastSquaresResult2D = useMemo(() => {
    return fitLeastSquaresLinear2D(points, {
      method,
      lambda: method === "ridge" ? lambda : 0,
    });
  }, [points, method, lambda]);

  // Handle Preset Change
  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    if (PRESETS[key]) {
      setPoints(PRESETS[key].points.map((p) => ({ ...p })));
      if (PRESETS[key].defaultMethod) {
        setMethod(PRESETS[key].defaultMethod!);
      }
    }
  };

  const { c, d, residualNormSq, AtA, Atb, condA, condAtA } = fitResult;
  const a1_dot_e = fitResult.residuals.reduce((acc, e) => acc + e, 0);
  const a2_dot_e = fitResult.residuals.reduce(
    (acc, e, idx) => acc + e * points[idx].x,
    0,
  );

  // Step-by-step mathematical diagnostics
  const currentDerivation = useMemo(() => {
    const p1x = points[0]?.x.toFixed(1) ?? "1.0";
    const p2x = points[1]?.x.toFixed(1) ?? "2.0";
    const p3x = points[2]?.x.toFixed(1) ?? "3.0";
    const p1y = points[0]?.y.toFixed(1) ?? "1.0";
    const p2y = points[1]?.y.toFixed(1) ?? "2.0";
    const p3y = points[2]?.y.toFixed(1) ?? "2.0";

    const detAtA = AtA[0][0] * AtA[1][1] - AtA[0][1] * AtA[1][0];
    const invAtA: Matrix2x2 =
      Math.abs(detAtA) > 1e-8
        ? [
            [AtA[1][1] / detAtA, -AtA[0][1] / detAtA],
            [-AtA[1][0] / detAtA, AtA[0][0] / detAtA],
          ]
        : [
            [0, 0],
            [0, 0],
          ];

    if (method === "qr") {
      const sum1 = points.length;
      const sumX = points.reduce((acc, p) => acc + p.x, 0);
      const sumY = points.reduce((acc, p) => acc + p.y, 0);
      const r00 = Math.sqrt(sum1);
      const r01 = sumX / r00;
      const d1 = points.reduce(
        (acc, p) => acc + Math.pow(p.x - r01 / r00, 2),
        0,
      );
      const r11 = Math.sqrt(d1);
      const qty0 = sumY / r00;

      return {
        title: "QR 分解正交变换求解步骤",
        steps: [
          {
            label: "数据矩阵 QR 分解 A = Q · R",
            tex: `R = \\begin{pmatrix} ${r00.toFixed(2)} & ${r01.toFixed(2)} \\\\ 0 & ${r11.toFixed(2)} \\end{pmatrix}`,
          },
          {
            label: "投影到正交基 Qᵀb",
            tex: `Q^\\top \\mathbf{b} = \\begin{pmatrix} ${qty0.toFixed(2)} \\\\ ... \\end{pmatrix}`,
          },
          {
            label: "回代求解上三角方程 R x̂ = Qᵀb",
            tex: `\\hat{\\mathbf{x}} = R^{-1} Q^\\top \\mathbf{b} = \\begin{pmatrix} ${c.toFixed(3)} \\\\ ${d.toFixed(3)} \\end{pmatrix}`,
          },
        ],
      };
    }

    if (method === "svd") {
      const svd = svd2x2(AtA);
      const sigma1 = Math.sqrt(Math.max(0, svd.sigma1));
      const sigma2 = Math.sqrt(Math.max(0, svd.sigma2));

      return {
        title: "SVD 奇异值分解与 Moore-Penrose 伪逆",
        steps: [
          {
            label: "设计矩阵奇异值 σ₁ ≥ σ₂",
            tex: `\\sigma_1 = ${sigma1.toFixed(2)},\\quad \\sigma_2 = ${sigma2.toFixed(2)}`,
          },
          {
            label: "奇异值倒数主导拉伸 Σ⁺",
            tex: `\\Sigma^+ = \\begin{pmatrix} ${(1 / Math.max(sigma1, 1e-4)).toFixed(3)} & 0 \\\\ 0 & ${(1 / Math.max(sigma2, 1e-4)).toFixed(3)} \\end{pmatrix}`,
          },
          {
            label: "伪逆解 x̂ = A⁺ b = V Σ⁺ Uᵀ b",
            tex: `\\hat{\\mathbf{x}} = A^+ \\mathbf{b} = \\begin{pmatrix} ${c.toFixed(3)} \\\\ ${d.toFixed(3)} \\end{pmatrix}`,
          },
        ],
      };
    }

    if (method === "ridge") {
      return {
        title: "Ridge (Tikhonov) 正则化阻尼正规方程",
        steps: [
          {
            label: "对角阻尼扰动 (AᵀA + λI)",
            tex: `A^\\top A + ${lambda.toFixed(2)} I = \\begin{pmatrix} ${(AtA[0][0] + lambda).toFixed(2)} & ${AtA[0][1].toFixed(2)} \\\\ ${AtA[1][0].toFixed(2)} & ${(AtA[1][1] + lambda).toFixed(2)} \\end{pmatrix}`,
          },
          {
            label: "截断病态矩阵条件数",
            tex: `\\kappa_{\\text{ridge}} = \\frac{\\sigma_{\\max}^2 + \\lambda}{\\sigma_{\\min}^2 + \\lambda} = ${condAtA.toFixed(1)} \\to \\text{受控稳定}`,
          },
          {
            label: "阻尼收缩解 x̂_ridge",
            tex: `\\hat{\\mathbf{x}} = (A^\\top A + \\lambda I)^{-1} A^\\top \\mathbf{b} = \\begin{pmatrix} ${c.toFixed(3)} \\\\ ${d.toFixed(3)} \\end{pmatrix}`,
          },
        ],
      };
    }

    return {
      title: "正规方程代数推导 AᵀA x̂ = Aᵀb",
      steps: [
        {
          label: "1. 构造设计矩阵 A 与观测向量 b",
          tex: `A = \\begin{pmatrix} 1 & ${p1x} \\\\ 1 & ${p2x} \\\\ 1 & ${p3x} \\end{pmatrix},\\quad \\mathbf{b} = \\begin{pmatrix} ${p1y} \\\\ ${p2y} \\\\ ${p3y} \\end{pmatrix}`,
        },
        {
          label: "2. 计算 Gram 矩阵 AᵀA 与投影源 Aᵀb",
          tex: `A^\\top A = \\begin{pmatrix} ${AtA[0][0].toFixed(1)} & ${AtA[0][1].toFixed(1)} \\\\ ${AtA[1][0].toFixed(1)} & ${AtA[1][1].toFixed(1)} \\end{pmatrix},\\quad A^\\top \\mathbf{b} = \\begin{pmatrix} ${Atb[0].toFixed(1)} \\\\ ${Atb[1].toFixed(1)} \\end{pmatrix}`,
        },
        {
          label: "3. 逆矩阵求解最优系数 (AᵀA)⁻¹ Aᵀb",
          tex: `\\hat{\\mathbf{x}} = \\begin{pmatrix} c \\\\ d \\end{pmatrix} = \\begin{pmatrix} ${invAtA[0][0].toFixed(2)} & ${invAtA[0][1].toFixed(2)} \\\\ ${invAtA[1][0].toFixed(2)} & ${invAtA[1][1].toFixed(2)} \\end{pmatrix} \\begin{pmatrix} ${Atb[0].toFixed(1)} \\\\ ${Atb[1].toFixed(1)} \\end{pmatrix} = \\begin{pmatrix} ${c.toFixed(3)} \\\\ ${d.toFixed(3)} \\end{pmatrix}`,
        },
      ],
    };
  }, [points, AtA, Atb, c, d, method, lambda, condAtA]);

  const modeTag =
    method === "normal"
      ? "正规方程法"
      : method === "qr"
        ? "QR 正交分解"
        : method === "svd"
          ? "SVD 伪逆法"
          : "Ridge 正则化";

  return (
    <ExpandableDemo id="least-squares-demo" height={height}>
      <KdeWindowShell
        title="最小二乘法与正规方程 (Least Squares & Normal Equations)"
        eyebrow="Linear Algebra · Projection & Optimization"
        mark="AᵀAx̂ = Aᵀb"
        modeTag={modeTag}
        display={
          <div className="space-y-3">
            {/* Dual-View Split Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left View: 2D Data Space Canvas */}
              <div className="relative flex flex-col rounded-xl border border-border/80 bg-surface/50 p-3 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />
                    {"数据拟合空间 (Data Space $\\mathbb{R}^2$)"}
                  </span>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    {`$y = ${c.toFixed(2)} + ${d.toFixed(2)} x$`}
                  </div>
                </div>

                <CanvasViewport
                  initialBounds={INITIAL_2D_BOUNDS}
                  className="h-[var(--demo-height,20rem)]"
                  onReset={() => handlePresetChange("standard")}
                  onDraw={(ctx, plot, theme, scene) => {
                    scene.addAxes("x", "y");

                    // 1. Regression line and residual squares via custom drawing
                    scene.raw((ctx, plot) => {
                      const lineX0 = -0.5;
                      const lineY0 = c + d * lineX0;
                      const lineX1 = 4.5;
                      const lineY1 = c + d * lineX1;

                      const s0x = plot.toScreenX(lineX0);
                      const s0y = plot.toScreenY(lineY0);
                      const s1x = plot.toScreenX(lineX1);
                      const s1y = plot.toScreenY(lineY1);

                      // Regression line
                      ctx.save();
                      ctx.strokeStyle = "#3b82f6";
                      ctx.lineWidth = 2.5;
                      ctx.beginPath();
                      ctx.moveTo(s0x, s0y);
                      ctx.lineTo(s1x, s1y);
                      ctx.stroke();

                      // Residuals and error squares
                      points.forEach((p) => {
                        const yHat = c + d * p.x;
                        const px = plot.toScreenX(p.x);
                        const py = plot.toScreenY(p.y);
                        const pyHat = plot.toScreenY(yHat);
                        const ei = p.y - yHat;

                        if (showSquares && Math.abs(ei) > 0.001) {
                          const sidePx = Math.abs(py - pyHat);
                          const topPy = Math.min(py, pyHat);
                          ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
                          ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
                          ctx.lineWidth = 1;
                          ctx.fillRect(px, topPy, sidePx, sidePx);
                          ctx.strokeRect(px, topPy, sidePx, sidePx);
                        }

                        // Vertical dashed line
                        ctx.setLineDash([4, 4]);
                        ctx.strokeStyle = "#ef4444";
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(px, py);
                        ctx.lineTo(px, pyHat);
                        ctx.stroke();
                        ctx.setLineDash([]);

                        // Foot of projection
                        ctx.fillStyle = "#3b82f6";
                        ctx.beginPath();
                        ctx.arc(px, pyHat, 3.5, 0, Math.PI * 2);
                        ctx.fill();
                      });
                      ctx.restore();
                    });

                    // 2. Interactive Draggable Data Points
                    points.forEach((p, idx) => {
                      scene.addPoint({
                        at: [p.x, p.y],
                        color: "#2563eb",
                        radius: 6,
                        ring: true,
                        label: `${p.name} (${p.x.toFixed(1)}, ${p.y.toFixed(1)})`,
                        draggable: true,
                        onDrag: ([wx, wy]) => {
                          setPoints((prev) => {
                            const next = [...prev];
                            next[idx] = {
                              ...next[idx],
                              x:
                                Math.round(Math.max(0, Math.min(4, wx)) * 10) /
                                10,
                              y:
                                Math.round(Math.max(-1, Math.min(6, wy)) * 10) /
                                10,
                            };
                            return next;
                          });
                          setPresetKey("custom");
                        },
                      });
                    });

                    scene.render(ctx, plot, theme);
                  }}
                >
                  <div className="absolute bottom-2 left-2 pointer-events-none rounded bg-black/60 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-xs z-10">
                    拖动蓝点调整数据点坐标 (x, y)
                  </div>
                </CanvasViewport>

                <div className="mt-2 text-xs text-muted-foreground">
                  残差平方和：
                  {`$\\lVert \\mathbf{e} \\rVert^2 = ${residualNormSq.toFixed(3)}$`}
                </div>
              </div>

              {/* Right View: 3D Vector Space Canvas */}
              <div className="relative flex flex-col rounded-xl border border-border/80 bg-surface/50 p-3 shadow-inner">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    {"向量子空间 (Vector Space $\\mathbb{R}^3$)"}
                  </span>
                  <div className="text-[11px] text-purple-400 font-mono">
                    Aᵀe = [
                    {Math.abs(a1_dot_e) < 1e-4 ? "0.00" : a1_dot_e.toFixed(2)},{" "}
                    {Math.abs(a2_dot_e) < 1e-4 ? "0.00" : a2_dot_e.toFixed(2)}
                    ]ᵀ
                  </div>
                </div>

                <Viewer3DViewport
                  factory={createLeastSquares3DScene}
                  className="h-[var(--demo-height,20rem)]"
                  onUpdate={({ api, viewer }) => {
                    api.update(
                      points,
                      [
                        fitResult.bHat[0] ?? 0,
                        fitResult.bHat[1] ?? 0,
                        fitResult.bHat[2] ?? 0,
                      ],
                      showColPlane,
                    );
                    viewer.render();
                  }}
                  deps={[points, fitResult, showColPlane]}
                >
                  <div className="absolute bottom-2 left-2 pointer-events-none rounded bg-black/60 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-xs z-10">
                    按住鼠标左键旋转 3D 视角，右键平移
                  </div>

                  {points.length >= 3 && (
                    <>
                      <Viewer3DViewport.Pin
                        at={[points[0].y, points[1].y, points[2].y]}
                        offset={[0, -12]}
                      >
                        <div className="rounded-full bg-red-600/90 text-[10px] text-white px-2 py-0.5 font-bold shadow-md select-none">
                          b 观测
                        </div>
                      </Viewer3DViewport.Pin>

                      <Viewer3DViewport.Pin
                        at={[
                          fitResult.bHat[0] ?? 0,
                          fitResult.bHat[1] ?? 0,
                          fitResult.bHat[2] ?? 0,
                        ]}
                        offset={[0, 12]}
                      >
                        <div className="rounded-full bg-emerald-600/90 text-[10px] text-white px-2 py-0.5 font-bold shadow-md select-none">
                          b̂ = Ax̂
                        </div>
                      </Viewer3DViewport.Pin>
                    </>
                  )}
                </Viewer3DViewport>

                {/* Legend & 3D Orthogonality Indicator */}
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {"$\\mathbf{b}$"} 观测
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {"$\\hat{\\mathbf{b}}$"} 投影
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      {"$\\mathbf{e}$"} 残差
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
        controls={
          <div className="space-y-3">
            <KdeCard title="求解算法 (Solver Method)" variant="dense">
              <KdeTabs
                options={METHOD_TABS}
                value={method}
                onChange={(m: string) => setMethod(m as FitMethod)}
              />
            </KdeCard>

            <KdeCard title="数据几何预设" variant="dense">
              <PresetSelector
                options={PRESETS}
                value={presetKey}
                onChange={handlePresetChange}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                {PRESETS[presetKey]?.desc}
              </p>
            </KdeCard>

            {method === "ridge" && (
              <KdeCard title="Ridge 正则化惩罚系数" variant="dense">
                <ParamSlider
                  label="$\\lambda$ 惩罚权重"
                  value={lambda}
                  min={0}
                  max={5}
                  step={0.05}
                  onChange={setLambda}
                  widthClass="w-full"
                />
              </KdeCard>
            )}

            <KdeCard title="视图图层与辅助线" variant="dense">
              <div className="flex flex-wrap items-center gap-4">
                <KdeCheckbox
                  label="2D 误差平方面积 (e²)"
                  checked={showSquares}
                  onChange={setShowSquares}
                />
                <KdeCheckbox
                  label="3D 列空间 col(A) 平面"
                  checked={showColPlane}
                  onChange={setShowColPlane}
                />
              </div>
            </KdeCard>

            <div className="grid grid-cols-2 gap-1.5">
              <KdeReadout label="拟合截距 c" value={c.toFixed(3)} dense />
              <KdeReadout label="拟合斜率 d" value={d.toFixed(3)} dense />
              <KdeReadout
                label="残差范数 ‖e‖"
                value={Math.sqrt(residualNormSq).toFixed(3)}
                variant="accent"
                dense
              />
              <KdeReadout
                label="正交检验 Aᵀe"
                value={`[${Math.abs(a1_dot_e) < 1e-4 ? "0.00" : a1_dot_e.toFixed(2)}, ${Math.abs(a2_dot_e) < 1e-4 ? "0.00" : a2_dot_e.toFixed(2)}]`}
                variant={
                  Math.abs(a1_dot_e) < 0.05 && Math.abs(a2_dot_e) < 0.05
                    ? "success"
                    : "warning"
                }
                dense
              />
            </div>

            <KdeCard title={currentDerivation.title} variant="dense">
              <div className="space-y-1.5 pt-0.5">
                {currentDerivation.steps.map((step, idx) => (
                  <div
                    key={idx}
                    className="rounded bg-surface-hover/50 p-1.5 border border-border/40 space-y-0.5"
                  >
                    <div className="text-[10px] text-muted-foreground font-mono flex items-center justify-between">
                      <span>
                        {idx + 1}. {step.label}
                      </span>
                    </div>
                    <div className="overflow-x-auto overflow-y-hidden py-1 text-[11px] text-foreground">
                      {`$${step.tex}$`}
                    </div>
                  </div>
                ))}
              </div>
            </KdeCard>

            <KdeCard title="四大子空间正交性检验" variant="dense">
              <div className="space-y-1.5 pt-0.5">
                <div className="rounded bg-surface-hover/50 p-1.5 border border-border/40 space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-mono">
                    1. 投影向量 b̂ = Ax̂
                  </div>
                  <div className="overflow-x-auto overflow-y-hidden py-1 text-[11px] text-foreground">
                    {`$\\hat{\\mathbf{b}} = A\\hat{\\mathbf{x}} = \\begin{pmatrix} ${(fitResult.bHat[0] ?? 0).toFixed(2)} \\\\ ${(fitResult.bHat[1] ?? 0).toFixed(2)} \\\\ ${(fitResult.bHat[2] ?? 0).toFixed(2)} \\end{pmatrix}$`}
                  </div>
                </div>

                <div className="rounded bg-surface-hover/50 p-1.5 border border-border/40 space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-mono">
                    2. 残差向量 e = b - b̂
                  </div>
                  <div className="overflow-x-auto overflow-y-hidden py-1 text-[11px] text-foreground">
                    {`$\\mathbf{e} = \\mathbf{b} - \\hat{\\mathbf{b}} = \\begin{pmatrix} ${(fitResult.residuals[0] ?? 0).toFixed(2)} \\\\ ${(fitResult.residuals[1] ?? 0).toFixed(2)} \\\\ ${(fitResult.residuals[2] ?? 0).toFixed(2)} \\end{pmatrix}$`}
                  </div>
                </div>

                <div className="rounded bg-surface-hover/50 p-1.5 border border-border/40 space-y-0.5">
                  <div className="text-[10px] text-muted-foreground font-mono">
                    3. 正交形式 Aᵀe
                  </div>
                  <div className="overflow-x-auto overflow-y-hidden py-1 text-[11px] text-foreground">
                    {`$A^\\top \\mathbf{e} = \\begin{pmatrix} ${Math.abs(a1_dot_e) < 1e-4 ? "0.00" : a1_dot_e.toFixed(2)} \\\\ ${Math.abs(a2_dot_e) < 1e-4 ? "0.00" : a2_dot_e.toFixed(2)} \\end{pmatrix}$`}
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-purple-400 font-medium pt-1 border-t border-border/60 flex items-center justify-between">
                <span>代数结论:</span>
                <span className="font-mono text-[10px]">
                  {
                    "$\\mathbf{e} \\in \\ker(A^\\top) \\iff \\mathbf{e} \\perp \\operatorname{col}(A)$"
                  }
                </span>
              </div>
            </KdeCard>

            <KdeCard title="数值稳定性与条件数" variant="dense">
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-1.5">
                  <KdeReadout
                    label="设计矩阵条件数 κ(A)"
                    value={condA.toFixed(2)}
                    dense
                  />
                  <KdeReadout
                    label="正规方程条件数 κ(AᵀA)"
                    value={condAtA.toFixed(1)}
                    variant={
                      condAtA > 1000
                        ? "danger"
                        : condAtA > 100
                          ? "warning"
                          : "success"
                    }
                    dense
                  />
                </div>
                {condAtA > 100 && (
                  <div className="text-[10px] text-amber-400 leading-tight pt-1">
                    ⚠️ 正规方程平方放大了条件数，工程建议采用 QR 正交分解或 SVD
                    求解！
                  </div>
                )}
              </div>
            </KdeCard>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
