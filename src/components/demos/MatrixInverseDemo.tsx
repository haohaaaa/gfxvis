import { useState, useMemo } from "react";
import ExpandableDemo from "../framework/ExpandableDemo";
import CanvasViewport from "../framework/CanvasViewport";
import CanvasOverlay from "../framework/CanvasOverlay";
import PresetSelector from "../framework/PresetSelector";
import ParamSlider from "../framework/ParamSlider";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeTabs, { type KdeTabOption } from "../framework/KdeTabs";
import KdeTabPanel, { KdeTabContext } from "../framework/KdeTabPanel";
import { type Bounds2 } from "../../visualizations/core/2d/plot2d";

type DemoMode = "transform" | "normal";
type PresetKey = "rot45" | "shear" | "scale" | "singular";

const DEMO_MODES: Array<KdeTabOption<DemoMode>> = [
  { id: "transform", label: "2D 空间变换与 A⁻¹ 撤销还原" },
  { id: "normal", label: "图形学法线变换：直接 M vs 逆转置 (M⁻¹)ᵀ" },
];

const BOUNDS_2D: Bounds2 = { xMin: -3.5, xMax: 3.5, yMin: -3.5, yMax: 3.5 };

interface TransformPreset {
  name: string;
  matrix: [[number, number], [number, number]];
  desc: string;
}

const PRESETS: Record<PresetKey, TransformPreset> = {
  rot45: {
    name: "45° 旋转 (正交矩阵)",
    matrix: [
      [Math.SQRT1_2, -Math.SQRT1_2],
      [Math.SQRT1_2, Math.SQRT1_2],
    ],
    desc: "刚体旋转变换，行列式 det(A) = 1.00，逆矩阵 A⁻¹ = Aᵀ（旋转 -45° 直接还原）。",
  },
  shear: {
    name: "水平剪切 (Shear)",
    matrix: [
      [1.0, 1.2],
      [0.0, 1.0],
    ],
    desc: "保面积的仿射剪切，行列式 det(A) = 1.00，逆矩阵向相反方向剪切即可复原。",
  },
  scale: {
    name: "非均匀缩放 (Stretch)",
    matrix: [
      [1.5, 0.0],
      [0.0, 0.8],
    ],
    desc: "沿坐标轴不同比例拉伸，det(A) = 1.20，逆矩阵对角元素取倒数 [1/1.5, 1/0.8] 还原。",
  },
  singular: {
    name: "奇异矩阵 (不可逆降维)",
    matrix: [
      [1.2, 0.6],
      [0.8, 0.4],
    ],
    desc: "两列完全线性相关，整个二维平面被压扁到一条直线上，det(A) = 0，零空间丢失无法求逆！",
  },
};

function fmt(v: number): string {
  const s = v.toFixed(2);
  return s === "-0.00" ? "0.00" : s;
}

