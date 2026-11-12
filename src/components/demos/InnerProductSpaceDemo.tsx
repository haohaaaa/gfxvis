import { useState, useMemo } from "react";
import ExpandableDemo from "../framework/ExpandableDemo";
import CanvasViewport from "../framework/CanvasViewport";
import CanvasOverlay from "../framework/CanvasOverlay";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeTabs, { type KdeTabOption } from "../framework/KdeTabs";
import KdeWindowShell from "../framework/KdeWindowShell";
import PresetSelector, { type PresetOption } from "../framework/PresetSelector";
import ParamSlider from "../framework/ParamSlider";
import KdeCheckbox from "../framework/KdeCheckbox";
import type { Bounds2 } from "../../visualizations/core/2d/plot2d";

export type ModeType = "weighted" | "func" | "theorems";

const MODES: Array<KdeTabOption<ModeType>> = [
  { id: "weighted", label: "加权内积与度规椭圆" },
  { id: "func", label: "函数空间积分内积" },
  { id: "theorems", label: "柯西-施瓦茨与平行四边形" },
];

const WEIGHTED_BOUNDS: Bounds2 = {
  xMin: -3.2,
  xMax: 3.2,
  yMin: -3.2,
  yMax: 3.2,
};
const FUNC_BOUNDS: Bounds2 = { xMin: -1.6, xMax: 1.6, yMin: -1.6, yMax: 1.6 };
const THEOREM_BOUNDS: Bounds2 = {
  xMin: -3.4,
  xMax: 3.4,
  yMin: -3.4,
  yMax: 3.4,
};

// 模式 1 预设
const WEIGHTED_PRESETS: PresetOption[] = [
  {
    value: "euclidean",
    label: "欧氏标准度规 ($I$)",
    description: "$w_{11}=1.0, w_{22}=1.0$，单位球退化为标准各向同性正圆",
  },
  {
    value: "x_heavy",
    label: "$X$ 轴刚度加强度规",
    description:
      "$w_{11}=2.5, w_{22}=0.75$，单位椭圆在 $X$ 方向收缩，各向异性明显",
  },
  {
    value: "y_heavy",
    label: "$Y$ 轴刚度加强度规",
    description: "$w_{11}=0.75, w_{22}=3.0$，单位椭圆在 $Y$ 方向显著压缩",
  },
  {
    value: "g_ortho_align",
    label: "$G$-正交向量对 ($\\langle\\mathbf{u},\\mathbf{v}\\rangle_G = 0$)",
    description:
      "$\\langle\\mathbf{u},\\mathbf{v}\\rangle_G = 0$，视觉呈现倾斜非直角但度规下严格正交",
  },
];

// 模式 2 函数定义与预设
interface FuncPreset {
  id: string;
  name: string;
  desc: string;
  fName: string;
  gName: string;
  f: (x: number) => number;
  g: (x: number) => number;
  exactIntegral: number;
}

const FUNC_PRESETS: FuncPreset[] = [
  {
    id: "sin_cos",
    name: "$\\sin(\\pi x)$ 与 $\\cos(\\pi x)$",
    desc: "三角基函数：奇偶对称正负面积完全对消，积分内积严格为 0 (正交)",
    fName: "\\sin(\\pi x)",
    gName: "\\cos(\\pi x)",
    f: (x) => Math.sin(Math.PI * x),
    g: (x) => Math.cos(Math.PI * x),
    exactIntegral: 0,
  },
  {
    id: "sin_harmonics",
    name: "$\\sin(\\pi x)$ 与 $\\sin(2\\pi x)$",
    desc: "傅里叶高阶谐波：不同倍频正弦波在周期对称区间内正交 (积分 0)",
    fName: "\\sin(\\pi x)",
    gName: "\\sin(2\\pi x)",
    f: (x) => Math.sin(Math.PI * x),
    g: (x) => Math.sin(2 * Math.PI * x),
    exactIntegral: 0,
  },
  {
    id: "poly_odd_even",
    name: "$x$ 与 $x^2$",
    desc: "奇偶多项式乘积为奇函数，在对称区间 [-1, 1] 积分恒为 0",
    fName: "x",
    gName: "x^2",
    f: (x) => x,
    g: (x) => x * x,
    exactIntegral: 0,
  },
  {
    id: "legendre_1_2",
    name: "$P_1(x)=x$ 与 $P_2(x)=\\frac{1}{2}(3x^2-1)$",
    desc: "勒让德正交多项式：球谐函数与数值积分的基底 (积分严格为 0)",
    fName: "x",
    gName: "\\frac{1}{2}(3x^2-1)",
    f: (x) => x,
    g: (x) => 0.5 * (3 * x * x - 1),
    exactIntegral: 0,
  },
  {
    id: "same_poly",
    name: "$x$ 与 $x$ (自内积)",
    desc: "诱导 L² 范数平方：⟨x, x⟩ = ∫₋₁¹ x² dx = 2/3 ≈ 0.667",
    fName: "x",
    gName: "x",
    f: (x) => x,
    g: (x) => x,
    exactIntegral: 2 / 3,
  },
  {
    id: "same_sin",
    name: "$\\sin(\\pi x)$ 与 $\\sin(\\pi x)$ (自内积)",
    desc: "标准正交归一化积：⟨sin(πx), sin(πx)⟩ = ∫₋₁¹ sin²(πx) dx = 1.000",
    fName: "\\sin(\\pi x)",
    gName: "\\sin(\\pi x)",
    f: (x) => Math.sin(Math.PI * x),
    g: (x) => Math.sin(Math.PI * x),
    exactIntegral: 1.0,
  },
];

