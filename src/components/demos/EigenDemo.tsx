import { useState, useMemo } from "react";
import ExpandableDemo from "../framework/ExpandableDemo";
import CanvasViewport from "../framework/CanvasViewport";
import CanvasOverlay from "../framework/CanvasOverlay";
import ParamSlider from "../framework/ParamSlider";
import PresetSelector from "../framework/PresetSelector";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeTabs, { type KdeTabOption } from "../framework/KdeTabs";
import type { Bounds2 } from "../../visualizations/core/2d/plot2d";

type EigenMode = "probe" | "spectral-ellipse" | "diagonalization";

const MODES: Array<KdeTabOption<EigenMode>> = [
  { id: "probe", label: "特征方向探测器 (A x = λ x)" },
  { id: "spectral-ellipse", label: "谱定理与主轴椭圆" },
  { id: "diagonalization", label: "特征基底对角化" },
];

interface MatrixPreset {
  name: string;
  a11: number;
  a12: number;
  a21: number;
  a22: number;
  desc: string;
}

const PRESETS: Record<string, MatrixPreset> = {
  symmetric: {
    name: "对称矩阵 (正交特征基)",
    a11: 1.6,
    a12: 0.6,
    a21: 0.6,
    a22: 1.1,
    desc: "实对称矩阵必有互相正交的实特征向量，主轴垂直",
  },
  anisotropic: {
    name: "对角拉伸",
    a11: 1.8,
    a12: 0.0,
    a21: 0.0,
    a22: 0.6,
    desc: "沿坐标轴方向独立伸缩，特征向量为标准基",
  },
  saddle: {
    name: "鞍点矩阵 (一正一负)",
    a11: 1.2,
    a12: 0.4,
    a21: 0.4,
    a22: -0.8,
    desc: "一个方向拉伸扩张，另一方向翻转压缩",
  },
  shear: {
    name: "剪切矩阵 (特征空间退化)",
    a11: 1.0,
    a12: 1.2,
    a21: 0.0,
    a22: 1.0,
    desc: "重特征值 λ=1 且只有一个特征方向（不可对角化）",
  },
  rotation: {
    name: "纯旋转矩阵 (复特征值)",
    a11: 0.707,
    a12: -0.707,
    a21: 0.707,
    a22: 0.707,
    desc: "所有实向量均发生旋转，无实特征向量与实特征值",
  },
};

const BOUNDS_2D: Bounds2 = {
  xMin: -2.8,
  xMax: 2.8,
  yMin: -2.4,
  yMax: 2.4,
};

function calculateEigen(a11: number, a12: number, a21: number, a22: number) {
  const tr = a11 + a22;
  const det = a11 * a22 - a12 * a21;
  const discriminant = tr * tr - 4 * det;

  if (discriminant < -1e-6) {
    const real = tr / 2;
    const imag = Math.sqrt(-discriminant) / 2;
    return {
      hasReal: false,
      tr,
      det,
      lambda1: real,
      lambda2: real,
      imag,
      v1: null,
      v2: null,
    };
  }

  const sqrtDisc = Math.sqrt(Math.max(0, discriminant));
  const l1 = (tr + sqrtDisc) / 2;
  const l2 = (tr - sqrtDisc) / 2;

  const getVec = (lambda: number) => {
    if (Math.abs(a12) > 1e-5) {
      const vx = a12;
      const vy = lambda - a11;
      const len = Math.hypot(vx, vy);
      return len > 1e-6 ? { x: vx / len, y: vy / len } : { x: 1, y: 0 };
    }
    if (Math.abs(a21) > 1e-5) {
      const vx = lambda - a22;
      const vy = a21;
      const len = Math.hypot(vx, vy);
      return len > 1e-6 ? { x: vx / len, y: vy / len } : { x: 0, y: 1 };
    }
    return lambda === a11 ? { x: 1, y: 0 } : { x: 0, y: 1 };
  };

  return {
    hasReal: true,
    tr,
    det,
    lambda1: l1,
    lambda2: l2,
    imag: 0,
    v1: getVec(l1),
    v2: getVec(l2),
  };
}