export default function MatrixInverseDemo({ height }: { height?: string }) {
  const [demoMode, setDemoMode] = useState<DemoMode>("transform");

  // ---------------- Sub-view 1: 2D Transform & Inverse ----------------
  const [presetKey, setPresetKey] = useState<PresetKey>("rot45");
  const [progress, setProgress] = useState<number>(1.0);
  const [vVec, setVVec] = useState<{ x: number; y: number }>({
    x: 1.5,
    y: 1.0,
  });

  const activePreset = PRESETS[presetKey];
  const A = activePreset.matrix;
  const detA = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const isSingular = Math.abs(detA) < 1e-5;

  const invA = useMemo(
    () =>
      isSingular
        ? null
        : [
            [A[1][1] / detA, -A[0][1] / detA],
            [-A[1][0] / detA, A[0][0] / detA],
          ],
    [A, detA, isSingular],
  );

  const curM: [[number, number], [number, number]] = useMemo(() => {
    if (progress <= 1.0) {
      const t = progress;
      return [
        [1 + t * (A[0][0] - 1), t * A[0][1]],
        [t * A[1][0], 1 + t * (A[1][1] - 1)],
      ];
    }
    const t = progress - 1.0;
    if (isSingular || !invA) {
      return A;
    }
    return [
      [A[0][0] + t * (1 - A[0][0]), A[0][1] + t * (0 - A[0][1])],
      [A[1][0] + t * (0 - A[1][0]), A[1][1] + t * (1 - A[1][1])],
    ];
  }, [A, invA, isSingular, progress]);

  const curV = useMemo(
    () => ({
      x: curM[0][0] * vVec.x + curM[0][1] * vVec.y,
      y: curM[1][0] * vVec.x + curM[1][1] * vVec.y,
    }),
    [curM, vVec],
  );

  // ---------------- Sub-view 2: Normal Matrix Transformation ----------------
  const [scaleX, setScaleX] = useState<number>(2.0);
  const [scaleY, setScaleY] = useState<number>(0.8);
  const [angleDeg, setAngleDeg] = useState<number>(45);

  const rad = (angleDeg * Math.PI) / 180;
  const p0 = { x: Math.cos(rad), y: Math.sin(rad) };
  const t0 = { x: -Math.sin(rad), y: Math.cos(rad) };
  const n0 = { x: Math.cos(rad), y: Math.sin(rad) };

  const pPrime = useMemo(
    () => ({ x: scaleX * p0.x, y: scaleY * p0.y }),
    [scaleX, scaleY, p0.x, p0.y],
  );

  const tNorm = useMemo(() => {
    const tP = { x: scaleX * t0.x, y: scaleY * t0.y };
    const len = Math.hypot(tP.x, tP.y) || 1;
    return { x: tP.x / len, y: tP.y / len };
  }, [scaleX, scaleY, t0.x, t0.y]);

  const { nNaiveNorm, dotNaive } = useMemo(() => {
    const nN = { x: scaleX * n0.x, y: scaleY * n0.y };
    const len = Math.hypot(nN.x, nN.y) || 1;
    const norm = { x: nN.x / len, y: nN.y / len };
    return {
      nNaiveNorm: norm,
      dotNaive: tNorm.x * norm.x + tNorm.y * norm.y,
    };
  }, [scaleX, scaleY, n0.x, n0.y, tNorm]);

  const { nCorrectNorm, dotCorrect } = useMemo(() => {
    const nC = { x: (1 / scaleX) * n0.x, y: (1 / scaleY) * n0.y };
    const len = Math.hypot(nC.x, nC.y) || 1;
    const norm = { x: nC.x / len, y: nC.y / len };
    return {
      nCorrectNorm: norm,
      dotCorrect: tNorm.x * norm.x + tNorm.y * norm.y,
    };
  }, [scaleX, scaleY, n0.x, n0.y, tNorm]);

  const isTransformMode = demoMode === "transform";

  return (
    <ExpandableDemo id="matrix-inverse" height={height}>
      <KdeWindowShell
        title={
          isTransformMode
            ? "2D 空间变换与 A⁻¹ 撤销还原"
            : "图形学法线变换：直接 M vs 逆转置 (M⁻¹)ᵀ"
        }
        eyebrow={
          isTransformMode
            ? "Linear Algebra · Matrix Inverse"
            : "Computer Graphics · Normal Matrix"
        }
        mark={isTransformMode ? "A⁻¹ A = I" : "(M⁻¹)ᵀ"}
        modeTag={
          isTransformMode
            ? isSingular
              ? "奇异不可逆矩阵 (det=0)"
              : "满秩可逆同构变换"
            : "法向量与切平面几何对偶"
        }
        display={
          <KdeTabContext.Provider value={{ activeTab: demoMode }}>
            <div className="relative">
              {/* 1. Transform Viewport */}
              <KdeTabPanel id="transform">
                <CanvasViewport
                  initialBounds={BOUNDS_2D}
                  className="h-[var(--demo-height,22rem)]"
                  onReset={() => setProgress(1.0)}
                  onDraw={(ctx, plot, theme, scene) => {
                    scene.addAxes();

                    // Deformed Grid under curM
                    ctx.save();
                    ctx.strokeStyle = isSingular
                      ? "rgba(239, 68, 68, 0.35)"
                      : "rgba(59, 130, 246, 0.3)";
                    ctx.lineWidth = 1.2;
                    for (let i = -3; i <= 3; i++) {
                      const p1x = plot.toScreenX(
                        curM[0][0] * i + curM[0][1] * -3.5,
                      );
                      const p1y = plot.toScreenY(
                        curM[1][0] * i + curM[1][1] * -3.5,
                      );
                      const p2x = plot.toScreenX(
                        curM[0][0] * i + curM[0][1] * 3.5,
                      );
                      const p2y = plot.toScreenY(
                        curM[1][0] * i + curM[1][1] * 3.5,
                      );
                      ctx.beginPath();
                      ctx.moveTo(p1x, p1y);
                      ctx.lineTo(p2x, p2y);
                      ctx.stroke();

                      const q1x = plot.toScreenX(
                        curM[0][0] * -3.5 + curM[0][1] * i,
                      );
                      const q1y = plot.toScreenY(
                        curM[1][0] * -3.5 + curM[1][1] * i,
                      );
                      const q2x = plot.toScreenX(
                        curM[0][0] * 3.5 + curM[0][1] * i,
                      );
                      const q2y = plot.toScreenY(
                        curM[1][0] * 3.5 + curM[1][1] * i,
                      );
                      ctx.beginPath();
                      ctx.moveTo(q1x, q1y);
                      ctx.lineTo(q2x, q2y);
                      ctx.stroke();
                    }
                    ctx.restore();

                    // Basis vectors
                    scene.addVector({
                      to: [curM[0][0], curM[1][0]],
                      color: "#ef4444",
                      width: 2.5,
                      label: "col₁",
                    });
                    scene.addVector({
                      to: [curM[0][1], curM[1][1]],
                      color: "#10b981",
                      width: 2.5,
                      label: "col₂",
                    });

                    // Original unmapped vector dashed line
                    scene.addVector({
                      to: [vVec.x, vVec.y],
                      color: "rgba(156, 163, 175, 0.6)",
                      width: 1.5,
                      dashed: true,
                      label: "原向量 v",
                    });

                    // Transformed Vector curV (Draggable handle)
                    scene.addVector({
                      to: [curV.x, curV.y],
                      color: "#f59e0b",
                      width: 3.5,
                      label: `v' (${curV.x.toFixed(2)}, ${curV.y.toFixed(2)})`,
                      draggable: true,
                      handleRadius: 6,
                      handleRing: true,
                      hitRadiusPx: 24,
                      onDrag: (tip) => {
                        // Invert current map to update original vVec
                        const detM =
                          curM[0][0] * curM[1][1] - curM[0][1] * curM[1][0];
                        if (Math.abs(detM) > 1e-4) {
                          const wx =
                            (curM[1][1] * tip[0] - curM[0][1] * tip[1]) / detM;
                          const wy =
                            (-curM[1][0] * tip[0] + curM[0][0] * tip[1]) / detM;
                          setVVec({
                            x: Math.max(-3, Math.min(3, wx)),
                            y: Math.max(-3, Math.min(3, wy)),
                          });
                        }
                      },
                    });

                    scene.render(ctx, plot, theme);
                  }}
                >
                  <CanvasOverlay position="top-left">
                    <CanvasOverlay.Title>
                      2D 空间变换与 A⁻¹ 撤销
                    </CanvasOverlay.Title>
                    <CanvasOverlay.Subtitle>
                      {isSingular ? "奇异降维 (det=0)" : "可逆同构变换"}
                    </CanvasOverlay.Subtitle>
                  </CanvasOverlay>
                  <CanvasOverlay position="bottom-left">
                    <CanvasOverlay.Item
                      color="#f59e0b"
                      label={`v' = (${fmt(curV.x)}, ${fmt(curV.y)})`}
                    />
                    <CanvasOverlay.Item
                      color="#3b82f6"
                      label={`det(A) = ${fmt(detA)}`}
                    />
                  </CanvasOverlay>
                </CanvasViewport>
              </KdeTabPanel>

              {/* 2. Normal Matrix Viewport */}
              <KdeTabPanel id="normal">
                <CanvasViewport
                  initialBounds={BOUNDS_2D}
                  className="h-[var(--demo-height,22rem)]"
                  onDraw={(ctx, plot, theme, scene) => {
                    scene.addAxes();

                    // Transformed Ellipse Curve
                    const ellipsePts: Array<[number, number]> = [];
                    for (let i = 0; i <= 80; i++) {
                      const theta = (i / 80) * Math.PI * 2;
                      ellipsePts.push([
                        scaleX * Math.cos(theta),
                        scaleY * Math.sin(theta),
                      ]);
                    }
                    scene.addPolyline({
                      points: ellipsePts,
                      color: "#3b82f6",
                      width: 2.5,
                    });

                    // Tangent vector T' (Blue)
                    scene.addVector({
                      from: [pPrime.x, pPrime.y],
                      to: [pPrime.x + 1.2 * tNorm.x, pPrime.y + 1.2 * tNorm.y],
                      color: "#3b82f6",
                      width: 3.0,
                      label: "切线 t' = M t",
                    });

                    // Naive Normal vector N_naive' (Red dashed - Incorrect!)
                    scene.addVector({
                      from: [pPrime.x, pPrime.y],
                      to: [
                        pPrime.x + 1.2 * nNaiveNorm.x,
                        pPrime.y + 1.2 * nNaiveNorm.y,
                      ],
                      color: "#ef4444",
                      width: 2.5,
                      dashed: true,
                      label: "直接变换 M n (失真)",
                    });

                    // Correct Normal vector N_correct' (Green - Correct!)
                    scene.addVector({
                      from: [pPrime.x, pPrime.y],
                      to: [
                        pPrime.x + 1.2 * nCorrectNorm.x,
                        pPrime.y + 1.2 * nCorrectNorm.y,
                      ],
                      color: "#10b981",
                      width: 3.0,
                      label: "正确法线 (M⁻¹)ᵀ n",
                    });

                    // Anchor point
                    scene.addPoint({
                      at: [pPrime.x, pPrime.y],
                      color: "#3b82f6",
                      radius: 5,
                    });

                    scene.render(ctx, plot, theme);
                  }}
                >
                  <CanvasOverlay position="top-left">
                    <CanvasOverlay.Title>
                      法线变换：(M⁻¹)ᵀ vs M
                    </CanvasOverlay.Title>
                    <CanvasOverlay.Subtitle>
                      非等比缩放下切线与法线正交性
                    </CanvasOverlay.Subtitle>
                  </CanvasOverlay>
                  <CanvasOverlay position="bottom-left">
                    <CanvasOverlay.Item
                      color="#10b981"
                      label={`正确法线正交积: ${dotCorrect.toFixed(3)} (垂直)`}
                    />
                    <CanvasOverlay.Item
                      color="#ef4444"
                      label={`直接变换正交积: ${dotNaive.toFixed(3)} (偏斜)`}
                    />
                  </CanvasOverlay>
                </CanvasViewport>
              </KdeTabPanel>
            </div>
          </KdeTabContext.Provider>
        }
        controls={
          <div className="space-y-3">
            <KdeTabs
              options={DEMO_MODES}
              value={demoMode}
              onChange={(v) => setDemoMode(v as DemoMode)}
            />

            <KdeTabContext.Provider value={{ activeTab: demoMode }}>
              <KdeTabPanel id="transform">
                <div className="space-y-3">
                  <KdeCard title="预设矩阵 A" variant="dense">
                    <PresetSelector
                      label="预设矩阵 A:"
                      options={PRESETS}
                      value={presetKey}
                      onChange={setPresetKey}
                    />
                  </KdeCard>

                  <KdeCard
                    title="变换时间轴进度 (0 初始 → 1 正变换 A → 2 逆变换 A⁻¹ 还原)"
                    variant="dense"
                  >
                    <ParamSlider
                      label="时间轴进度 $t$"
                      labelMode="adaptive"
                      widthClass="w-full"
                      value={progress}
                      min={0.0}
                      max={2.0}
                      step={0.05}
                      onChange={setProgress}
                      display={
                        progress <= 0.05
                          ? "0.00 (初始 I)"
                          : progress >= 0.95 && progress <= 1.05
                            ? "1.00 (正变换 A)"
                            : progress >= 1.95
                              ? "2.00 (逆还原 A⁻¹)"
                              : progress < 1.0
                                ? `t = ${progress.toFixed(2)} (I → A)`
                                : `t = ${progress.toFixed(2)} (A → A⁻¹ 还原)`
                      }
                    />
                  </KdeCard>

                  <KdeCard title="矩阵数值与代数验证" variant="dense">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          正变换 A：
                        </span>
                        <span className="font-mono">
                          {`[${fmt(A[0][0])} ${fmt(A[0][1])}; ${fmt(A[1][0])} ${fmt(A[1][1])}]`}
                        </span>
                        <span className="font-mono text-muted-foreground">
                          det(A) = {fmt(detA)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          逆变换 A⁻¹：
                        </span>
                        {isSingular ? (
                          <span className="font-semibold text-rose-400">
                            不存在（奇异降维）
                          </span>
                        ) : (
                          <span className="font-mono text-primary">
                            {`[${fmt(invA![0][0])} ${fmt(invA![0][1])}; ${fmt(invA![1][0])} ${fmt(invA![1][1])}]`}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground pt-1 border-t border-[var(--kde-border,#bec5cc)]/60">
                        {activePreset.desc}
                      </p>
                    </div>
                  </KdeCard>

                  <div className="grid grid-cols-2 gap-1.5">
                    <KdeReadout
                      label="原始向量 v"
                      value={`(${fmt(vVec.x)}, ${fmt(vVec.y)})`}
                      dense
                    />
                    <KdeReadout
                      label="映射位置 v'"
                      value={`(${fmt(curV.x)}, ${fmt(curV.y)})`}
                      variant="accent"
                      dense
                    />
                    <KdeReadout label="行列式 det(A)" value={fmt(detA)} dense />
                    <KdeReadout
                      label="可逆状态"
                      value={isSingular ? "奇异 (不可逆)" : "满秩 (可逆同构)"}
                      variant={isSingular ? "danger" : "success"}
                      dense
                    />
                  </div>
                </div>
              </KdeTabPanel>

              <KdeTabPanel id="normal">
                <div className="space-y-3">
                  <KdeCard title="非等比缩放矩阵参数" variant="dense">
                    <div className="space-y-2">
                      <ParamSlider
                        label="X 轴缩放比例 $s_x$"
                        labelMode="adaptive"
                        widthClass="w-full"
                        value={scaleX}
                        min={0.5}
                        max={3.0}
                        step={0.1}
                        onChange={setScaleX}
                      />
                      <ParamSlider
                        label="Y 轴缩放比例 $s_y$"
                        labelMode="adaptive"
                        widthClass="w-full"
                        value={scaleY}
                        min={0.5}
                        max={3.0}
                        step={0.1}
                        onChange={setScaleY}
                      />
                      <ParamSlider
                        label="曲面采样角度 $\\theta$"
                        labelMode="adaptive"
                        widthClass="w-full"
                        value={angleDeg}
                        min={0}
                        max={360}
                        step={5}
                        onChange={setAngleDeg}
                      />
                    </div>
                  </KdeCard>

                  <KdeCard title="法向量正交性对偶验证" variant="dense">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          直接变换内积 $t' \\cdot (Mn)$：
                        </span>
                        <span className="font-mono text-rose-400 font-semibold">
                          {dotNaive.toFixed(3)} (非 0，正交性被破坏)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          逆转置变换内积 $t' \\cdot ((M^{-1})^\\top n)$：
                        </span>
                        <span className="font-mono text-emerald-400 font-semibold">
                          {dotCorrect.toFixed(3)} (严格为 0，保持垂直)
                        </span>
                      </div>
                    </div>
                  </KdeCard>

                  <div className="grid grid-cols-2 gap-1.5">
                    <KdeReadout
                      label="变换矩阵 M"
                      value={`diag(${scaleX.toFixed(1)}, ${scaleY.toFixed(1)})`}
                      dense
                    />
                    <KdeReadout
                      label="法线矩阵 (M⁻¹)ᵀ"
                      value={`diag(${(1 / scaleX).toFixed(2)}, ${(1 / scaleY).toFixed(2)})`}
                      variant="accent"
                      dense
                    />
                  </div>
                </div>
              </KdeTabPanel>
            </KdeTabContext.Provider>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