// 模式 3 预设
const THEOREM_PRESETS: PresetOption[] = [
  {
    value: "general",
    label: "一般斜交向量",
    description:
      "两向量夹角任意，严格满足柯西-施瓦茨不等式 $|\\langle\\mathbf{u},\\mathbf{v}\\rangle| < \\|\\mathbf{u}\\|\\|\\mathbf{v}\\|$",
  },
  {
    value: "collinear_same",
    label: "共线同向 (等号 $\\cos\\theta = +1$)",
    description:
      "两向量同向共线，$\\cos\\theta = +1$，柯西-施瓦茨饱和比值达到 100%",
  },
  {
    value: "collinear_opp",
    label: "共线反向 (等号 $\\cos\\theta = -1$)",
    description:
      "两向量反向共线，$\\cos\\theta = -1$，绝对值等号 $|\\langle\\mathbf{u},\\mathbf{v}\\rangle| = \\|\\mathbf{u}\\|\\|\\mathbf{v}\\|$ 严格成立",
  },
  {
    value: "orthogonal",
    label: "正交直角 (勾股定理 $\\langle\\mathbf{u},\\mathbf{v}\\rangle = 0$)",
    description:
      "$\\langle\\mathbf{u},\\mathbf{v}\\rangle = 0$，平行四边形退化为矩形，两对角线长度严格相等",
  },
];

