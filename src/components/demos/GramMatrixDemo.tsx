import { useState } from "react";
import {
  drawAdaptiveAxes,
  drawDragGizmo,
  drawSegment,
  type Bounds2,
} from "../../visualizations/core/2d/plot2d";
import CanvasResizer from "../framework/CanvasResizer";
import CanvasToolbar from "../framework/CanvasToolbar";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeWindowShell from "../framework/KdeWindowShell";
import PresetSelector from "../framework/PresetSelector";
import { useCanvas2D } from "../framework/useCanvas2D";
import { useVectorDrag } from "../framework/useVectorDrag";

const INITIAL_BOUNDS: Bounds2 = {
  xMin: -3.5,
  xMax: 3.5,
  yMin: -3.5,
  yMax: 3.5,
};
const MARGIN = 30;

const PRESETS = [
  { id: "ortho", label: "正交 (90°)" },
  { id: "collinear", label: "共线 (退化 0°)" },
  { id: "general", label: "一般独立" },
];

export default function GramMatrixDemo({ height }: { height?: string }) {
  const [u, setU] = useState<{ x: number; y: number }>({ x: 2.2, y: 0.8 });
  const [v, setV] = useState<{ x: number; y: number }>({ x: 0.6, y: 2.2 });
  const [presetKey, setPresetKey] = useState("general");

  const dragHandlers = useVectorDrag<"u" | "v">({
    targets: [
      { id: "u", x: u.x, y: u.y },
      { id: "v", x: v.x, y: v.y },
    ],
    onDrag(id, pos) {
      if (id === "u") setU(pos);
      else setV(pos);
    },
  });

  const { containerRef, canvasRef, resetBounds } = useCanvas2D(
    {
      initialBounds: INITIAL_BOUNDS,
      margin: MARGIN,
      onLeftDown: dragHandlers.onLeftDown,
      onLeftMove: dragHandlers.onLeftMove,
      onLeftUp: dragHandlers.onLeftUp,
      onHover: dragHandlers.onHover,
      onPointerLeave: dragHandlers.onPointerLeave,
      draw(ctx, plot, theme) {
        drawAdaptiveAxes(ctx, plot, theme);

        const originX = plot.toScreenX(0);
        const originY = plot.toScreenY(0);
        const ux = plot.toScreenX(u.x);
        const uy = plot.toScreenY(u.y);
        const vx = plot.toScreenX(v.x);
        const vy = plot.toScreenY(v.y);
        const sumx = plot.toScreenX(u.x + v.x);
        const sumy = plot.toScreenY(u.y + v.y);

        // Draw filled parallelogram
        ctx.fillStyle = theme.accent + "22";
        ctx.beginPath();
        ctx.moveTo(originX, originY);
        ctx.lineTo(ux, uy);
        ctx.lineTo(sumx, sumy);
        ctx.lineTo(vx, vy);
        ctx.closePath();
        ctx.fill();

        // Draw dashed boundary edges
        drawSegment(ctx, plot, u.x, u.y, u.x + v.x, u.y + v.y, {
          color: theme.muted,
          width: 1.5,
          dash: [4, 4],
        });
        drawSegment(ctx, plot, v.x, v.y, u.x + v.x, u.y + v.y, {
          color: theme.muted,
          width: 1.5,
          dash: [4, 4],
        });

        // Draw vector u (blue accent) & 2D Transform Gizmo
        drawSegment(ctx, plot, 0, 0, u.x, u.y, {
          color: "#2563eb",
          width: 2.5,
        });
        drawDragGizmo(ctx, plot, u.x, u.y, {
          color: "#2563eb",
          isHoveredCenter: dragHandlers.isCenterHovered("u"),
          isDraggingCenter: dragHandlers.isCenterDragging("u"),
          hoveredArrowId: dragHandlers.getHoveredArrowId("u"),
          draggingArrowId: dragHandlers.getDraggingArrowId("u"),
          opacity: dragHandlers.getOpacity("u"),
        });

        // Draw vector v (emerald accent) & 2D Transform Gizmo
        drawSegment(ctx, plot, 0, 0, v.x, v.y, {
          color: "#10b981",
          width: 2.5,
        });
        drawDragGizmo(ctx, plot, v.x, v.y, {
          color: "#10b981",
          isHoveredCenter: dragHandlers.isCenterHovered("v"),
          isDraggingCenter: dragHandlers.isCenterDragging("v"),
          hoveredArrowId: dragHandlers.getHoveredArrowId("v"),
          draggingArrowId: dragHandlers.getDraggingArrowId("v"),
          opacity: dragHandlers.getOpacity("v"),
        });

        // Labels on vector tips
        ctx.font = "bold 13px ui-sans-serif, system-ui, sans-serif";
        ctx.fillStyle = "#2563eb";
        ctx.fillText("u", ux + 10, uy - 6);
        ctx.fillStyle = "#059669";
        ctx.fillText("v", vx + 10, vy - 6);
      },
    },
    [u, v],
  );

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
    <AutoMath>
      <ExpandableDemo id="gram-matrix" height={height}>
        <KdeWindowShell
          title="Gram 矩阵与几何测度工作台"
          eyebrow="BREEZE WORKSPACE · GRAM MATRIX"
          mark="G"
          modeTag="GRAM"
          testId="gram-matrix-demo"
          display={
            <div
              ref={containerRef}
              className="relative h-[var(--demo-height,20rem)] w-full overflow-hidden"
            >
              <CanvasToolbar onReset={resetBounds} />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full"
              />
              <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
            </div>
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
                提示：在画布中拖拽{" "}
                <span className="text-[#2563eb] font-semibold">u</span> 或{" "}
                <span className="text-[#10b981] font-semibold">v</span>{" "}
                向量端点；支持滚轮缩放视野。
              </p>
            </div>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
