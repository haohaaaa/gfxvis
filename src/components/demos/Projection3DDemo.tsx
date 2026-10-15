import { useState, useEffect, useRef } from "react";
import { Vector3 } from "three";
import {
  PROJECTION3D_TARGETS,
  createProjection3DScene,
  type ProjectionTargetId,
} from "../../visualizations/scenes/linear-algebra/projection3d";
import type { ProjectionModeId } from "../../visualizations/scenes/linear-algebra/projection2d";
import { mathToWorld } from "../../visualizations/core/3d/coords";
import { attachGizmo3D } from "../../visualizations/core/3d/gizmo3d";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import ParamSlider from "../framework/ParamSlider";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import { useViewer3D } from "../framework/useViewer3D";

const TARGET_OPTIONS: { id: ProjectionTargetId; label: string }[] = [
  { id: "xy-plane", label: "xy 平面" },
  { id: "plane-xyz", label: "x+y+z=0" },
];

const SLIDER_MIN = -2.5;
const SLIDER_MAX = 2.5;

/** 3D projection explorer: sliders set x = (x, y, z); pick target plane + mode. */
export default function Projection3DDemo({ height }: { height?: string }) {
  const [vector, setVector] = useState({ x: 2, y: 1.5, z: 1 });
  const [targetId, setTargetId] = useState<ProjectionTargetId>("xy-plane");
  const [modeId, setModeId] = useState<ProjectionModeId>("orthogonal");
  const showAxes = true;

  const vectorRef = useRef(vector);
  vectorRef.current = vector;

  const [screenPos, setScreenPos] = useState<{
    xTip: { x: number; y: number; visible: boolean };
    pxTip: { x: number; y: number; visible: boolean };
    midRes: { x: number; y: number; visible: boolean };
  }>({
    xTip: { x: 0, y: 0, visible: false },
    pxTip: { x: 0, y: 0, visible: false },
    midRes: { x: 0, y: 0, visible: false },
  });

  const target = PROJECTION3D_TARGETS[targetId];
  const mode = target.modes[modeId];
  const modeOptions = Object.values(target.modes).map((m) => ({
    id: m.id,
    label: m.label,
  }));

  const { containerRef, viewerRef } = useViewer3D(
    () => createProjection3DScene(),
    ({ api, viewer }) => {
      api.setTarget(targetId);
      api.setMode(modeId);
      api.setVector(
        vectorRef.current.x,
        vectorRef.current.y,
        vectorRef.current.z,
      );
      api.setAxesVisible(showAxes);

      return attachGizmo3D({
        domElement: viewer.renderer.domElement,
        camera: viewer.camera,
        controls: viewer.controls,
        gizmo: api.gizmo,
        bounds: {
          xMin: SLIDER_MIN,
          xMax: SLIDER_MAX,
          yMin: SLIDER_MIN,
          yMax: SLIDER_MAX,
          zMin: SLIDER_MIN,
          zMax: SLIDER_MAX,
        },
        getPosition: () => vectorRef.current,
        onPositionChange: (pos) => {
          setVector(pos);
          api.setVector(pos.x, pos.y, pos.z);
        },
        render: () => viewer.render(),
      });
    },
    [targetId, modeId, showAxes],
  );

  const [px, py, pz] = mode.project(vector.x, vector.y, vector.z);
  const [rx, ry, rz] = mode.residual(vector.x, vector.y, vector.z);

  // Continuously update 3D -> 2D screen positions as camera moves
  useEffect(() => {
    let rafId = 0;
    const projectToScreen = () => {
      const viewer = viewerRef.current;
      const container = containerRef.current;
      if (viewer && container) {
        const camera = viewer.camera;
        const w = container.clientWidth;
        const h = container.clientHeight;

        const [currPx, currPy, currPz] = mode.project(
          vector.x,
          vector.y,
          vector.z,
        );
        const wx = mathToWorld(vector.x, vector.y, vector.z);
        const wpx = mathToWorld(currPx, currPy, currPz);
        const wmid = [
          (wx[0] + wpx[0]) / 2,
          (wx[1] + wpx[1]) / 2,
          (wx[2] + wpx[2]) / 2,
        ];

        const toScreen = (pt: number[]) => {
          const v = new Vector3(pt[0], pt[1], pt[2]);
          v.project(camera);
          return {
            x: (v.x * 0.5 + 0.5) * w,
            y: (-v.y * 0.5 + 0.5) * h,
            visible:
              v.z < 1 && v.x >= -1.1 && v.x <= 1.1 && v.y >= -1.1 && v.y <= 1.1,
          };
        };

        setScreenPos({
          xTip: toScreen(wx),
          pxTip: toScreen(wpx),
          midRes: toScreen(wmid),
        });
      }
      rafId = requestAnimationFrame(projectToScreen);
    };

    rafId = requestAnimationFrame(projectToScreen);
    return () => cancelAnimationFrame(rafId);
  }, [vector, targetId, modeId, mode, viewerRef, containerRef]);

  return (
    <AutoMath>
      <ExpandableDemo id="projection-3d" height={height}>
        <KdeWindowShell
          title="3D 空间平面投影与幂等分解 (3D Plane Projection)"
          eyebrow="Linear Algebra · 3D Geometric Projection"
          mark="P²x = Px"
          modeTag={mode.label}
          display={
            <div
              ref={containerRef}
              className="relative h-[var(--demo-height,28rem)] w-full overflow-hidden rounded-xl border border-border bg-slate-950"
            >
              <CanvasToolbar
                onReset={() => viewerRef.current?.controls.reset()}
              />

              {/* 3D Floating Vector Badges */}
              {screenPos.xTip.visible && (
                <div
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-slate-900/90 px-2.5 py-0.5 text-xs font-bold text-white shadow-md backdrop-blur-xs select-none"
                  style={{ left: screenPos.xTip.x, top: screenPos.xTip.y - 14 }}
                >
                  x = ({vector.x.toFixed(2)}, {vector.y.toFixed(2)},{" "}
                  {vector.z.toFixed(2)})
                </div>
              )}

              {screenPos.pxTip.visible && (
                <div
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 bg-blue-600/90 px-2.5 py-0.5 text-xs font-bold text-white shadow-md backdrop-blur-xs select-none"
                  style={{
                    left: screenPos.pxTip.x,
                    top: screenPos.pxTip.y + 14,
                  }}
                >
                  Px = ({px.toFixed(2)}, {py.toFixed(2)}, {pz.toFixed(2)})
                </div>
              )}

              {screenPos.midRes.visible && (
                <div
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-slate-600/90 px-2 py-0.5 text-[11px] font-bold text-white shadow-md backdrop-blur-xs select-none"
                  style={{ left: screenPos.midRes.x, top: screenPos.midRes.y }}
                >
                  (I - P)x = ({rx.toFixed(2)}, {ry.toFixed(2)}, {rz.toFixed(2)})
                </div>
              )}

              <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
            </div>
          }
          controls={
            <div className="space-y-3">
              <KdeCard title="目标子空间平面与投影类型" variant="dense">
                <div className="space-y-2">
                  <div>
                    <div className="text-[11px] text-muted mb-1 font-medium">
                      目标平面：
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
                      options={modeOptions}
                      value={modeId}
                      onChange={(id: string) =>
                        setModeId(id as ProjectionModeId)
                      }
                      size="xs"
                    />
                  </div>
                </div>
              </KdeCard>

              <KdeCard title="探测向量坐标 x = (x, y, z)" variant="dense">
                <div className="space-y-2">
                  <ParamSlider
                    label="$x$"
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    step={0.05}
                    value={vector.x}
                    onChange={(v) => setVector((s) => ({ ...s, x: v }))}
                    widthClass="w-full"
                  />
                  <ParamSlider
                    label="$y$"
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    step={0.05}
                    value={vector.y}
                    onChange={(v) => setVector((s) => ({ ...s, y: v }))}
                    widthClass="w-full"
                  />
                  <ParamSlider
                    label="$z$"
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    step={0.05}
                    value={vector.z}
                    onChange={(v) => setVector((s) => ({ ...s, z: v }))}
                    widthClass="w-full"
                  />
                </div>
              </KdeCard>

              <div className="grid grid-cols-2 gap-1.5">
                <KdeReadout
                  label="原向量 x"
                  value={`(${vector.x.toFixed(2)}, ${vector.y.toFixed(2)}, ${vector.z.toFixed(2)})`}
                  dense
                />
                <KdeReadout
                  label="投影向量 Px"
                  value={`(${px.toFixed(2)}, ${py.toFixed(2)}, ${pz.toFixed(2)})`}
                  variant="accent"
                  dense
                />
                <KdeReadout
                  label="残差向量 (I-P)x"
                  value={`(${rx.toFixed(2)}, ${ry.toFixed(2)}, ${rz.toFixed(2)})`}
                  dense
                />
                <KdeReadout
                  label="幂等性质 P² = P"
                  value="严格成立 (落点重合)"
                  variant="success"
                  dense
                />
              </div>

              <KdeCard title="投影矩阵代数解析" variant="dense">
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
                左键旋转视角 · 滚轮缩放 · 右键平移；使用滑块或直接拖拽 3D Gizmo
                控制向量位置；空心环为二次投影落点 $P^2x=Px$。
              </p>
            </div>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
