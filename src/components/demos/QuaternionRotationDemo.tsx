import { useState, useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import ExpandableDemo from "../framework/ExpandableDemo";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import PresetSelector, { type PresetOption } from "../framework/PresetSelector";
import ParamSlider from "../framework/ParamSlider";
import { AutoMath } from "../framework/AutoMath";
import { mathToWorld } from "../../visualizations/core/3d/coords";
import { createControls } from "../../visualizations/core/3d/controls";
import {
  type Vec3,
  type Quat,
  type Matrix3x3,
  length,
  normalize,
  axisAngleToQuat,
  slerp,
  quatToMatrix3x3,
  determinant3x3,
  getColumn3,
} from "@math";

type TabType = "inspect" | "interpolate";

const MODE_TABS = [
  { id: "inspect", label: "1. 自由旋转与多表象实时解构" },
  { id: "interpolate", label: "2. SLERP 球面插值 vs Matrix LERP 形变对比" },
] as const;

const PRESETS: PresetOption[] = [
  {
    value: "identity",
    label: "恒等姿态 (零旋转)",
    description: "q = [1, 0, 0, 0]，旋转角度为 0°，对应单位矩阵 I",
  },
  {
    value: "yaw_90",
    label: "偏航旋转 90° (绕 Z 轴)",
    description:
      "u = (0, 0, 1)，θ = 90°，q = [cos 45°, 0, 0, sin 45°] ≈ [0.71, 0, 0, 0.71]",
  },
  {
    value: "pitch_90",
    label: "俯仰旋转 90° (绕 X 轴)",
    description: "u = (1, 0, 0)，θ = 90°，q = [0.71, 0.71, 0, 0]",
  },
  {
    value: "roll_90",
    label: "滚转旋转 90° (绕 Y 轴)",
    description: "u = (0, 1, 0)，θ = 90°，q = [0.71, 0, 0.71, 0]",
  },
  {
    value: "diagonal_120",
    label: "空间对角轴 120° (三分对称)",
    description: "u = (1/√3, 1/√3, 1/√3)，θ = 120°，q = [0.5, 0.5, 0.5, 0.5]",
  },
];

function matrix3x3Lerp(m1: Matrix3x3, m2: Matrix3x3, t: number): Matrix3x3 {
  return [
    [
      (1 - t) * m1[0][0] + t * m2[0][0],
      (1 - t) * m1[0][1] + t * m2[0][1],
      (1 - t) * m1[0][2] + t * m2[0][2],
    ],
    [
      (1 - t) * m1[1][0] + t * m2[1][0],
      (1 - t) * m1[1][1] + t * m2[1][1],
      (1 - t) * m1[1][2] + t * m2[1][2],
    ],
    [
      (1 - t) * m1[2][0] + t * m2[2][0],
      (1 - t) * m1[2][1] + t * m2[2][1],
      (1 - t) * m1[2][2] + t * m2[2][2],
    ],
  ];
}

function fmt(n: number): string {
  const v = Math.abs(n) < 1e-4 ? 0 : n;
  return v.toFixed(2);
}

export default function QuaternionRotationDemo({
  height = "520px",
}: {
  height?: string;
}) {
  const [activeTab, setActiveTab] = useState<"inspect" | "interpolate">(
    "inspect",
  );
  const [presetKey, setPresetKey] = useState("identity");

  // Inspection mode state
  const [axis, setAxis] = useState<Vec3>({ x: 0, y: 0, z: 1 });
  const [angleDeg, setAngleDeg] = useState<number>(0);
  const [isNegated, setIsNegated] = useState<boolean>(false);

  // Interpolation mode state
  const [tInterp, setTInterp] = useState<number>(0.5);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<ReturnType<typeof createControls> | null>(null);

  const dynamicGroupRef = useRef<THREE.Group | null>(null);

  // Compute standard quaternion from axis-angle
  const baseQuat = useMemo(
    () => axisAngleToQuat(axis, angleDeg),
    [axis, angleDeg],
  );

  // Actual quaternion (may be negated to demonstrate double cover)
  const currentQuat: Quat = useMemo(() => {
    if (!isNegated) return baseQuat;
    return {
      w: -baseQuat.w,
      x: -baseQuat.x,
      y: -baseQuat.y,
      z: -baseQuat.z,
    };
  }, [baseQuat, isNegated]);

  const currentMat = useMemo(() => quatToMatrix3x3(currentQuat), [currentQuat]);

  // Interpolation endpoints: q1 = Identity, q2 = 180° rotation around (1, 1, 0)/√2
  const qStart: Quat = useMemo(() => ({ w: 1, x: 0, y: 0, z: 0 }), []);
  const qEnd: Quat = useMemo(
    () => axisAngleToQuat({ x: 1, y: 1, z: 0 }, 180),
    [],
  );

  const slerpQuat = useMemo(
    () => slerp(qStart, qEnd, tInterp),
    [qStart, qEnd, tInterp],
  );
  const slerpMat = useMemo(() => quatToMatrix3x3(slerpQuat), [slerpQuat]);

  const mStart = useMemo(() => quatToMatrix3x3(qStart), [qStart]);
  const mEnd = useMemo(() => quatToMatrix3x3(qEnd), [qEnd]);
  const lerpMat = useMemo(
    () => matrix3x3Lerp(mStart, mEnd, tInterp),
    [mStart, mEnd, tInterp],
  );
  const lerpDet = useMemo(() => determinant3x3(lerpMat), [lerpMat]);

  // Handle Preset Switching
  const handlePreset = (val: string) => {
    setPresetKey(val);
    setIsNegated(false);
    if (val === "identity") {
      setAxis({ x: 0, y: 0, z: 1 });
      setAngleDeg(0);
    } else if (val === "yaw_90") {
      setAxis({ x: 0, y: 0, z: 1 });
      setAngleDeg(90);
    } else if (val === "pitch_90") {
      setAxis({ x: 1, y: 0, z: 0 });
      setAngleDeg(90);
    } else if (val === "roll_90") {
      setAxis({ x: 0, y: 1, z: 0 });
      setAngleDeg(90);
    } else if (val === "diagonal_120") {
      setAxis({ x: 1, y: 1, z: 1 });
      setAngleDeg(120);
    }
  };

  // Mount Three.js Viewer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100,
    );
    const [cWx, cWy, cWz] = mathToWorld(4.5, -5.5, 3.8);
    camera.position.set(cWx, cWy, cWz);
    cameraRef.current = camera;

    const controls = createControls(camera, renderer.domElement);
    const [tWx, tWy, tWz] = mathToWorld(0, 0, 0);
    controls.target.set(tWx, tWy, tWz);
    controls.update();
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x93c5fd, 0.6);
    dirLight2.position.set(-5, -8, -3);
    scene.add(dirLight2);

    // Floor Grid Helper
    const grid = new THREE.GridHelper(8, 8, 0x94a3b8, 0xe2e8f0);
    grid.position.y = -1.2;
    scene.add(grid);

    // Dynamic Objects Group
    const dynamicGroup = new THREE.Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    // Theme Background adaptation
    const applyTheme = () => {
      const styles = getComputedStyle(document.documentElement);
      const bg = styles.getPropertyValue("--gfx-bg").trim() || "#ffffff";
      renderer.setClearColor(bg, 1);
    };
    applyTheme();

    const themeObserver = new MutationObserver(() => applyTheme());
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Animation Loop for Interpolation Tab
  useEffect(() => {
    if (!isPlaying) return;
    let animId = 0;
    let forward = true;

    const tick = () => {
      setTInterp((prev) => {
        let next = prev + (forward ? 0.008 : -0.008);
        if (next >= 1) {
          next = 1;
          forward = false;
        } else if (next <= 0) {
          next = 0;
          forward = true;
        }
        return next;
      });
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // Helper: Create a spacecraft / aircraft model
  const createAircraftMesh = (color: number, opacity: number = 1.0) => {
    const group = new THREE.Group();

    // Fuselage
    const bodyGeo = new THREE.ConeGeometry(0.4, 1.8, 16);
    bodyGeo.rotateX(Math.PI / 2); // math +Y is forward
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.3,
      metalness: 0.7,
      transparent: opacity < 1.0,
      opacity,
    });
    group.add(new THREE.Mesh(bodyGeo, bodyMat));

    // Wings
    const wingGeo = new THREE.BoxGeometry(1.8, 0.5, 0.06);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.5,
      transparent: opacity < 1.0,
      opacity,
    });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.position.set(0, -0.2, 0);
    group.add(wings);

    // Tail fin (Math +Z is up)
    const finGeo = new THREE.BoxGeometry(0.06, 0.4, 0.5);
    const finMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      roughness: 0.3,
      metalness: 0.6,
      transparent: opacity < 1.0,
      opacity,
    });
    const fin = new THREE.Mesh(finGeo, finMat);
    fin.position.set(0, -0.6, 0.25);
    group.add(fin);

    // Local RGB Coordinate Axes
    const arrowLen = 1.2;
    // Math X (Red)
    group.add(
      new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        arrowLen,
        0xef4444,
        0.2,
        0.1,
      ),
    );
    // Math Y (Green, in Three.js world that maps through mathToWorld)
    group.add(
      new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 0, 0),
        arrowLen,
        0x10b981,
        0.2,
        0.1,
      ),
    );
    // Math Z (Blue, in Three.js world that is +Y)
    group.add(
      new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        arrowLen,
        0x3b82f6,
        0.2,
        0.1,
      ),
    );

    return group;
  };

  // Update 3D Scene Geometry when state changes
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    if (activeTab === "inspect") {
      // 1. Single Model Rotated by currentQuat
      const craft = createAircraftMesh(0x0284c7, 1.0);

      // Convert Math Quaternion (w, x, y, z) where z-up to Three.js World Quaternion (y-up)
      // Math matrix -> World matrix
      const c0 = getColumn3(currentMat, 0);
      const c1 = getColumn3(currentMat, 1);
      const c2 = getColumn3(currentMat, 2);
      const [c0x, c0y, c0z] = mathToWorld(c0.x, c0.y, c0.z);
      const [c1x, c1y, c1z] = mathToWorld(c1.x, c1.y, c1.z);
      const [c2x, c2y, c2z] = mathToWorld(c2.x, c2.y, c2.z);

      const threeMat = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(c0x, c0y, c0z),
        new THREE.Vector3(c2x, c2y, c2z), // Math Z (up) -> Three Y
        new THREE.Vector3(-c1x, -c1y, -c1z), // Math Y (forward) -> Three -Z
      );
      craft.quaternion.setFromRotationMatrix(threeMat);
      group.add(craft);

      // 2. Visual Rotation Axis Vector
      const uNorm = normalize(axis);
      const [uWx, uWy, uWz] = mathToWorld(uNorm.x, uNorm.y, uNorm.z);
      const axisDir = new THREE.Vector3(uWx, uWy, uWz).normalize();

      const axisLineGeo = new THREE.BufferGeometry().setFromPoints([
        axisDir.clone().multiplyScalar(-2.5),
        axisDir.clone().multiplyScalar(2.5),
      ]);
      const axisLineMat = new THREE.LineDashedMaterial({
        color: 0xf59e0b,
        dashSize: 0.15,
        gapSize: 0.08,
      });
      const axisLine = new THREE.Line(axisLineGeo, axisLineMat);
      axisLine.computeLineDistances();
      group.add(axisLine);

      const axisArrow = new THREE.ArrowHelper(
        axisDir,
        new THREE.Vector3(0, 0, 0),
        2.5,
        0xf59e0b,
        0.3,
        0.18,
      );
      group.add(axisArrow);
    } else {
      // Interpolation Tab: SLERP (Left/Accent) vs Matrix LERP (Right/Orange)
      // 1. SLERP Model (Green/Emerald, Left side)
      const slerpCraft = createAircraftMesh(0x10b981, 1.0);
      const s0 = getColumn3(slerpMat, 0);
      const s1 = getColumn3(slerpMat, 1);
      const s2 = getColumn3(slerpMat, 2);
      const [s0x, s0y, s0z] = mathToWorld(s0.x, s0.y, s0.z);
      const [s1x, s1y, s1z] = mathToWorld(s1.x, s1.y, s1.z);
      const [s2x, s2y, s2z] = mathToWorld(s2.x, s2.y, s2.z);

      const slerpThreeMat = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(s0x, s0y, s0z),
        new THREE.Vector3(s2x, s2y, s2z),
        new THREE.Vector3(-s1x, -s1y, -s1z),
      );
      slerpCraft.quaternion.setFromRotationMatrix(slerpThreeMat);
      const [sPosWx, sPosWy, sPosWz] = mathToWorld(-1.8, 0, 0);
      slerpCraft.position.set(sPosWx, sPosWy, sPosWz);
      group.add(slerpCraft);

      // 2. Matrix LERP Model (Orange/Red, Right side - shows squeezing distortion)
      const lerpCraft = createAircraftMesh(0xf97316, 0.85);
      const l0 = getColumn3(lerpMat, 0);
      const l1 = getColumn3(lerpMat, 1);
      const l2 = getColumn3(lerpMat, 2);
      const [l0x, l0y, l0z] = mathToWorld(l0.x, l0.y, l0.z);
      const [l1x, l1y, l1z] = mathToWorld(l1.x, l1.y, l1.z);
      const [l2x, l2y, l2z] = mathToWorld(l2.x, l2.y, l2.z);

      const lerpThreeMat = new THREE.Matrix4().makeBasis(
        new THREE.Vector3(l0x, l0y, l0z),
        new THREE.Vector3(l2x, l2y, l2z),
        new THREE.Vector3(-l1x, -l1y, -l1z),
      );
      // Decompose matrix into position, rotation, scale to apply non-rigid shrink distortion
      const pos = new THREE.Vector3();
      const rot = new THREE.Quaternion();
      const scl = new THREE.Vector3();
      lerpThreeMat.decompose(pos, rot, scl);

      lerpCraft.quaternion.copy(rot);
      lerpCraft.scale.copy(scl);
      const [lPosWx, lPosWy, lPosWz] = mathToWorld(1.8, 0, 0);
      lerpCraft.position.set(lPosWx, lPosWy, lPosWz);
      group.add(lerpCraft);
    }
  }, [activeTab, currentMat, axis, slerpMat, lerpMat]);

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      const [cWx, cWy, cWz] = mathToWorld(4.5, -5.5, 3.8);
      cameraRef.current.position.set(cWx, cWy, cWz);
      const [tWx, tWy, tWz] = mathToWorld(0, 0, 0);
      controlsRef.current.target.set(tWx, tWy, tWz);
      controlsRef.current.update();
    }
  };

  return (
    <AutoMath>
      <ExpandableDemo id="quaternion-rotation-3d-demo" height={height}>
        <KdeWindowShell
          title="四元数与三维旋转 (Quaternions & 3D Rotations)"
          eyebrow="Linear Algebra · SO(3) & Quaternions"
          mark="q = cos(θ/2) + u sin(θ/2)"
          modeTag={
            activeTab === "inspect" ? "多表象实时解构" : "SLERP vs LERP 插值"
          }
          display={
            <div className="relative h-[var(--demo-height,28rem)] w-full overflow-hidden rounded-xl border border-border bg-slate-950">
              <div ref={containerRef} className="w-full h-full" />
              <CanvasToolbar onReset={resetCamera} />

              {/* In-canvas Legend */}
              <div className="pointer-events-none absolute bottom-4 left-3 z-10 flex flex-col gap-1 rounded bg-slate-900/90 p-2 text-[11px] text-muted backdrop-blur-xs border border-border/60">
                {activeTab === "inspect" ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-red-500 font-bold">
                        ● 局部 X 轴
                      </span>
                      <span className="text-emerald-500 font-bold">
                        ● 局部 Y (机头朝向)
                      </span>
                      <span className="text-blue-500 font-bold">
                        ● 局部 Z (机顶)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-medium pt-0.5 border-t border-border/40">
                      <span>● 金色虚线：当前瞬时旋转轴 u</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-500 font-bold">
                      ● SLERP：测地线恒速旋转（体积缩放 = 1.00）
                    </span>
                    <span className="text-orange-500 font-bold">
                      ● Matrix LERP：线性混色导致中间态压扁
                    </span>
                  </div>
                )}
              </div>
              <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
            </div>
          }
          controls={
            <div className="space-y-3">
              <KdeCard title="工作台模式" variant="dense">
                <KdeTabs
                  options={MODE_TABS}
                  value={activeTab}
                  onChange={(tab: string) => setActiveTab(tab as TabType)}
                />
              </KdeCard>

              {activeTab === "inspect" && (
                <>
                  <KdeCard title="预设姿态与对跖四元数" variant="dense">
                    <div className="space-y-2">
                      <PresetSelector
                        label="经典三维旋转预设姿态:"
                        options={PRESETS}
                        value={presetKey}
                        onChange={handlePreset}
                      />
                      <button
                        onClick={() => setIsNegated(!isNegated)}
                        className={`w-full rounded-md border py-1.5 px-3 text-xs font-semibold transition-all ${
                          isNegated
                            ? "border-purple-500/80 bg-purple-500/15 text-purple-400 font-bold"
                            : "border-border bg-surface text-muted hover:text-foreground"
                        }`}
                      >
                        {isNegated
                          ? "✓ 当前为对跖四元数 -q (Double Cover: 旋转完全一致)"
                          : "切换至对跖四元数 -q (验证双重覆盖 2:1)"}
                      </button>
                    </div>
                  </KdeCard>

                  <KdeCard title="旋转轴与旋转角参数" variant="dense">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted mb-1 font-mono">
                        <span>旋转轴 u (模长 = {length(axis).toFixed(2)})</span>
                        <span className="text-accent font-bold">
                          θ = {angleDeg}°
                        </span>
                      </div>
                      <ParamSlider
                        label="轴向 X"
                        value={axis.x}
                        min={-1}
                        max={1}
                        step={0.05}
                        onChange={(v) => {
                          setAxis({ ...axis, x: v });
                          setPresetKey("custom");
                        }}
                        widthClass="w-full"
                      />
                      <ParamSlider
                        label="轴向 Y"
                        value={axis.y}
                        min={-1}
                        max={1}
                        step={0.05}
                        onChange={(v) => {
                          setAxis({ ...axis, y: v });
                          setPresetKey("custom");
                        }}
                        widthClass="w-full"
                      />
                      <ParamSlider
                        label="轴向 Z"
                        value={axis.z}
                        min={-1}
                        max={1}
                        step={0.05}
                        onChange={(v) => {
                          setAxis({ ...axis, z: v });
                          setPresetKey("custom");
                        }}
                        widthClass="w-full"
                      />
                      <ParamSlider
                        label="旋转角 θ (°)"
                        value={angleDeg}
                        min={-180}
                        max={180}
                        step={1}
                        onChange={(v) => {
                          setAngleDeg(v);
                          setPresetKey("custom");
                        }}
                        widthClass="w-full"
                      />
                    </div>
                  </KdeCard>

                  <div className="grid grid-cols-2 gap-1.5">
                    <KdeReadout
                      label="单位四元数 q"
                      value={`[${fmt(currentQuat.w)}, ${fmt(currentQuat.x)}, ${fmt(currentQuat.y)}, ${fmt(currentQuat.z)}]`}
                      variant="accent"
                      dense
                    />
                    <KdeReadout
                      label="轴角表示 (u, θ)"
                      value={`u=(${fmt(normalize(axis).x)}, ${fmt(normalize(axis).y)}, ${fmt(normalize(axis).z)}), θ=${angleDeg}°`}
                      dense
                    />
                  </div>

                  <KdeCard
                    title="等价 3×3 旋转矩阵 R(q) ∈ SO(3)"
                    variant="dense"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-center overflow-x-auto py-1 font-mono text-xs">
                        {`$R = \\begin{pmatrix} ${fmt(currentMat[0][0])} & ${fmt(currentMat[1][0])} & ${fmt(currentMat[2][0])} \\\\ ${fmt(currentMat[0][1])} & ${fmt(currentMat[1][1])} & ${fmt(currentMat[2][1])} \\\\ ${fmt(currentMat[0][2])} & ${fmt(currentMat[1][2])} & ${fmt(currentMat[2][2])} \\end{pmatrix}$`}
                      </div>
                      <div className="text-[11px] text-muted text-center">
                        det(R) = {determinant3x3(currentMat).toFixed(3)}{" "}
                        (严格正交且保形，无万向节死锁)
                      </div>
                    </div>
                  </KdeCard>
                </>
              )}

              {activeTab === "interpolate" && (
                <>
                  <KdeCard title="插值时间轴控制器" variant="dense">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="rounded-md bg-accent px-3 py-1.5 font-semibold text-accent-foreground text-xs shadow-xs hover:bg-accent/90"
                        >
                          {isPlaying ? "⏸ 暂停动画" : "▶ 自动播放插值"}
                        </button>
                        <button
                          onClick={() => {
                            setIsPlaying(false);
                            setTInterp(0.5);
                          }}
                          className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-muted hover:text-foreground"
                        >
                          中点 (t = 0.5)
                        </button>
                        <span className="font-mono text-xs font-bold text-accent">
                          t = {tInterp.toFixed(2)}
                        </span>
                      </div>

                      <ParamSlider
                        label="时间参数 t ∈ [0, 1]"
                        value={tInterp}
                        min={0}
                        max={1}
                        step={0.01}
                        onChange={(v) => {
                          setIsPlaying(false);
                          setTInterp(v);
                        }}
                        widthClass="w-full"
                      />
                    </div>
                  </KdeCard>

                  <div className="grid grid-cols-2 gap-1.5">
                    <KdeReadout
                      label="SLERP 行列式 det"
                      value={determinant3x3(slerpMat).toFixed(3)}
                      variant="success"
                      dense
                    />
                    <KdeReadout
                      label="Matrix LERP 行列式"
                      value={lerpDet.toFixed(3)}
                      variant={lerpDet < 0.9 ? "danger" : "warning"}
                      dense
                    />
                  </div>

                  <KdeCard title="插值保形几何原理对比" variant="dense">
                    <div className="space-y-2 text-xs text-muted">
                      <div>
                        <span className="font-semibold text-emerald-500">
                          SLERP（球面线性插值）：
                        </span>
                        {
                          "沿四元数超球面 $\\mathbb{S}^3$ 上的测地线恒角速旋转，‖q(t)‖ ≡ 1，无任何形变与塌缩。"
                        }
                      </div>
                      <div>
                        <span className="font-semibold text-amber-500">
                          Matrix LERP（矩阵直接混色）：
                        </span>
                        加权平均破坏正交性，中间态行列式显著缩水（det &lt;
                        1），导致刚体塌缩挤压。
                      </div>
                    </div>
                  </KdeCard>
                </>
              )}
            </div>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
