import { useState, useRef, useEffect, useMemo } from "react";
import ExpandableDemo from "../framework/ExpandableDemo";
import PresetSelector from "../framework/PresetSelector";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeTabs, { KdeTabPanel } from "../framework/KdeTabs";
import ParamSlider from "../framework/ParamSlider";
import CanvasViewport, {
  type CanvasViewportHandle,
} from "../framework/CanvasViewport";
import CanvasOverlay from "../framework/CanvasOverlay";
import type { Bounds2 } from "../../visualizations/core/2d/plot2d";

type MainTab = "row_col" | "affine_manifold";

type RowColPreset = "ortho" | "skew" | "parallel" | "coincident";

interface RowColPresetData {
  name: string;
  desc: string;
  a11: number;
  a12: number;
  a21: number;
  a22: number;
  b1: number;
  b2: number;
}

const ROW_COL_PRESETS: Record<RowColPreset, RowColPresetData> = {
  ortho: {
    name: "正交独立 (唯一解)",
    desc: "两行方程法向量正交垂直，行超平面正交相交于一点；两列向量正交独立，可唯一张成目标向量 b。",
    a11: 1,
    a12: 1,
    a21: 1,
    a22: -1,
    b1: 2,
    b2: 0,
  },
  skew: {
    name: "斜交独立 (唯一解)",
    desc: "一般非正交线性无关系统，两直线倾斜相交于一点；列向量张成全空间并以平行四边形定则合成 b。",
    a11: 2,
    a12: 1,
    a21: 1,
    a22: 2,
    b1: 3,
    b2: 3,
  },
  parallel: {
    name: "平行矛盾 (无解)",
    desc: "两行方程法向共线且常数项矛盾，两直线严格平行无交点；列向量共线但目标向量 b 落在列空间外。",
    a11: 1,
    a12: 2,
    a21: 2,
    a22: 4,
    b1: 2,
    b2: 6,
  },
  coincident: {
    name: "重合退化 (无穷多解)",
    desc: "两行方程完全等价，在几何上重合为同一条一维直线；列向量共线且目标向量 b 恰好落在列空间内。",
    a11: 1,
    a12: 2,
    a21: 2,
    a22: 4,
    b1: 2,
    b2: 4,
  },
};

type AffinePreset = "standard" | "symmetric" | "homogeneous" | "steep";

interface AffinePresetData {
  name: string;
  desc: string;
  a: number;
  b: number;
  c: number;
}

const AFFINE_PRESETS: Record<AffinePreset, AffinePresetData> = {
  standard: {
    name: "标准非齐次 (x + 2y = 4)",
    desc: "常数项非零，解线不经过原点，整体脱离原点形成仿射子空间 S = xr + ker(A)。",
    a: 1,
    b: 2,
    c: 4,
  },
  symmetric: {
    name: "对称斜切 (2x + y = 3)",
    desc: "行向量 (2, 1) 决定了垂直法向，正交最小范数特解为从原点指向解线的最短向量。",
    a: 2,
    b: 1,
    c: 3,
  },
  homogeneous: {
    name: "齐次特例 (x + 2y = 0)",
    desc: "常数项为零，解线恰好穿过原点，此时仿射子空间退化为标准的过原点线性子空间 ker(A)。",
    a: 1,
    b: 2,
    c: 0,
  },
  steep: {
    name: "陡峭方程 (3x - y = 6)",
    desc: "方向向量与行空间呈现大倾角，最小范数特解与零空间方向严格保持 90° 垂直。",
    a: 3,
    b: -1,
    c: 6,
  },
};

const BOUNDS_2D: Bounds2 = { xMin: -4.5, xMax: 4.5, yMin: -4.5, yMax: 4.5 };

function formatEq(a: number, b: number, c: number): string {
  const aStr = a === 1 ? "x" : a === -1 ? "-x" : `${a}x`;
  const bSign = b >= 0 ? "+" : "-";
  const bAbs = Math.abs(b);
  const bTerm = bAbs === 1 ? "y" : `${bAbs}y`;
  return `${aStr} ${bSign} ${bTerm} = ${c}`;
}

