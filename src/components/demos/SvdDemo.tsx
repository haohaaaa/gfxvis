import { useState, useMemo, useCallback } from "react";
import ExpandableDemo from "../framework/ExpandableDemo";
import CanvasViewport from "../framework/CanvasViewport";
import CanvasOverlay from "../framework/CanvasOverlay";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs, { type KdeTabOption } from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import ParamSlider from "../framework/ParamSlider";
import PresetSelector from "../framework/PresetSelector";
import type { Bounds2 } from "../../visualizations/core/2d/plot2d";

interface MatrixPreset {
  name: string;
  a: number;
  b: number;
  c: number;
  d: number;
  desc: string;
}

const PRESETS: Record<string, MatrixPreset> = {
  general: {
    name: "一般矩阵 (拉伸+旋转)",
    a: 1.5,
    b: 0.8,
    c: 0.4,
    d: 1.2,
    desc: "将单位圆变换为倾斜椭圆，奇异值 σ₁ ≈ 1.95, σ₂ ≈ 0.76",
  },
  shear: {
    name: "剪切矩阵 (不可对角化但可 SVD)",
    a: 1.0,
    b: 1.2,
    c: 0.0,
    d: 1.0,
    desc: "代数不可对角化，但 SVD 仍能完美将其分解为正交旋转与主轴拉伸",
  },
  singular: {
    name: "奇异矩阵 (Rank 1 降维压缩)",
    a: 1.2,
    b: 0.6,
    c: 0.8,
    d: 0.4,
    desc: "列线性相关 (det=0)，σ₂=0，单位圆被完全压扁为一条 1D 直线段",
  },
  symmetric: {
    name: "对称正定矩阵 (U = V)",
    a: 1.6,
    b: 0.5,
    c: 0.5,
    d: 1.0,
    desc: "实对称矩阵的 SVD 与特征值分解重合，右奇异向量与左奇异向量同向",
  },
  rotation: {
    name: "纯旋转矩阵 (σ₁ = σ₂ = 1)",
    a: 0.6,
    b: -0.8,
    c: 0.8,
    d: 0.6,
    desc: "保持所有向量长度不变，奇异值恒等于 1，单位圆保持为标准圆",
  },
};

type StepId = "0" | "1" | "2" | "3";

const STEPS: Array<KdeTabOption<StepId>> = [
  { id: "0", label: "0. 输入单位圆 (基底 V)" },
  { id: "1", label: "1. 旋转对齐 (Vᵀ)" },
  { id: "2", label: "2. 轴向缩放 (Σ)" },
  { id: "3", label: "3. 旋转输出 (U)" },
];

interface SvdResult {
  sigma1: number;
  sigma2: number;
  v1: [number, number];
  v2: [number, number];
  u1: [number, number];
  u2: [number, number];
  thetaV: number;
  thetaU: number;
  detA: number;
  conditionNumber: number;
}

function computeSvd2x2(a: number, b: number, c: number, d: number): SvdResult {
  const detA = a * d - b * c;
  const s11 = a * a + b * b;
  const s12 = a * c + b * d;
  const s22 = c * c + d * d;

  const trace = s11 + s22;
  const detS = detA * detA;
  const disc = Math.max(0, trace * trace - 4 * detS);
  const sqrtDisc = Math.sqrt(disc);

  const lambda1 = Math.max(0, (trace + sqrtDisc) / 2);
  const lambda2 = Math.max(0, (trace - sqrtDisc) / 2);

  const sigma1 = Math.sqrt(lambda1);
  const sigma2 = Math.sqrt(lambda2);

  let thetaU = 0;
  if (Math.abs(s12) > 1e-8 || Math.abs(s11 - s22) > 1e-8) {
    thetaU = 0.5 * Math.atan2(2 * s12, s11 - s22);
  }

  const u1: [number, number] = [Math.cos(thetaU), Math.sin(thetaU)];
  const u2: [number, number] = [-Math.sin(thetaU), Math.cos(thetaU)];

  const at11 = a * a + c * c;
  const at12 = a * b + c * d;
  const at22 = b * b + d * d;

  let thetaV = 0;
  if (Math.abs(at12) > 1e-8 || Math.abs(at11 - at22) > 1e-8) {
    thetaV = 0.5 * Math.atan2(2 * at12, at11 - at22);
  }

  let v1: [number, number] = [Math.cos(thetaV), Math.sin(thetaV)];
  let v2: [number, number] = [-Math.sin(thetaV), Math.cos(thetaV)];

  const av1x = a * v1[0] + b * v1[1];
  const av1y = c * v1[0] + d * v1[1];
  const dot1 = av1x * u1[0] + av1y * u1[1];
  if (dot1 < 0) {
    v1 = [-v1[0], -v1[1]];
    thetaV += Math.PI;
  }

  const av2x = a * v2[0] + b * v2[1];
  const av2y = c * v2[0] + d * v2[1];
  const dot2 = av2x * u2[0] + av2y * u2[1];
  if (dot2 < 0) {
    v2 = [-v2[0], -v2[1]];
  }

  const conditionNumber =
    sigma2 < 1e-8 ? Number.POSITIVE_INFINITY : sigma1 / sigma2;

  return {
    sigma1,
    sigma2,
    v1,
    v2,
    u1,
    u2,
    thetaV,
    thetaU,
    detA,
    conditionNumber,
  };
}

