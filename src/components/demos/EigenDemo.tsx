import { useState, useRef, useEffect } from "react";
import { useCanvas2D } from "../framework/useCanvas2D";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import ParamSlider from "../framework/ParamSlider";
import PresetSelector from "../framework/PresetSelector";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeTabs from "../framework/KdeTabs";
import {
  drawAdaptiveAxes,
  type Bounds2,
} from "../../visualizations/core/2d/plot2d";

type EigenMode = "probe" | "spectral-ellipse" | "diagonalization";

const MODES: Array<{ id: EigenMode; label: string }> = [
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

// Calculate real 2x2 eigenvalues & eigenvectors
function calculateEigen(a11: number, a12: number, a21: number, a22: number) {
  const tr = a11 + a22;
  const det = a11 * a22 - a12 * a21;
  const discriminant = tr * tr - 4 * det;

  if (discriminant < -1e-6) {
    // Complex eigenvalues
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

  // Find eigenvectors for l1: (A - l1*I)v = 0
  const getVec = (lambda: number) => {
    // (a11 - lambda)*x + a12*y = 0
    // a21*x + (a22 - lambda)*y = 0
    if (Math.abs(a12) > 1e-5) {
      const vx = a12;
      const vy = lambda - a11;
      const len = Math.hypot(vx, vy);
      return len > 1e-6 ? { x: vx / len, y: vy / len } : { x: 1, y: 0 };
    } else if (Math.abs(a21) > 1e-5) {
      const vx = lambda - a22;
      const vy = a21;
      const len = Math.hypot(vx, vy);
      return len > 1e-6 ? { x: vx / len, y: vy / len } : { x: 0, y: 1 };
    } else {
      // Diagonal
      return lambda === a11 ? { x: 1, y: 0 } : { x: 0, y: 1 };
    }
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

  const stateRef = useRef({
    mode,
    a11,
    a12,
    a21,
    a22,
    probeAngle,
  });

  useEffect(() => {
    stateRef.current = { mode, a11, a12, a21, a22, probeAngle };
  }, [mode, a11, a12, a21, a22, probeAngle]);

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

  const initialBounds: Bounds2 = {
    xMin: -2.8,
    xMax: 2.8,
    yMin: -2.4,
    yMax: 2.4,
  };

  const eigen = calculateEigen(a11, a12, a21, a22);

  const { containerRef, canvasRef, redraw, resetBounds } = useCanvas2D({
    initialBounds,
    equalScale: true,
    draw: (ctx, plot, theme) => {
      const { mode, a11, a12, a21, a22, probeAngle } = stateRef.current;

      // 1. Draw Adaptive Grid & Axes
      drawAdaptiveAxes(ctx, plot, theme);

      const drawArrow = (
        fromX: number,
        fromY: number,
        toX: number,
        toY: number,
        color: string,
        label: string,
        lineWidth = 2.5,
      ) => {
        const p0x = plot.toScreenX(fromX);
        const p0y = plot.toScreenY(fromY);
        const p1x = plot.toScreenX(toX);
        const p1y = plot.toScreenY(toY);
        const angle = Math.atan2(p1y - p0y, p1x - p0x);
        const headLen = 9;

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        ctx.moveTo(p0x, p0y);
        ctx.lineTo(p1x, p1y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(
          p1x - headLen * Math.cos(angle - Math.PI / 6),
          p1y - headLen * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
          p1x - headLen * Math.cos(angle + Math.PI / 6),
          p1y - headLen * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();
        ctx.fill();

        if (label) {
          ctx.font = "bold 12px sans-serif";
          ctx.fillStyle = color;
          const textX = p1x + 14 * Math.cos(angle + Math.PI / 4);
          const textY = p1y + 14 * Math.sin(angle + Math.PI / 4);
          ctx.fillText(label, textX, textY);
        }
      };

      const eigenData = calculateEigen(a11, a12, a21, a22);

      // Draw real eigen-axes if exist
      if (eigenData.hasReal) {
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);

        if (eigenData.v1) {
          ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
          const ep1x = plot.toScreenX(-eigenData.v1.x * 5);
          const ep1y = plot.toScreenY(-eigenData.v1.y * 5);
          const ep2x = plot.toScreenX(eigenData.v1.x * 5);
          const ep2y = plot.toScreenY(eigenData.v1.y * 5);
          ctx.beginPath();
          ctx.moveTo(ep1x, ep1y);
          ctx.lineTo(ep2x, ep2y);
          ctx.stroke();
        }

        if (eigenData.v2) {
          ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
          const ep1x = plot.toScreenX(-eigenData.v2.x * 5);
          const ep1y = plot.toScreenY(-eigenData.v2.y * 5);
          const ep2x = plot.toScreenX(eigenData.v2.x * 5);
          const ep2y = plot.toScreenY(eigenData.v2.y * 5);
          ctx.beginPath();
          ctx.moveTo(ep1x, ep1y);
          ctx.lineTo(ep2x, ep2y);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      if (mode === "probe") {
        // MODE 1: Probe vector x & Ax
        const px = Math.cos(probeAngle);
        const py = Math.sin(probeAngle);

        const ax = a11 * px + a12 * py;
        const ay = a21 * px + a22 * py;

        // Check cross product / collinearity
        const cross = px * ay - py * ax;
        const isCollinear = Math.abs(cross) < 0.08;

        if (isCollinear) {
          // Draw bright glowing circle around vector tip
          const tipX = plot.toScreenX(ax);
          const tipY = plot.toScreenY(ay);
          ctx.fillStyle = "rgba(16, 185, 129, 0.3)";
          ctx.beginPath();
          ctx.arc(tipX, tipY, 16, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw probe vector x (Purple) and transformed Ax (Green/Red)
        drawArrow(0, 0, px, py, "#8b5cf6", "x", 3);
        drawArrow(
          0,
          0,
          ax,
          ay,
          isCollinear ? "#10b981" : "#06b6d4",
          isCollinear ? "A x = λ x (特征向量!)" : "A x",
          3.2,
        );
      } else if (mode === "spectral-ellipse") {
        // MODE 2: Unit circle -> Transformed Ellipse
        const segments = 120;

        // 1. Draw Unit circle
        ctx.strokeStyle = theme.border;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const sx = plot.toScreenX(Math.cos(theta));
          const sy = plot.toScreenY(Math.sin(theta));
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // 2. Draw Transformed ellipse A(S^1)
        ctx.strokeStyle = "#8b5cf6";
        ctx.fillStyle = "rgba(139, 92, 246, 0.15)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const ux = Math.cos(theta);
          const uy = Math.sin(theta);
          const ex = a11 * ux + a12 * uy;
          const ey = a21 * ux + a22 * uy;
          const sx = plot.toScreenX(ex);
          const sy = plot.toScreenY(ey);
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Draw Principal Eigenvector Axes
        if (eigenData.hasReal && eigenData.v1 && eigenData.v2) {
          drawArrow(
            0,
            0,
            eigenData.v1.x * eigenData.lambda1,
            eigenData.v1.y * eigenData.lambda1,
            "#3b82f6",
            `λ₁ v₁ (${eigenData.lambda1.toFixed(2)})`,
            3,
          );
          drawArrow(
            0,
            0,
            eigenData.v2.x * eigenData.lambda2,
            eigenData.v2.y * eigenData.lambda2,
            "#f59e0b",
            `λ₂ v₂ (${eigenData.lambda2.toFixed(2)})`,
            3,
          );
        }
      } else if (mode === "diagonalization") {
        // MODE 3: Decoupled Eigenbasis Coordinate grid
        if (eigenData.hasReal && eigenData.v1 && eigenData.v2) {
          // Draw transformed eigenbasis
          drawArrow(
            0,
            0,
            eigenData.v1.x,
            eigenData.v1.y,
            "rgba(59, 130, 246, 0.5)",
            "v₁",
            2,
          );
          drawArrow(
            0,
            0,
            eigenData.v2.x,
            eigenData.v2.y,
            "rgba(245, 158, 11, 0.5)",
            "v₂",
            2,
          );

          drawArrow(
            0,
            0,
            eigenData.v1.x * eigenData.lambda1,
            eigenData.v1.y * eigenData.lambda1,
            "#3b82f6",
            `A v₁ = ${eigenData.lambda1.toFixed(1)} v₁`,
            3,
          );
          drawArrow(
            0,
            0,
            eigenData.v2.x * eigenData.lambda2,
            eigenData.v2.y * eigenData.lambda2,
            "#f59e0b",
            `A v₂ = ${eigenData.lambda2.toFixed(1)} v₂`,
            3,
          );
        }
      }
    },
  });

  return (
    <AutoMath>
      <ExpandableDemo id="eigenvalues-and-eigenvectors" height={height}>
        <KdeWindowShell
          title="特征值、特征向量与谱定理"
          eyebrow="Linear Algebra · Eigenvalues & Eigenvectors"
          mark="Ax = λx"
          modeTag={
            mode === "probe"
              ? "特征方向探测器"
              : mode === "spectral-ellipse"
                ? "谱定理主轴椭圆"
                : "特征基底对角化"
          }
          display={
            <div
              ref={containerRef}
              className="relative h-[var(--demo-height,20rem)] w-full overflow-hidden rounded-md border border-slate-800 bg-slate-950"
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
              <KdeTabs
                options={MODES}
                value={mode}
                onChange={(val: string) => {
                  setMode(val as EigenMode);
                  redraw();
                }}
              />

              <KdeCard title="预设矩阵与探测参数" variant="dense">
                <div className="space-y-2.5">
                  <PresetSelector
                    label="预设矩阵:"
                    options={PRESETS}
                    value={preset}
                    onChange={(p) => {
                      handlePresetChange(p);
                      redraw();
                    }}
                  />

                  {mode === "probe" && (
                    <ParamSlider
                      label="探测角 $\theta$"
                      labelMode="adaptive"
                      widthClass="w-full"
                      min={0}
                      max={Math.PI * 2}
                      step={0.02}
                      value={probeAngle}
                      onChange={(val) => {
                        setProbeAngle(val);
                        redraw();
                      }}
                      display={`${((probeAngle * 180) / Math.PI).toFixed(0)}°`}
                    />
                  )}
                </div>
              </KdeCard>

              <KdeCard title="代数特征方程与几何洞察" variant="dense">
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="space-y-1">
                    <div className="font-mono text-sm text-foreground">
                      {`$A = \\begin{pmatrix} ${a11.toFixed(2)} & ${a12.toFixed(2)} \\\\ ${a21.toFixed(2)} & ${a22.toFixed(2)} \\end{pmatrix}$`}
                    </div>
                    <div className="text-muted-foreground font-mono">
                      {`$\\operatorname{tr}(A) = ${(a11 + a22).toFixed(2)},\\quad \\det(A) = ${(a11 * a22 - a12 * a21).toFixed(2)}$`}
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-1 border-t border-slate-700/50">
                      {`特征多项式: $\\lambda^2 - ${eigen.tr.toFixed(2)}\\lambda + ${eigen.det.toFixed(2)} = 0$`}
                    </p>
                  </div>

                  <div className="space-y-1 text-muted-foreground leading-normal">
                    {eigen.hasReal ? (
                      <p>
                        虚线为特征子空间直线。当向量位于该直线上时，矩阵变换仅发生纯粹的标量伸缩（长度乘
                        $\lambda$），方向绝不发生任何偏转！
                      </p>
                    ) : (
                      <p className="text-rose-400">
                        旋转变换不存在任何实不变直线，所有非零向量都在变换中被扭转偏向。
                      </p>
                    )}
                  </div>
                </div>
              </KdeCard>

              <div className="grid grid-cols-2 gap-1.5">
                <KdeReadout
                  label="λ₁ 特征值"
                  value={
                    eigen.hasReal
                      ? eigen.lambda1.toFixed(3)
                      : `${eigen.lambda1.toFixed(2)} + ${eigen.imag.toFixed(2)}i`
                  }
                  variant="accent"
                  dense
                />
                <KdeReadout
                  label="λ₂ 特征值"
                  value={
                    eigen.hasReal
                      ? eigen.lambda2.toFixed(3)
                      : `${eigen.lambda2.toFixed(2)} - ${eigen.imag.toFixed(2)}i`
                  }
                  dense
                />
                <KdeReadout
                  label="迹 tr(A)"
                  value={(a11 + a22).toFixed(2)}
                  dense
                />
                <KdeReadout
                  label="行列式 det(A)"
                  value={(a11 * a22 - a12 * a21).toFixed(2)}
                  dense
                />
              </div>

              <p className="text-xs text-muted-foreground">
                提示：在“特征方向探测器”模式下拖动滑块旋转紫色向量 x，当 x
                与变换向量 Ax
                共线时（高亮为绿色），即成功探测到特征向量；在“谱定理与主轴椭圆”模式下可直观看到单位圆被拉伸为主轴椭圆的过程。
              </p>
            </div>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
