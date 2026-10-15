import { useState } from "react";
import { clamp } from "@math";
import {
  drawAdaptiveAxes,
  drawArrow,
  drawPoint,
  drawPolyline,
} from "../../visualizations/core/2d/plot2d";
import {
  CURVES2D,
  type Curve2DId,
} from "../../visualizations/scenes/calculus/parametric-curve2d";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import ParamSlider from "../framework/ParamSlider";
import { useCanvas2D } from "../framework/useCanvas2D";

const MARGIN = 30;
const CURVE_OPTIONS: { id: Curve2DId; label: string }[] = [
  { id: "circle", label: "圆" },
  { id: "parabola", label: "抛物线" },
];

/** 2D parametric curve explorer: circle / parabola, t slider + drag, tangent. */
export default function ParametricCurveDemo({ height }: { height?: string }) {
  const [curveId, setCurveId] = useState<Curve2DId>("circle");
  const [t, setT] = useState(1.0);

  const curve = CURVES2D[curveId];

  const { containerRef, canvasRef, setBounds, resetBounds } = useCanvas2D(
    {
      initialBounds: CURVES2D.circle.bounds,
      margin: MARGIN,
      draw(ctx, plot, theme) {
        drawAdaptiveAxes(ctx, plot, theme);
        drawPolyline(ctx, plot, curve.sample(240), {
          color: theme.ink,
          width: 2,
        });

        const [px, py] = curve.point(t);
        const [tx, ty] = curve.tangent(t);
        const mag = Math.hypot(tx, ty) || 1;
        const kx = plot.toScreenX(1) - plot.toScreenX(0);
        const ky = plot.toScreenY(0) - plot.toScreenY(1);
        drawPoint(ctx, plot, px, py, {
          color: theme.accent,
          filled: true,
          radius: 6,
        });
        drawArrow(
          ctx,
          plot.toScreenX(px),
          plot.toScreenY(py),
          (tx / mag) * 0.55 * kx,
          -(ty / mag) * 0.55 * ky,
          theme.accent,
          10,
          7,
          2,
        );
      },
      onLeftDown() {
        return true;
      },
      onLeftMove(e, plot) {
        const el =
          (e.currentTarget as HTMLElement | null) ??
          (e.target as HTMLElement | null);
        const rect = el?.getBoundingClientRect();
        if (!rect) return;
        const wx = plot.toWorldX(e.clientX - rect.left);
        const wy = plot.toWorldY(e.clientY - rect.top);
        setT(clamp(curve.invert(wx, wy), curve.tMin, curve.tMax));
      },
    },
    [curveId, t],
  );

  const handleCurveChange = (id: Curve2DId): void => {
    setCurveId(id);
    const c = CURVES2D[id];
    setT(c.defaultT);
    setBounds(c.bounds);
  };

  const [x, y] = curve.point(t);
  const [tx, ty] = curve.tangent(t);

  return (
    <AutoMath>
      <ExpandableDemo id="parametric-curve-2d" height={height}>
        <KdeWindowShell
          title="二维参数曲线与动态切向量"
          eyebrow="微积分 · 曲线几何"
          mark="r(t)"
          modeTag="切线与速度向量"
          tabs={
            <KdeTabs
              options={CURVE_OPTIONS}
              value={curveId}
              onChange={handleCurveChange}
            />
          }
          display={
            <div
              ref={containerRef}
              className="relative h-[var(--demo-height,20rem)] w-full overflow-hidden rounded border border-border/70 bg-surface"
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
              <KdeCard title="曲线参数控制" variant="dense">
                <ParamSlider
                  label="$t$"
                  min={curve.tMin}
                  max={curve.tMax}
                  step={0.01}
                  value={t}
                  onChange={setT}
                  widthClass="w-full"
                  labelMode="adaptive"
                />
                <p className="mt-2 text-[11px] text-muted">
                  拖动滑块或直接在画布上拖拽曲线点；滚轮缩放，中键平移。
                </p>
              </KdeCard>

              <KdeCard title="曲线位置与速度切向量" variant="dense">
                <div className="space-y-2">
                  <KdeReadout
                    label="参数方程 r(t)"
                    value={`$\\mathbf{r}(t) = ${curve.tex}$`}
                    dense
                  />
                  <KdeReadout
                    label={`当前位置 r(${t.toFixed(2)})`}
                    value={`(${x.toFixed(3)},\\, ${y.toFixed(3)})`}
                    variant="accent"
                    dense
                  />
                  <KdeReadout
                    label="导数切向 r'(t)"
                    value={`$\\mathbf{r}'(t) = ${curve.texTangent}$`}
                    dense
                  />
                  <KdeReadout
                    label={`瞬时切向 r'(${t.toFixed(2)})`}
                    value={`(${tx.toFixed(3)},\\, ${ty.toFixed(3)})`}
                    variant="success"
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
