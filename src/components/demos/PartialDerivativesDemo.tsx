import { useRef, useState } from "react";
import * as THREE from "three";
import { clamp } from "@math";
import { attachDrag3D } from "../../visualizations/core/3d/drag3d";
import {
  DOMAIN,
  SURFACE_FN,
} from "../../visualizations/scenes/calculus/bivariate-surface";
import {
  createPartialDerivScene,
  type FixMode,
} from "../../visualizations/scenes/calculus/bivariate-partials";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeCheckbox from "../framework/KdeCheckbox";
import KdeReadout from "../framework/KdeReadout";
import { useViewer3D } from "../framework/useViewer3D";

const MODE_OPTIONS: { id: FixMode; label: string }[] = [
  { id: "x", label: "固定 x 坐标 (截出 y 向曲线)" },
  { id: "y", label: "固定 y 坐标 (截出 x 向曲线)" },
];

export default function PartialDerivativesDemo({
  height,
}: {
  height?: string;
}) {
  const [mode, setMode] = useState<FixMode>("x");
  const [fixed, setFixed] = useState(0.5);
  const [free, setFree] = useState(0.8);
  const showAxes = true;
  const [surfaceTransparent, setSurfaceTransparent] = useState(true);
  const modeRef = useRef<FixMode>("x");
  const fixedRef = useRef(0.5);
  const gestureRef = useRef<"marker" | "plane" | null>(null);
  const grabYRef = useRef(0);
  const raycasterRef = useRef(new THREE.Raycaster());
  modeRef.current = mode;
  fixedRef.current = fixed;

  const { containerRef, viewerRef } = useViewer3D(
    () => createPartialDerivScene(),
    ({ api, viewer }) => {
      api.setState(mode, fixed, free);
      api.setAxesVisible(showAxes);
      api.setSurfaceTransparent(surfaceTransparent);

      return attachDrag3D({
        domElement: viewer.renderer.domElement,
        camera: viewer.camera,
        controls: viewer.controls,
        targets: [api.slicePlane, api.marker],
        onDragStart(hit) {
          if (hit.object === api.marker) {
            gestureRef.current = "marker";
          } else {
            gestureRef.current = "plane";
            grabYRef.current = hit.point.y;
          }
        },
        onDrag(hit, event) {
          if (gestureRef.current === "marker") {
            const rect = viewer.renderer.domElement.getBoundingClientRect();
            const ndc = new THREE.Vector2(
              ((event.clientX - rect.left) / rect.width) * 2 - 1,
              -((event.clientY - rect.top) / rect.height) * 2 + 1,
            );
            raycasterRef.current.setFromCamera(ndc, viewer.camera);
            const slice = new THREE.Plane(
              modeRef.current === "x"
                ? new THREE.Vector3(1, 0, 0)
                : new THREE.Vector3(0, 0, 1),
              modeRef.current === "x" ? -fixedRef.current : fixedRef.current,
            );
            const world = new THREE.Vector3();
            if (raycasterRef.current.ray.intersectPlane(slice, world)) {
              const value = modeRef.current === "x" ? -world.z : world.x;
              setFree(clamp(value, -DOMAIN, DOMAIN));
            }
            return;
          }
          if (gestureRef.current !== "plane") return;
          const rect = viewer.renderer.domElement.getBoundingClientRect();
          const ndc = new THREE.Vector2(
            ((event.clientX - rect.left) / rect.width) * 2 - 1,
            -((event.clientY - rect.top) / rect.height) * 2 + 1,
          );
          raycasterRef.current.setFromCamera(ndc, viewer.camera);
          const ground = new THREE.Plane(
            new THREE.Vector3(0, 1, 0),
            -grabYRef.current,
          );
          const world = new THREE.Vector3();
          if (raycasterRef.current.ray.intersectPlane(ground, world)) {
            const value = modeRef.current === "x" ? world.x : -world.z;
            setFixed(clamp(value, -DOMAIN, DOMAIN));
          }
        },
      });
    },
    [mode, fixed, free, showAxes, surfaceTransparent],
  );

  const value = SURFACE_FN.f(fixed, free);
  const slope =
    mode === "x" ? SURFACE_FN.fy(fixed, free) : SURFACE_FN.fx(free, fixed);

  return (
    <AutoMath>
      <ExpandableDemo id="partial-derivatives" height={height}>
        <KdeWindowShell
          title="多元函数偏导数剖面与切线几何"
          eyebrow="微积分 · 多元微分"
          mark="∂f/∂x"
          modeTag="剖面曲线与偏导切线"
          tabs={
            <KdeTabs
              options={MODE_OPTIONS}
              value={mode}
              onChange={(id) => setMode(id as FixMode)}
            />
          }
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
              <KdeCard title="剖面切片设置" variant="dense">
                <div className="space-y-3">
                  <KdeCheckbox
                    label="曲面半透明渲染"
                    checked={surfaceTransparent}
                    onChange={setSurfaceTransparent}
                    size="xs"
                  />
                  <p className="text-[11px] text-muted leading-relaxed">
                    交互方式：直接拖拽蓝色切片平面改变固定值，拖拽曲面上的红点沿截面曲线移动；青色箭头为当前偏导切线。
                  </p>
                </div>
              </KdeCard>

              <KdeCard title="偏导数数值与截面读数" variant="dense">
                <div className="space-y-2">
                  <KdeReadout
                    label={`采样点 (${mode === "x" ? "固定 x" : "固定 y"})`}
                    value={`(${mode === "x" ? fixed.toFixed(2) : free.toFixed(2)}, ${mode === "x" ? free.toFixed(2) : fixed.toFixed(2)})`}
                    subValue={`函数值 f = ${value.toFixed(3)}`}
                    dense
                  />
                  <KdeReadout
                    label={
                      mode === "x"
                        ? "偏导数 ∂f/∂y (沿 y 轴剖面斜率)"
                        : "偏导数 ∂f/∂x (沿 x 轴剖面斜率)"
                    }
                    value={slope.toFixed(3)}
                    variant="accent"
                    dense
                  />
                  <KdeReadout
                    label="截面自由变量"
                    value={`${mode === "x" ? "y" : "x"} = ${free.toFixed(2)}`}
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
