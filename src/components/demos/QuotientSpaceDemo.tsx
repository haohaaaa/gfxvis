import { useState, useRef } from "react";
import { Vector3 } from "three";
import {
  createQuotientSpaceScene,
  type QuotientMode,
} from "../../visualizations/scenes/linear-algebra/quotient-space";
import { attachGizmo3D } from "../../visualizations/core/3d/gizmo3d";
import Viewer3DViewport from "../framework/Viewer3DViewport";
import ExpandableDemo from "../framework/ExpandableDemo";
import ParamSlider from "../framework/ParamSlider";
import PresetSelector, { type PresetOption } from "../framework/PresetSelector";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeTabs from "../framework/KdeTabs";

const MODE_OPTIONS = [
  {
    id: "line" as const,
    label: "模掉一维直线子空间 U (dim U = 1, dim V/U = 2)",
  },
  {
    id: "plane" as const,
    label: "模掉二维平面子空间 U (dim U = 2, dim V/U = 1)",
  },
];

const LINE_PRESETS: PresetOption[] = [
  { id: "diag", label: "体对角线 (1, 1, 1)" },
  { id: "z_axis", label: "标准 z 轴 (0, 0, 1)" },
  { id: "skew_xy", label: "横向斜线 (2, 1, 0)" },
  { id: "skew_xz", label: "切向斜线 (1, 0, 1)" },
  { id: "custom", label: "自定义方向" },
];

const PLANE_PRESETS: PresetOption[] = [
  { id: "diag_plane", label: "等权斜面 x+y+z=0" },
  { id: "xy_plane", label: "标准 xy 平面 z=0" },
  { id: "steep_plane", label: "陡峭切面 2x+y=0" },
  { id: "custom", label: "自定义法向" },
];

const SLIDER_MIN = -3.0;
const SLIDER_MAX = 3.0;
const SLIDER_STEP = 0.1;