function drawPixelSegment(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 1.5,
  dash: number[] = [],
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export default function LinearSystemsDemo() {
  const [activeTab, setActiveTab] = useState<MainTab>("row_col");

  // Mode 1: Row vs Column states
  const [rcPreset, setRcPreset] = useState<RowColPreset>("ortho");
  const [a11, setA11] = useState(1);
  const [a12, setA12] = useState(1);
  const [a21, setA21] = useState(1);
  const [a22, setA22] = useState(-1);
  const [b1, setB1] = useState(2);
  const [b2, setB2] = useState(0);

  // Sync Mode 1 preset
  useEffect(() => {
    const p = ROW_COL_PRESETS[rcPreset];
    setA11(p.a11);
    setA12(p.a12);
    setA21(p.a21);
    setA22(p.a22);
    setB1(p.b1);
    setB2(p.b2);
  }, [rcPreset]);

  // Mode 2: Affine Manifold states
  const [afPreset, setAfPreset] = useState<AffinePreset>("standard");
  const [coeffA, setCoeffA] = useState(1);
  const [coeffB, setCoeffB] = useState(2);
  const [constC, setConstC] = useState(4);
  const [paramT, setParamT] = useState(1.2);

  // Sync Mode 2 preset
  useEffect(() => {
    const p = AFFINE_PRESETS[afPreset];
    setCoeffA(p.a);
    setCoeffB(p.b);
    setConstC(p.c);
    setParamT(1.0);
  }, [afPreset]);

  // Math for Mode 1:
  const detA = a11 * a22 - a12 * a21;
  const isSingular = Math.abs(detA) < 1e-4;

  const sol = useMemo(() => {
    if (!isSingular) {
      const x = (b1 * a22 - b2 * a12) / detA;
      const y = (a11 * b2 - a21 * b1) / detA;
      return { status: "unique" as const, x, y };
    }
    const isConsistent = Math.abs(a11 * b2 - a21 * b1) < 1e-3;
    if (isConsistent) {
      return { status: "infinite" as const, x: 0, y: 0 };
    }
    return { status: "none" as const, x: 0, y: 0 };
  }, [a11, a12, a21, a22, b1, b2, detA, isSingular]);

  // Math for Mode 2 (Affine Manifold: ax + by = c)
  const normSq = coeffA * coeffA + coeffB * coeffB;
  const norm = Math.sqrt(normSq);
  const nx = norm > 1e-5 ? coeffA / norm : 1;
  const ny = norm > 1e-5 ? coeffB / norm : 0;
  const dx = -ny;
  const dy = nx;
  const xrX = normSq > 1e-5 ? (constC / normSq) * coeffA : 0;
  const xrY = normSq > 1e-5 ? (constC / normSq) * coeffB : 0;
  const xrDist = Math.hypot(xrX, xrY);

  const xpX = xrX + paramT * dx;
  const xpY = xrY + paramT * dy;

  // Viewport controller handles for external redraw
  const leftVpRef = useRef<CanvasViewportHandle | null>(null);
  const rightVpRef = useRef<CanvasViewportHandle | null>(null);
  const affineVpRef = useRef<CanvasViewportHandle | null>(null);

  // Redraw canvases on state update
  useEffect(() => {
    leftVpRef.current?.redraw();
    rightVpRef.current?.redraw();
  }, [a11, a12, a21, a22, b1, b2, sol]);

  useEffect(() => {
    affineVpRef.current?.redraw();
  }, [coeffA, coeffB, constC, paramT]);

  // Synchronize canvas redraw when switching tabs
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (activeTab === "row_col") {
        leftVpRef.current?.redraw();
        rightVpRef.current?.redraw();
      } else {
        affineVpRef.current?.redraw();
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [activeTab]);

  return (
    <ExpandableDemo id="linear-systems-demo">
      <KdeWindowShell
        title="线性方程组几何：行列视角与非齐次解集流形"
        eyebrow="Linear Systems & Affine Manifolds"
        mark="SYS-01"
        modeTag={
          activeTab === "row_col"
            ? "行视角求交 vs 列视角拼装"
            : "非齐次仿射子空间平移"
        }
      >
        {/* Top Mode Tabs */}
        <div className="mb-3 flex items-center justify-between border-b border-[var(--kde-border)] pb-2">
          <KdeTabs<MainTab>
            options={[
              { id: "row_col", label: "双重视角：行求交 vs 列拼装" },
              {
                id: "affine_manifold",
                label: "解集流形：齐次 vs 非齐次平移",
              },
            ]}
            value={activeTab}
            onChange={setActiveTab}
            size="sm"
          />
        </div>

        {/* Mode 1: Row vs Column Dual Viewports */}
        <KdeTabPanel id="row_col" activeId={activeTab}>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {/* Left Canvas: Row Picture */}
            <CanvasViewport
              ref={leftVpRef}
              initialBounds={BOUNDS_2D}
              onReset={() => setRcPreset("ortho")}
              onDraw={(ctx, plot, theme, scene) => {
                scene.addAxes();

                // Line 1: a11*x + a12*y = b1
                scene.addLine({
                  normal: [a11, a12],
                  offset: b1,
                  stroke: "#0284c7",
                  width: 2.5,
                });

                // Line 2: a21*x + a22*y = b2
                scene.addLine({
                  normal: [a21, a22],
                  offset: b2,
                  stroke: "#f43f5e",
                  width: 2.5,
                });

                // Interactive Solution Point
                if (sol.status === "unique") {
                  scene.addPoint({
                    at: [sol.x, sol.y],
                    color: "#10b981",
                    ring: true,
                    label: `交点 x* = (${sol.x.toFixed(2)}, ${sol.y.toFixed(2)})`,
                    draggable: true,
                    onDrag: ([wx, wy]) => {
                      setB1(Number((a11 * wx + a12 * wy).toFixed(2)));
                      setB2(Number((a21 * wx + a22 * wy).toFixed(2)));
                    },
                  });
                }

                scene.render(ctx, plot, theme);
              }}
            >
              <CanvasOverlay position="top-left">
                <CanvasOverlay.Title>
                  <span>{"行视角（Row Picture）：超平面相交"}</span>
                  {sol.status === "none" && (
                    <CanvasOverlay.Badge variant="rose">
                      平行矛盾无解
                    </CanvasOverlay.Badge>
                  )}
                  {sol.status === "infinite" && (
                    <CanvasOverlay.Badge variant="emerald">
                      重合无穷多解
                    </CanvasOverlay.Badge>
                  )}
                </CanvasOverlay.Title>
                <CanvasOverlay.Subtitle>
                  {"解空间 $\\mathbb{R}^2$ 中两直线求交点 $x^*$"}
                </CanvasOverlay.Subtitle>
              </CanvasOverlay>

              <CanvasOverlay position="bottom-left" variant="chips">
                <CanvasOverlay.Item
                  color="#0284c7"
                  label={`$\\ell_1: ${formatEq(a11, a12, b1)}$`}
                />
                <CanvasOverlay.Item
                  color="#f43f5e"
                  label={`$\\ell_2: ${formatEq(a21, a22, b2)}$`}
                />
              </CanvasOverlay>
            </CanvasViewport>

            {/* Right Canvas: Column Picture */}
            <CanvasViewport
              ref={rightVpRef}
              initialBounds={BOUNDS_2D}
              onReset={() => setRcPreset("ortho")}
              onDraw={(ctx, plot, theme, scene) => {
                scene.addAxes();

                // Column 1: a1
                scene.addVector({
                  to: [a11, a21],
                  color: "#0284c7",
                  label: `列1 a₁ (${a11}, ${a21})`,
                });

                // Column 2: a2
                scene.addVector({
                  to: [a12, a22],
                  color: "#f43f5e",
                  label: `列2 a₂ (${a12}, ${a22})`,
                });

                if (sol.status === "unique") {
                  const v1x = sol.x * a11;
                  const v1y = sol.x * a21;
                  const v2x = sol.y * a12;
                  const v2y = sol.y * a22;

                  // Parallelogram dashed synthesis
                  scene.raw((rawCtx, rawPlot) => {
                    const p0 = {
                      x: rawPlot.toScreenX(0),
                      y: rawPlot.toScreenY(0),
                    };
                    const pV1 = {
                      x: rawPlot.toScreenX(v1x),
                      y: rawPlot.toScreenY(v1y),
                    };
                    const pV2 = {
                      x: rawPlot.toScreenX(v2x),
                      y: rawPlot.toScreenY(v2y),
                    };
                    const pB = {
                      x: rawPlot.toScreenX(b1),
                      y: rawPlot.toScreenY(b2),
                    };

                    drawPixelSegment(
                      rawCtx,
                      pV1.x,
                      pV1.y,
                      pB.x,
                      pB.y,
                      "#94a3b8",
                      1.2,
                      [4, 4],
                    );
                    drawPixelSegment(
                      rawCtx,
                      pV2.x,
                      pV2.y,
                      pB.x,
                      pB.y,
                      "#94a3b8",
                      1.2,
                      [4, 4],
                    );
                    drawPixelSegment(
                      rawCtx,
                      p0.x,
                      p0.y,
                      pV1.x,
                      pV1.y,
                      "#0284c7",
                      2,
                      [3, 2],
                    );
                    drawPixelSegment(
                      rawCtx,
                      p0.x,
                      p0.y,
                      pV2.x,
                      pV2.y,
                      "#f43f5e",
                      2,
                      [3, 2],
                    );
                  });

                  // Target Vector b = Ax
                  scene.addVector({
                    to: [b1, b2],
                    color: "#10b981",
                    width: 3,
                    label: `b = x₁a₁ + x₂a₂ (${b1.toFixed(1)}, ${b2.toFixed(1)})`,
                  });
                  scene.addPoint({
                    at: [b1, b2],
                    color: "#10b981",
                    draggable: true,
                    onDrag: ([wx, wy]) => {
                      setB1(Number(wx.toFixed(2)));
                      setB2(Number(wy.toFixed(2)));
                    },
                  });
                } else {
                  scene.addVector({
                    to: [b1, b2],
                    color: "#e11d48",
                    width: 2.5,
                    label: `目标 b (${b1.toFixed(1)}, ${b2.toFixed(1)})`,
                  });
                  scene.addPoint({
                    at: [b1, b2],
                    color: "#e11d48",
                    draggable: true,
                    onDrag: ([wx, wy]) => {
                      setB1(Number(wx.toFixed(2)));
                      setB2(Number(wy.toFixed(2)));
                    },
                  });
                }

                scene.render(ctx, plot, theme);
              }}
            >
              <CanvasOverlay position="top-left">
                <CanvasOverlay.Title>
                  <span>{"列视角（Column Picture）：向量积木拼装"}</span>
                </CanvasOverlay.Title>
                <CanvasOverlay.Subtitle>
                  {"目标空间 $\\mathbb{R}^2$ 中 $x_1 a_1 + x_2 a_2 = b$"}
                </CanvasOverlay.Subtitle>
              </CanvasOverlay>

              <CanvasOverlay position="bottom-left" variant="chips">
                <CanvasOverlay.Item
                  color="#0284c7"
                  label={`$\\mathbf{a}_1 = (${a11}, ${a21})^T$`}
                />
                <CanvasOverlay.Item
                  color="#f43f5e"
                  label={`$\\mathbf{a}_2 = (${a12}, ${a22})^T$`}
                />
                <CanvasOverlay.Item
                  color="#10b981"
                  label={`$\\mathbf{b} = (${b1}, ${b2})^T$`}
                />
              </CanvasOverlay>
            </CanvasViewport>
          </div>

          {/* Mode 1 Controls */}
          <div className="grid gap-3 md:grid-cols-2">
            <KdeCard title="场景预设与方程参数" variant="dense">
              <PresetSelector
                label="典型几何构型:"
                options={ROW_COL_PRESETS}
                value={rcPreset}
                onChange={(val) => setRcPreset(val as RowColPreset)}
              />
              <div className="mt-2.5 space-y-2">
                <ParamSlider
                  label={"常数项 $b_1$"}
                  min={-4}
                  max={4}
                  step={0.5}
                  value={b1}
                  onChange={setB1}
                />
                <ParamSlider
                  label={"常数项 $b_2$"}
                  min={-4}
                  max={4}
                  step={0.5}
                  value={b2}
                  onChange={setB2}
                />
              </div>
            </KdeCard>

            <KdeCard title="解集状态与几何读数" variant="dense">
              <div className="space-y-1.5">
                <KdeReadout
                  label="方程组行列式"
                  value={`det(A) = ${detA.toFixed(2)}`}
                  variant={isSingular ? "danger" : "accent"}
                  dense
                />
                <KdeReadout
                  label="几何解状态"
                  value={
                    sol.status === "unique"
                      ? `唯一解 (${sol.x.toFixed(2)}, ${sol.y.toFixed(2)})`
                      : sol.status === "none"
                        ? "两线平行矛盾（无解）"
                        : "两线重合（无穷多解）"
                  }
                  variant={
                    sol.status === "unique"
                      ? "success"
                      : sol.status === "none"
                        ? "danger"
                        : "warning"
                  }
                  dense
                />
                <div className="rounded bg-[var(--kde-panel)] p-2 text-xs text-[var(--kde-ink)] font-mono">
                  {`$\\begin{pmatrix} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} ${b1} \\\\ ${b2} \\end{pmatrix}$`}
                </div>
              </div>
            </KdeCard>
          </div>
        </KdeTabPanel>

        {/* Mode 2: Affine Manifold Viewport & Controls */}
        <KdeTabPanel id="affine_manifold" activeId={activeTab}>
          <CanvasViewport
            ref={affineVpRef}
            initialBounds={BOUNDS_2D}
            heightClass="h-[var(--demo-height,22rem)]"
            onReset={() => setAfPreset("standard")}
            onDraw={(ctx, plot, theme, scene) => {
              scene.addAxes();

              // 1. Nullspace line: ax + by = 0
              scene.addLine({
                normal: [coeffA, coeffB],
                offset: 0,
                stroke: "#10b981",
                width: 2,
                dash: [6, 4],
              });

              // 2. Row space line: orthogonal direction
              scene.addLine({
                normal: [-coeffB, coeffA],
                offset: 0,
                stroke: "#f59e0b",
                width: 1.2,
                dash: [3, 3],
              });

              // 3. Affine manifold: ax + by = c
              scene.addLine({
                normal: [coeffA, coeffB],
                offset: constC,
                stroke: "#0284c7",
                width: 3,
              });

              // 4. Minimum norm solution xr
              if (xrDist > 0.05) {
                scene.addVector({
                  to: [xrX, xrY],
                  color: "#f59e0b",
                  label: `最小范数特解 xr (${xrX.toFixed(2)}, ${xrY.toFixed(2)})`,
                });
                scene.raw((rawCtx, rawPlot) => {
                  const px = rawPlot.toScreenX(xrX);
                  const py = rawPlot.toScreenY(xrY);
                  rawCtx.strokeStyle = "#f59e0b";
                  rawCtx.lineWidth = 1.2;
                  rawCtx.strokeRect(px - 7, py - 7, 7, 7);
                });
              }

              // 5. Offset line from xr to xp
              if (Math.abs(paramT) > 0.05) {
                scene.raw((rawCtx, rawPlot) => {
                  const p1 = {
                    x: rawPlot.toScreenX(xrX),
                    y: rawPlot.toScreenY(xrY),
                  };
                  const p2 = {
                    x: rawPlot.toScreenX(xpX),
                    y: rawPlot.toScreenY(xpY),
                  };
                  drawPixelSegment(
                    rawCtx,
                    p1.x,
                    p1.y,
                    p2.x,
                    p2.y,
                    "#a855f7",
                    2,
                    [3, 2],
                  );
                });
              }

              // 6. Interactive particular solution xp
              scene.addPoint({
                at: [xpX, xpY],
                color: "#a855f7",
                radius: 6.5,
                ring: true,
                label: `特解 xp (${xpX.toFixed(2)}, ${xpY.toFixed(2)})`,
                draggable: true,
                onDrag: ([wx, wy]) => {
                  const relX = wx - xrX;
                  const relY = wy - xrY;
                  const newT = relX * dx + relY * dy;
                  setParamT(Number(newT.toFixed(2)));
                },
              });

              scene.render(ctx, plot, theme);
            }}
          >
            <CanvasOverlay position="top-left">
              <CanvasOverlay.Title>
                <span>{"非齐次约束 $a x + b y = c$ 与零空间平移"}</span>
              </CanvasOverlay.Title>
              <CanvasOverlay.Subtitle>
                {
                  "仿射子空间 $S = x_r + \\ker(A)$（平移向量 $x_r \\in \\operatorname{Row}(A)$）"
                }
              </CanvasOverlay.Subtitle>
            </CanvasOverlay>

            <CanvasOverlay position="bottom-left" variant="chips">
              <CanvasOverlay.Item
                color="#0284c7"
                label={`仿射子空间 $S: ${formatEq(coeffA, coeffB, constC)}$`}
              />
              <CanvasOverlay.Item
                color="#10b981"
                label={`零空间 $\\ker(A): ${formatEq(coeffA, coeffB, 0)}$`}
              />
              <CanvasOverlay.Item
                color="#f59e0b"
                label={`法向行空间 $\\operatorname{Row}(A) = \\operatorname{span}\\{(${coeffA}, ${coeffB})\\}$`}
              />
            </CanvasOverlay>
          </CanvasViewport>

          {/* Mode 2 Controls */}
          <div className="grid gap-3 md:grid-cols-2">
            <KdeCard title="预设约束与参数滑块" variant="dense">
              <PresetSelector
                label="预设约束:"
                options={AFFINE_PRESETS}
                value={afPreset}
                onChange={(val) => setAfPreset(val as AffinePreset)}
              />
              <div className="mt-2.5 space-y-2">
                <ParamSlider
                  label={"常数项 $c$（非齐次平移量）"}
                  min={-6}
                  max={6}
                  step={0.5}
                  value={constC}
                  onChange={setConstC}
                />
                <ParamSlider
                  label={"特解在零空间方向的偏移 $t$"}
                  min={-3}
                  max={3}
                  step={0.2}
                  value={paramT}
                  onChange={setParamT}
                />
              </div>
            </KdeCard>

            <KdeCard title="代数与几何空间判定" variant="dense">
              <div className="space-y-1.5">
                <KdeReadout
                  label="解空间几何形态"
                  value={
                    Math.abs(constC) < 1e-4
                      ? "过原点线性子空间（ker A）"
                      : `仿射子空间（脱离原点，平移距离 ${xrDist.toFixed(2)}）`
                  }
                  variant={Math.abs(constC) < 1e-4 ? "accent" : "success"}
                  dense
                />
                <KdeReadout
                  label="正交最小范数特解 xr"
                  value={`(${xrX.toFixed(2)}, ${xrY.toFixed(2)})，垂直于零空间`}
                  variant="formula"
                  dense
                />
                <KdeReadout
                  label="当前特解 xp"
                  value={`(${xpX.toFixed(2)}, ${xpY.toFixed(2)}) = xr + ${paramT.toFixed(1)} d`}
                  variant="formula"
                  dense
                />
              </div>
            </KdeCard>
          </div>
        </KdeTabPanel>
      </KdeWindowShell>
    </ExpandableDemo>
  );
}
