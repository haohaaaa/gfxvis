import { useState } from "react";
import {
  SPACE_CURVES,
  createCurve3DScene,
  type SpaceCurveId,
} from "../../visualizations/scenes/calculus/parametric-curve3d";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import ParamSlider from "../framework/ParamSlider";
import { useViewer3D } from "../framework/useViewer3D";

const CURVE_OPTIONS: { id: SpaceCurveId; label: string }[] = [
  { id: "circle", label: "圆" },
  { id: "helix", label: "螺旋线" },
  { id: "trefoil", label: "三叶结" },
];

/** 3D space-curve explorer: circle / helix / trefoil knot with a t slider. */
export default function ParametricCurve3DDemo({ height }: { height?: string }) {
  const [curveId, setCurveId] = useState<SpaceCurveId>("circle");
  const [t, setT] = useState(1.0);
  const showAxes = true;

  const curve = SPACE_CURVES[curveId];
  const [x, y, z] = curve.point(t);

  const { containerRef, viewerRef } = useViewer3D(
    () => createCurve3DScene(),
    ({ api }) => {
      api.setCurve(curveId);
      api.setT(t);
      api.setAxesVisible(showAxes);
    },
    [curveId, t, showAxes],
  );

  const handleCurveChange = (id: SpaceCurveId): void => {
    setCurveId(id);
    setT(SPACE_CURVES[id].defaultT);
  };

  return (
    <AutoMath>
      <ExpandableDemo id="parametric-curve-3d" height={height}>
        <KdeWindowShell
          title="三维空间参数曲线与切向速度"
          eyebrow="微积分 · 空间曲线"
          mark="r(t)"
          modeTag="3D 几何"
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
              className="relative h-[var(--demo-height,24rem)] w-full overflow-hidden rounded border border-border/70 bg-surface"
            >
              <CanvasToolbar
                onReset={() => viewerRef.current?.controls.reset()}
              />
              <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
            </div>
          }
          controls={
            <div className="space-y-3">
              <KdeCard title="空间曲线参数控制" variant="dense">
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
                  左键旋转 · 滚轮缩放 · 右键平移；拖动 $t$
                  观察点沿空间曲线运动，蓝色箭头为速度方向。
                </p>
              </KdeCard>

              <KdeCard title="空间位置与方程读数" variant="dense">
                <div className="space-y-2">
                  <KdeReadout
                    label="空间曲线方程 r(t)"
                    value={`$\\mathbf{r}(t) = ${curve.tex}$`}
                    dense
                  />
                  <KdeReadout
                    label={`位置坐标 r(${t.toFixed(2)})`}
                    value={`(${x.toFixed(3)},\\, ${y.toFixed(3)},\\, ${z.toFixed(3)})`}
                    variant="accent"
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
