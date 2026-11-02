import { useState } from "react";
import ExpandableDemo from "../framework/ExpandableDemo";
import CanvasViewport from "../framework/CanvasViewport";
import CanvasOverlay from "../framework/CanvasOverlay";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeTabs, { type KdeTabOption } from "../framework/KdeTabs";
import KdeWindowShell from "../framework/KdeWindowShell";
import PresetSelector from "../framework/PresetSelector";
import ParamSlider from "../framework/ParamSlider";
import type { Bounds2 } from "../../visualizations/core/2d/plot2d";

type ModeType = "weighted" | "func" | "theorems";

const MODES: Array<KdeTabOption<ModeType>> = [
  { id: "weighted", label: "加权内积与度规椭圆" },
  { id: "func", label: "函数空间积分内积 ⟨f,g⟩" },
  { id: "theorems", label: "柯西-施瓦茨与平行四边形恒等式" },
];

const BOUNDS: Bounds2 = { xMin: -3.5, xMax: 3.5, yMin: -3.5, yMax: 3.5 };

interface FuncPreset {
  name: string;
  fName: string;
  gName: string;
  f: (x: number) => number;
  g: (x: number) => number;
  exactIntegral: number;
}

const FUNC_PRESETS: FuncPreset[] = [
  {
    name: "sin(πx) 与 cos(πx) (区间 [-1, 1] 正交)",
    fName: "\\sin(\\pi x)",
    gName: "\\cos(\\pi x)",
    f: (x) => Math.sin(Math.PI * x),
    g: (x) => Math.cos(Math.PI * x),
    exactIntegral: 0,
  },
  {
    name: "x 与 x² (奇次与偶次多项式正交)",
    fName: "x",
    gName: "x^2",
    f: (x) => x,
    g: (x) => x * x,
    exactIntegral: 0,
  },
  {
    name: "1 与 x (正交常数与线性函数)",
    fName: "1",
    gName: "x",
    f: (_) => 1,
    g: (x) => x,
    exactIntegral: 0,
  },
  {
    name: "x 与 x (相同函数 ⟨x, x⟩ = 2/3)",
    fName: "x",
    gName: "x",
    f: (x) => x,
    g: (x) => x,
    exactIntegral: 2 / 3,
  },
];