export default function EigenDemo({ height }: { height?: string }) {
  const [mode, setMode] = useState<EigenMode>("probe");
  const [preset, setPreset] = useState<string>("symmetric");

  const [a11, setA11] = useState(1.6);
  const [a12, setA12] = useState(0.6);
  const [a21, setA21] = useState(0.6);
  const [a22, setA22] = useState(1.1);

  // Probe angle in radians
  const [probeAngle, setProbeAngle] = useState(0.5);

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

  const eigen = useMemo(
    () => calculateEigen(a11, a12, a21, a22),
    [a11, a12, a21, a22],
  );

  // Probe vector x and transformed Ax
  const probeX = Math.cos(probeAngle);
  const probeY = Math.sin(probeAngle);
  const axX = a11 * probeX + a12 * probeY;
  const axY = a21 * probeX + a22 * probeY;

  // Check alignment: cross product of x and Ax
  const cross = Math.abs(probeX * axY - probeY * axX);
  const isAligned = cross < 0.08;
  const approxLambda =
    Math.hypot(axX, axY) * (probeX * axX + probeY * axY >= 0 ? 1 : -1);

  return (
    <ExpandableDemo id="eigen-demo" height={height}>
      <KdeWindowShell
        title="特征值与特征向量几何全景"
        eyebrow="Linear Algebra · Spectral Theory"
        mark="A v = λ v"
        modeTag={
          !eigen.hasReal
            ? "复特征值 (无实特征方向)"
            : Math.abs(eigen.lambda1 - eigen.lambda2) < 1e-4
              ? "重特征值退化"
              : "非退化实特征基"
        }
        display={
          <CanvasViewport
            initialBounds={BOUNDS_2D}
            className="h-[var(--demo-height,22rem)]"
            onDraw={(ctx, plot, theme, scene) => {
              scene.addAxes();

              // Draw real eigen-axes if exist
              if (eigen.hasReal) {
                if (eigen.v1) {
                  scene.addLine({
                    p1: [-eigen.v1.x * 5, -eigen.v1.y * 5],
                    p2: [eigen.v1.x * 5, eigen.v1.y * 5],
                    stroke: "rgba(59, 130, 246, 0.4)",
                    dash: [4, 4],
                    width: 1.5,
                    label: `E₁ (λ₁ = ${eigen.lambda1.toFixed(2)})`,
                  });
                }
                if (eigen.v2) {
                  scene.addLine({
                    p1: [-eigen.v2.x * 5, -eigen.v2.y * 5],
                    p2: [eigen.v2.x * 5, eigen.v2.y * 5],
                    stroke: "rgba(16, 185, 129, 0.4)",
                    dash: [4, 4],
                    width: 1.5,
                    label: `E₂ (λ₂ = ${eigen.lambda2.toFixed(2)})`,
                  });
                }
              }

              if (mode === "probe") {
                // Unit circle guide
                const circlePts: Array<[number, number]> = [];
                for (let i = 0; i <= 64; i++) {
                  const th = (i / 64) * Math.PI * 2;
                  circlePts.push([Math.cos(th), Math.sin(th)]);
                }
                scene.addPolyline({
                  points: circlePts,
                  color: "rgba(148, 163, 184, 0.3)",
                  dash: [3, 3],
                  width: 1,
                });

                // Transformed vector Ax (Rose)
                scene.addVector({
                  to: [axX, axY],
                  color: isAligned ? "#10b981" : "#f43f5e",
                  width: 3.5,
                  label: `A x (${axX.toFixed(2)}, ${axY.toFixed(2)})`,
                });

                // Probe vector x (Draggable handle)
                scene.addVector({
                  to: [probeX, probeY],
                  color: "#3b82f6",
                  width: 3.0,
                  label: "测试向量 x",
                  draggable: true,
                  handleRadius: 6,
                  handleRing: true,
                  hitRadiusPx: 24,
                  onDrag: (tip) => {
                    const ang = Math.atan2(tip[1], tip[0]);
                    setProbeAngle(ang < 0 ? ang + Math.PI * 2 : ang);
                  },
                });
              } else if (mode === "spectral-ellipse") {
                // Mapped Ellipse: A * (cos theta, sin theta)
                const ellipsePts: Array<[number, number]> = [];
                for (let i = 0; i <= 80; i++) {
                  const th = (i / 80) * Math.PI * 2;
                  const cx = Math.cos(th);
                  const cy = Math.sin(th);
                  ellipsePts.push([a11 * cx + a12 * cy, a21 * cx + a22 * cy]);
                }
                scene.addPolyline({
                  points: ellipsePts,
                  color: "#8b5cf6",
                  width: 2.5,
                });

                // Eigen-vectors scaled by eigenvalues
                if (eigen.hasReal && eigen.v1) {
                  scene.addVector({
                    to: [
                      eigen.v1.x * eigen.lambda1,
                      eigen.v1.y * eigen.lambda1,
                    ],
                    color: "#3b82f6",
                    width: 3.0,
                    label: `λ₁ v₁ (${(eigen.v1.x * eigen.lambda1).toFixed(2)}, ${(eigen.v1.y * eigen.lambda1).toFixed(2)})`,
                  });
                }
                if (eigen.hasReal && eigen.v2) {
                  scene.addVector({
                    to: [
                      eigen.v2.x * eigen.lambda2,
                      eigen.v2.y * eigen.lambda2,
                    ],
                    color: "#10b981",
                    width: 3.0,
                    label: `λ₂ v₂ (${(eigen.v2.x * eigen.lambda2).toFixed(2)}, ${(eigen.v2.y * eigen.lambda2).toFixed(2)})`,
                  });
                }
              } else {
                // Diagonalization mode: show basis vectors
                if (eigen.hasReal && eigen.v1 && eigen.v2) {
                  scene.addVector({
                    to: [eigen.v1.x, eigen.v1.y],
                    color: "#3b82f6",
                    width: 2.5,
                    label: "v₁",
                  });
                  scene.addVector({
                    to: [eigen.v2.x, eigen.v2.y],
                    color: "#10b981",
                    width: 2.5,
                    label: "v₂",
                  });
                  scene.addVector({
                    to: [
                      eigen.v1.x * eigen.lambda1,
                      eigen.v1.y * eigen.lambda1,
                    ],
                    color: "#60a5fa",
                    width: 3.0,
                    dashed: true,
                    label: "A v₁",
                  });
                  scene.addVector({
                    to: [
                      eigen.v2.x * eigen.lambda2,
                      eigen.v2.y * eigen.lambda2,
                    ],
                    color: "#34d399",
                    width: 3.0,
                    dashed: true,
                    label: "A v₂",
                  });
                }
              }

              scene.render(ctx, plot, theme);
            }}
          >
            <CanvasOverlay position="top-left">
              <CanvasOverlay.Title>A x = λ x 特征空间</CanvasOverlay.Title>
              <CanvasOverlay.Subtitle>
                {mode === "probe"
                  ? isAligned
                    ? `🎯 捕获特征方向！λ ≈ ${approxLambda.toFixed(2)}`
                    : "非特征方向 (发生偏转)"
                  : mode === "spectral-ellipse"
                    ? "单位圆在矩阵 A 作用下的主轴椭圆"
                    : "特征基底对角化：A = V Λ V⁻¹"}
              </CanvasOverlay.Subtitle>
            </CanvasOverlay>

            <CanvasOverlay position="bottom-left">
              <CanvasOverlay.Item
                color="#3b82f6"
                label={
                  eigen.hasReal
                    ? `λ₁ = ${eigen.lambda1.toFixed(2)}, λ₂ = ${eigen.lambda2.toFixed(2)}`
                    : `复特征根: ${(eigen.tr / 2).toFixed(2)} ± ${eigen.imag.toFixed(2)}i`
                }
              />
              <CanvasOverlay.Item
                color="#f59e0b"
                label={`det(A) = ${eigen.det.toFixed(2)}, tr(A) = ${eigen.tr.toFixed(2)}`}
              />
            </CanvasOverlay>
          </CanvasViewport>
        }
        controls={
          <div className="space-y-3">
            <KdeTabs
              options={MODES}
              value={mode}
              onChange={(m) => setMode(m as EigenMode)}
            />

            <KdeCard title="预设矩阵 A" variant="dense">
              <PresetSelector
                label="典型矩阵类型:"
                options={PRESETS}
                value={preset}
                onChange={handlePresetChange}
              />
            </KdeCard>

            {mode === "probe" && (
              <KdeCard title="探测向量方向调节" variant="dense">
                <ParamSlider
                  label="方位角 $\theta$"
                  labelMode="adaptive"
                  widthClass="w-full"
                  value={probeAngle}
                  min={0}
                  max={Math.PI * 2}
                  step={0.02}
                  onChange={setProbeAngle}
                  display={`${((probeAngle * 180) / Math.PI).toFixed(0)}°`}
                />
              </KdeCard>
            )}

            <KdeCard title="矩阵系数微调" variant="dense">
              <div className="grid grid-cols-2 gap-2">
                <ParamSlider
                  label="$a_{11}$"
                  widthClass="w-full"
                  value={a11}
                  min={-2.5}
                  max={2.5}
                  step={0.1}
                  onChange={(v) => {
                    setA11(v);
                    setPreset("custom");
                  }}
                />
                <ParamSlider
                  label="$a_{12}$"
                  widthClass="w-full"
                  value={a12}
                  min={-2.5}
                  max={2.5}
                  step={0.1}
                  onChange={(v) => {
                    setA12(v);
                    setPreset("custom");
                  }}
                />
                <ParamSlider
                  label="$a_{21}$"
                  widthClass="w-full"
                  value={a21}
                  min={-2.5}
                  max={2.5}
                  step={0.1}
                  onChange={(v) => {
                    setA21(v);
                    setPreset("custom");
                  }}
                />
                <ParamSlider
                  label="$a_{22}$"
                  widthClass="w-full"
                  value={a22}
                  min={-2.5}
                  max={2.5}
                  step={0.1}
                  onChange={(v) => {
                    setA22(v);
                    setPreset("custom");
                  }}
                />
              </div>
            </KdeCard>

            <div className="grid grid-cols-2 gap-1.5">
              <KdeReadout
                label="迹 tr(A) = λ₁ + λ₂"
                value={eigen.tr.toFixed(2)}
                dense
              />
              <KdeReadout
                label="行列式 det(A) = λ₁ λ₂"
                value={eigen.det.toFixed(2)}
                variant="accent"
                dense
              />
            </div>

            <KdeCard title="特征方程与特征根判定" variant="dense">
              <div className="space-y-1 text-xs">
                <div className="font-mono text-muted-foreground">
                  {`$\\det(A - \\lambda I) = \\lambda^2 - (${eigen.tr.toFixed(2)})\\lambda + (${eigen.det.toFixed(2)}) = 0$`}
                </div>
                <div className="pt-1 border-t border-[var(--kde-border,#bec5cc)]/60">
                  {eigen.hasReal ? (
                    <span className="text-emerald-400 font-medium">
                      {`实特征值：$\\lambda_1 = ${eigen.lambda1.toFixed(2)},\\; \\lambda_2 = ${eigen.lambda2.toFixed(2)}$`}
                    </span>
                  ) : (
                    <span className="text-rose-400 font-medium">
                      {`判别式 $\\Delta < 0$，存在共轭复特征根：$\\lambda = ${(eigen.tr / 2).toFixed(2)} \\pm ${eigen.imag.toFixed(2)}i$`}
                    </span>
                  )}
                </div>
              </div>
            </KdeCard>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
