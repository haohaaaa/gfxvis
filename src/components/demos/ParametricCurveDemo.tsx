import { useEffect, useRef, useState } from "react";
import { clamp } from "@math";
import {
  drawAdaptiveAxes,
  drawArrow,
  drawPoint,
  drawPolyline,
  type Plot2D,
} from "../../visualizations/core/2d/plot2d";
import {
  CURVES2D,
  type Curve2DId,
} from "../../visualizations/scenes/calculus/parametric-curve2d";
import CanvasViewport, {
  type CanvasViewportHandle,
} from "../framework/CanvasViewport";
import ExpandableDemo from "../framework/ExpandableDemo";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import ParamSlider from "../framework/ParamSlider";

const MARGIN = 30;
const CURVE_OPTIONS: { id: Curve2DId; label: string }[] = [
  { id: "circle", label: "圆" },
  { id: "parabola", label: "抛物线" },
];

/** 2D parametric curve explorer: circle / parabola, t slider + drag, tangent. */
export default function ParametricCurveDemo({ height }: { height?: string }) {
  const [curveId, setCurveId] = useState<Curve2DId>("circle");
  const [t, setT] = useState(1.0);
  const isDraggingRef = useRef(false);
  const vpRef = useRef<CanvasViewportHandle | null>(null);

  const curve = CURVES2D[curveId];

  useEffect(() => {
    vpRef.current?.redraw();
  }, [curveId, t]);

  const handleCurveChange = (id: Curve2DId): void => {
    setCurveId(id);
    const c = CURVES2D[id];
    setT(c.defaultT);
    vpRef.current?.setBounds(c.bounds);
  };

  const handleLeftDown = (e: PointerEvent, plot: Plot2D) => {
    isDraggingRef.current = true;
    const rect = (e.target as HTMLElement | null)?.getBoundingClientRect();
    if (!rect) return false;
    const wx = plot.toWorldX(e.clientX - rect.left);
    const wy = plot.toWorldY(e.clientY - rect.top);
    setT(clamp(curve.invert(wx, wy), curve.tMin, curve.tMax));
    return true;
  };

  const handleLeftMove = (e: PointerEvent, plot: Plot2D) => {
    if (!isDraggingRef.current) return;
    const rect = (e.target as HTMLElement | null)?.getBoundingClientRect();
    if (!rect) return;
    const wx = plot.toWorldX(e.clientX - rect.left);
    const wy = plot.toWorldY(e.clientY - rect.top);
    setT(clamp(curve.invert(wx, wy), curve.tMin, curve.tMax));
  };

  const handleLeftUp = () => {
    isDraggingRef.current = false;
  };

  const [x, y] = curve.point(t);
  const [tx, ty] = curve.tangent(t);

  return (
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
          <CanvasViewport
            ref={vpRef}
            initialBounds={CURVES2D.circle.bounds}
            margin={MARGIN}
            heightClass="h-[var(--demo-height,20rem)]"
            onReset={() => vpRef.current?.setBounds(curve.bounds)}
            onLeftDown={handleLeftDown}
            onLeftMove={handleLeftMove}
            onLeftUp={handleLeftUp}
            onPointerLeave={handleLeftUp}
            onDraw={(ctx, plot, theme) => {
              drawAdaptiveAxes(ctx, plot, theme);
              drawPolyline(ctx, plot, curve.sample(240), {
                color: theme.ink,
                width: 2,
              });

              const [px, py] = curve.point(t);
              const [curTx, curTy] = curve.tangent(t);
              const mag = Math.hypot(curTx, curTy) || 1;
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
                (curTx / mag) * 0.55 * kx,
                -(curTy / mag) * 0.55 * ky,
                theme.accent,
                10,
                7,
                2,
              );
            }}
          />
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
  );
}
