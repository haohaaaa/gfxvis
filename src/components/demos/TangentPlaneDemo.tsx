import { useState, useRef } from "react";
import {
  DOMAIN,
  SURFACE_FN,
  createSurfaceScene,
} from "../../visualizations/scenes/calculus/bivariate-surface";
import { attachGizmo3D } from "../../visualizations/core/3d/gizmo3d";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeCheckbox from "../framework/KdeCheckbox";
import KdeReadout from "../framework/KdeReadout";
import { useViewer3D } from "../framework/useViewer3D";

export default function TangentPlaneDemo({ height }: { height?: string }) {
  const [point, setPoint] = useState({ x: 0.8, y: 0.6 });
  const showAxes = true;
  const [surfaceTransparent, setSurfaceTransparent] = useState(true);

  const pointRef = useRef(point);
  pointRef.current = point;

  const { containerRef, viewerRef } = useViewer3D(
    () => createSurfaceScene(),
    ({ api, viewer }) => {
      api.setPoint(pointRef.current.x, pointRef.current.y);
      api.setAxesVisible(showAxes);
      api.setSurfaceTransparent(surfaceTransparent);

      return attachGizmo3D({
        domElement: viewer.renderer.domElement,
        camera: viewer.camera,
        controls: viewer.controls,
        gizmo: api.gizmo,
        bounds: {
          xMin: -DOMAIN,
          xMax: DOMAIN,
          yMin: -DOMAIN,
          yMax: DOMAIN,
        },
        surfaceFunc: (x, y) => SURFACE_FN.f(x, y),
        getPosition: () => ({
          x: pointRef.current.x,
          y: pointRef.current.y,
          z: SURFACE_FN.f(pointRef.current.x, pointRef.current.y),
        }),
        onPositionChange: (pos) => {
          setPoint({ x: pos.x, y: pos.y });
          api.setPoint(pos.x, pos.y);
        },
        render: () => viewer.render(),
      });
    },
    [showAxes, surfaceTransparent],
  );

  const { x, y } = point;
  const z = SURFACE_FN.f(x, y);
  const fx = SURFACE_FN.fx(x, y);
  const fy = SURFACE_FN.fy(x, y);

  return (
    <AutoMath>
      <ExpandableDemo id="tangent-plane" height={height}>
        <KdeWindowShell
          title="二元函数切平面与全微分局部逼近"
          eyebrow="微积分 · 多元全微分"
          mark="z = f(x,y)"
          modeTag="切平面与梯度法向量"
          display={
            <div
              ref={containerRef}
              className="relative h-[var(--demo-height,28rem)] w-full overflow-hidden rounded border border-border/70 bg-surface"
            >
              <CanvasToolbar
                onReset={() => viewerRef.current?.controls.reset()}
              />
              <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
            </div>
          }
          controls={
            <div className="space-y-3">
              <KdeCard title="曲面显示设置" variant="dense">
                <div className="space-y-3">
                  <KdeCheckbox
                    label="曲面半透明渲染"
                    checked={surfaceTransparent}
                    onChange={setSurfaceTransparent}
                    size="xs"
                  />
                  <p className="text-[11px] text-muted leading-relaxed">
                    交互方式：左键旋转 · 滚轮缩放 · 右键平移；使用 3D
                    轴向手柄在曲面上自由拖拽移动切点，观察切平面与法向量的实时变化。
                  </p>
                </div>
              </KdeCard>

              <KdeCard title="全微分切平面与法向量" variant="dense">
                <div className="space-y-2">
                  <KdeReadout
                    label="切点坐标 (x, y, z)"
                    value={`(${x.toFixed(2)},\\, ${y.toFixed(2)},\\, ${z.toFixed(3)})`}
                    variant="accent"
                    dense
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <KdeReadout label="偏导数 fx" value={fx.toFixed(3)} dense />
                    <KdeReadout label="偏导数 fy" value={fy.toFixed(3)} dense />
                  </div>
                  <KdeReadout
                    label="切平面外法向 n = (-fx, -fy, 1)"
                    value={`(${(-fx).toFixed(2)},\\, ${(-fy).toFixed(2)},\\, 1.00)`}
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
