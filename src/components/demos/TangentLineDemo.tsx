import { useState } from "react";
import {
  drawAdaptiveAxes,
  drawAdaptiveFunction,
  drawDragGizmo,
  drawSegment,
  getVisibleBounds,
  type Bounds2,
} from "../../visualizations/core/2d/plot2d";
import {
  f,
  fprime,
  secantSlope,
  tangentLineAt,
} from "../../visualizations/scenes/calculus/tangent2d";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import ParamSlider from "../framework/ParamSlider";
import { clamp } from "@math";
import { useCanvas2D } from "../framework/useCanvas2D";
import { useVectorDrag } from "../framework/useVectorDrag";

const INITIAL_BOUNDS: Bounds2 = {
  xMin: -4.5,
  xMax: 4.5,
  yMin: -1.8,
  yMax: 1.8,
};
const MARGIN = 30;

export default function TangentLineDemo({ height }: { height?: string }) {
  const [a, setA] = useState(0.9);
  const [b, setB] = useState(2.4);

  const dragHandlers = useVectorDrag<"a" | "b">({
    targets: [
      {
        id: "a",
        x: a,
        y: f(a),
        constraint: {
          type: "custom",
          project: (rawPos) => ({ x: rawPos.x, y: f(rawPos.x) }),
        },
      },
      {
        id: "b",
        x: b,
        y: f(b),
        constraint: {
          type: "custom",
          project: (rawPos) => ({ x: rawPos.x, y: f(rawPos.x) }),
        },
      },
    ],
    onDrag(id, pos) {
      if (id === "a") setA(clamp(pos.x, -4.5, 4.5));
      if (id === "b") setB(clamp(pos.x, -4.5, 4.5));
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

        // Infinitely and dynamically sample the function curve across the visible viewport
        drawAdaptiveFunction(ctx, plot, f, {
          color: theme.ink,
          width: 2,
          stepPx: 2,
        });

        // Secant segment between points A and B
        drawSegment(ctx, plot, a, f(a), b, f(b), {
          color: theme.accent,
          width: 1.6,
          dash: [5, 4],
        });

        // Tangent line extended across the entire visible window
        const visible = getVisibleBounds(plot);
        drawSegment(
          ctx,
          plot,
          visible.xMin,
          tangentLineAt(a, visible.xMin),
          visible.xMax,
          tangentLineAt(a, visible.xMax),
          { color: "#ef4444", width: 2 },
        );

        // Point A (tangent point) 2D Transform Gizmo
        drawDragGizmo(ctx, plot, a, f(a), {
          color: "#ef4444",
          isHoveredCenter: dragHandlers.isCenterHovered("a"),
          isDraggingCenter: dragHandlers.isCenterDragging("a"),
          hoveredArrowId: dragHandlers.getHoveredArrowId("a"),
          draggingArrowId: dragHandlers.getDraggingArrowId("a"),
          opacity: dragHandlers.getOpacity("a"),
        });

        // Point B (secant second point) 2D Transform Gizmo
        drawDragGizmo(ctx, plot, b, f(b), {
          color: theme.accent,
          isHoveredCenter: dragHandlers.isCenterHovered("b"),
          isDraggingCenter: dragHandlers.isCenterDragging("b"),
          hoveredArrowId: dragHandlers.getHoveredArrowId("b"),
          draggingArrowId: dragHandlers.getDraggingArrowId("b"),
          opacity: dragHandlers.getOpacity("b"),
        });
      },
    },
    [a, b],
  );

  const derivative = fprime(a);
  const secant = secantSlope(a, b);

  return (
    <AutoMath>
      <ExpandableDemo id="tangent-line" height={height}>
        <KdeWindowShell
          title="导数几何定义：割线极限逼近切线"
          eyebrow="微积分 · 单变量微分"
          mark="f'(x)"
          modeTag="割线斜率趋近切线"
          display={
            <div
              ref={containerRef}
              className="relative h-[var(--demo-height,20rem)] w-full overflow-hidden rounded border border-border/70 bg-surface"
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
              <KdeCard title="采样点坐标微调" variant="dense">
                <div className="space-y-2">
                  <ParamSlider
                    label="切点 A 横坐标 a"
                    value={a}
                    min={-4.5}
                    max={4.5}
                    step={0.05}
                    onChange={setA}
                    widthClass="w-full"
                    labelMode="adaptive"
                  />
                  <ParamSlider
                    label="割线点 B 横坐标 b"
                    value={b}
                    min={-4.5}
                    max={4.5}
                    step={0.05}
                    onChange={setB}
                    widthClass="w-full"
                    labelMode="adaptive"
                  />
                  <p className="pt-1 text-[11px] text-muted">
                    可在画布上直接拖拽红点 A 与蓝点 B 移动；滚轮缩放，中键平移。
                  </p>
                </div>
              </KdeCard>

              <KdeCard title="导数与差商读数" variant="dense">
                <div className="space-y-2">
                  <KdeReadout
                    label={`切点 A 斜率 f'(${a.toFixed(2)})`}
                    value={derivative.toFixed(3)}
                    variant="accent"
                    dense
                  />
                  <KdeReadout
                    label="割线斜率 Δy/Δx"
                    value={secant.toFixed(3)}
                    subValue={`h = |b - a| = ${Math.abs(a - b).toFixed(3)}`}
                    variant={Math.abs(a - b) < 0.2 ? "success" : "default"}
                    dense
                  />
                  <KdeReadout
                    label="极限逼近误差 |斜率差|"
                    value={Math.abs(derivative - secant).toFixed(4)}
                    dense
                  />
                </div>
              </KdeCard>
            </div>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