export function InnerProductSpaceDemo({ height }: { height?: string }) {
  const [mode, setMode] = useState<ModeType>("weighted");

  // ---------------------------------------------------------------------------
  // 模式 1: 加权内积与度规椭圆
  // ---------------------------------------------------------------------------
  const [weightedPreset, setWeightedPreset] = useState("euclidean");
  const [w11, setW11] = useState(1.0);
  const [w22, setW22] = useState(1.0);
  const [uW, setUW] = useState<{ x: number; y: number }>({ x: 1.2, y: 0.8 });
  const [vW, setVW] = useState<{ x: number; y: number }>({ x: 0.6, y: -0.8 });
  const [showGOrtho, setShowGOrtho] = useState(true);
  const [showEuclideanCircle, setShowEuclideanCircle] = useState(true);

  const handleWeightedPreset = (val: string) => {
    setWeightedPreset(val);
    if (val === "euclidean") {
      setW11(1.0);
      setW22(1.0);
      setUW({ x: 1.2, y: 0.8 });
      setVW({ x: 0.6, y: -0.8 });
    } else if (val === "x_heavy") {
      setW11(2.5);
      setW22(0.75);
      setUW({ x: 0.8, y: 1.2 });
      setVW({ x: -0.6, y: 1.0 });
    } else if (val === "y_heavy") {
      setW11(0.75);
      setW22(3.0);
      setUW({ x: 1.4, y: 0.5 });
      setVW({ x: -0.8, y: 0.6 });
    } else if (val === "g_ortho_align") {
      setW11(2.0);
      setW22(0.8);
      const ux = 1.0;
      const uy = 0.8;
      // G-正交条件: w11 * ux * vx + w22 * uy * vy = 0 => 2.0*1.0*vx + 0.8*0.8*vy = 0 => 2.0 vx + 0.64 vy = 0
      // 取 vy = 1.25, vx = - (0.64 * 1.25)/2.0 = -0.4
      setUW({ x: ux, y: uy });
      setVW({ x: -0.4, y: 1.25 });
    }
  };

  // 计算椭圆主半轴长
  const rx = 1 / Math.sqrt(Math.max(0.01, w11));
  const ry = 1 / Math.sqrt(Math.max(0.01, w22));

  // 计算加权内积与诱导范数
  const normUW = Math.sqrt(Math.max(0, w11 * uW.x * uW.x + w22 * uW.y * uW.y));
  const normVW = Math.sqrt(Math.max(0, w11 * vW.x * vW.x + w22 * vW.y * vW.y));
  const innerGW = w11 * uW.x * vW.x + w22 * uW.y * vW.y;
  const standardDotW = uW.x * vW.x + uW.y * vW.y;

  // u 的 G-正交方向: 满足 w11 * ux * wx + w22 * uy * wy = 0 => (wx, wy) ∝ (-w22 * uy, w11 * ux)
  const gOrthoDir = useMemo(() => {
    const rawX = -w22 * uW.y;
    const rawY = w11 * uW.x;
    const len = Math.hypot(rawX, rawY);
    if (len < 1e-5) return { x: 0, y: 0 };
    const targetScale = Math.hypot(vW.x, vW.y);
    return {
      x: (rawX / len) * (targetScale > 0.1 ? targetScale : 1.2),
      y: (rawY / len) * (targetScale > 0.1 ? targetScale : 1.2),
    };
  }, [w11, w22, uW.x, uW.y, vW.x, vW.y]);

  // ---------------------------------------------------------------------------
  // 模式 2: 函数空间积分内积
  // ---------------------------------------------------------------------------
  const [activeFuncId, setActiveFuncId] = useState("sin_cos");
  const [showSignedShading, setShowSignedShading] = useState(true);
  const [showProdCurve, setShowProdCurve] = useState(true);

  const activeFunc = useMemo(() => {
    return FUNC_PRESETS.find((p) => p.id === activeFuncId) ?? FUNC_PRESETS[0];
  }, [activeFuncId]);

  // ---------------------------------------------------------------------------
  // 模式 3: 几何定理 (柯西-施瓦茨与平行四边形)
  // ---------------------------------------------------------------------------
  const [theoremPreset, setTheoremPreset] = useState("general");
  const [uT, setUT] = useState<{ x: number; y: number }>({ x: 2.2, y: 0.8 });
  const [vT, setVT] = useState<{ x: number; y: number }>({ x: 0.8, y: 1.8 });

  const handleTheoremPreset = (val: string) => {
    setTheoremPreset(val);
    if (val === "general") {
      setUT({ x: 2.2, y: 0.8 });
      setVT({ x: 0.8, y: 1.8 });
    } else if (val === "collinear_same") {
      setUT({ x: 2.0, y: 1.2 });
      setVT({ x: 1.0, y: 0.6 });
    } else if (val === "collinear_opp") {
      setUT({ x: 1.8, y: 1.2 });
      setVT({ x: -1.2, y: -0.8 });
    } else if (val === "orthogonal") {
      setUT({ x: 2.2, y: 0.0 });
      setVT({ x: 0.0, y: 1.8 });
    }
  };

  // 定理模式几何量
  const dotT = uT.x * vT.x + uT.y * vT.y;
  const normUT = Math.hypot(uT.x, uT.y);
  const normVT = Math.hypot(vT.x, vT.y);
  const normProdT = normUT * normVT;
  const cosTheta = normProdT > 1e-4 ? dotT / normProdT : 0;
  const cosThetaClamped = Math.max(-1, Math.min(1, cosTheta));
  const cosThetaAbs = Math.abs(cosThetaClamped);
  const isCollinear = cosThetaAbs > 0.995;
  const isOrtho = Math.abs(dotT) < 0.05;

  // 正交投影向量 proj_v(u) = (u·v / ||v||²) * v
  const vTSq = normVT * normVT;
  const projScale = vTSq > 1e-4 ? dotT / vTSq : 0;
  const projV = { x: projScale * vT.x, y: projScale * vT.y };

  // 平行四边形几何量
  const sumT = { x: uT.x + vT.x, y: uT.y + vT.y };
  const diffT = { x: uT.x - vT.x, y: uT.y - vT.y };
  const normSumSq = sumT.x * sumT.x + sumT.y * sumT.y;
  const normDiffSq = diffT.x * diffT.x + diffT.y * diffT.y;
  const leftParallelogram = normSumSq + normDiffSq;
  const rightParallelogram = 2 * (normUT * normUT + normVT * normVT);
  const parallelogramDiff = Math.abs(leftParallelogram - rightParallelogram);

  // 视口边界切换
  const activeBounds =
    mode === "func"
      ? FUNC_BOUNDS
      : mode === "weighted"
        ? WEIGHTED_BOUNDS
        : THEOREM_BOUNDS;

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
        tabs={
          <KdeTabs
            options={MODES}
            value={mode}
            onChange={(m) => setMode(m as ModeType)}
          />
        }
        display={
          <CanvasViewport
            initialBounds={activeBounds}
            equalScale
            className="h-[var(--demo-height,22rem)]"
            onReset={() => {
              if (mode === "weighted") handleWeightedPreset("euclidean");
              else if (mode === "func") setActiveFuncId("sin_cos");
              else handleTheoremPreset("general");
            }}
            onDraw={(ctx, plot, theme, scene) => {
              scene.addAxes("x", "y");

              // ===============================================================
              // 模式 1: 加权内积与度规椭圆
              // ===============================================================
              if (mode === "weighted") {
                // 1. 欧氏参考正圆 (虚线)
                if (showEuclideanCircle) {
                  const circlePts: Array<[number, number]> = [];
                  for (let i = 0; i <= 64; i++) {
                    const th = (i / 64) * Math.PI * 2;
                    circlePts.push([Math.cos(th), Math.sin(th)]);
                  }
                  scene.addPolyline({
                    points: circlePts,
                    color: "rgba(148, 163, 184, 0.45)",
                    closed: true,
                    dash: [4, 4],
                    width: 1.5,
                  });
                }

                // 2. 加权度规单位球 (椭圆): w11 * x^2 + w22 * y^2 = 1
                const ellipsePts: Array<[number, number]> = [];
                for (let i = 0; i <= 96; i++) {
                  const th = (i / 96) * Math.PI * 2;
                  ellipsePts.push([rx * Math.cos(th), ry * Math.sin(th)]);
                }
                scene.addPolyline({
                  points: ellipsePts,
                  color: "#2563eb",
                  fillColor: "rgba(37, 99, 235, 0.08)",
                  closed: true,
                  width: 2.2,
                });

                // 椭圆主轴半透明辅助虚线
                scene.addPolyline({
                  points: [
                    [-rx, 0],
                    [rx, 0],
                  ],
                  color: "rgba(37, 99, 235, 0.35)",
                  dash: [3, 3],
                  width: 1.2,
                });
                scene.addPolyline({
                  points: [
                    [0, -ry],
                    [0, ry],
                  ],
                  color: "rgba(37, 99, 235, 0.35)",
                  dash: [3, 3],
                  width: 1.2,
                });

                // 3. u 的 G-正交共轭方向提示 (虚线紫红箭头)
                if (showGOrtho && Math.hypot(gOrthoDir.x, gOrthoDir.y) > 0.05) {
                  scene.addVector({
                    to: [gOrthoDir.x, gOrthoDir.y],
                    color: "#a855f7",
                    width: 2.0,
                    dash: [4, 3],
                    label: "$\\mathbf{u}_G^\\perp$",
                  });
                }

                // 4. 向量 v (绿色，可拖拽)
                scene.addVector({
                  to: [vW.x, vW.y],
                  color: "#059669",
                  width: 3.0,
                  label: `$\\mathbf{v}$ (${vW.x.toFixed(2)}, ${vW.y.toFixed(2)})`,
                  draggable: true,
                  handleRadius: 6,
                  handleRing: true,
                  hitRadiusPx: 24,
                  onDrag: (tip) => setVW({ x: tip[0], y: tip[1] }),
                });

                // 5. 向量 u (橙色，可拖拽)
                scene.addVector({
                  to: [uW.x, uW.y],
                  color: "#ea580c",
                  width: 3.5,
                  label: `$\\mathbf{u}$ (${uW.x.toFixed(2)}, ${uW.y.toFixed(2)})`,
                  draggable: true,
                  handleRadius: 6,
                  handleRing: true,
                  hitRadiusPx: 24,
                  onDrag: (tip) => setUW({ x: tip[0], y: tip[1] }),
                });
              }

              // ===============================================================
              // 模式 2: 函数空间积分内积
              // ===============================================================
              else if (mode === "func") {
                const step = 0.02;
                const fPts: Array<[number, number]> = [];
                const gPts: Array<[number, number]> = [];
                const prodPts: Array<[number, number]> = [];

                for (let x = -1; x <= 1.001; x += step) {
                  const fx = activeFunc.f(x);
                  const gx = activeFunc.g(x);
                  fPts.push([x, fx]);
                  gPts.push([x, gx]);
                  prodPts.push([x, fx * gx]);
                }

                // 1. 正负积分微元切片阴影 (展示正负面积如何对消达到 0)
                if (showSignedShading) {
                  scene.raw((ctx, plot) => {
                    const N = 80;
                    for (let i = 0; i < N; i++) {
                      const x1 = -1 + (i / N) * 2;
                      const x2 = -1 + ((i + 1) / N) * 2;
                      const xm = (x1 + x2) / 2;
                      const ym = activeFunc.f(xm) * activeFunc.g(xm);

                      const sx1 = plot.toScreenX(x1);
                      const sx2 = plot.toScreenX(x2);
                      const sy0 = plot.toScreenY(0);
                      const sym = plot.toScreenY(ym);

                      ctx.fillStyle =
                        ym >= 0
                          ? "rgba(16, 185, 129, 0.28)" // 正贡献微元 (绿)
                          : "rgba(244, 63, 94, 0.28)"; // 负贡献微元 (红)

                      ctx.beginPath();
                      ctx.moveTo(sx1, sy0);
                      ctx.lineTo(sx1, sym);
                      ctx.lineTo(sx2, sym);
                      ctx.lineTo(sx2, sy0);
                      ctx.closePath();
                      ctx.fill();
                    }
                  });
                }

                // 积分边界 x = -1 与 x = 1 虚线
                scene.addPolyline({
                  points: [
                    [-1, -1.5],
                    [-1, 1.5],
                  ],
                  color: "rgba(100, 116, 139, 0.4)",
                  dash: [4, 4],
                  width: 1.2,
                });
                scene.addPolyline({
                  points: [
                    [1, -1.5],
                    [1, 1.5],
                  ],
                  color: "rgba(100, 116, 139, 0.4)",
                  dash: [4, 4],
                  width: 1.2,
                });

                // 2. 乘积曲线 f(x)g(x) (紫色)
                if (showProdCurve) {
                  scene.addPolyline({
                    points: prodPts,
                    color: "#9333ea",
                    width: 2.2,
                  });
                }

                // 3. 原函数 f(x) (蓝色) 与 g(x) (绿色)
                scene.addPolyline({
                  points: fPts,
                  color: "#2563eb",
                  width: 2.6,
                });
                scene.addPolyline({
                  points: gPts,
                  color: "#059669",
                  width: 2.6,
                });

                // 曲线名称 LaTeX 公式标注 (托管至 Scene2D DOM 标签层)
                const endF = fPts[fPts.length - 1];
                scene.addLabel({
                  at: endF,
                  offset: [8, -8],
                  text: `$f(x) = ${activeFunc.fName}$`,
                  color: "#2563eb",
                });

                const endG = gPts[gPts.length - 1];
                scene.addLabel({
                  at: endG,
                  offset: [8, 12],
                  text: `$g(x) = ${activeFunc.gName}$`,
                  color: "#059669",
                });

                if (showProdCurve) {
                  const midProd = prodPts[Math.floor(prodPts.length * 0.4)];
                  scene.addLabel({
                    at: midProd,
                    offset: [4, -12],
                    text: "$f(x)\\cdot g(x)$",
                    color: "#9333ea",
                  });
                }
              }

              // ===============================================================
              // 模式 3: 几何定理 (柯西-施瓦茨与平行四边形)
              // ===============================================================
              else {
                // 1. 平行四边形闭合虚线面
                scene.addPolyline({
                  points: [
                    [0, 0],
                    [uT.x, uT.y],
                    [sumT.x, sumT.y],
                    [vT.x, vT.y],
                  ],
                  closed: true,
                  fillColor: "rgba(59, 130, 246, 0.08)",
                  color: "rgba(59, 130, 246, 0.35)",
                  width: 1.5,
                  dash: [4, 4],
                });

                // 2. 对角线 1: u + v (紫色实线)
                scene.addVector({
                  to: [sumT.x, sumT.y],
                  color: "#7c3aed",
                  width: 2.6,
                  label: "$\\mathbf{u} + \\mathbf{v}$",
                });

                // 3. 对角线 2: u - v (红色虚线，从 v 到 u)
                scene.addVector({
                  from: [vT.x, vT.y],
                  to: [uT.x, uT.y],
                  color: "#e11d48",
                  width: 2.0,
                  dash: [4, 3],
                  label: "$\\mathbf{u} - \\mathbf{v}$",
                });

                // 4. 正交投影垂足与投影向量 proj_v(u) (青色)
                if (normVT > 0.1) {
                  // 垂足虚线 (从 u 到 proj)
                  scene.addPolyline({
                    points: [
                      [uT.x, uT.y],
                      [projV.x, projV.y],
                    ],
                    color: "rgba(6, 182, 212, 0.7)",
                    dash: [3, 3],
                    width: 1.5,
                  });

                  // 投影向量 proj_v(u)
                  scene.addVector({
                    to: [projV.x, projV.y],
                    color: "#0891b2",
                    width: 2.8,
                    label: "$\\operatorname{proj}_{\\mathbf{v}}(\\mathbf{u})$",
                  });

                  // 垂足直角标记 (90° 方折角)
                  scene.raw((ctx, plot) => {
                    const spX = plot.toScreenX(projV.x);
                    const spY = plot.toScreenY(projV.y);
                    const suX = plot.toScreenX(uT.x);
                    const suY = plot.toScreenY(uT.y);
                    const duX = suX - spX;
                    const duY = suY - spY;
                    const lenU = Math.hypot(duX, duY);

                    const sv0X = plot.toScreenX(0);
                    const sv0Y = plot.toScreenY(0);
                    const dvX = plot.toScreenX(vT.x) - sv0X;
                    const dvY = plot.toScreenY(vT.y) - sv0Y;
                    const lenV = Math.hypot(dvX, dvY);

                    if (lenU > 15 && lenV > 15) {
                      const sz = 9;
                      const dirUx = (duX / lenU) * sz;
                      const dirUy = (duY / lenU) * sz;
                      const dirVx = (dvX / lenV) * sz * Math.sign(dotT || 1);
                      const dirVy = (dvY / lenV) * sz * Math.sign(dotT || 1);

                      ctx.strokeStyle = "#0891b2";
                      ctx.lineWidth = 1.4;
                      ctx.beginPath();
                      ctx.moveTo(spX + dirVx, spY + dirVy);
                      ctx.lineTo(spX + dirVx + dirUx, spY + dirVy + dirUy);
                      ctx.lineTo(spX + dirUx, spY + dirUy);
                      ctx.stroke();
                    }
                  });
                }

                // 5. 原点处的夹角 θ 圆弧
                if (normUT > 0.2 && normVT > 0.2) {
                  const angU = Math.atan2(uT.y, uT.x);
                  const angV = Math.atan2(vT.y, vT.x);
                  const rPx = 28;
                  const midAng = (angU + angV) / 2;

                  scene.raw((ctx, plot) => {
                    const s0x = plot.toScreenX(0);
                    const s0y = plot.toScreenY(0);

                    // 计算逆时针方向扫过范围
                    let diffAng = angU - angV;
                    while (diffAng > Math.PI) diffAng -= Math.PI * 2;
                    while (diffAng < -Math.PI) diffAng += Math.PI * 2;

                    ctx.strokeStyle = "#f59e0b";
                    ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    ctx.moveTo(s0x, s0y);
                    // 屏幕系 y 翻转: Math.atan2 在笛卡尔系为 ang, 在屏幕系为 -ang
                    ctx.arc(s0x, s0y, rPx, -angV, -angU, diffAng > 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                  });

                  scene.addLabel({
                    at: [0, 0],
                    offset: [
                      Math.cos(midAng) * (rPx + 10),
                      -Math.sin(midAng) * (rPx + 10),
                    ],
                    text: "$\\theta$",
                    color: "#d97706",
                    chip: false,
                  });
                }

                // 6. 主向量 u (蓝色，可拖拽)
                scene.addVector({
                  to: [uT.x, uT.y],
                  color: "#2563eb",
                  width: 3.5,
                  label: "$\\mathbf{u}$",
                  draggable: true,
                  handleRadius: 6,
                  handleRing: true,
                  hitRadiusPx: 24,
                  onDrag: (tip) => setUT({ x: tip[0], y: tip[1] }),
                });

                // 7. 主向量 v (绿色，可拖拽)
                scene.addVector({
                  to: [vT.x, vT.y],
                  color: "#059669",
                  width: 3.5,
                  label: "$\\mathbf{v}$",
                  draggable: true,
                  handleRadius: 6,
                  handleRing: true,
                  hitRadiusPx: 24,
                  onDrag: (tip) => setVT({ x: tip[0], y: tip[1] }),
                });
              }

              scene.render(ctx, plot, theme);
            }}
          >
            {/* 顶栏覆盖信息 */}
            <CanvasOverlay position="top-left">
              <CanvasOverlay.Title>
                {mode === "weighted"
                  ? "度规矩阵 $G$ 诱导的赋范空间与单位球"
                  : mode === "func"
                    ? "函数空间 $L^2[-1, 1]$ 积分内积与能量重叠"
                    : "柯西-施瓦茨投影与平行四边形对角线"}
              </CanvasOverlay.Title>
              <CanvasOverlay.Subtitle>
                {mode === "weighted"
                  ? "各向异性度规下，代数正交 $\\langle\\mathbf{u}, \\mathbf{v}\\rangle_G = 0$ 解耦于欧氏直角视觉"
                  : mode === "func"
                    ? "正面积 (绿) 与负面积 (红) 对称抵消即代表函数严格正交 $\\langle f, g\\rangle = 0$"
                    : "斜边永远大于投影直角边 $|\\langle\\mathbf{u}, \\mathbf{v}\\rangle| \\le \\|\\mathbf{u}\\|\\|\\mathbf{v}\\|$"}
              </CanvasOverlay.Subtitle>
            </CanvasOverlay>

            {/* 底栏覆盖信息 */}
            <CanvasOverlay position="bottom-left">
              {mode === "weighted" ? (
                <>
                  <CanvasOverlay.Item
                    color="#ea580c"
                    label={`$\\|\\mathbf{u}\\|_G = ${normUW.toFixed(2)}$`}
                  />
                  <CanvasOverlay.Item
                    color="#059669"
                    label={`$\\|\\mathbf{v}\\|_G = ${normVW.toFixed(2)}$`}
                  />
                  <CanvasOverlay.Item
                    color={Math.abs(innerGW) < 0.05 ? "#10b981" : "#2563eb"}
                    label={
                      <div className="flex items-center gap-1.5">
                        <span>{`$\\langle\\mathbf{u}, \\mathbf{v}\\rangle_G = ${innerGW.toFixed(2)}$`}</span>
                        {Math.abs(innerGW) < 0.05 && (
                          <span className="rounded bg-emerald-500/20 px-1 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            正交
                          </span>
                        )}
                      </div>
                    }
                  />
                  <CanvasOverlay.Item
                    color="#64748b"
                    label={`半轴：$r_x = \\frac{1}{\\sqrt{w_{11}}} = ${rx.toFixed(2)},\\; r_y = \\frac{1}{\\sqrt{w_{22}}} = ${ry.toFixed(2)}$`}
                  />
                </>
              ) : mode === "func" ? (
                <>
                  <CanvasOverlay.Item
                    color={
                      activeFunc.exactIntegral === 0 ? "#10b981" : "#9333ea"
                    }
                    label={`$\\langle f, g\\rangle = \\int_{-1}^1 f(x)g(x)\\,\\mathrm{d}x = ${activeFunc.exactIntegral.toFixed(3)}$`}
                  />
                  <CanvasOverlay.Item
                    color="#2563eb"
                    label={
                      activeFunc.exactIntegral === 0
                        ? "正负能量完全对消 (严格正交)"
                        : "存在净重叠投影能量 (非正交)"
                    }
                  />
                </>
              ) : (
                <>
                  <CanvasOverlay.Item
                    color={isCollinear ? "#10b981" : "#2563eb"}
                    label={`$|\\langle\\mathbf{u}, \\mathbf{v}\\rangle| = ${Math.abs(dotT).toFixed(2)} \\le \\|\\mathbf{u}\\|\\|\\mathbf{v}\\| = ${normProdT.toFixed(2)}$`}
                  />
                  <CanvasOverlay.Item
                    color="#7c3aed"
                    label={`$\\|\\mathbf{u}+\\mathbf{v}\\|^2 + \\|\\mathbf{u}-\\mathbf{v}\\|^2 = ${leftParallelogram.toFixed(2)} = 2(\\|\\mathbf{u}\\|^2+\\|\\mathbf{v}\\|^2)$`}
                  />
                  <CanvasOverlay.Item
                    color="#0891b2"
                    label={`$\\|\\operatorname{proj}_\\mathbf{v}(\\mathbf{u})\\| = ${Math.hypot(projV.x, projV.y).toFixed(2)} \\le \\|\\mathbf{u}\\| = ${normUT.toFixed(2)}$`}
                  />
                </>
              )}
            </CanvasOverlay>
          </CanvasViewport>
        }
        controls={
          <div className="space-y-3">
            {/* ------------------------------------------------------------- */}
            {/* 模式 1 控制面板 */}
            {/* ------------------------------------------------------------- */}
            {mode === "weighted" && (
              <div className="space-y-2.5">
                <KdeCard title="度规几何预设" variant="dense">
                  <PresetSelector
                    options={WEIGHTED_PRESETS}
                    value={weightedPreset}
                    onChange={handleWeightedPreset}
                    size="xs"
                  />
                </KdeCard>

                <KdeCard
                  title="对角度规权重矩阵 $G = \operatorname{diag}(w_{11}, w_{22})$"
                  variant="dense"
                >
                  <div className="space-y-2.5">
                    <ParamSlider
                      label="权重 $w_{11}$ ($X$ 轴刚度/主向权重)"
                      labelMode="stacked"
                      min={0.25}
                      max={4.0}
                      step={0.25}
                      value={w11}
                      onChange={(v) => {
                        setW11(v);
                        setWeightedPreset("custom");
                      }}
                    />
                    <ParamSlider
                      label="权重 $w_{22}$ ($Y$ 轴刚度/主向权重)"
                      labelMode="stacked"
                      min={0.25}
                      max={4.0}
                      step={0.25}
                      value={w22}
                      onChange={(v) => {
                        setW22(v);
                        setWeightedPreset("custom");
                      }}
                    />
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-[var(--kde-border,#bec5cc)]/50 pt-2 text-xs">
                    <KdeCheckbox
                      label="显示 $G$-正交共轭 $\mathbf{u}_G^\perp$"
                      checked={showGOrtho}
                      onChange={setShowGOrtho}
                    />
                    <KdeCheckbox
                      label="显示欧氏单位正圆对照 ($S^1$)"
                      checked={showEuclideanCircle}
                      onChange={setShowEuclideanCircle}
                    />
                  </div>
                </KdeCard>

                <div className="grid grid-cols-2 gap-2">
                  <KdeReadout
                    label="加权内积 $\langle\mathbf{u}, \mathbf{v}\rangle_G$"
                    value={innerGW.toFixed(3)}
                    subValue={
                      Math.abs(innerGW) < 0.05
                        ? "在度规 $G$ 下保持正交"
                        : `欧氏点积: $\\mathbf{u}\\cdot\\mathbf{v} = ${standardDotW.toFixed(3)}$`
                    }
                    variant={Math.abs(innerGW) < 0.05 ? "success" : "default"}
                    dense
                  />
                  <KdeReadout
                    label="诱导度规范数 $\|\mathbf{u}\|_G$"
                    value={normUW.toFixed(3)}
                    subValue={`欧氏范数: $\\|\\mathbf{u}\\| = ${Math.hypot(uW.x, uW.y).toFixed(3)}$`}
                    variant="accent"
                    dense
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 模式 2 控制面板 */}
            {/* ------------------------------------------------------------- */}
            {mode === "func" && (
              <div className="space-y-2.5">
                <KdeCard title="典型函数空间正交基选择" variant="dense">
                  <PresetSelector
                    options={FUNC_PRESETS.map((p) => ({
                      value: p.id,
                      label: p.name,
                      description: p.desc,
                    }))}
                    value={activeFuncId}
                    onChange={setActiveFuncId}
                    size="xs"
                  />

                  <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-[var(--kde-border,#bec5cc)]/50 pt-2 text-xs">
                    <KdeCheckbox
                      label="正负微元面积分割着色"
                      checked={showSignedShading}
                      onChange={setShowSignedShading}
                    />
                    <KdeCheckbox
                      label="显示乘积曲线 $f(x)g(x)$"
                      checked={showProdCurve}
                      onChange={setShowProdCurve}
                    />
                  </div>
                </KdeCard>

                <div className="grid grid-cols-2 gap-2">
                  <KdeReadout
                    label="积分内积结果 $\langle f, g\rangle$"
                    value={activeFunc.exactIntegral.toFixed(3)}
                    subValue={
                      activeFunc.exactIntegral === 0
                        ? "正负对称能量全抵消"
                        : "同向/自投影净能量"
                    }
                    variant={
                      activeFunc.exactIntegral === 0 ? "success" : "default"
                    }
                    dense
                  />
                  <KdeReadout
                    label="函数空间正交判定"
                    value={
                      activeFunc.exactIntegral === 0 ? "严格正交 (0)" : "非正交"
                    }
                    subValue={`区间 $[-1, 1]$，经 $L^2$ 度规`}
                    variant={
                      activeFunc.exactIntegral === 0 ? "success" : "warning"
                    }
                    dense
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 模式 3 控制面板 */}
            {/* ------------------------------------------------------------- */}
            {mode === "theorems" && (
              <div className="space-y-2.5">
                <KdeCard title="几何定理向量形态预设" variant="dense">
                  <PresetSelector
                    options={THEOREM_PRESETS}
                    value={theoremPreset}
                    onChange={handleTheoremPreset}
                    size="xs"
                  />
                </KdeCard>

                <KdeCard
                  title={
                    "柯西-施瓦茨不等式 $|\\langle\\mathbf{u}, \\mathbf{v}\\rangle| \\le \\|\\mathbf{u}\\| \\|\\mathbf{v}\\|$"
                  }
                  variant="dense"
                >
                  <div className="space-y-2 text-xs">
                    {/* 饱和比值进度指示条 */}
                    <div className="space-y-1">
                      <div className="flex justify-between font-mono">
                        <span className="text-[var(--kde-muted)]">
                          不等式饱和度 $|\cos\theta|$:
                        </span>
                        <span
                          className={`font-bold ${isCollinear ? "text-emerald-500" : isOrtho ? "text-blue-500" : "text-[var(--kde-accent)]"}`}
                        >
                          {(cosThetaAbs * 100).toFixed(1)}% (
                          {isCollinear
                            ? "共线"
                            : isOrtho
                              ? "正交 90°"
                              : `夹角 ${((Math.acos(cosThetaAbs) * 180) / Math.PI).toFixed(0)}°`}
                          )
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--kde-border,#bec5cc)]/40">
                        <div
                          className="h-full rounded-full transition-all duration-150"
                          style={{
                            width: `${Math.min(100, Math.max(0, cosThetaAbs * 100))}%`,
                            backgroundColor: isCollinear
                              ? "#10b981"
                              : isOrtho
                                ? "#3b82f6"
                                : "#f59e0b",
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="rounded border border-[var(--kde-border)]/50 bg-[var(--kde-raised)] p-1.5 font-mono">
                        <div className="text-[10px] text-[var(--kde-muted)]">
                          {
                            "内积绝对值 $|\\langle\\mathbf{u}, \\mathbf{v}\\rangle|$"
                          }
                        </div>
                        <div className="text-sm font-bold text-primary">
                          {Math.abs(dotT).toFixed(3)}
                        </div>
                      </div>
                      <div className="rounded border border-[var(--kde-border)]/50 bg-[var(--kde-raised)] p-1.5 font-mono">
                        <div className="text-[10px] text-[var(--kde-muted)]">
                          {"范数乘积 $\\|\\mathbf{u}\\|\\|\\mathbf{v}\\|$"}
                        </div>
                        <div className="text-sm font-bold text-emerald-500">
                          {normProdT.toFixed(3)}
                        </div>
                      </div>
                    </div>

                    <p className="border-t border-[var(--kde-border,#bec5cc)]/50 pt-1 text-[11px] text-[var(--kde-muted)]">
                      {isCollinear ? (
                        <span className="font-bold text-emerald-500">
                          ★ 等号严格成立：两向量共线线性相关！
                        </span>
                      ) : isOrtho ? (
                        <span className="font-bold text-blue-500">
                          ★ 正交极小点：内积归零，投影长度为 0！
                        </span>
                      ) : (
                        <span>
                          {
                            "几何本质：直角三角形斜边永远大于投影直角边 $\\|\\operatorname{proj}_\\mathbf{v}(\\mathbf{u})\\| \\le \\|\\mathbf{u}\\|$。"
                          }
                        </span>
                      )}
                    </p>
                  </div>
                </KdeCard>

                <KdeCard
                  title={
                    "平行四边形恒等式 $\\|\\mathbf{u}+\\mathbf{v}\\|^2 + \\|\\mathbf{u}-\\mathbf{v}\\|^2 = 2(\\|\\mathbf{u}\\|^2 + \\|\\mathbf{v}\\|^2)$"
                  }
                  variant="dense"
                >
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[var(--kde-muted)]">
                        {
                          "对角线平方和 $(\\|\\mathbf{u}+\\mathbf{v}\\|^2 + \\|\\mathbf{u}-\\mathbf{v}\\|^2)$:"
                        }
                      </span>
                      <span className="font-bold text-purple-400">
                        {leftParallelogram.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--kde-muted)]">
                        {
                          "四边边长平方和 $2(\\|\\mathbf{u}\\|^2 + \\|\\mathbf{v}\\|^2)$:"
                        }
                      </span>
                      <span className="font-bold text-purple-400">
                        {rightParallelogram.toFixed(3)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--kde-border,#bec5cc)]/40 pt-1 text-[11px]">
                      <span className="text-[var(--kde-muted)]">
                        恒等能量误差:
                      </span>
                      <span className="font-bold text-emerald-500">
                        {`$\\Delta = ${parallelogramDiff.toFixed(4)}$ (严格恒等)`}
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