export default function SvdDemo({ height }: { height?: string }) {
  const [matrix, setMatrix] = useState({ a: 1.5, b: 0.8, c: 0.4, d: 1.2 });
  const [presetKey, setPresetKey] = useState<string>("general");
  const [stageProgress, setStageProgress] = useState<number>(3);
  const [probeAngle, setProbeAngle] = useState<number>(0.6);

  const svd = useMemo(
    () => computeSvd2x2(matrix.a, matrix.b, matrix.c, matrix.d),
    [matrix],
  );

  const handlePreset = (key: string) => {
    setPresetKey(key);
    const p = PRESETS[key];
    if (p) {
      setMatrix({ a: p.a, b: p.b, c: p.c, d: p.d });
    }
  };

  const handleStepSelect = (stepId: StepId) => {
    setStageProgress(Number.parseInt(stepId, 10));
  };

  const currentStepId: StepId = (
    stageProgress < 0.5
      ? "0"
      : stageProgress < 1.5
        ? "1"
        : stageProgress < 2.5
          ? "2"
          : "3"
  ) as StepId;

  const initialBounds: Bounds2 = useMemo(() => {
    const maxVal = Math.max(2.6, svd.sigma1 * 1.3);
    return { xMin: -maxVal, xMax: maxVal, yMin: -maxVal, yMax: maxVal };
  }, [svd.sigma1]);

  const getTransform = useCallback(
    (t: number): ((x: number, y: number) => [number, number]) => {
      const { thetaV, thetaU, sigma1, sigma2 } = svd;
      return (x: number, y: number): [number, number] => {
        let curX = x;
        let curY = y;

        // Stage 1: V^T (rotate by -thetaV)
        const t1 = Math.max(0, Math.min(1, t));
        if (t1 > 0) {
          const angle1 = -thetaV * t1;
          const cos1 = Math.cos(angle1);
          const sin1 = Math.sin(angle1);
          const nx = cos1 * curX - sin1 * curY;
          const ny = sin1 * curX + cos1 * curY;
          curX = nx;
          curY = ny;
        }

        // Stage 2: Sigma (stretch x by sigma1, y by sigma2)
        const t2 = Math.max(0, Math.min(1, t - 1));
        if (t2 > 0) {
          const s1 = 1 + (sigma1 - 1) * t2;
          const s2 = 1 + (sigma2 - 1) * t2;
          curX *= s1;
          curY *= s2;
        }

        // Stage 3: U (rotate by thetaU)
        const t3 = Math.max(0, Math.min(1, t - 2));
        if (t3 > 0) {
          const angle3 = thetaU * t3;
          const cos3 = Math.cos(angle3);
          const sin3 = Math.sin(angle3);
          const nx = cos3 * curX - sin3 * curY;
          const ny = sin3 * curX + cos3 * curY;
          curX = nx;
          curY = ny;
        }

        return [curX, curY];
      };
    },
    [svd],
  );

  const transform = useMemo(
    () => getTransform(stageProgress),
    [getTransform, stageProgress],
  );

  const isSingular = svd.sigma2 < 1e-4;

  return (
    <ExpandableDemo id="svd-demo" height={height}>
      <KdeWindowShell
        title="奇异值分解几何：A = U Σ Vᵀ 三步几何图景"
        eyebrow="Linear Algebra · Singular Value Decomposition"
        mark="A = U Σ Vᵀ"
        modeTag={
          isSingular
            ? "奇异降维 (Rank 1)"
            : `满秩可逆 (κ = ${svd.conditionNumber < 100 ? svd.conditionNumber.toFixed(2) : "∞"})`
        }
        display={
          <CanvasViewport
            initialBounds={initialBounds}
            className="h-[var(--demo-height,22rem)]"
            onReset={() => setStageProgress(3)}
            onDraw={(ctx, plot, theme, scene) => {
              scene.addAxes();

              // 1. Original Unit Circle (Dashed Guide)
              const unitCirclePts: Array<[number, number]> = [];
              for (let a = 0; a <= 64; a++) {
                const th = (a / 64) * Math.PI * 2;
                unitCirclePts.push([Math.cos(th), Math.sin(th)]);
              }
              scene.addPolyline({
                points: unitCirclePts,
                color: "rgba(148, 163, 184, 0.4)",
                dash: [4, 4],
                width: 1.2,
              });

              // 2. Transformed Circle/Ellipse
              const transformedPts: Array<[number, number]> = [];
              for (let a = 0; a <= 80; a++) {
                const th = (a / 80) * Math.PI * 2;
                const [tx, ty] = transform(Math.cos(th), Math.sin(th));
                transformedPts.push([tx, ty]);
              }
              scene.addPolyline({
                points: transformedPts,
                color: "#3b82f6",
                fillColor: "rgba(59, 130, 246, 0.08)",
                closed: true,
                width: 2.5,
              });

              // 3. Transformed Basis Vectors (v1 & v2 through the stages)
              const [v1Tx, v1Ty] = transform(svd.v1[0], svd.v1[1]);
              const [v2Tx, v2Ty] = transform(svd.v2[0], svd.v2[1]);

              scene.addVector({
                to: [v1Tx, v1Ty],
                color: "#ef4444",
                width: 3.0,
                label:
                  stageProgress >= 2.5
                    ? `σ₁ u₁ (${(svd.sigma1 * svd.u1[0]).toFixed(2)}, ${(svd.sigma1 * svd.u1[1]).toFixed(2)})`
                    : `v₁ 像`,
              });

              scene.addVector({
                to: [v2Tx, v2Ty],
                color: "#10b981",
                width: 3.0,
                label:
                  stageProgress >= 2.5
                    ? `σ₂ u₂ (${(svd.sigma2 * svd.u2[0]).toFixed(2)}, ${(svd.sigma2 * svd.u2[1]).toFixed(2)})`
                    : `v₂ 像`,
              });

              // 4. Interactive Test Vector x
              const px = Math.cos(probeAngle);
              const py = Math.sin(probeAngle);
              const [axX, axY] = transform(px, py);

              scene.addVector({
                to: [axX, axY],
                color: "#f59e0b",
                width: 2.5,
                label: "A x",
              });

              scene.addVector({
                to: [px, py],
                color: "rgba(245, 158, 11, 0.5)",
                width: 1.5,
                dashed: true,
                draggable: true,
                handleRadius: 6,
                handleRing: true,
                hitRadiusPx: 24,
                label: "原向量 x",
                onDrag: (tip) => {
                  const ang = Math.atan2(tip[1], tip[0]);
                  setProbeAngle(ang < 0 ? ang + Math.PI * 2 : ang);
                },
              });

              scene.render(ctx, plot, theme);
            }}
          >
            <CanvasOverlay position="top-left">
              <CanvasOverlay.Title>A = U Σ Vᵀ 分解流水线</CanvasOverlay.Title>
              <CanvasOverlay.Subtitle>
                {stageProgress < 0.5
                  ? "0. 输入空间：标准单位圆与正交基底 V"
                  : stageProgress < 1.5
                    ? "1. 右奇异正交矩阵 Vᵀ：消除倾角，与坐标轴对齐"
                    : stageProgress < 2.5
                      ? "2. 奇异值对角矩阵 Σ：沿坐标主轴独立缩放 σ₁, σ₂"
                      : "3. 左奇异正交矩阵 U：旋转至最终目标椭圆姿态"}
              </CanvasOverlay.Subtitle>
            </CanvasOverlay>

            <CanvasOverlay position="bottom-left">
              <CanvasOverlay.Item
                color="#ef4444"
                label={`σ₁ = ${svd.sigma1.toFixed(2)} (长半轴)`}
              />
              <CanvasOverlay.Item
                color="#10b981"
                label={`σ₂ = ${svd.sigma2.toFixed(2)} (短半轴)`}
              />
            </CanvasOverlay>
          </CanvasViewport>
        }
        controls={
          <div className="space-y-3">
            <KdeTabs
              options={STEPS}
              value={currentStepId}
              onChange={handleStepSelect}
            />

            <KdeCard title="预设矩阵 A" variant="dense">
              <PresetSelector
                label="典型几何变换:"
                options={PRESETS}
                value={presetKey}
                onChange={handlePreset}
              />
            </KdeCard>

            <KdeCard title="三阶段几何插值连续进度" variant="dense">
              <ParamSlider
                label="时间轴进度 $t$"
                labelMode="adaptive"
                widthClass="w-full"
                value={stageProgress}
                min={0}
                max={3}
                step={0.02}
                onChange={setStageProgress}
                display={
                  stageProgress <= 0.05
                    ? "0.00 (原单位圆)"
                    : stageProgress < 1.0
                      ? `t = ${stageProgress.toFixed(2)} (旋转 Vᵀ)`
                      : stageProgress < 2.0
                        ? `t = ${stageProgress.toFixed(2)} (主轴缩放 Σ)`
                        : `t = ${stageProgress.toFixed(2)} (最终旋转 U)`
                }
              />
            </KdeCard>

            <div className="grid grid-cols-2 gap-1.5">
              <KdeReadout
                label="奇异值 σ₁ (长轴)"
                value={svd.sigma1.toFixed(2)}
                dense
              />
              <KdeReadout
                label="奇异值 σ₂ (短轴)"
                value={svd.sigma2.toFixed(2)}
                variant={isSingular ? "danger" : "default"}
                dense
              />
              <KdeReadout
                label="行列式 det(A) = σ₁ σ₂"
                value={svd.detA.toFixed(2)}
                dense
              />
              <KdeReadout
                label="条件数 κ(A) = σ₁ / σ₂"
                value={
                  isSingular ? "∞ (奇异降维)" : svd.conditionNumber.toFixed(2)
                }
                variant={
                  isSingular || svd.conditionNumber > 20 ? "danger" : "success"
                }
                dense
              />
            </div>

            <KdeCard title="矩阵系数微调" variant="dense">
              <div className="grid grid-cols-2 gap-2">
                <ParamSlider
                  label="$a$"
                  widthClass="w-full"
                  value={matrix.a}
                  min={-2.5}
                  max={2.5}
                  step={0.1}
                  onChange={(v) => {
                    setMatrix((m) => ({ ...m, a: v }));
                    setPresetKey("custom");
                  }}
                />
                <ParamSlider
                  label="$b$"
                  widthClass="w-full"
                  value={matrix.b}
                  min={-2.5}
                  max={2.5}
                  step={0.1}
                  onChange={(v) => {
                    setMatrix((m) => ({ ...m, b: v }));
                    setPresetKey("custom");
                  }}
                />
                <ParamSlider
                  label="$c$"
                  widthClass="w-full"
                  value={matrix.c}
                  min={-2.5}
                  max={2.5}
                  step={0.1}
                  onChange={(v) => {
                    setMatrix((m) => ({ ...m, c: v }));
                    setPresetKey("custom");
                  }}
                />
                <ParamSlider
                  label="$d$"
                  widthClass="w-full"
                  value={matrix.d}
                  min={-2.5}
                  max={2.5}
                  step={0.1}
                  onChange={(v) => {
                    setMatrix((m) => ({ ...m, d: v }));
                    setPresetKey("custom");
                  }}
                />
              </div>
            </KdeCard>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
