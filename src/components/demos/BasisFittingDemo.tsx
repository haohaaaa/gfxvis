import { useState, useMemo } from "react";
import {
  drawAdaptiveAxes,
  drawDragGizmo,
  drawPolyline,
  drawSegment,
  getVisibleBounds,
  type Bounds2,
} from "../../visualizations/core/2d/plot2d";
import CanvasViewport from "../framework/CanvasViewport";
import ExpandableDemo from "../framework/ExpandableDemo";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import { useVectorDrag } from "../framework/useVectorDrag";

const INITIAL_BOUNDS: Bounds2 = {
  xMin: -4,
  xMax: 4,
  yMin: -3.5,
  yMax: 3.5,
};
const MARGIN = 30;

export type BasisFamily = "poly" | "fourier" | "rbf";

interface BasisFunction {
  label: string;
  eval: (x: number) => number;
}

interface Point2D {
  id: string;
  x: number;
  y: number;
}

const INITIAL_POINTS: Point2D[] = [
  { id: "p1", x: -3.0, y: -1.2 },
  { id: "p2", x: -1.8, y: 1.5 },
  { id: "p3", x: -0.5, y: -0.8 },
  { id: "p4", x: 0.8, y: 0.9 },
  { id: "p5", x: 2.2, y: -1.6 },
  { id: "p6", x: 3.2, y: 1.8 },
];

/** Solve linear least squares A θ ≈ b via normal equations (Aᵀ A) θ = Aᵀ b using Gaussian elimination with pivoting */
function solveLinearLeastSquares(
  A: number[][],
  b: number[],
): { theta: number[]; rss: number } {
  const m = A.length;
  const n = A[0].length;

  const G: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  const d: number[] = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < m; k++) {
        sum += A[k][i] * A[k][j];
      }
      G[i][j] = sum;
    }
    G[i][i] += 1e-7;

    let bSum = 0;
    for (let k = 0; k < m; k++) {
      bSum += A[k][i] * b[k];
    }
    d[i] = bSum;
  }

  const M: number[][] = G.map((row, i) => [...row, d[i]]);
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
        maxRow = k;
      }
    }
    if (Math.abs(M[maxRow][i]) < 1e-12) continue;

    const temp = M[i];
    M[i] = M[maxRow];
    M[maxRow] = temp;

    const pivot = M[i][i];
    for (let j = i; j <= n; j++) {
      M[i][j] /= pivot;
    }

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = M[k][i];
        for (let j = i; j <= n; j++) {
          M[k][j] -= factor * M[i][j];
        }
      }
    }
  }

  const theta = M.map((row) => row[n]);

  let rss = 0;
  for (let k = 0; k < m; k++) {
    let pred = 0;
    for (let j = 0; j < n; j++) {
      pred += A[k][j] * theta[j];
    }
    const diff = b[k] - pred;
    rss += diff * diff;
  }

  return { theta, rss };
}

