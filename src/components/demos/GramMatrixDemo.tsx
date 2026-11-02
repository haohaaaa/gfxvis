import { useState } from "react";
import CanvasViewport from "../framework/CanvasViewport";
import CanvasOverlay from "../framework/CanvasOverlay";
import ExpandableDemo from "../framework/ExpandableDemo";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeWindowShell from "../framework/KdeWindowShell";
import PresetSelector from "../framework/PresetSelector";
import type { Bounds2 } from "../../visualizations/core/2d/plot2d";

const INITIAL_BOUNDS: Bounds2 = {
  xMin: -3.5,
  xMax: 3.5,
  yMin: -3.5,
  yMax: 3.5,
};

const PRESETS = [
  { id: "ortho", label: "正交 (90°)" },
  { id: "collinear", label: "共线 (退化 0°)" },
  { id: "general", label: "一般独立" },
];

export default function GramMatrixDemo({ height }: { height?: string }) {
  const [u, setU] = useState<{ x: number; y: number }>({ x: 2.2, y: 0.8 });
  const [v, setV] = useState<{ x: number; y: number }>({ x: 0.6, y: 2.2 });
  const [presetKey, setPresetKey] = useState("general");

  const handlePreset = (key: string) => {
    setPresetKey(key);
    if (key === "ortho") {
      setU({ x: 2.5, y: 0.0 });
      setV({ x: 0.0, y: 2.0 });
    } else if (key === "collinear") {
      setU({ x: 2.0, y: 1.5 });
      setV({ x: -1.2, y: -0.9 });
    } else {
      setU({ x: 2.2, y: 0.8 });
      setV({ x: 0.6, y: 2.2 });
    }
  };

  const g11 = u.x * u.x + u.y * u.y;
  const g12 = u.x * v.x + u.y * v.y;
  const g22 = v.x * v.x + v.y * v.y;
  const detG = Math.max(0, g11 * g22 - g12 * g12);
  const area = Math.sqrt(detG);
  const isDegenerate = detG < 1e-4;

  return (
    <ExpandableDemo id="gram-matrix" height={height}>
      <KdeWindowShell
        title="Gram 矩阵与几何测度工作台"
        eyebrow="BREEZE WORKSPACE · GRAM MATRIX"
        mark="G"
        modeTag="GRAM"
        testId="gram-matrix-demo"
        display={
          <CanvasViewport
            initialBounds={INITIAL_BOUNDS}
            className="h-[var(--demo-height,20rem)]"
            onReset={() => handlePreset("general")}
            onDraw={(ctx, plot, theme, scene) => {
              scene.addAxes();

              // 1. Draw Parallelogram
              scene.addPolyline({
                points: [
                  [0, 0],
                  [u.x, u.y],
                  [u.x + v.x, u.y + v.y],
                  [v.x, v.y],
                ],
                closed: true,
                fillColor: "rgba(59, 130, 246, 0.12)",
                color: "rgba(59, 130, 246, 0.4)",
                width: 1.5,
                dash: [4, 4],
              });

              // 2. Vector u (Draggable)
              scene.addVector({
                to: [u.x, u.y],
                color: "#2563eb",
                width: 3.0,
                label: "u",
                draggable: true,
                handleRadius: 6,
                handleRing: true,
                hitRadiusPx: 24,
                onDrag: (tip) => setU({ x: tip[0], y: tip[1] }),
              });

              // 3. Vector v (Draggable)
              scene.addVector({
                to: [v.x, v.y],
                color: "#10b981",
                width: 3.0,
                label: "v",
                draggable: true,
                handleRadius: 6,
                handleRing: true,
                hitRadiusPx: 24,
                onDrag: (tip) => setV({ x: tip[0], y: tip[1] }),
              });

              scene.render(ctx, plot, theme);
            }}
          >
            <CanvasOverlay position="top-left">
              <CanvasOverlay.Title>Gram 矩阵 G = Aᵀ A</CanvasOverlay.Title>
              <CanvasOverlay.Subtitle>
                {isDegenerate
                  ? "退化共线 (面积为 0)"
                  : `平行四边形面积 S = √det(G) = ${area.toFixed(2)}`}
              </CanvasOverlay.Subtitle>
            </CanvasOverlay>

            <CanvasOverlay position="bottom-left">
              <CanvasOverlay.Item
                color="#2563eb"
                label={`‖u‖ = ${Math.hypot(u.x, u.y).toFixed(2)}`}
              />
              <CanvasOverlay.Item
                color="#10b981"
                label={`‖v‖ = ${Math.hypot(v.x, v.y).toFixed(2)}`}
              />
              <CanvasOverlay.Item
                color="#f59e0b"
                label={`⟨u, v⟩ = ${g12.toFixed(2)}`}
              />
            </CanvasOverlay>
          </CanvasViewport>
        }
        controls={
          <div className="space-y-3">
            <KdeCard title="场景预设" variant="dense">
              <PresetSelector
                options={PRESETS}
                value={presetKey}
                onChange={handlePreset}
                size="xs"
              />
            </KdeCard>

            <KdeCard title="Gram 矩阵与几何测度" variant="dense">
              <div className="space-y-2">
                <KdeReadout
                  label="Gram 矩阵 G = AᵀA"
                  value={`g₁₁ = ${g11.toFixed(3)}, g₂₂ = ${g22.toFixed(3)}`}
                  subValue={`g₁₂ = g₂₁ = ⟨u, v⟩ = ${g12.toFixed(3)}`}
                  variant="accent"
                  dense
                />
                <KdeReadout
                  label="Gram 行列式 det(G)"
                  value={detG.toFixed(3)}
                  variant={isDegenerate ? "danger" : "default"}
                  dense
                />
                <KdeReadout
                  label="平行四边形面积 S = √det(G)"
                  value={area.toFixed(3)}
                  variant="success"
                  dense
                />
                {isDegenerate && (
                  <p className="text-xs text-[var(--kde-error,#da4453)] font-medium leading-relaxed">
                    ⚠️ 向量线性相关：平行四边形退化为线段，det(G) = 0，Gram
                    矩阵不可逆。
                  </p>
                )}
              </div>
            </KdeCard>

            <p className="text-xs text-muted leading-relaxed">
              提示：在画布中直接拖拽{" "}
              <span className="text-[#2563eb] font-semibold">u</span> 或{" "}
              <span className="text-[#10b981] font-semibold">v</span>{" "}
              端点手柄即可自由调整向量。
            </p>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
