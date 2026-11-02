import { useState } from "react";
import CanvasViewport from "../framework/CanvasViewport";
import ExpandableDemo from "../framework/ExpandableDemo";
import ParamSlider from "../framework/ParamSlider";
import PresetSelector, { type PresetOption } from "../framework/PresetSelector";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeCheckbox from "../framework/KdeCheckbox";
import type { Bounds2 } from "../../visualizations/core/2d/plot2d";

const BOUNDS: Bounds2 = { xMin: -3.5, xMax: 3.5, yMin: -3.5, yMax: 3.5 };

const PRESETS: PresetOption[] = [
  {
    value: "standard",
    label: "标准倾斜测量",
    description:
      "泛函 $f(x,y) = x + 0.5y$，测量向量 $\\mathbf{v} = (2.0, 1.0)$",
  },
  {
    value: "nullspace",
    label: "零核正交测量 ($f(\\mathbf{v}) = 0$)",
    description: "向量位于 $\\ker(f)$ 上，穿透层数为 0",
  },
  {
    value: "dense",
    label: "高密刻度探针 (大幅值泛函)",
    description: "系数较大，等高线密集，相同向量穿透更多层",
  },
  {
    value: "coord_extract",
    label: "坐标提取对偶基 $\\mathbf{e}^{*1}$",
    description: "$f(x,y) = x$，等值线垂直于 $x$ 轴，严格提取 $x$ 坐标",
  },
];