export default function BasisFittingDemo({ height }: { height?: string }) {
  const [points, setPoints] = useState<Point2D[]>(INITIAL_POINTS);
  const [family, setFamily] = useState<BasisFamily>("poly");
  const [polyDegree, setPolyDegree] = useState<number>(3);

  const basisFunctions = useMemo<BasisFunction[]>(() => {
    if (family === "poly") {
      const funcs: BasisFunction[] = [];
      for (let d = 0; d <= polyDegree; d++) {
        if (d === 0) funcs.push({ label: "1", eval: () => 1 });
        else if (d === 1) funcs.push({ label: "x", eval: (x) => x });
        else funcs.push({ label: `x^${d}`, eval: (x) => Math.pow(x, d) });
      }
      return funcs;
    }
    if (family === "fourier") {
      return [
        { label: "1", eval: () => 1 },
        { label: "\\cos(x)", eval: (x) => Math.cos(x) },
        { label: "\\sin(x)", eval: (x) => Math.sin(x) },
        { label: "\\cos(2x)", eval: (x) => Math.cos(2 * x) },
        { label: "\\sin(2x)", eval: (x) => Math.sin(2 * x) },
      ];
    }
    const centers = [-2.5, -1.2, 0.0, 1.2, 2.5];
    const gamma = 1.0;
    return [
      { label: "1", eval: () => 1 },
      ...centers.map((c, i) => ({
        label: `\\phi_${i + 1}(x)`,
        eval: (x: number) => Math.exp(-gamma * Math.pow(x - c, 2)),
      })),
    ];
  }, [family, polyDegree]);

  const fitResult = useMemo(() => {
    const A = points.map((p) => basisFunctions.map((bf) => bf.eval(p.x)));
    const b = points.map((p) => p.y);
    return solveLinearLeastSquares(A, b);
  }, [points, basisFunctions]);

  const evalModel = (x: number) => {
    let sum = 0;
    for (let i = 0; i < basisFunctions.length; i++) {
      sum += (fitResult.theta[i] || 0) * basisFunctions[i].eval(x);
    }
    return sum;
  };

  const dragTargets = useMemo(
    () =>
      points.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        bounds: { xMin: -3.8, xMax: 3.8, yMin: -3.2, yMax: 3.2 },
      })),
    [points],
  );

  const dragHandlers = useVectorDrag({
    targets: dragTargets,
    onDrag(id, pos) {
      setPoints((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                x: Math.max(-3.8, Math.min(3.8, pos.x)),
                y: Math.max(-3.2, Math.min(3.2, pos.y)),
              }
            : p,
        ),
      );
    },
  });

  const formatFormula = () => {
    return basisFunctions
      .map((bf, idx) => {
        const coef = fitResult.theta[idx] || 0;
        const sign = idx > 0 && coef >= 0 ? "+" : "";
        if (bf.label === "1") {
          return `${sign}${coef.toFixed(2)}`;
        }
        return `${sign}${coef.toFixed(2)}\\,${bf.label}`;
      })
      .join(" ");
  };

  const modeTag =
    family === "poly"
      ? `${polyDegree} 阶多项式基`
      : family === "fourier"
        ? "傅里叶基 (Fourier)"
        : "径向基 (RBF)";

  return (
    <ExpandableDemo id="basis-fitting" height={height}>
      <KdeWindowShell
        title="广义线性模型与基函数拟合 (Basis Function Linear Regression)"
        eyebrow="Linear Algebra · Function Space & Regression"
        mark="f(x) = ∑ θⱼ φⱼ(x)"
        modeTag={modeTag}
        display={
          <CanvasViewport
            initialBounds={INITIAL_BOUNDS}
            margin={MARGIN}
            className="h-[var(--demo-height,20rem)]"
            onLeftDown={dragHandlers.onLeftDown}
            onLeftMove={dragHandlers.onLeftMove}
            onLeftUp={dragHandlers.onLeftUp}
            onHover={dragHandlers.onHover}
            onPointerLeave={dragHandlers.onPointerLeave}
            onDraw={(ctx, plot, theme) => {
              drawAdaptiveAxes(ctx, plot, theme);

              // 1. Draw continuous fitted curve f(x) across viewport
              const bounds = getVisibleBounds(plot);
              const visibleMinX = bounds.xMin;
              const visibleMaxX = bounds.xMax;
              const steps = 240;
              const dx = (visibleMaxX - visibleMinX) / steps;
              const curvePoints: [number, number][] = [];

              for (let i = 0; i <= steps; i++) {
                const cx = visibleMinX + i * dx;
                const cy = evalModel(cx);
                if (Number.isFinite(cy)) {
                  curvePoints.push([cx, cy]);
                }
              }

              drawPolyline(ctx, plot, curvePoints, {
                color: "#3b82f6",
                width: 2.8,
              });

              // 2. Draw vertical residual dashed lines e_i from data points to curve
              for (const p of points) {
                const modelY = evalModel(p.x);
                drawSegment(ctx, plot, p.x, p.y, p.x, modelY, {
                  color: "#ef4444",
                  width: 1.8,
                  dash: [4, 4],
                });
              }

              // 3. Draw data points using 2D Transform Gizmo
              for (const p of points) {
                drawDragGizmo(ctx, plot, p.x, p.y, {
                  color: "#f59e0b",
                  radius: 6,
                  isHoveredCenter: dragHandlers.isCenterHovered(p.id),
                  isDraggingCenter: dragHandlers.isCenterDragging(p.id),
                  opacity: dragHandlers.getOpacity(p.id),
                });
              }
            }}
          />
        }
        controls={
          <div className="space-y-3">
            <KdeCard title="基函数族选择 (Basis Family)" variant="dense">
              <div className="space-y-2">
                <KdeTabs
                  options={[
                    { id: "poly", label: "多项式基" },
                    { id: "fourier", label: "傅里叶基" },
                    { id: "rbf", label: "径向基 (RBF)" },
                  ]}
                  value={family}
                  onChange={(val: string) => setFamily(val as BasisFamily)}
                />

                {family === "poly" && (
                  <div className="pt-2 border-t border-[var(--kde-border)]">
                    <div className="text-[11px] text-muted-foreground mb-1 font-medium">
                      多项式最高阶数：
                    </div>
                    <KdeTabs
                      options={[1, 2, 3, 4, 5].map((deg) => ({
                        id: String(deg),
                        label: `${deg} 阶`,
                      }))}
                      value={String(polyDegree)}
                      onChange={(val: string) => setPolyDegree(Number(val))}
                      size="xs"
                    />
                  </div>
                )}
              </div>
            </KdeCard>

            <KdeCard title="实时拟合函数解析式 f(x)" variant="dense">
              <div className="space-y-1.5">
                <div className="overflow-x-auto rounded bg-surface p-2 font-mono text-xs text-primary border border-border/40">
                  {`$f(x) = ${formatFormula()}$`}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  对参数 {"$\\boldsymbol\\theta$"} 严格线性，求解无需非线性迭代
                </div>
              </div>
            </KdeCard>

            <div className="grid grid-cols-2 gap-1.5">
              <KdeReadout
                label="残差平方和 RSS"
                value={fitResult.rss.toFixed(4)}
                variant="accent"
                dense
              />
              <KdeReadout
                label="参数维度 dim(θ)"
                value={`${fitResult.theta.length} 项`}
                dense
              />
            </div>

            <KdeCard title="核心代数结论" variant="dense">
              <div className="space-y-1 text-xs text-muted-foreground leading-relaxed">
                <p>
                  虽然屏幕上的拟合曲线呈现高度弯曲的非线性形态，但由于所有基函数{" "}
                  {"$\\phi_j(x)$"} 不含未知参数，模型对权重{" "}
                  {"$\\boldsymbol\\theta$"} 构成严格的线性方程组{" "}
                  {"$A\\boldsymbol\\theta \\approx \\mathbf{b}$"}。
                </p>
                <p className="text-foreground font-medium pt-0.5">
                  💡 求解只需一次标准的正规方程或 QR
                  投影，无需任何梯度下降或局部极小陷阱！
                </p>
              </div>
            </KdeCard>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
