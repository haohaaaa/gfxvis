import { useState, useMemo } from "react";
import ExpandableDemo from "../framework/ExpandableDemo";
import CanvasViewport from "../framework/CanvasViewport";
import CanvasOverlay from "../framework/CanvasOverlay";
import PresetSelector from "../framework/PresetSelector";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import type { Bounds2 } from "../../visualizations/core/2d/plot2d";

type PresetType =
  | "ortho_21"
  | "oblique_x"
  | "oblique_diag"
  | "rank1"
  | "full"
  | "shear";

interface MatrixPreset {
  name: string;
  a11: number;
  a12: number;
  a21: number;
  a22: number;
  desc: string;
}

const PRESETS: Record<PresetType, MatrixPreset> = {
  ortho_21: {
    name: "正交投影 (2, 1)",
    a11: 0.8,
    a12: 0.4,
    a21: 0.4,
    a22: 0.2,
    desc: "正交投影到方向 (2, 1)。满足 P² = P 且 Pᵀ = P（对称），列空间等于行空间，零空间与列空间正交垂直。",
  },
  oblique_x: {
    name: "斜投影 ((1,1)→x轴)",
    a11: 1.0,
    a12: -1.0,
    a21: 0.0,
    a22: 0.0,
    desc: "沿方向 (1, 1) 斜向投影至 x 轴。满足 P² = P 但 Pᵀ ≠ P（非对称），列空间为 x 轴，零空间为直线 y = x（非垂直夹角）。",
  },
  oblique_diag: {
    name: "斜投影 (y轴→y=x)",
    a11: 1.0,
    a12: 0.0,
    a21: 1.0,
    a22: 0.0,
    desc: "沿 y 轴斜向投影至直线 y = x。满足 P² = P 但 Pᵀ ≠ P，列空间为直线 y = x，零空间为 y 轴。",
  },
  rank1: {
    name: "一般秩-1 (退化)",
    a11: 1.5,
    a12: 3.0,
    a21: 1.0,
    a22: 2.0,
    desc: "一般秩亏退化矩阵（非投影算子，P² ≠ P）。行空间与零空间垂直，列空间与左零空间垂直。",
  },
  full: {
    name: "满秩 (2×2 可逆)",
    a11: 1.5,
    a12: -0.8,
    a21: 0.6,
    a22: 1.2,
    desc: "满秩同构变换：行空间与列空间均为全空间 ℝ²，零空间与左零空间退化为原点 {0}。",
  },
  shear: {
    name: "剪切矩阵 (全秩)",
    a11: 1.0,
    a12: 1.2,
    a21: 0.0,
    a22: 1.0,
    desc: "保持 x 轴不变并沿水平方向平行剪切，可逆满秩变换。",
  },
};

const BOUNDS: Bounds2 = { xMin: -3.5, xMax: 3.5, yMin: -3.5, yMax: 3.5 };

