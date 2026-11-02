import { useState } from "react";
import CanvasViewport from "../framework/CanvasViewport";
import ExpandableDemo from "../framework/ExpandableDemo";
import ParamSlider from "../framework/ParamSlider";
import PresetSelector from "../framework/PresetSelector";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeTabs from "../framework/KdeTabs";
import type { Bounds2 } from "../../visualizations/core/2d/plot2d";

type DemoMode = "signed-area" | "jacobi-flow" | "similarity";

const MODES: Array<{ id: DemoMode; label: string }> = [
  { id: "signed-area", label: "几何网格与定向面积" },
  { id: "jacobi-flow", label: "连续流动与 Jacobi 膨胀率" },
  { id: "similarity", label: "基变换与相似不变性" },
];

interface MatrixPreset {
  name: string;
  a11: number;
  a12: number;
  a21: number;
  a22: number;
}

const PRESETS: Record<string, MatrixPreset> = {
  dilation: { name: "各向异性扩张", a11: 1.5, a12: 0.3, a21: 0.2, a22: 1.2 },
  shear: { name: "保面积剪切", a11: 1.0, a12: 1.0, a21: 0.0, a22: 1.0 },
  rotation: { name: "纯旋转变换", a11: 0.8, a12: -0.6, a21: 0.6, a22: 0.8 },
  traceFree: {
    name: "无迹流动 (tr=0)",
    a11: 0.8,
    a12: 1.2,
    a21: 0.4,
    a22: -0.8,
  },
  singular: {
    name: "退化投影 (det=0)",
    a11: 1.0,
    a12: 1.0,
    a21: 1.0,
    a22: 1.0,
  },
};

const INITIAL_BOUNDS: Bounds2 = {
  xMin: -2.8,
  xMax: 3.5,
  yMin: -2.5,
  yMax: 3.0,
};

