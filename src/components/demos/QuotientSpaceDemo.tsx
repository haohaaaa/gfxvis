import { useState, useEffect, useRef } from "react";
import { Vector3 } from "three";
import {
  createQuotientSpaceScene,
  type QuotientMode,
} from "../../visualizations/scenes/linear-algebra/quotient-space";
import { attachGizmo3D } from "../../visualizations/core/3d/gizmo3d";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import ParamSlider from "../framework/ParamSlider";
import PresetSelector, { type PresetOption } from "../framework/PresetSelector";
import { useViewer3D } from "../framework/useViewer3D";
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
  { id: "xy_plane", label: "标准 xy 平面 (z=0)" },
  { id: "symm_plane", label: "垂直面对角 x-y=0" },
  { id: "tilt_plane", label: "切斜面 x+z=0" },
  { id: "custom", label: "自定义法向" },
];

const SLIDER_MIN = -2.5;
const SLIDER_MAX = 2.5;

export default function QuotientSpaceDemo({ height }: { height?: string }) {
  const [mode, setMode] = useState<QuotientMode>("line");
  const [presetKey, setPresetKey] = useState<string>("diag");
  const [azimuthDeg, setAzimuthDeg] = useState<number>(45);
  const [elevationDeg, setElevationDeg] = useState<number>(35.26);
  const [showAngles, setShowAngles] = useState<boolean>(false);

  const [vector, setVector] = useState({ x: 1.4, y: 1.0, z: 1.5 });
  const [collapseT, setCollapseT] = useState<number>(0);
  const [isSlidingAnim, setIsSlidingAnim] = useState<boolean>(false);
  const showAxes = true;

  const vectorRef = useRef(vector);
  vectorRef.current = vector;
  const collapseRef = useRef(collapseT);
  collapseRef.current = collapseT;
  const azimuthRef = useRef(azimuthDeg);
  azimuthRef.current = azimuthDeg;
  const elevationRef = useRef(elevationDeg);
  elevationRef.current = elevationDeg;

  // Screen-projected positions for floating 3D labels
  const [screenPos, setScreenPos] = useState<{
    point: { x: number; y: number; visible: boolean };
    quotient: { x: number; y: number; visible: boolean };
  }>({
    point: { x: 0, y: 0, visible: false },
    quotient: { x: 0, y: 0, visible: false },
  });

  const { containerRef, apiRef, viewerRef } = useViewer3D(
    () => createQuotientSpaceScene(),
    ({ api, viewer }) => {
      api.setMode(mode);
      api.setDirection(azimuthRef.current, elevationRef.current);
      api.setVector(
        vectorRef.current.x,
        vectorRef.current.y,
        vectorRef.current.z,
      );
      api.setCollapse(collapseRef.current);
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
    [mode, showAxes],
  );

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
      } else if (key === "symm_plane") {
        setAzimuthDeg(-45);
        setElevationDeg(0);
      } else if (key === "tilt_plane") {
        setAzimuthDeg(0);
        setElevationDeg(45);
      }
    }
  };

  // Sync direction angles
  useEffect(() => {
    const api = apiRef.current;
    const viewer = viewerRef.current;
    if (api && viewer) {
      api.setDirection(azimuthDeg, elevationDeg);
      viewer.render();
    }
  }, [azimuthDeg, elevationDeg, apiRef, viewerRef]);

  // Sync collapse slider to 3D scene
  useEffect(() => {
    const api = apiRef.current;
    const viewer = viewerRef.current;
    if (api && viewer) {
      api.setCollapse(collapseT);
      viewer.render();
    }
  }, [collapseT, apiRef, viewerRef]);

  // Sync vector changes to 3D scene
  useEffect(() => {
    const api = apiRef.current;
    const viewer = viewerRef.current;
    if (api && viewer) {
      api.setVector(vector.x, vector.y, vector.z);
      viewer.render();
    }
  }, [vector, apiRef, viewerRef]);

  // Decomposition calculation
  const thetaRad = (azimuthDeg * Math.PI) / 180;
  const phiRad = (elevationDeg * Math.PI) / 180;
  const uX = Math.cos(phiRad) * Math.cos(thetaRad);
  const uY = Math.cos(phiRad) * Math.sin(thetaRad);
  const uZ = Math.sin(phiRad);
  const uVec = new Vector3(uX, uY, uZ).normalize();
  const vVec = new Vector3(vector.x, vector.y, vector.z);

  const dotVal = vVec.dot(uVec);
  const vParallel = uVec.clone().multiplyScalar(dotVal);
  const vPerp = vVec.clone().sub(vParallel);

  const decomp = {
    u: [uVec.x, uVec.y, uVec.z] as [number, number, number],
    parallelVal: dotVal,
    parallel: [vParallel.x, vParallel.y, vParallel.z] as [
      number,
      number,
      number,
    ],
    perp: [vPerp.x, vPerp.y, vPerp.z] as [number, number, number],
  };

  // Smooth animation sliding along fiber
  useEffect(() => {
    if (!isSlidingAnim) return;
    let animId = 0;
    const startS = decomp.parallelVal;
    const startTime = performance.now();

    const frame = (tNow: number) => {
      const elapsed = (tNow - startTime) / 1000;
      const offset = 1.3 * Math.sin(elapsed * 2.5);
      const newS = startS + offset;

      // Update vector by preserving v_perp and changing parallel component
      const curU = new Vector3(...decomp.u);
      const curVPerp = new Vector3(...decomp.perp);
      const newV = curVPerp.clone().addScaledVector(curU, newS);

      const nextPos = {
        x: Number(newV.x.toFixed(2)),
        y: Number(newV.y.toFixed(2)),
        z: Number(newV.z.toFixed(2)),
      };
      setVector(nextPos);

      animId = requestAnimationFrame(frame);
    };

    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [isSlidingAnim, decomp.parallelVal, decomp.u, decomp.perp]);

  // Continuous screen projection for floating HTML badges
  useEffect(() => {
    let rafId = 0;
    const projectToScreen = () => {
      const viewer = viewerRef.current;
      const api = apiRef.current;
      const container = containerRef.current;
      if (viewer && container && api) {
        const camera = viewer.camera;
        const w = container.clientWidth;
        const h = container.clientHeight;

        const toScreen = (pos: Vector3) => {
          const p = pos.clone().project(camera);
          const x = ((p.x + 1) / 2) * w;
          const y = ((-p.y + 1) / 2) * h;
          return { x, y, visible: p.z < 1 };
        };

        const ptPos = api.getPointWorldPos();
        const qPos = api.getQuotientWorldPos();

        setScreenPos({
          point: toScreen(ptPos),
          quotient: toScreen(qPos),
        });
      }
      rafId = requestAnimationFrame(projectToScreen);
    };

    rafId = requestAnimationFrame(projectToScreen);
    return () => cancelAnimationFrame(rafId);
  }, [
    vector,
    mode,
    collapseT,
    azimuthDeg,
    elevationDeg,
    viewerRef,
    containerRef,
    apiRef,
  ]);

  // Dedicated slider handlers: moving strictly along U
  const handleParallelChange = (newS: number) => {
    const newV = vPerp.clone().addScaledVector(uVec, newS);
    setVector({
      x: Number(newV.x.toFixed(2)),
      y: Number(newV.y.toFixed(2)),
      z: Number(newV.z.toFixed(2)),
    });
  };

  const xStr = vector.x.toFixed(1);
  const yStr = vector.y.toFixed(1);
  const zStr = vector.z.toFixed(1);

  const qxStr = (mode === "line" ? vPerp.x : vParallel.x).toFixed(1);
  const qyStr = (mode === "line" ? vPerp.y : vParallel.y).toFixed(1);
  const qzStr = (mode === "line" ? vPerp.z : vParallel.z).toFixed(1);

  const currentPresets = mode === "line" ? LINE_PRESETS : PLANE_PRESETS;

  return (
    <AutoMath>
      <ExpandableDemo id="quotient-space" height={height}>
        <KdeWindowShell
          title="商空间与等价类几何流形"
          eyebrow="Linear Algebra · Quotient Space"
          mark="V/U"
          modeTag={
            mode === "line"
              ? "dim V/U = 2 (模掉直线)"
              : "dim V/U = 1 (模掉平面)"
          }
          display={
            <div
              ref={containerRef}
              className="relative h-[var(--demo-height,28rem)] w-full overflow-hidden rounded-md border border-slate-800 bg-slate-950"
            >
              <CanvasToolbar
                onReset={() => {
                  const viewer = viewerRef.current;
                  if (viewer) {
                    viewer.camera.position.set(4.5, 3.8, 5.2);
                    viewer.camera.lookAt(0, 0, 0);
                    viewer.controls.target.set(0, 0, 0);
                    viewer.controls.update();
                    viewer.render();
                  }
                }}
              />

              {screenPos.point.visible && (
                <div
                  className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-amber-500/60 bg-amber-950/80 px-2 py-0.5 text-xs font-medium text-amber-300 shadow-md backdrop-blur-sm"
                  style={{
                    left: `${screenPos.point.x}px`,
                    top: `${screenPos.point.y - 12}px`,
                  }}
                >
                  <span className="font-mono">
                    {collapseT < 0.05 ? (
                      <span>{`$\\mathbf{v} = (${xStr}, ${yStr}, ${zStr})$`}</span>
                    ) : (
                      <span>{"$\\mathbf{v}(t)$"} 坍缩中</span>
                    )}
                  </span>
                </div>
              )}

              {screenPos.quotient.visible && (
                <div
                  className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-indigo-500/60 bg-indigo-950/80 px-2 py-0.5 text-xs font-medium text-indigo-200 shadow-md backdrop-blur-sm"
                  style={{
                    left: `${screenPos.quotient.x}px`,
                    top: `${screenPos.quotient.y - 14}px`,
                  }}
                >
                  <span className="font-mono">
                    {`$[\\mathbf{v}] \\in V/U \\; (${qxStr}, ${qyStr}, ${qzStr})$`}
                  </span>
                </div>
              )}

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
                  <span className="text-slate-300">
                    垂直投影虚线（坍缩轨迹）
                  </span>
                </div>
              </div>

              <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
            </div>
          }
          controls={
            <div className="space-y-3">
              <KdeCard title="子空间维度与基底配置" variant="dense">
                <div className="space-y-2">
                  <KdeTabs
                    options={MODE_OPTIONS}
                    value={mode}
                    onChange={handleModeChange}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <PresetSelector
                      label={
                        mode === "line" ? (
                          <span>子空间 $U$ 方向:</span>
                        ) : (
                          <span>子空间 $U$ 法向:</span>
                        )
                      }
                      options={currentPresets}
                      value={presetKey}
                      onChange={handlePresetChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAngles(!showAngles)}
                      className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-medium transition"
                    >
                      {showAngles ? (
                        <span>收起角度微调 ▲</span>
                      ) : (
                        <span>
                          微调方向角（方位角 $\theta$ / 仰角 $\phi$）▼
                        </span>
                      )}
                    </button>
                  </div>

                  {showAngles && (
                    <div className="grid grid-cols-1 gap-2 rounded border border-slate-700/60 bg-slate-900/40 p-2 sm:grid-cols-2">
                      <ParamSlider
                        label="方位角 $\theta$"
                        labelMode="adaptive"
                        widthClass="w-full"
                        value={azimuthDeg}
                        min={0}
                        max={360}
                        step={1}
                        onChange={(val) => {
                          setAzimuthDeg(val);
                          setPresetKey("custom");
                        }}
                        display={`${azimuthDeg.toFixed(0)}°`}
                      />
                      <ParamSlider
                        label="仰角 $\phi$"
                        labelMode="adaptive"
                        widthClass="w-full"
                        value={elevationDeg}
                        min={-85}
                        max={85}
                        step={1}
                        onChange={(val) => {
                          setElevationDeg(val);
                          setPresetKey("custom");
                        }}
                        display={`${elevationDeg.toFixed(0)}°`}
                      />
                    </div>
                  )}
                </div>
              </KdeCard>

              <KdeCard
                title="商空间几何坍缩 (Collapse Mapping)"
                variant="dense"
              >
                <div className="space-y-1.5">
                  <ParamSlider
                    label="坍缩进度 $t$"
                    labelMode="adaptive"
                    widthClass="w-full"
                    value={collapseT}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(val) => setCollapseT(val)}
                    display={
                      collapseT === 0
                        ? "t = 0 (3D 原始空间)"
                        : collapseT === 1
                          ? "t = 1 (完全压入商空间)"
                          : `t = ${collapseT.toFixed(2)}`
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    当 $t$ 从 0 增至 1 时，所有平行于 $U$ 的几何纤维沿 $U$
                    方向等比缩短，最终彻底坍缩为商空间载体 $U^\perp$
                    上的唯一点。
                  </p>
                </div>
              </KdeCard>

              <KdeCard title="向量坐标调节与陪集纤维滑动验证" variant="dense">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/50 pb-2">
                    <span className="text-xs font-medium text-foreground">
                      {"向量 $\\mathbf{v}$ 三维分量"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsSlidingAnim(!isSlidingAnim)}
                      className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition ${
                        isSlidingAnim
                          ? "border border-amber-500/50 bg-amber-500/20 text-amber-300"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {isSlidingAnim ? (
                        "⏸ 暂停滑动"
                      ) : (
                        <span>
                          {"▶ 沿纤维滑动演示（验证 $[\\mathbf{v}]$ 不变）"}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <ParamSlider
                      label="$v_x$"
                      labelMode="adaptive"
                      widthClass="w-full"
                      value={vector.x}
                      min={SLIDER_MIN}
                      max={SLIDER_MAX}
                      step={0.1}
                      onChange={(val) =>
                        setVector((prev) => ({ ...prev, x: val }))
                      }
                      display={vector.x.toFixed(1)}
                    />
                    <ParamSlider
                      label="$v_y$"
                      labelMode="adaptive"
                      widthClass="w-full"
                      value={vector.y}
                      min={SLIDER_MIN}
                      max={SLIDER_MAX}
                      step={0.1}
                      onChange={(val) =>
                        setVector((prev) => ({ ...prev, y: val }))
                      }
                      display={vector.y.toFixed(1)}
                    />
                    <ParamSlider
                      label="$v_z$"
                      labelMode="adaptive"
                      widthClass="w-full"
                      value={vector.z}
                      min={SLIDER_MIN}
                      max={SLIDER_MAX}
                      step={0.1}
                      onChange={(val) =>
                        setVector((prev) => ({ ...prev, z: val }))
                      }
                      display={vector.z.toFixed(1)}
                    />
                  </div>

                  <div className="rounded-md border border-primary/25 bg-primary/5 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-foreground">
                        {
                          "沿子空间 $U$ 移动分量（改变 $\\mathbf{v}_\\parallel$，验证商类 $[\\mathbf{v}]$ 绝对静止）"
                        }
                      </span>
                      <span className="rounded bg-primary/15 px-2 py-0.5 text-xs font-mono text-primary">
                        {"$[\\mathbf{v}] = \\mathbf{v}_\\perp$ 恒定"}
                      </span>
                    </div>
                    <ParamSlider
                      label={
                        mode === "line"
                          ? "$s = \\mathbf{v} \\cdot \\mathbf{u}$"
                          : "$h = \\mathbf{v} \\cdot \\mathbf{n}$"
                      }
                      labelMode="adaptive"
                      widthClass="w-full"
                      value={decomp.parallelVal}
                      min={-3}
                      max={3}
                      step={0.05}
                      onChange={handleParallelChange}
                      display={decomp.parallelVal.toFixed(2)}
                    />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {
                        "拖动此滑块，点 $\\mathbf{v}$ 严格在当前陪集纤维内位移；而商空间中的点 $[\\mathbf{v}]$ 纹丝不动！"
                      }
                    </p>
                  </div>
                </div>
              </KdeCard>

              <div className="grid grid-cols-2 gap-1.5">
                <KdeReadout
                  label={mode === "line" ? "子空间方向 u" : "子空间法向 n"}
                  value={`(${uVec.x.toFixed(2)}, ${uVec.y.toFixed(2)}, ${uVec.z.toFixed(2)})`}
                  dense
                />
                <KdeReadout
                  label="当前向量 v"
                  value={`(${xStr}, ${yStr}, ${zStr})`}
                  dense
                />
                <KdeReadout
                  label="属于 U 的分量 v_||"
                  value={`(${decomp.parallel[0].toFixed(2)}, ${decomp.parallel[1].toFixed(2)}, ${decomp.parallel[2].toFixed(2)})`}
                  dense
                />
                <KdeReadout
                  label="商空间代表元 [v] = v_perp"
                  value={`(${decomp.perp[0].toFixed(2)}, ${decomp.perp[1].toFixed(2)}, ${decomp.perp[2].toFixed(2)})`}
                  variant="accent"
                  dense
                />
              </div>

              <div className="rounded-md border border-slate-700/60 bg-slate-900/50 p-2.5 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  💡 商空间核心直觉：
                </span>
                {
                  " 沿任意方向的子空间 $U$ 移动，仅改变 $\\mathbf{v}_\\parallel$，而在商空间中由于 $\\mathbf{v}_\\parallel \\sim \\mathbf{0}$，商类 $[\\mathbf{v}]$ 保持唯一且恒定！"
                }
              </div>
            </div>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
