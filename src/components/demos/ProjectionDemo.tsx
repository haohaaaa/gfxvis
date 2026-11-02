import { useState, useMemo } from "react";
import {
  drawAdaptiveAxes,
  drawArrow,
  drawDragGizmo,
  drawDragGuideTrack,
  drawPoint,
  drawSegment,
  getVisibleBounds,
} from "../../visualizations/core/2d/plot2d";
import {
  DEFAULT_X,
  PROBE_CLAMP,
  PROJECTION_BOUNDS,
  PROJECTION_TARGETS,
  type ProjectionModeId,
  type ProjectionTargetId,
} from "../../visualizations/scenes/linear-algebra/projection2d";
import CanvasViewport from "../framework/CanvasViewport";
import ExpandableDemo from "../framework/ExpandableDemo";
import ParamSlider from "../framework/ParamSlider";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import { clamp } from "@math";
import { useVectorDrag } from "../framework/useVectorDrag";

const MARGIN = 24;

const TARGET_OPTIONS: { id: ProjectionTargetId; label: string }[] = [
  { id: "x-axis", label: "x 轴" },
  { id: "line-yx", label: "y = x" },
];

const MODE_OPTIONS: { id: ProjectionModeId; label: string }[] = [
  { id: "orthogonal", label: "正交投影" },
  { id: "oblique", label: "斜投影" },
];

function drawPillBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  bgColor: string,
  textColor: string,
  borderColor?: string,
) {
  ctx.save();
  ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  const paddingX = 8;
  const h = 20;
  const w = textWidth + paddingX * 2;
  const rx = x - w / 2;
  const ry = y - h / 2;
  const radius = h / 2;

  ctx.beginPath();
  ctx.roundRect(rx, ry, w, h, radius);
  ctx.fillStyle = bgColor;
  ctx.fill();
  if (borderColor) {
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillStyle = textColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** 2D projection explorer: x/y sliders set the vector; pick target line and mode. */
export default function ProjectionDemo({ height }: { height?: string }) {
  const [targetId, setTargetId] = useState<ProjectionTargetId>("x-axis");
  const [modeId, setModeId] = useState<ProjectionModeId>("orthogonal");
  const [probe, setProbe] = useState(DEFAULT_X);

  const mode = PROJECTION_TARGETS[targetId].modes[modeId];

  const gizmoArrows = useMemo(() => {
    const dirSubspace = targetId === "x-axis" ? { x: 1, y: 0 } : { x: 1, y: 1 };
    let dirResidual = { x: 0, y: 1 };
    if (targetId === "line-yx") {
      dirResidual = modeId === "orthogonal" ? { x: -1, y: 1 } : { x: 0, y: 1 };
    }
    return [
      {
        id: "subspace",
        direction: dirSubspace,
        color: "#2563eb",
        label: "L",
        lengthPx: 34,
      },
      {
        id: "residual",
        direction: dirResidual,
        color: "#64748b",
        label: "L^⊥",
        lengthPx: 34,
      },
    ];
  }, [targetId, modeId]);

  const dragHandlers = useVectorDrag<"probe">({
    targets: [
      {
        id: "probe",
        x: probe.x,
        y: probe.y,
        bounds: PROBE_CLAMP,
        arrows: gizmoArrows,
      },
    ],
    onDrag(_, pos) {
      setProbe({
        x: clamp(pos.x, PROBE_CLAMP.xMin, PROBE_CLAMP.xMax),
        y: clamp(pos.y, PROBE_CLAMP.yMin, PROBE_CLAMP.yMax),
      });
    },
  });

  const { x, y } = probe;
  const [px, py] = mode.project(x, y);
  const rx = x - px;
  const ry = y - py;

  return (
    <ExpandableDemo id="projection" height={height}>
      <KdeWindowShell
        title="2D 投影变换与幂等分解"
        eyebrow="Linear Algebra · 2D Projection"
        mark="P² = P"
        modeTag={`${PROJECTION_TARGETS[targetId].label} · ${mode.label}`}
        display={
          <CanvasViewport
            initialBounds={PROJECTION_BOUNDS}
            margin={MARGIN}
            className="h-[var(--demo-height,20rem)]"
            onLeftDown={dragHandlers.onLeftDown}
            onLeftMove={dragHandlers.onLeftMove}
            onLeftUp={dragHandlers.onLeftUp}
            onHover={dragHandlers.onHover}
            onPointerLeave={dragHandlers.onPointerLeave}
            onDraw={(ctx, plot, theme) => {
              const target = PROJECTION_TARGETS[targetId];
              const m = target.modes[modeId];
              drawAdaptiveAxes(ctx, plot, theme);

              const activeTrack = dragHandlers.getActiveTrack();
              if (activeTrack) {
                drawDragGuideTrack(ctx, plot, activeTrack);
              }

              const [curPx, curPy] = m.project(probe.x, probe.y);
              const curRx = probe.x - curPx;
              const curRy = probe.y - curPy;

              // Target subspace: emphasize the target line across the visible viewport
              const visible = getVisibleBounds(plot);
              if (target.id === "x-axis") {
                drawSegment(ctx, plot, visible.xMin, 0, visible.xMax, 0, {
                  color: theme.border,
                  width: 3,
                });
              } else {
                const minVal = Math.min(visible.xMin, visible.yMin);
                const maxVal = Math.max(visible.xMax, visible.yMax);
                drawSegment(ctx, plot, minVal, minVal, maxVal, maxVal, {
                  color: theme.border,
                  width: 3,
                });
              }

              const ox = plot.toScreenX(0);
              const oy = plot.toScreenY(0);
              const xTipX = plot.toScreenX(probe.x);
              const xTipY = plot.toScreenY(probe.y);
              const pxTipX = plot.toScreenX(curPx);
              const pxTipY = plot.toScreenY(curPy);

              // Residual (I - P)x: dashed segment from Px to x.
              drawSegment(ctx, plot, curPx, curPy, probe.x, probe.y, {
                color: theme.muted,
                width: 1.8,
                dash: [5, 4],
              });

              // Right-angle marker for orthogonal projection
              if (modeId === "orthogonal" && Math.hypot(curRx, curRy) > 0.3) {
                const lineDirX = targetId === "x-axis" ? 1 : 1 / Math.SQRT2;
                const lineDirY = targetId === "x-axis" ? 0 : -1 / Math.SQRT2;
                const resDx = xTipX - pxTipX;
                const resDy = xTipY - pxTipY;
                const resLen = Math.hypot(resDx, resDy) || 1;
                const resNormX = resDx / resLen;
                const resNormY = resDy / resLen;

                const lineSign =
                  (pxTipX - ox) * lineDirX + (pxTipY - oy) * lineDirY >= 0
                    ? 1
                    : -1;
                const uX = lineDirX * lineSign;
                const uY = lineDirY * lineSign;

                const cornerSize = 10;
                ctx.save();
                ctx.strokeStyle = theme.muted;
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(pxTipX + uX * cornerSize, pxTipY + uY * cornerSize);
                ctx.lineTo(
                  pxTipX + uX * cornerSize + resNormX * cornerSize,
                  pxTipY + uY * cornerSize + resNormY * cornerSize,
                );
                ctx.lineTo(
                  pxTipX + resNormX * cornerSize,
                  pxTipY + resNormY * cornerSize,
                );
                ctx.stroke();
                ctx.restore();
              }

              // x arrow (ink) and Px arrow (accent).
              drawArrow(
                ctx,
                ox,
                oy,
                xTipX - ox,
                xTipY - oy,
                theme.ink,
                10,
                7,
                2.4,
              );
              drawArrow(
                ctx,
                ox,
                oy,
                pxTipX - ox,
                pxTipY - oy,
                theme.accent,
                10,
                7,
                2.6,
              );

              // Hollow ring at Px: projecting again lands on the same point (P^2 x = Px).
              drawPoint(ctx, plot, curPx, curPy, {
                color: theme.accent,
                filled: false,
                radius: 6,
                width: 2,
              });

              // Interactive Transform Gizmo at tip x
              drawDragGizmo(ctx, plot, probe.x, probe.y, {
                color: theme.ink,
                isHoveredCenter: dragHandlers.isCenterHovered("probe"),
                isDraggingCenter: dragHandlers.isCenterDragging("probe"),
                hoveredArrowId: dragHandlers.getHoveredArrowId("probe"),
                draggingArrowId: dragHandlers.getDraggingArrowId("probe"),
                arrows: gizmoArrows,
              });

              // Badges
              const midResX = plot.toScreenX((curPx + probe.x) / 2);
              const midResY = plot.toScreenY((curPy + probe.y) / 2);
              drawPillBadge(
                ctx,
                midResX + 32,
                midResY - 14,
                "(I - P)x",
                "rgba(15, 23, 42, 0.85)",
                "#94a3b8",
                "rgba(148, 163, 184, 0.3)",
              );
              drawPillBadge(
                ctx,
                pxTipX,
                pxTipY + 22,
                "Px",
                "rgba(15, 23, 42, 0.85)",
                theme.accent,
                "rgba(37, 99, 235, 0.4)",
              );
              drawPillBadge(
                ctx,
                xTipX + 18,
                xTipY - 18,
                "x",
                "rgba(15, 23, 42, 0.85)",
                theme.ink,
                "rgba(255, 255, 255, 0.3)",
              );
            }}
          />
        }
        controls={
          <div className="space-y-3">
            <KdeCard title="目标子空间与投影类型" variant="dense">
              <div className="space-y-2.5">
                <div>
                  <div className="text-[11px] text-muted mb-1 font-medium">
                    目标子空间：
                  </div>
                  <KdeTabs
                    options={TARGET_OPTIONS}
                    value={targetId}
                    onChange={(id: string) =>
                      setTargetId(id as ProjectionTargetId)
                    }
                    size="xs"
                  />
                </div>
                <div className="pt-2 border-t border-border/40">
                  <div className="text-[11px] text-muted mb-1 font-medium">
                    投影类型：
                  </div>
                  <KdeTabs
                    options={MODE_OPTIONS}
                    value={modeId}
                    onChange={(id: string) => setModeId(id as ProjectionModeId)}
                    size="xs"
                  />
                </div>
              </div>
            </KdeCard>

            <KdeCard title="探测向量坐标 (x, y)" variant="dense">
              <div className="space-y-2">
                <ParamSlider
                  label="$x$"
                  min={PROBE_CLAMP.xMin}
                  max={PROBE_CLAMP.xMax}
                  step={0.05}
                  value={probe.x}
                  onChange={(v: number) => setProbe((s) => ({ ...s, x: v }))}
                  widthClass="w-full"
                />
                <ParamSlider
                  label="$y$"
                  min={PROBE_CLAMP.yMin}
                  max={PROBE_CLAMP.yMax}
                  step={0.05}
                  value={probe.y}
                  onChange={(v: number) => setProbe((s) => ({ ...s, y: v }))}
                  widthClass="w-full"
                />
              </div>
            </KdeCard>

            <div className="grid grid-cols-2 gap-1.5">
              <KdeReadout
                label="原向量 x"
                value={`(${probe.x.toFixed(2)}, ${probe.y.toFixed(2)})`}
                dense
              />
              <KdeReadout
                label="投影向量 Px"
                value={`(${px.toFixed(2)}, ${py.toFixed(2)})`}
                variant="accent"
                dense
              />
              <KdeReadout
                label="残差向量 (I-P)x"
                value={`(${rx.toFixed(2)}, ${ry.toFixed(2)})`}
                dense
              />
              <KdeReadout
                label="幂等性质 P²x = Px"
                value="P² = P 成立"
                variant="success"
                dense
              />
            </div>

            <KdeCard title="投影矩阵与代数表达式" variant="dense">
              <div className="space-y-1.5 text-xs">
                <div className="font-mono text-primary bg-surface p-2 rounded border border-border/40 overflow-x-auto">
                  {`$P = ${mode.tex}$`}
                </div>
                <div className="text-[11px] text-muted font-mono">
                  {`$Px = ${mode.texPx}$`}
                </div>
              </div>
            </KdeCard>

            <p className="text-xs text-muted leading-relaxed">
              {
                "提示：拖动端点黑心圆点进行 2D 自由移动；拖动蓝色箭头沿子空间 $L$ 滑动；拖动灰色箭头沿残差法向 $L^\\perp$ 滑动（落点 $Px$ 保持恒定不变！）。"
              }
            </p>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