export default function QuotientSpaceDemo({ height }: { height?: string }) {
  const [mode, setMode] = useState<QuotientMode>("line");
  const [presetKey, setPresetKey] = useState("diag");

  const [azimuthDeg, setAzimuthDeg] = useState(45);
  const [elevationDeg, setElevationDeg] = useState(35.26);
  const [showAngles, setShowAngles] = useState(false);

  const [vector, setVector] = useState({ x: 1.5, y: 1.2, z: 2.0 });
  const [collapseT, setCollapseT] = useState(0);
  const showAxes = true;

  const vectorRef = useRef(vector);
  vectorRef.current = vector;

  // Sync mode changes
  const handleModeChange = (newModeId: QuotientMode) => {
    setMode(newModeId);
    if (newModeId === "line") {
      setPresetKey("diag");
      setAzimuthDeg(45);
      setElevationDeg(35.26);
    } else {
      setPresetKey("diag_plane");
      setAzimuthDeg(45);
      setElevationDeg(35.26);
    }
  };

  // Sync presets
  const handlePresetChange = (key: string) => {
    setPresetKey(key);
    if (key === "custom") {
      setShowAngles(true);
      return;
    }
    if (mode === "line") {
      if (key === "diag") {
        setAzimuthDeg(45);
        setElevationDeg(35.26);
      } else if (key === "z_axis") {
        setAzimuthDeg(0);
        setElevationDeg(90);
      } else if (key === "skew_xy") {
        setAzimuthDeg(26.57);
        setElevationDeg(0);
      } else if (key === "skew_xz") {
        setAzimuthDeg(0);
        setElevationDeg(45);
      }
    } else {
      if (key === "diag_plane") {
        setAzimuthDeg(45);
        setElevationDeg(35.26);
      } else if (key === "xy_plane") {
        setAzimuthDeg(0);
        setElevationDeg(90);
      } else if (key === "steep_plane") {
        setAzimuthDeg(26.57);
        setElevationDeg(0);
      }
    }
  };

  // Unit direction vector u
  const azRad = (azimuthDeg * Math.PI) / 180;
  const elRad = (elevationDeg * Math.PI) / 180;
  const cosEl = Math.cos(elRad);
  const sinEl = Math.sin(elRad);
  const cosAz = Math.cos(azRad);
  const sinAz = Math.sin(azRad);

  const uVec = new Vector3(cosEl * cosAz, cosEl * sinAz, sinEl).normalize();
  const v = new Vector3(vector.x, vector.y, vector.z);

  const parallelComp = v.dot(uVec);
  const vParallel = uVec.clone().multiplyScalar(parallelComp);
  const vPerp = v.clone().sub(vParallel);

  const distToU = mode === "line" ? vPerp.length() : Math.abs(parallelComp);

  const xStr = vector.x.toFixed(1);
  const yStr = vector.y.toFixed(1);
  const zStr = vector.z.toFixed(1);

  const qxStr = (mode === "line" ? vPerp.x : vParallel.x).toFixed(1);
  const qyStr = (mode === "line" ? vPerp.y : vParallel.y).toFixed(1);
  const qzStr = (mode === "line" ? vPerp.z : vParallel.z).toFixed(1);

  const currentPresets = mode === "line" ? LINE_PRESETS : PLANE_PRESETS;

  return (
    <ExpandableDemo id="quotient-space" height={height}>
      <KdeWindowShell
        title="商空间与等价类几何流形"
        eyebrow="Linear Algebra · Quotient Space"
        mark="V/U"
        modeTag={
          mode === "line" ? "dim V/U = 2 (模掉直线)" : "dim V/U = 1 (模掉平面)"
        }
        display={
          <Viewer3DViewport
            factory={createQuotientSpaceScene}
            className="h-[var(--demo-height,28rem)]"
            onUpdate={({ api, viewer }) => {
              api.setMode(mode);
              api.setDirection(azimuthDeg, elevationDeg);
              api.setVector(vector.x, vector.y, vector.z);
              api.setCollapse(collapseT);
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
            }}
            deps={[mode, azimuthDeg, elevationDeg, vector, collapseT, showAxes]}
          >
            <Viewer3DViewport.Pin
              at={[vector.x, vector.y, vector.z]}
              offset={[0, -14]}
            >
              <div className="pointer-events-none rounded-md border border-amber-500/60 bg-amber-950/80 px-2 py-0.5 text-xs font-medium text-amber-300 shadow-md backdrop-blur-xs select-none">
                <span className="font-mono">
                  {collapseT < 0.05 ? (
                    <span>{`$\\mathbf{v} = (${xStr}, ${yStr}, ${zStr})$`}</span>
                  ) : (
                    <span>{"$\\mathbf{v}(t)$"} 坍缩中</span>
                  )}
                </span>
              </div>
            </Viewer3DViewport.Pin>

            <Viewer3DViewport.Pin
              at={[
                mode === "line" ? vPerp.x : vParallel.x,
                mode === "line" ? vPerp.y : vParallel.y,
                mode === "line" ? vPerp.z : vParallel.z,
              ]}
              offset={[0, 14]}
            >
              <div className="pointer-events-none rounded-md border border-indigo-500/60 bg-indigo-950/80 px-2 py-0.5 text-xs font-medium text-indigo-200 shadow-md backdrop-blur-xs select-none">
                <span className="font-mono">
                  {`$[\\mathbf{v}] \\in V/U \\; (${qxStr}, ${qyStr}, ${qzStr})$`}
                </span>
              </div>
            </Viewer3DViewport.Pin>

            {/* Legend Overlay */}
            <div className="pointer-events-none absolute bottom-5 left-3 z-10 flex flex-col gap-1 rounded-lg border border-slate-700/50 bg-slate-900/80 p-2 text-xs backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span className="text-slate-300">
                  子空间 $U$（{mode === "line" ? "倾斜直线" : "倾斜平面"}）
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-400" />
                <span className="text-slate-300">
                  商空间 {"$V/U \\cong U^\\perp$"}（
                  {mode === "line" ? "正交商平面" : "正交商法线"}）
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-slate-300">
                  当前点 {"$\\mathbf{v}$"} 与陪集纤维 {"$\\mathbf{v} + U$"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                <span className="text-slate-300">垂直投影虚线（坍缩轨迹）</span>
              </div>
            </div>
          </Viewer3DViewport>
        }
        controls={
          <div className="space-y-3">
            <KdeTabs
              options={MODE_OPTIONS}
              value={mode}
              onChange={(m: string) => handleModeChange(m as QuotientMode)}
            />

            <KdeCard title="预设场景与方向参数" variant="dense">
              <div className="space-y-2.5">
                <PresetSelector
                  label="子空间 U 预设:"
                  options={currentPresets}
                  value={presetKey}
                  onChange={handlePresetChange}
                />

                {showAngles && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--kde-border)]">
                    <ParamSlider
                      label="方位角 $\\varphi$"
                      value={azimuthDeg}
                      min={0}
                      max={360}
                      step={1}
                      onChange={(val) => {
                        setAzimuthDeg(val);
                        setPresetKey("custom");
                      }}
                      display={`${azimuthDeg}°`}
                      widthClass="w-full"
                    />
                    <ParamSlider
                      label="仰角 $\\theta$"
                      value={elevationDeg}
                      min={-90}
                      max={90}
                      step={1}
                      onChange={(val) => {
                        setElevationDeg(val);
                        setPresetKey("custom");
                      }}
                      display={`${elevationDeg}°`}
                      widthClass="w-full"
                    />
                  </div>
                )}
              </div>
            </KdeCard>

            <KdeCard title="陪集纤维坍缩动态演示" variant="dense">
              <div className="space-y-2">
                <ParamSlider
                  label="商映射坍缩进度 $t$"
                  value={collapseT}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={setCollapseT}
                  widthClass="w-full"
                  display={`${Math.round(collapseT * 100)}%`}
                />
                <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
                  <span>t=0: 三维空间完整纤维</span>
                  <button
                    type="button"
                    onClick={() => setCollapseT(collapseT > 0.5 ? 0 : 1)}
                    className="px-2 py-0.5 rounded bg-[var(--kde-panel)] border border-[var(--kde-border)] hover:bg-[var(--kde-hover)] text-foreground"
                  >
                    {collapseT > 0.5 ? "复原纤维 (t=0)" : "坍缩至商空间 (t=1)"}
                  </button>
                  <span>t=1: 压缩为商空间单点</span>
                </div>
              </div>
            </KdeCard>

            <KdeCard title="当前探测向量坐标 (x, y, z)" variant="dense">
              <div className="grid grid-cols-3 gap-2">
                <ParamSlider
                  label="$x$"
                  value={vector.x}
                  min={SLIDER_MIN}
                  max={SLIDER_MAX}
                  step={SLIDER_STEP}
                  onChange={(x) => setVector((prev) => ({ ...prev, x }))}
                  widthClass="w-full"
                />
                <ParamSlider
                  label="$y$"
                  value={vector.y}
                  min={SLIDER_MIN}
                  max={SLIDER_MAX}
                  step={SLIDER_STEP}
                  onChange={(y) => setVector((prev) => ({ ...prev, y }))}
                  widthClass="w-full"
                />
                <ParamSlider
                  label="$z$"
                  value={vector.z}
                  min={SLIDER_MIN}
                  max={SLIDER_MAX}
                  step={SLIDER_STEP}
                  onChange={(z) => setVector((prev) => ({ ...prev, z }))}
                  widthClass="w-full"
                />
              </div>
            </KdeCard>

            <div className="grid grid-cols-2 gap-1.5">
              <KdeReadout
                label="商空间维数"
                value={mode === "line" ? "dim V/U = 2" : "dim V/U = 1"}
                variant="accent"
                dense
              />
              <KdeReadout
                label="点到子空间距离"
                value={distToU.toFixed(2)}
                dense
              />
              <KdeReadout
                label="商点代表元 [v]"
                value={`(${qxStr}, ${qyStr}, ${qzStr})`}
                dense
              />
              <KdeReadout
                label="零类归属"
                value={distToU < 0.05 ? "[v] = [0] (在 U 内)" : "[v] ≠ [0]"}
                variant={distToU < 0.05 ? "success" : "default"}
                dense
              />
            </div>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
