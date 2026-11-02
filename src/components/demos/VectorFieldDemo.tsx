import { useEffect, useRef, useState } from "react";
import {
  rgbCss,
  viridis,
  valueToT,
} from "../../visualizations/core/common/colormap";
import {
  numericCurl2,
  numericDivergence2,
} from "../../visualizations/core/common/math";
import {
  drawAdaptiveAxes,
  drawArrow,
  drawDragGizmo,
  getVisibleBounds,
  type Bounds2,
  type Plot2D,
} from "../../visualizations/core/2d/plot2d";
import {
  VECTOR_PRESETS,
  sampleVectorGrid,
  type FieldPresetId,
} from "../../visualizations/scenes/calculus/vector-field-2d";
import CanvasViewport, {
  type CanvasViewportHandle,
} from "../framework/CanvasViewport";
import ExpandableDemo from "../framework/ExpandableDemo";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import { useVectorDrag } from "../framework/useVectorDrag";

const INITIAL_BOUNDS: Bounds2 = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 };
const MARGIN = 24;

export default function VectorFieldDemo({ height }: { height?: string }) {
  const [presetId, setPresetId] = useState<FieldPresetId>("rotation");
  const [probe, setProbe] = useState({ x: 1.2, y: 0.8 });
  const vpRef = useRef<CanvasViewportHandle | null>(null);

  const preset =
    VECTOR_PRESETS.find((entry) => entry.id === presetId) ?? VECTOR_PRESETS[0];

  const dragHandlers = useVectorDrag<"probe">({
    targets: [{ id: "probe", x: probe.x, y: probe.y, hitRadius: 30 }],
    onDrag(_id, pos) {
      setProbe(pos);
    },
  });

  useEffect(() => {
    vpRef.current?.redraw();
  }, [presetId, probe]);

  const handleHover = (e: PointerEvent, plot: Plot2D, redraw: () => void) => {
    dragHandlers.onHover(e, plot, redraw);
    const rect = (e.target as HTMLElement | null)?.getBoundingClientRect();
    if (!rect) return;
    setProbe({
      x: plot.toWorldX(e.clientX - rect.left),
      y: plot.toWorldY(e.clientY - rect.top),
    });
  };

  const handleLeftDown = (e: PointerEvent, plot: Plot2D) => {
    const handled = dragHandlers.onLeftDown(e, plot);
    if (handled) return true;
    const rect = (e.target as HTMLElement | null)?.getBoundingClientRect();
    if (!rect) return false;
    setProbe({
      x: plot.toWorldX(e.clientX - rect.left),
      y: plot.toWorldY(e.clientY - rect.top),
    });
    return true;
  };

  const handleLeftMove = (e: PointerEvent, plot: Plot2D) => {
    dragHandlers.onLeftMove(e, plot);
    const rect = (e.target as HTMLElement | null)?.getBoundingClientRect();
    if (!rect) return;
    setProbe({
      x: plot.toWorldX(e.clientX - rect.left),
      y: plot.toWorldY(e.clientY - rect.top),
    });
  };

  const handleLeftUp = () => {
    dragHandlers.onLeftUp();
  };

  const divNumeric = numericDivergence2(preset.p, preset.q, probe.x, probe.y);
  const curlNumeric = numericCurl2(preset.p, preset.q, probe.x, probe.y);
  const probePx = preset.p(probe.x, probe.y);
  const probePy = preset.q(probe.x, probe.y);

  return (
    <ExpandableDemo id="vector-field" height={height}>
      <KdeWindowShell
        title="二维向量场 · 散度与旋度探测"
        eyebrow="CALCULUS 2D LAB"
        mark="2D"
        modeTag={preset.label}
        display={
          <CanvasViewport
            ref={vpRef}
            initialBounds={INITIAL_BOUNDS}
            margin={MARGIN}
            heightClass="h-[var(--demo-height,20rem)]"
            onReset={() => vpRef.current?.resetBounds()}
            onHover={handleHover}
            onLeftDown={handleLeftDown}
            onLeftMove={handleLeftMove}
            onLeftUp={handleLeftUp}
            onPointerLeave={(e, plot, redraw) => {
              dragHandlers.onPointerLeave(e, plot, redraw);
              handleLeftUp();
            }}
            onDraw={(ctx, plot, theme) => {
              drawAdaptiveAxes(ctx, plot, theme);

              const visible = getVisibleBounds(plot);
              const dynamicSamples = sampleVectorGrid(preset, visible, 14, 14);
              let maxMag = 0;
              for (const sample of dynamicSamples) {
                if (sample.mag > maxMag) maxMag = sample.mag;
              }
              const safeMaxMag = maxMag || 1;

              const kx = plot.toScreenX(1) - plot.toScreenX(0);
              const ky = plot.toScreenY(0) - plot.toScreenY(1);
              const worldScale = 0.24 * (visible.xMax - visible.xMin);

              for (const sample of dynamicSamples) {
                const color = rgbCss(
                  viridis(valueToT(sample.mag, 0, safeMaxMag)),
                );
                drawArrow(
                  ctx,
                  plot.toScreenX(sample.x),
                  plot.toScreenY(sample.y),
                  (sample.px / safeMaxMag) * worldScale * kx,
                  -(sample.py / safeMaxMag) * worldScale * ky,
                  color,
                  8,
                  6,
                  1.6,
                );
              }

              // Draw probe point + local field vector in accent color
              const curProbePx = preset.p(probe.x, probe.y);
              const curProbePy = preset.q(probe.x, probe.y);
              const curProbeMag = Math.hypot(curProbePx, curProbePy);
              if (curProbeMag > 1e-4) {
                drawArrow(
                  ctx,
                  plot.toScreenX(probe.x),
                  plot.toScreenY(probe.y),
                  (curProbePx / safeMaxMag) * worldScale * kx * 1.3,
                  -(curProbePy / safeMaxMag) * worldScale * ky * 1.3,
                  theme.accent,
                  10,
                  7,
                  2.5,
                );
              }

              // Interactive probe point with 2D Transform Gizmo
              drawDragGizmo(ctx, plot, probe.x, probe.y, {
                color: theme.accent,
                isHoveredCenter: dragHandlers.isCenterHovered("probe"),
                isDraggingCenter: dragHandlers.isCenterDragging("probe"),
                hoveredArrowId: dragHandlers.getHoveredArrowId("probe"),
                draggingArrowId: dragHandlers.getDraggingArrowId("probe"),
                opacity: dragHandlers.getOpacity("probe"),
              });
            }}
          />
        }
        controls={
          <div className="space-y-3">
            <KdeTabs
              options={VECTOR_PRESETS}
              value={presetId}
              onChange={(id) => setPresetId(id as FieldPresetId)}
            />

            <div className="grid gap-2 sm:grid-cols-3">
              <KdeCard title="探针处向量" variant="dense">
                <KdeReadout
                  label={`F(${probe.x.toFixed(2)}, ${probe.y.toFixed(2)})`}
                  value={`(${probePx.toFixed(2)}, ${probePy.toFixed(2)})`}
                  variant="formula"
                  dense
                />
              </KdeCard>
              <KdeCard title="局部散度 (通量源汇)" variant="dense">
                <KdeReadout
                  label="$\nabla\cdot \mathbf{F}$"
                  value={`${divNumeric.toFixed(3)} (解析 ${preset.div.toFixed(1)})`}
                  variant={Math.abs(divNumeric) > 0.05 ? "accent" : "default"}
                  dense
                />
              </KdeCard>
              <KdeCard title="局部旋度 (涡旋环量)" variant="dense">
                <KdeReadout
                  label="$\nabla\times \mathbf{F}$"
                  value={`${curlNumeric.toFixed(3)} (解析 ${preset.curl.toFixed(1)})`}
                  variant={Math.abs(curlNumeric) > 0.05 ? "warning" : "default"}
                  dense
                />
              </KdeCard>
            </div>

            <p className="text-xs text-muted">
              移动鼠标或拖动探针查看该点邻域的散度与旋度；粗蓝箭头为探针处的向量；网格箭头颜色代表模长；滚轮缩放，拖拽平移。
            </p>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