export function FourSubspacesDemo({ height }: { height?: string }) {
  const [preset, setPreset] = useState<PresetType>("ortho_21");
  const [xVec, setXVec] = useState<{ x: number; y: number }>({
    x: 1.2,
    y: 1.0,
  });

  const activePreset = PRESETS[preset];
  const { a11, a12, a21, a22 } = activePreset;

  const detA = a11 * a22 - a12 * a21;
  const isRank1 = Math.abs(detA) < 1e-4;
  const rank = isRank1 ? 1 : 2;

  // Projection properties (P^2 == P & P^T == P)
  const sq11 = a11 * a11 + a12 * a21;
  const sq12 = a11 * a12 + a12 * a22;
  const sq21 = a21 * a11 + a22 * a21;
  const sq22 = a21 * a12 + a22 * a22;
  const isIdempotent =
    Math.abs(sq11 - a11) < 1e-3 &&
    Math.abs(sq12 - a12) < 1e-3 &&
    Math.abs(sq21 - a21) < 1e-3 &&
    Math.abs(sq22 - a22) < 1e-3;
  const isSymmetric = Math.abs(a12 - a21) < 1e-3;

  const { rowDir, nullDir, colDir, leftNullDir } = useMemo(() => {
    let rLen = Math.hypot(a11, a12);
    if (rLen < 1e-6) rLen = 1;
    const rDir = { x: a11 / rLen, y: a12 / rLen };
    const nDir = { x: -rDir.y, y: rDir.x };

    let cLen = Math.hypot(a11, a21);
    if (cLen < 1e-6) cLen = 1;
    const cDir = { x: a11 / cLen, y: a21 / cLen };
    const lnDir = { x: -cDir.y, y: cDir.x };

    return { rowDir: rDir, nullDir: nDir, colDir: cDir, leftNullDir: lnDir };
  }, [a11, a12, a21]);

  const { xRow, xNull } = useMemo(() => {
    const projRowScalar = xVec.x * rowDir.x + xVec.y * rowDir.y;
    const rPart = { x: projRowScalar * rowDir.x, y: projRowScalar * rowDir.y };
    const projNullScalar = xVec.x * nullDir.x + xVec.y * nullDir.y;
    const nPart = {
      x: projNullScalar * nullDir.x,
      y: projNullScalar * nullDir.y,
    };
    return { xRow: rPart, xNull: nPart };
  }, [xVec, rowDir, nullDir]);

  const bVec = useMemo(
    () => ({
      x: a11 * xVec.x + a12 * xVec.y,
      y: a21 * xVec.x + a22 * xVec.y,
    }),
    [a11, a12, a21, a22, xVec],
  );

  return (
    <ExpandableDemo id="four-subspaces" height={height}>
      <KdeWindowShell
        title="四大基本子空间与正交分解"
        eyebrow="Linear Algebra · Fundamental Theorem"
        mark="Row(A) ⊥ Null(A)"
        modeTag={
          isIdempotent && isSymmetric
            ? "正交投影算子"
            : isIdempotent
              ? "斜向投影算子"
              : isRank1
                ? "秩亏退化变换"
                : "满秩同构变换"
        }
        display={
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {/* Left Canvas: Input Space R^2 */}
            <CanvasViewport
              initialBounds={BOUNDS}
              className="h-[var(--demo-height,20rem)]"
              onDraw={(ctx, plot, theme, scene) => {
                scene.addAxes();

                if (isRank1) {
                  // Row space line (blue)
                  scene.addLine({
                    p1: [-rowDir.x * 10, -rowDir.y * 10],
                    p2: [rowDir.x * 10, rowDir.y * 10],
                    stroke: "#2563eb",
                    width: 2,
                    label: "行空间 Row(A)",
                  });
                  // Null space line (rose)
                  scene.addLine({
                    p1: [-nullDir.x * 10, -nullDir.y * 10],
                    p2: [nullDir.x * 10, nullDir.y * 10],
                    stroke: "#e11d48",
                    width: 2,
                    dash: [5, 4],
                    label: "零空间 Null(A)",
                  });

                  // Decomposition projection lines
                  scene.addPolyline({
                    points: [
                      [xRow.x, xRow.y],
                      [xVec.x, xVec.y],
                    ],
                    color: "#e11d48",
                    dash: [3, 3],
                    width: 1.5,
                  });
                  scene.addPolyline({
                    points: [
                      [xNull.x, xNull.y],
                      [xVec.x, xVec.y],
                    ],
                    color: "#2563eb",
                    dash: [3, 3],
                    width: 1.5,
                  });

                  // Vector components
                  scene.addVector({
                    to: [xRow.x, xRow.y],
                    color: "#2563eb",
                    width: 2.5,
                    label: "x_row",
                  });
                  scene.addVector({
                    to: [xNull.x, xNull.y],
                    color: "#e11d48",
                    width: 2.5,
                    label: "x_null",
                  });
                }

                // Vector x (interactive draggable handle)
                scene.addVector({
                  to: [xVec.x, xVec.y],
                  color: "#d97706",
                  width: 3.5,
                  label: "x",
                  draggable: true,
                  handleRadius: 6,
                  handleRing: true,
                  hitRadiusPx: 24,
                  onDrag: (tip) => setXVec({ x: tip[0], y: tip[1] }),
                });

                scene.render(ctx, plot, theme);
              }}
            >
              <CanvasOverlay position="top-left">
                <CanvasOverlay.Title>输入空间 ℝ²</CanvasOverlay.Title>
                <CanvasOverlay.Subtitle>
                  x = x_row + x_null
                </CanvasOverlay.Subtitle>
              </CanvasOverlay>
              <CanvasOverlay position="bottom-left">
                <CanvasOverlay.Item
                  color="#d97706"
                  label={`x = (${xVec.x.toFixed(1)}, ${xVec.y.toFixed(1)})`}
                />
                {isRank1 && (
                  <>
                    <CanvasOverlay.Item
                      color="#2563eb"
                      label={`x_row = (${xRow.x.toFixed(1)}, ${xRow.y.toFixed(1)})`}
                    />
                    <CanvasOverlay.Item
                      color="#e11d48"
                      label={`x_null = (${xNull.x.toFixed(1)}, ${xNull.y.toFixed(1)})`}
                    />
                  </>
                )}
              </CanvasOverlay>
            </CanvasViewport>

            {/* Right Canvas: Output Space R^2 */}
            <CanvasViewport
              initialBounds={BOUNDS}
              className="h-[var(--demo-height,20rem)]"
              onDraw={(ctx, plot, theme, scene) => {
                scene.addAxes();

                if (isRank1) {
                  // Col space line (purple)
                  scene.addLine({
                    p1: [-colDir.x * 10, -colDir.y * 10],
                    p2: [colDir.x * 10, colDir.y * 10],
                    stroke: "#9333ea",
                    width: 2,
                    label: "列空间 Col(A)",
                  });
                  // Left null space line (emerald)
                  scene.addLine({
                    p1: [-leftNullDir.x * 10, -leftNullDir.y * 10],
                    p2: [leftNullDir.x * 10, leftNullDir.y * 10],
                    stroke: "#059669",
                    width: 2,
                    dash: [5, 4],
                    label: "左零空间 Null(Aᵀ)",
                  });
                }

                // Output vector b = Ax
                scene.addVector({
                  to: [bVec.x, bVec.y],
                  color: "#9333ea",
                  width: 3.5,
                  label: `b = Ax (${bVec.x.toFixed(1)}, ${bVec.y.toFixed(1)})`,
                });

                scene.render(ctx, plot, theme);
              }}
            >
              <CanvasOverlay position="top-left">
                <CanvasOverlay.Title>输出空间 ℝ²</CanvasOverlay.Title>
                <CanvasOverlay.Subtitle>
                  b = Ax = A x_row
                </CanvasOverlay.Subtitle>
              </CanvasOverlay>
              <CanvasOverlay position="bottom-left">
                <CanvasOverlay.Item
                  color="#9333ea"
                  label={`b = (${bVec.x.toFixed(1)}, ${bVec.y.toFixed(1)})`}
                />
              </CanvasOverlay>
            </CanvasViewport>
          </div>
        }
        controls={
          <div className="space-y-3">
            <KdeCard title="预设矩阵 A" variant="dense">
              <PresetSelector
                label="预设矩阵 A:"
                options={PRESETS}
                value={preset}
                onChange={setPreset}
              />
            </KdeCard>

            <KdeCard title="矩阵代数结构与四大子空间维度" variant="dense">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 text-xs">
                  <div className="font-mono text-sm text-foreground">
                    {`$A = \\begin{pmatrix} ${a11.toFixed(1)} & ${a12.toFixed(1)} \\\\ ${a21.toFixed(1)} & ${a22.toFixed(1)} \\end{pmatrix}$`}
                  </div>
                  <div className="text-muted-foreground">
                    {`秩 $\\operatorname{rank}(A) = ${rank}$ (${isRank1 ? "秩亏退化" : "满秩可逆"})`}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    {activePreset.desc}
                  </p>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="text-blue-400 font-medium">
                    {`行空间 $\\operatorname{Row}(A)$: 维数 $r = ${rank}$`}
                  </div>
                  <div className="text-rose-400 font-medium">
                    {`零空间 $\\operatorname{Null}(A)$: 维数 $n - r = ${2 - rank}$ ${isRank1 ? "(垂直于 Row)" : ""}`}
                  </div>
                  <div className="text-purple-400 font-medium">
                    {`列空间 $\\operatorname{Col}(A)$: 维数 $r = ${rank}$`}
                  </div>
                  <div className="text-emerald-400 font-medium">
                    {`左零空间 $\\operatorname{Null}(A^\\top)$: 维数 $m - r = ${2 - rank}$ ${isRank1 ? "(垂直于 Col)" : ""}`}
                  </div>
                </div>
              </div>
            </KdeCard>

            <div className="grid grid-cols-2 gap-1.5">
              <KdeReadout
                label="输入向量 x"
                value={`(${xVec.x.toFixed(1)}, ${xVec.y.toFixed(1)})`}
                dense
              />
              <KdeReadout
                label="输出向量 b = Ax"
                value={`(${bVec.x.toFixed(1)}, ${bVec.y.toFixed(1)})`}
                variant="accent"
                dense
              />
              <div className="col-span-2">
                <KdeReadout
                  label="投影性质"
                  value={
                    isIdempotent && isSymmetric
                      ? "正交投影 (P²=P, Pᵀ=P)"
                      : isIdempotent
                        ? "斜投影 (P²=P, Pᵀ≠P)"
                        : "非投影 (P²≠P)"
                  }
                  variant={isIdempotent ? "success" : "default"}
                  dense
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {
                "提示：拖动左侧中心橙色手柄进行自由移动，观察输入空间正交分解 $x = x_{\\text{row}} + x_{\\text{null}}$ 与右侧输出向量 $b = Ax$ 的线性映射映射响应。"
              }
            </p>
          </div>
        }
      />
    </ExpandableDemo>
  );
}

export default FourSubspacesDemo;