export function InnerProductSpaceDemo({ height }: { height?: string }) {
  const [mode, setMode] = useState<ModeType>("weighted");

  // Mode 1: Weighted
  const [w11, setW11] = useState(1.0);
  const [w22, setW22] = useState(2.25);
  const [uVec, setUVec] = useState<{ x: number; y: number }>({
    x: 1.0,
    y: 0.8,
  });
  const [vWeighted] = useState<{ x: number; y: number }>({ x: 0.6, y: -0.6 });

  // Mode 2: Function Space
  const [activeFuncIdx, setActiveFuncIdx] = useState(0);
  const activeFunc = FUNC_PRESETS[activeFuncIdx];

  // Mode 3: Theorems
  const [uThem, setUThem] = useState<{ x: number; y: number }>({
    x: 2.0,
    y: 0.8,
  });
  const [vThem, setVThem] = useState<{ x: number; y: number }>({
    x: 0.8,
    y: 1.8,
  });

  // Calculations for Mode 1
  const normUSq = w11 * uVec.x * uVec.x + w22 * uVec.y * uVec.y;
  const normU = Math.sqrt(Math.max(0, normUSq));
  const normVSq =
    w11 * vWeighted.x * vWeighted.x + w22 * vWeighted.y * vWeighted.y;
  const _normV = Math.sqrt(Math.max(0, normVSq));
  const innerUV = w11 * uVec.x * vWeighted.x + w22 * uVec.y * vWeighted.y;

  // Calculations for Mode 3
  const dotThem = uThem.x * vThem.x + uThem.y * vThem.y;
  const normUThemSq = uThem.x * uThem.x + uThem.y * uThem.y;
  const normVThemSq = vThem.x * vThem.x + vThem.y * vThem.y;
  const normUThem = Math.sqrt(normUThemSq);
  const normVThem = Math.sqrt(normVThemSq);

  const sumUV = { x: uThem.x + vThem.x, y: uThem.y + vThem.y };
  const diffUV = { x: uThem.x - vThem.x, y: uThem.y - vThem.y };
  const normSumSq = sumUV.x * sumUV.x + sumUV.y * sumUV.y;
  const normDiffSq = diffUV.x * diffUV.x + diffUV.y * diffUV.y;
  const leftParallelogram = normSumSq + normDiffSq;
  const rightParallelogram = 2 * (normUThemSq + normVThemSq);

  return (
    <ExpandableDemo id="inner-product-space" height={height}>
      <KdeWindowShell
        title="内积空间几何：度规、函数空间与基本几何定理"
        eyebrow="Linear Algebra · Inner Product Spaces"
        mark="⟨u, v⟩"
        modeTag={
          mode === "weighted"
            ? "加权度规椭圆"
            : mode === "func"
              ? "L²[-1,1] 积分内积"
              : "几何不等式与恒等式"
        }
        display={
          <CanvasViewport
            initialBounds={BOUNDS}
            className="h-[var(--demo-height,22rem)]"
            onDraw={(ctx, plot, theme, scene) => {
              scene.addAxes();

              if (mode === "weighted") {
                // Unit ellipse for weighted metric: w11 * x^2 + w22 * y^2 = 1
                const rx = 1 / Math.sqrt(w11);
                const ry = 1 / Math.sqrt(w22);
                const ellipsePts: Array<[number, number]> = [];
                for (let i = 0; i <= 80; i++) {
                  const th = (i / 80) * Math.PI * 2;
                  ellipsePts.push([rx * Math.cos(th), ry * Math.sin(th)]);
                }
                scene.addPolyline({
                  points: ellipsePts,
                  color: "#2563eb",
                  fillColor: "rgba(37, 99, 235, 0.08)",
                  closed: true,
                  width: 2.0,
                });

                // Fixed vector v
                scene.addVector({
                  to: [vWeighted.x, vWeighted.y],
                  color: "#059669",
                  width: 2.5,
                  label: `v (${vWeighted.x.toFixed(2)}, ${vWeighted.y.toFixed(2)})`,
                });

                // Draggable vector u
                scene.addVector({
                  to: [uVec.x, uVec.y],
                  color: "#d97706",
                  width: 3.5,
                  label: `u (${uVec.x.toFixed(2)}, ${uVec.y.toFixed(2)})`,
                  draggable: true,
                  handleRadius: 6,
                  handleRing: true,
                  hitRadiusPx: 24,
                  onDrag: (tip) => setUVec({ x: tip[0], y: tip[1] }),
                });
              } else if (mode === "func") {
                // Curves f(x), g(x), and integrand f(x)*g(x) on [-1, 1]
                const fPts: Array<[number, number]> = [];
                const gPts: Array<[number, number]> = [];
                const prodPts: Array<[number, number]> = [];

                for (let x = -1; x <= 1.001; x += 0.02) {
                  const fx = activeFunc.f(x);
                  const gx = activeFunc.g(x);
                  fPts.push([x, fx]);
                  gPts.push([x, gx]);
                  prodPts.push([x, fx * gx]);
                }

                // Shaded integral area under product f(x)*g(x)
                scene.addPolyline({
                  points: [[-1, 0], ...prodPts, [1, 0]],
                  color: "rgba(168, 85, 247, 0.4)",
                  fillColor: "rgba(168, 85, 247, 0.15)",
                  closed: true,
                  width: 1.5,
                });

                scene.addPolyline({
                  points: fPts,
                  color: "#2563eb",
                  width: 2.5,
                });

                scene.addPolyline({
                  points: gPts,
                  color: "#059669",
                  width: 2.5,
                });
              } else {
                // Mode: Theorems (u, v, parallelogram u+v, diagonal u-v)
                scene.addPolyline({
                  points: [
                    [0, 0],
                    [uThem.x, uThem.y],
                    [sumUV.x, sumUV.y],
                    [vThem.x, vThem.y],
                  ],
                  closed: true,
                  fillColor: "rgba(59, 130, 246, 0.08)",
                  color: "rgba(59, 130, 246, 0.3)",
                  width: 1.5,
                  dash: [4, 4],
                });

                // Diagonal u - v from v to u
                scene.addVector({
                  from: [vThem.x, vThem.y],
                  to: [uThem.x, uThem.y],
                  color: "#dc2626",
                  width: 2.0,
                  dash: [4, 3],
                  label: "u - v",
                });

                // Diagonal sum u + v
                scene.addVector({
                  to: [sumUV.x, sumUV.y],
                  color: "#7c3aed",
                  width: 2.5,
                  label: "u + v",
                });

                // Vector u (draggable)
                scene.addVector({
                  to: [uThem.x, uThem.y],
                  color: "#2563eb",
                  width: 3.5,
                  label: "u",
                  draggable: true,
                  handleRadius: 6,
                  handleRing: true,
                  hitRadiusPx: 24,
                  onDrag: (tip) => setUThem({ x: tip[0], y: tip[1] }),
                });

                // Vector v (draggable)
                scene.addVector({
                  to: [vThem.x, vThem.y],
                  color: "#059669",
                  width: 3.5,
                  label: "v",
                  draggable: true,
                  handleRadius: 6,
                  handleRing: true,
                  hitRadiusPx: 24,
                  onDrag: (tip) => setVThem({ x: tip[0], y: tip[1] }),
                });
              }

              scene.render(ctx, plot, theme);
            }}
          >
            <CanvasOverlay position="top-left">
              <CanvasOverlay.Title>内积空间结构</CanvasOverlay.Title>
              <CanvasOverlay.Subtitle>
                {mode === "weighted"
                  ? "度规矩阵 G 诱导的赋范空间与单位球"
                  : mode === "func"
                    ? "连续函数空间积分正交性"
                    : "柯西-施瓦茨不等式与平行四边形恒等式"}
              </CanvasOverlay.Subtitle>
            </CanvasOverlay>

            <CanvasOverlay position="bottom-left">
              {mode === "weighted" ? (
                <>
                  <CanvasOverlay.Item
                    color="#d97706"
                    label={`‖u‖_G = ${normU.toFixed(2)}`}
                  />
                  <CanvasOverlay.Item
                    color="#2563eb"
                    label={`⟨u, v⟩_G = ${innerUV.toFixed(2)}`}
                  />
                </>
              ) : mode === "func" ? (
                <CanvasOverlay.Item
                  color="#7c3aed"
                  label={`⟨f, g⟩ = ${activeFunc.exactIntegral.toFixed(3)}`}
                />
              ) : (
                <>
                  <CanvasOverlay.Item
                    color="#2563eb"
                    label={`|⟨u, v⟩| = ${Math.abs(dotThem).toFixed(2)} ≤ ‖u‖‖v‖ = ${(normUThem * normVThem).toFixed(2)}`}
                  />
                  <CanvasOverlay.Item
                    color="#7c3aed"
                    label={`‖u+v‖² + ‖u-v‖² = ${leftParallelogram.toFixed(2)} = 2(‖u‖²+‖v‖²)`}
                  />
                </>
              )}
            </CanvasOverlay>
          </CanvasViewport>
        }
        controls={
          <div className="space-y-3">
            <KdeTabs
              options={MODES}
              value={mode}
              onChange={(m) => setMode(m as ModeType)}
            />

            {mode === "weighted" && (
              <>
                <KdeCard title="度规矩阵对角权重" variant="dense">
                  <div className="space-y-2">
                    <ParamSlider
                      label="权重 $w_{11}$ (X 轴主向权重)"
                      labelMode="adaptive"
                      widthClass="w-full"
                      value={w11}
                      min={0.25}
                      max={4.0}
                      step={0.25}
                      onChange={setW11}
                    />
                    <ParamSlider
                      label="权重 $w_{22}$ (Y 轴主向权重)"
                      labelMode="adaptive"
                      widthClass="w-full"
                      value={w22}
                      min={0.25}
                      max={4.0}
                      step={0.25}
                      onChange={setW22}
                    />
                  </div>
                </KdeCard>

                <div className="grid grid-cols-2 gap-1.5">
                  <KdeReadout
                    label="加权内积 ⟨u, v⟩_G"
                    value={innerUV.toFixed(3)}
                    variant={Math.abs(innerUV) < 0.05 ? "success" : "default"}
                    dense
                  />
                  <KdeReadout
                    label="诱导范数 ‖u‖_G"
                    value={normU.toFixed(3)}
                    variant="accent"
                    dense
                  />
                </div>
              </>
            )}

            {mode === "func" && (
              <>
                <KdeCard title="典型正交/非正交函数对" variant="dense">
                  <PresetSelector
                    label="选择函数对:"
                    options={FUNC_PRESETS.map((p, idx) => ({
                      id: String(idx),
                      label: p.name,
                    }))}
                    value={String(activeFuncIdx)}
                    onChange={(id) => setActiveFuncIdx(Number.parseInt(id, 10))}
                  />
                </KdeCard>

                <div className="grid grid-cols-2 gap-1.5">
                  <KdeReadout
                    label="积分内积结果 ⟨f, g⟩"
                    value={activeFunc.exactIntegral.toFixed(3)}
                    variant={
                      activeFunc.exactIntegral === 0 ? "success" : "default"
                    }
                    dense
                  />
                  <KdeReadout
                    label="正交判定"
                    value={
                      activeFunc.exactIntegral === 0 ? "严格正交 (0)" : "非正交"
                    }
                    variant={
                      activeFunc.exactIntegral === 0 ? "success" : "default"
                    }
                    dense
                  />
                </div>
              </>
            )}

            {mode === "theorems" && (
              <div className="space-y-2">
                <KdeCard
                  title="柯西-施瓦茨不等式 |⟨u,v⟩| ≤ ‖u‖‖v‖"
                  variant="dense"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="text-muted-foreground">
                        左侧 |⟨u, v⟩|：
                      </span>
                      <span className="text-primary font-bold">
                        {Math.abs(dotThem).toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span className="text-muted-foreground">
                        右侧 ‖u‖ ‖v‖：
                      </span>
                      <span className="text-emerald-500 font-bold">
                        {(normUThem * normVThem).toFixed(3)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1 border-t border-[var(--kde-border,#bec5cc)]/60">
                      {Math.abs(Math.abs(dotThem) - normUThem * normVThem) <
                      0.05
                        ? "等号严格成立：两向量共线！"
                        : "严格小于：两向量不共线。"}
                    </p>
                  </div>
                </KdeCard>

                <KdeCard
                  title="平行四边形恒等式 ‖u+v‖² + ‖u-v‖² = 2(‖u‖² + ‖v‖²)"
                  variant="dense"
                >
                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        对角线平方和：
                      </span>
                      <span className="text-purple-400 font-bold">
                        {leftParallelogram.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        2 × (边长平方和)：
                      </span>
                      <span className="text-purple-400 font-bold">
                        {rightParallelogram.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </KdeCard>
              </div>
            )}
          </div>
        }
      />
    </ExpandableDemo>
  );
}

export default InnerProductSpaceDemo;