export default function DualFunctionalHyperplanesDemo({
  height,
}: {
  height?: string;
}) {
  const [presetKey, setPresetKey] = useState("standard");
  const [a, setA] = useState<number>(1.0);
  const [b, setB] = useState<number>(0.5);
  const [v, setV] = useState<{ x: number; y: number }>({ x: 2.0, y: 1.0 });
  const [showRiesz, setShowRiesz] = useState<boolean>(true);
  const [showIntersections, setShowIntersections] = useState<boolean>(true);

  const fVal = a * v.x + b * v.y;
  const gradLen = Math.hypot(a, b);
  const lineSpacing = gradLen > 1e-4 ? 1 / gradLen : 0;

  const handlePreset = (val: string) => {
    setPresetKey(val);
    if (val === "standard") {
      setA(1.0);
      setB(0.5);
      setV({ x: 2.0, y: 1.0 });
    } else if (val === "nullspace") {
      setA(1.0);
      setB(1.0);
      setV({ x: -1.5, y: 1.5 });
    } else if (val === "dense") {
      setA(1.8);
      setB(1.2);
      setV({ x: 1.2, y: 0.8 });
    } else if (val === "coord_extract") {
      setA(1.0);
      setB(0.0);
      setV({ x: 2.4, y: 1.6 });
    }
  };

  return (
    <ExpandableDemo id="dual-functional-hyperplanes" height={height}>
      <KdeWindowShell
        title="对偶泛函与超平面等高线流形"
        eyebrow="Linear Algebra · Dual Space & Functional"
        mark="$f(\mathbf{v}) = \langle \mathbf{v}_f, \mathbf{v}\rangle$"
        modeTag="Hyperplane Piercing"
        display={
          <CanvasViewport
            initialBounds={BOUNDS}
            equalScale
            className="h-[var(--demo-height,20rem)]"
            onReset={() => handlePreset("standard")}
            onDraw={(ctx, plot, theme, scene) => {
              scene.addAxes("x", "y");

              const gradSq = a * a + b * b;
              const width = plot.width;
              const height = plot.height;

              // 1. Draw Equispaced Hyperplanes
              if (gradSq > 1e-5) {
                scene.raw((ctx, plot) => {
                  const corners = [
                    { x: plot.toWorldX(0), y: plot.toWorldY(0) },
                    { x: plot.toWorldX(width), y: plot.toWorldY(0) },
                    { x: plot.toWorldX(0), y: plot.toWorldY(height) },
                    { x: plot.toWorldX(width), y: plot.toWorldY(height) },
                  ];
                  const cVals = corners.map((p) => a * p.x + b * p.y);
                  const minC = Math.floor(Math.min(...cVals)) - 1;
                  const maxC = Math.ceil(Math.max(...cVals)) + 1;

                  const dx = -b;
                  const dy = a;
                  const span = 15;

                  for (let cInt = minC; cInt <= maxC; cInt++) {
                    const p0x = (cInt * a) / gradSq;
                    const p0y = (cInt * b) / gradSq;

                    const s0x = plot.toScreenX(p0x - dx * span);
                    const s0y = plot.toScreenY(p0y - dy * span);
                    const s1x = plot.toScreenX(p0x + dx * span);
                    const s1y = plot.toScreenY(p0y + dy * span);

                    const isKernel = cInt === 0;
                    ctx.save();
                    if (isKernel) {
                      ctx.strokeStyle = "#059669";
                      ctx.lineWidth = 2.4;
                      ctx.setLineDash([]);
                    } else {
                      ctx.strokeStyle =
                        cInt % 2 === 0
                          ? "rgba(59, 130, 246, 0.45)"
                          : "rgba(59, 130, 246, 0.25)";
                      ctx.lineWidth = cInt % 2 === 0 ? 1.4 : 1.0;
                      ctx.setLineDash(cInt % 2 === 0 ? [5, 4] : [3, 3]);
                    }

                    ctx.beginPath();
                    ctx.moveTo(s0x, s0y);
                    ctx.lineTo(s1x, s1y);
                    ctx.stroke();

                    // Label level value c
                    const labelSx = plot.toScreenX(p0x);
                    const labelSy = plot.toScreenY(p0y);
                    if (
                      labelSx >= 10 &&
                      labelSx <= width - 10 &&
                      labelSy >= 10 &&
                      labelSy <= height - 10
                    ) {
                      ctx.font = isKernel
                        ? "bold 11px system-ui, sans-serif"
                        : "10px system-ui, sans-serif";
                      ctx.fillStyle = isKernel ? "#059669" : "#3b82f6";
                      ctx.textAlign = "center";
                      ctx.textBaseline = "middle";
                      ctx.fillText(
                        isKernel ? "f=0 (ker f)" : `f=${cInt}`,
                        labelSx + (Math.abs(b) > Math.abs(a) ? 18 : 0),
                        labelSy - (Math.abs(a) >= Math.abs(b) ? 14 : 6),
                      );
                    }
                    ctx.restore();
                  }
                });
              }

              // 2. Piercing Intersections
              if (showIntersections && gradSq > 1e-5) {
                const val = a * v.x + b * v.y;
                if (Math.abs(val) >= 1) {
                  const startK = val >= 0 ? 1 : -1;
                  const endK = val >= 0 ? Math.floor(val) : Math.ceil(val);
                  const stepK = val >= 0 ? 1 : -1;

                  for (
                    let k = startK;
                    val >= 0 ? k <= endK : k >= endK;
                    k += stepK
                  ) {
                    const t = k / val;
                    scene.addPoint({
                      at: [t * v.x, t * v.y],
                      color: "#ef4444",
                      radius: 4,
                      ring: true,
                    });
                  }
                }
              }

              // 3. Riesz Representative Vector v_f = (a, b)
              if (showRiesz) {
                scene.addVector({
                  to: [a, b],
                  color: "#8b5cf6",
                  width: 2.2,
                  dash: [4, 3],
                  label: "v_f (Riesz 对偶)",
                });
              }

              // 4. Tested Vector v (Interactive Draggable)
              scene.addVector({
                to: [v.x, v.y],
                color: "#f59e0b",
                width: 3.0,
                label: `v (${v.x.toFixed(1)}, ${v.y.toFixed(1)})`,
                draggable: true,
                handleRing: true,
                onDrag: ([wx, wy]) => {
                  const clampedX = Math.max(-3.0, Math.min(3.0, wx));
                  const clampedY = Math.max(-3.0, Math.min(3.0, wy));
                  setV({
                    x: Math.round(clampedX * 10) / 10,
                    y: Math.round(clampedY * 10) / 10,
                  });
                  setPresetKey("custom");
                },
              });

              scene.render(ctx, plot, theme);
            }}
          >
            {/* In-canvas Legend */}
            <div className="pointer-events-none absolute bottom-4 left-3 z-10 flex flex-col gap-1 rounded bg-slate-900/90 p-2 text-[11px] text-slate-300 backdrop-blur-sm border border-slate-700/60">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">
                  {"● 向量 $\\mathbf{v}$"}
                </span>
                <span className="text-emerald-400 font-bold">
                  {"― $\\ker(f)$ 零核超平面"}
                </span>
                <span className="text-blue-400 font-bold">
                  {"┄ $f(x)=c$ 等值线族"}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-0.5 border-t border-slate-700/40 text-[10px]">
                <span className="text-rose-400 font-medium">● 穿透计数点</span>
                {showRiesz && (
                  <span className="text-purple-400 font-medium">
                    {"┄ $\\mathbf{v}_f$ (Riesz 表现向量)"}
                  </span>
                )}
              </div>
            </div>
          </CanvasViewport>
        }
        controls={
          <div className="space-y-3">
            <KdeCard title="预设场景与泛函系数探针" variant="dense">
              <div className="space-y-2.5">
                <PresetSelector
                  label="预设测量场景:"
                  options={PRESETS}
                  value={presetKey}
                  onChange={handlePreset}
                />
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <ParamSlider
                    label="系数 $a$ ($x$ 分量)"
                    labelMode="stacked"
                    value={a}
                    min={-2.5}
                    max={2.5}
                    step={0.1}
                    onChange={(val) => {
                      setA(val);
                      setPresetKey("custom");
                    }}
                  />
                  <ParamSlider
                    label="系数 $b$ ($y$ 分量)"
                    labelMode="stacked"
                    value={b}
                    min={-2.5}
                    max={2.5}
                    step={0.1}
                    onChange={(val) => {
                      setB(val);
                      setPresetKey("custom");
                    }}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-700/50">
                  <KdeCheckbox
                    label="显示穿透交点"
                    checked={showIntersections}
                    onChange={setShowIntersections}
                  />
                  <KdeCheckbox
                    label="显示 Riesz 对偶向量 $\mathbf{v}_f$"
                    checked={showRiesz}
                    onChange={setShowRiesz}
                  />
                </div>
              </div>
            </KdeCard>

            <div className="grid grid-cols-2 gap-1.5">
              <KdeReadout
                label="泛函求值 $f(\mathbf{v})$"
                value={fVal.toFixed(2)}
                variant="accent"
                dense
              />
              <KdeReadout
                label="几何穿透层数"
                value={
                  Math.abs(fVal) < 1e-4
                    ? "0 (位于零核)"
                    : `${Math.abs(fVal).toFixed(2)} 层`
                }
                dense
              />
              <KdeReadout
                label="等高线间距 $d$"
                value={lineSpacing.toFixed(2)}
                dense
              />
              <KdeReadout
                label="零核状态"
                value={
                  Math.abs(fVal) < 1e-3
                    ? "$\\mathbf{v} \\in \\ker(f)$"
                    : "$\\mathbf{v} \\notin \\ker(f)$"
                }
                variant={Math.abs(fVal) < 1e-3 ? "success" : "default"}
                dense
              />
            </div>

            <div className="rounded-md border border-[var(--kde-border)] bg-[var(--kde-panel)]/50 p-2.5 text-xs text-muted-foreground">
              {`$f(\\mathbf{v}) = (${a.toFixed(1)})(${v.x.toFixed(1)}) + (${b.toFixed(1)})(${v.y.toFixed(1)}) = ${fVal.toFixed(2)}$`}
              <p className="mt-1 text-[11px]">
                等高线间距 $d = 1/\|\nabla f\| =$ {lineSpacing.toFixed(2)}
                。间距越密，泛函对同一向量测出的数值越大。
              </p>
            </div>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
