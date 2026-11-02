import { useRef, useState } from "react";
import {
  PARAMETRIC_SURFACES,
  createParametricSurfaceScene,
  type ParametricSurfaceScene,
  type SurfaceId,
} from "../../visualizations/scenes/calculus/parametric-surface3d";
import ExpandableDemo from "../framework/ExpandableDemo";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeCheckbox from "../framework/KdeCheckbox";
import KdeReadout from "../framework/KdeReadout";
import ParamSlider from "../framework/ParamSlider";
import Viewer3DViewport, {
  type Viewer3DViewportHandle,
} from "../framework/Viewer3DViewport";

const SURFACE_OPTIONS: { id: SurfaceId; label: string }[] = [
  { id: "sphere", label: "球面" },
  { id: "graph", label: "函数图像" },
];

/** 3D parametric surface: u/v sliders, parameter grid, highlighted curves. */
export default function ParametricSurfaceDemo({ height }: { height?: string }) {
  const [surfaceId, setSurfaceId] = useState<SurfaceId>("sphere");
  const [u, setU] = useState(1.2);
  const [v, setV] = useState(1.5);
  const showAxes = true;
  const [tangentsVisible, setTangentsVisible] = useState(true);

  const surface = PARAMETRIC_SURFACES[surfaceId];
  const [x, y, z] = surface.point(u, v);
  const [dux, duy, duz] = surface.du(u, v);
  const [dvx, dvy, dvz] = surface.dv(u, v);

  const vpRef = useRef<Viewer3DViewportHandle<ParametricSurfaceScene> | null>(
    null,
  );

  const handleSurfaceChange = (id: SurfaceId): void => {
    setSurfaceId(id);
    const s = PARAMETRIC_SURFACES[id];
    setU(s.defaults.u);
    setV(s.defaults.v);
  };

  return (
    <ExpandableDemo id="parametric-surface-3d" height={height}>
      <KdeWindowShell
        title="三维参数曲面、网格曲线与切平面"
        eyebrow="微积分 · 多元函数曲面"
        mark="r(u,v)"
        modeTag="参数曲面与微切空间"
        tabs={
          <KdeTabs
            options={SURFACE_OPTIONS}
            value={surfaceId}
            onChange={handleSurfaceChange}
          />
        }
        display={
          <Viewer3DViewport
            ref={vpRef}
            heightClass="h-[var(--demo-height,28rem)]"
            factory={() => createParametricSurfaceScene()}
            onUpdate={({ api }) => {
              api.setSurface(surfaceId);
              api.setParams(u, v);
              api.setAxesVisible(showAxes);
              api.setTangentsVisible(tangentsVisible);
            }}
            deps={[surfaceId, u, v, showAxes, tangentsVisible]}
          />
        }
        controls={
          <div className="space-y-3">
            <KdeCard title="曲面参数与可视性" variant="dense">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <ParamSlider
                    label="$u$"
                    min={surface.uMin}
                    max={surface.uMax}
                    step={0.02}
                    value={u}
                    onChange={setU}
                    widthClass="w-full"
                    labelMode="adaptive"
                  />
                  <ParamSlider
                    label="$v$"
                    min={surface.vMin}
                    max={surface.vMax}
                    step={0.02}
                    value={v}
                    onChange={setV}
                    widthClass="w-full"
                    labelMode="adaptive"
                  />
                </div>
                <div className="pt-2 border-t border-border/50">
                  <KdeCheckbox
                    label="显示切向量与切平面"
                    checked={tangentsVisible}
                    onChange={setTangentsVisible}
                    size="xs"
                  />
                </div>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                左键旋转 · 滚轮缩放 · 右键平移；黄色为固定 $v$ 的 $u$
                参数线，青色为固定 $u$ 的 $v$ 参数线，红点为{" "}
                {"$\\mathbf{r}(u,v)$"}；浅蓝面为切平面。
              </p>
            </KdeCard>

            <KdeCard title="曲面方程与切向量读数" variant="dense">
              <div className="space-y-2">
                <KdeReadout
                  label="参数曲面方程 r(u, v)"
                  value={`$\\mathbf{r}(u,v) = ${surface.tex}$`}
                  dense
                />
                <KdeReadout
                  label={`曲面点 r(${u.toFixed(2)}, ${v.toFixed(2)})`}
                  value={`(${x.toFixed(3)},\\, ${y.toFixed(3)},\\, ${z.toFixed(3)})`}
                  variant="accent"
                  dense
                />
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
                  <KdeReadout
                    label="∂r/∂u 切向量"
                    value={`(${dux.toFixed(2)}, ${duy.toFixed(2)}, ${duz.toFixed(2)})`}
                    variant="warning"
                    dense
                  />
                  <KdeReadout
                    label="∂r/∂v 切向量"
                    value={`(${dvx.toFixed(2)}, ${dvy.toFixed(2)}, ${dvz.toFixed(2)})`}
                    variant="success"
                    dense
                  />
                </div>
              </div>
            </KdeCard>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