export default function TraceDeterminantDemo({ height }: { height?: string }) {
  const [mode, setMode] = useState<DemoMode>("signed-area");
  const [preset, setPreset] = useState<string>("dilation");

  // Matrix A components
  const [a11, setA11] = useState(1.5);
  const [a12, setA12] = useState(0.3);
  const [a21, setA21] = useState(0.2);
  const [a22, setA22] = useState(1.2);

  // Flow time t
  const [flowT, setFlowT] = useState(0.8);

  // Basis rotation angle for similarity mode
  const [basisAngle, setBasisAngle] = useState(0.6);

  const handlePresetChange = (key: string) => {
    setPreset(key);
    const p = PRESETS[key];
    if (p) {
      setA11(p.a11);
      setA12(p.a12);
      setA21(p.a21);
      setA22(p.a22);
    }
  };

  // Mathematical metrics calculation
  const tr = a11 + a22;
  const det = a11 * a22 - a12 * a21;

  // Jacobi expansion values
  const jacobiArea =
    (1 + flowT * a11) * (1 + flowT * a22) - flowT * a12 * (flowT * a21);
  const linearApproximation = 1 + flowT * tr;

  // Similarity rotated matrix values
  const cosB = Math.cos(basisAngle);
  const sinB = Math.sin(basisAngle);
  const ap11 = a11 * cosB + a12 * sinB;
  const ap12 = -a11 * sinB + a12 * cosB;
  const ap21 = a21 * cosB + a22 * sinB;
  const ap22 = -a21 * sinB + a22 * cosB;

  const simA11 = cosB * ap11 + sinB * ap21;
  const simA12 = cosB * ap12 + sinB * ap22;
  const simA21 = -sinB * ap11 + cosB * ap21;
  const simA22 = -sinB * ap12 + cosB * ap22;
  const simTr = simA11 + simA22;
  const simDet = simA11 * simA22 - simA12 * simA21;

  return (
    <ExpandableDemo id="trace-and-determinant" height={height}>
      <KdeWindowShell
        title="迹与行列式几何流形与相似不变性"
        eyebrow="Linear Algebra · Trace & Determinant"
        mark="tr(A) & det(A)"
        modeTag={
          mode === "signed-area"
            ? "定向面积变换"
            : mode === "jacobi-flow"
              ? "Jacobi 连续流动"
              : "基变换相似不变性"
        }
        display={
          <CanvasViewport
            initialBounds={INITIAL_BOUNDS}
            equalScale
            className="h-[var(--demo-height,20rem)]"
            onDraw={(ctx, plot, theme, scene) => {
              scene.addAxes("x", "y");

              // Original unit square
              scene.addPolyline({
                points: [
                  [0, 0],
                  [1, 0],
                  [1, 1],
                  [0, 1],
                ],
                closed: true,
                color: theme.muted,
                width: 1.5,
                dash: [4, 4],
              });

              scene.raw((ctx, plot, theme) => {
                ctx.fillStyle = theme.muted;
                ctx.font = "11px sans-serif";
                const sqCenterX = plot.toScreenX(0.5);
                const sqCenterY = plot.toScreenY(0.5);
                ctx.fillText("单位方格 (面积 1)", sqCenterX - 36, sqCenterY);
              });

              if (mode === "signed-area") {
                const v1x = a11;
                const v1y = a21;
                const v2x = a12;
                const v2y = a22;
                const vSumX = v1x + v2x;
                const vSumY = v1y + v2y;

                const fillCol =
                  det >= 0
                    ? "rgba(39, 174, 96, 0.2)"
                    : "rgba(231, 76, 60, 0.2)";
                const strokeCol =
                  det >= 0
                    ? "rgba(39, 174, 96, 0.85)"
                    : "rgba(231, 76, 60, 0.85)";

                scene.addPolyline({
                  points: [
                    [0, 0],
                    [v1x, v1y],
                    [vSumX, vSumY],
                    [v2x, v2y],
                  ],
                  closed: true,
                  color: strokeCol,
                  fillColor: fillCol,
                  width: 2,
                });

                // Column vectors with draggable handles
                scene.addVector({
                  to: [v1x, v1y],
                  color: "#3b82f6",
                  label: "a₁ (第1列)",
                  width: 3,
                  draggable: true,
                  handleRing: true,
                  onDrag: ([x, y]) => {
                    setA11(Math.round(x * 10) / 10);
                    setA21(Math.round(y * 10) / 10);
                  },
                });

                scene.addVector({
                  to: [v2x, v2y],
                  color: "#f59e0b",
                  label: "a₂ (第2列)",
                  width: 3,
                  draggable: true,
                  handleRing: true,
                  onDrag: ([x, y]) => {
                    setA12(Math.round(x * 10) / 10);
                    setA22(Math.round(y * 10) / 10);
                  },
                });
              } else if (mode === "jacobi-flow") {
                const t = flowT;
                const m11 = 1 + t * a11;
                const m12 = t * a12;
                const m21 = t * a21;
                const m22 = 1 + t * a22;

                const v1x = m11;
                const v1y = m21;
                const v2x = m12;
                const v2y = m22;
                const vSumX = v1x + v2x;
                const vSumY = v1y + v2y;

                scene.addPolyline({
                  points: [
                    [0, 0],
                    [v1x, v1y],
                    [vSumX, vSumY],
                    [v2x, v2y],
                  ],
                  closed: true,
                  color: "#6366f1",
                  fillColor: "rgba(99, 102, 241, 0.22)",
                  width: 2.5,
                });

                scene.addVector({
                  from: [1, 0],
                  to: [1 + a11 * 0.5, a21 * 0.5],
                  color: "#3b82f6",
                  label: "v(e₁)",
                  width: 2,
                });

                scene.addVector({
                  from: [0, 1],
                  to: [a12 * 0.5, 1 + a22 * 0.5],
                  color: "#f59e0b",
                  label: "v(e₂)",
                  width: 2,
                });
              } else if (mode === "similarity") {
                // Standard transformed basis
                scene.addVector({
                  to: [a11, a21],
                  color: "rgba(59, 130, 246, 0.5)",
                  label: "A e₁",
                  width: 1.5,
                });
                scene.addVector({
                  to: [a12, a22],
                  color: "rgba(245, 158, 11, 0.5)",
                  label: "A e₂",
                  width: 1.5,
                });

                // Rotated coordinate axes
                scene.addVector({
                  to: [cosB, sinB],
                  color: "#10b981",
                  label: "p₁ (新基)",
                  width: 2.5,
                });
                scene.addVector({
                  to: [-sinB, cosB],
                  color: "#8b5cf6",
                  label: "p₂ (新基)",
                  width: 2.5,
                });

                // Transformed new basis
                scene.addVector({
                  to: [ap11, ap21],
                  color: "#10b981",
                  label: "A p₁",
                  width: 2.5,
                  dash: [4, 2],
                });
                scene.addVector({
                  to: [ap12, ap22],
                  color: "#8b5cf6",
                  label: "A p₂",
                  width: 2.5,
                  dash: [4, 2],
                });
              }

              scene.render(ctx, plot, theme);
            }}
          />
        }
        controls={
          <div className="space-y-3">
            <KdeTabs
              options={MODES}
              value={mode}
              onChange={(val: string) => setMode(val as DemoMode)}
            />

            <KdeCard title="预设矩阵与动态参数" variant="dense">
              <div className="space-y-2.5">
                <PresetSelector
                  label="矩阵预设:"
                  options={PRESETS}
                  value={preset}
                  onChange={handlePresetChange}
                />

                {mode === "jacobi-flow" && (
                  <ParamSlider
                    label="流流动时间 $t$"
                    labelMode="adaptive"
                    widthClass="w-full"
                    min={0}
                    max={1.5}
                    step={0.05}
                    value={flowT}
                    onChange={setFlowT}
                    display={`t = ${flowT.toFixed(2)}`}
                  />
                )}

                {mode === "similarity" && (
                  <ParamSlider
                    label="基底旋转角 $\theta$"
                    labelMode="adaptive"
                    widthClass="w-full"
                    min={0}
                    max={Math.PI}
                    step={0.05}
                    value={basisAngle}
                    onChange={setBasisAngle}
                    display={`${((basisAngle * 180) / Math.PI).toFixed(0)}°`}
                  />
                )}
              </div>
            </KdeCard>

            <KdeCard title="矩阵特征与固有不变量" variant="dense">
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="space-y-1">
                  <div className="font-mono text-sm text-foreground">
                    {`$A = \\begin{pmatrix} ${a11.toFixed(1)} & ${a12.toFixed(1)} \\\\ ${a21.toFixed(1)} & ${a22.toFixed(1)} \\end{pmatrix}$`}
                  </div>
                  <div className="text-muted-foreground font-mono">
                    {`列向量 $a_1=(${a11.toFixed(1)}, ${a21.toFixed(1)})$, $a_2=(${a12.toFixed(1)}, ${a22.toFixed(1)})$`}
                  </div>
                  {mode === "similarity" && (
                    <div className="mt-1 font-mono text-[11px] text-muted-foreground pt-1 border-t border-[var(--kde-border)]">
                      {`$A' = \\begin{pmatrix} ${simA11.toFixed(2)} & ${simA12.toFixed(2)} \\\\ ${simA21.toFixed(2)} & ${simA22.toFixed(2)} \\end{pmatrix}$`}
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-muted-foreground leading-normal">
                  {mode === "signed-area" && (
                    <p>
                      单位方格变换后平行四边形面积为{" "}
                      <span className="font-mono font-bold text-foreground">
                        |det(A)| = {Math.abs(det).toFixed(2)}
                      </span>
                      。拖动蓝色/橙色端点可实时修改列基。
                    </p>
                  )}
                  {mode === "jacobi-flow" && (
                    <div className="font-mono text-xs">
                      <p>实际面积 Area(t) = {jacobiArea.toFixed(3)}</p>
                      <p>一阶线性近似 ≈ {linearApproximation.toFixed(3)}</p>
                      <p className="mt-0.5 text-primary text-[11px]">
                        t=0 时膨胀率 d(Area)/dt ≡ tr(A) = {tr.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {mode === "similarity" && (
                    <div>
                      <p className="font-semibold text-foreground">
                        相似变换保持迹与行列式守恒：
                      </p>
                      <p className="font-mono text-[11px]">
                        tr(A') = {simTr.toFixed(2)} ≡ {tr.toFixed(2)}
                      </p>
                      <p className="font-mono text-[11px]">
                        det(A') = {simDet.toFixed(2)} ≡ {det.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </KdeCard>

            <div className="grid grid-cols-2 gap-1.5">
              <KdeReadout
                label="迹 tr(A)"
                value={tr.toFixed(2)}
                variant="accent"
                dense
              />
              <KdeReadout label="行列式 det(A)" value={det.toFixed(2)} dense />
              <KdeReadout
                label="几何定向"
                value={
                  det > 0
                    ? "保持 (逆时针)"
                    : det < 0
                      ? "翻转 (顺时针)"
                      : "奇异退化 (det=0)"
                }
                variant={det !== 0 ? "success" : "danger"}
                dense
              />
              <KdeReadout
                label={
                  mode === "similarity" ? "相似变换 tr(A')" : "面积比例 |det|"
                }
                value={
                  mode === "similarity"
                    ? `${simTr.toFixed(2)} (恒等)`
                    : Math.abs(det).toFixed(2)
                }
                dense
              />
            </div>

            <p className="text-xs text-muted-foreground">
              提示：在“几何网格与定向面积”模式下可直接在画布中拖拽蓝/橙向量端点；切换至“连续流动”观察微元体积增长；切换至“相似不变性”旋转基底验证迹与行列式的守恒不变性。
            </p>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
