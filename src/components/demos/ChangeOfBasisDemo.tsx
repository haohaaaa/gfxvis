import { useState, useCallback, useMemo } from "react";
import {
  Scene,
  Group,
  ArrowHelper,
  Vector3,
  MeshStandardMaterial,
  Mesh,
  LineSegments,
  LineBasicMaterial,
  BufferGeometry,
  Float32BufferAttribute,
  DoubleSide,
} from "three";
import ExpandableDemo from "../framework/ExpandableDemo";
import CanvasViewport from "../framework/CanvasViewport";
import CanvasOverlay from "../framework/CanvasOverlay";
import Viewer3DViewport from "../framework/Viewer3DViewport";
import ParamSlider from "../framework/ParamSlider";
import PresetSelector from "../framework/PresetSelector";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeTabs from "../framework/KdeTabs";
import KdeTabPanel, { KdeTabContext } from "../framework/KdeTabPanel";
import {
  getVisibleBounds,
  type Bounds2,
  type Plot2D,
  type ThemeColors,
} from "../../visualizations/core/2d/plot2d";
import type { Scene2D } from "../../visualizations/core/2d/Scene2D";
import {
  addStandardLights,
  addGroundGrid,
  disposeObject,
} from "../../visualizations/core/3d/three-utils";
import { mathToWorld } from "../../visualizations/core/3d/coords";

type DemoMode = "2d" | "3d";
type Preset2D = "standard" | "rot45" | "shear" | "general";
type Preset3D = "identity" | "yaw45" | "pitch30" | "roll45" | "fps";

const DEMO_MODES: Array<{ id: DemoMode; label: string }> = [
  { id: "2d", label: "2D 基变换与坐标换算" },
  { id: "3d", label: "3D 图形学矩阵与局部坐标系 [r, f, u]" },
];

const BOUNDS_2D: Bounds2 = { xMin: -3.5, xMax: 3.5, yMin: -3.5, yMax: 3.5 };

interface BasisPreset2D {
  name: string;
  c1: { x: number; y: number };
  c2: { x: number; y: number };
  desc: string;
}

const PRESETS_2D: Record<Preset2D, BasisPreset2D> = {
  standard: {
    name: "标准基 I",
    c1: { x: 1.0, y: 0.0 },
    c2: { x: 0.0, y: 1.0 },
    desc: "新基与标准基重合，过渡矩阵为单位矩阵，两套坐标数值完全一致。",
  },
  rot45: {
    name: "45° 旋转基",
    c1: { x: Math.SQRT1_2, y: Math.SQRT1_2 },
    c2: { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
    desc: "将坐标轴逆时针旋转 45°，基向量保持正交且保持单位长度。",
  },
  shear: {
    name: "水平剪切基",
    c1: { x: 1.0, y: 0.0 },
    c2: { x: 1.0, y: 1.0 },
    desc: "保持 x 轴基底不变，将 y 轴基底斜向右上方倾斜 45°。",
  },
  general: {
    name: "一般非正交基",
    c1: { x: 1.4, y: 0.4 },
    c2: { x: -0.6, y: 1.2 },
    desc: "非正交且不同模长的两组基底，网格呈现任意仿射平行四边形形态。",
  },
};

interface PresetConfig3D {
  name: string;
  yaw: number;
  pitch: number;
  roll: number;
  desc: string;
}

const PRESETS_3D: Record<Preset3D, PresetConfig3D> = {
  identity: {
    name: "原点姿态 I",
    yaw: 0,
    pitch: 0,
    roll: 0,
    desc: "局部坐标系与世界标准基完全重合，旋转矩阵 R = I。",
  },
  yaw45: {
    name: "纯偏航 (Yaw 45°)",
    yaw: 45,
    pitch: 0,
    roll: 0,
    desc: "绕垂直 Z 轴（Up）逆时针旋转 45°，垂直 Up 轴保持不变，水平面基底旋转。",
  },
  pitch30: {
    name: "俯仰抬头 (Pitch 30°)",
    yaw: 0,
    pitch: 30,
    roll: 0,
    desc: "绕横向 X 轴（Right）旋转 30°，Right 轴保持不变，前向与上向基底倾斜。",
  },
  roll45: {
    name: "翻滚倾斜 (Roll 45°)",
    yaw: 0,
    pitch: 0,
    roll: 45,
    desc: "绕前向 Y 轴（Forward）旋转 45°，Forward 轴保持不变，左右与上下基底倾斜。",
  },
  fps: {
    name: "第一人称视角 (FPS Look)",
    yaw: 60,
    pitch: -20,
    roll: 0,
    desc: "典型的第一人称相机姿态：水平偏转 60° 并俯视 20°，Forward 轴指向视线方向。",
  },
};

function fmt(v: number): string {
  const s = v.toFixed(2);
  return s === "-0.00" ? "0.00" : s;
}

function multiply3x3(A: number[][], B: number[][]): number[][] {
  const result: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      result[r][c] = A[r][0] * B[0][c] + A[r][1] * B[1][c] + A[r][2] * B[2][c];
    }
  }
  return result;
}

// 3D Scene Controller Interface
interface Viewer3DApi {
  scene: Scene;
  setTransformation: (
    r: { x: number; y: number; z: number },
    f: { x: number; y: number; z: number },
    u: { x: number; y: number; z: number },
    showFrustum: boolean,
  ) => void;
  setAxesVisible: (visible: boolean) => void;
  dispose: () => void;
}

function create3DScene(): Viewer3DApi {
  const scene = new Scene();
  addStandardLights(scene);
  addGroundGrid(scene, 6, 12);

  const axesWorldGroup = new Group();
  // Math Z-up World Axes: X (Red, Right), Y (Green, Forward), Z (Blue, Up)
  const dirX = new Vector3(...mathToWorld(1, 0, 0));
  const dirY = new Vector3(...mathToWorld(0, 1, 0));
  const dirZ = new Vector3(...mathToWorld(0, 0, 1));
  const origin = new Vector3(0, 0, 0);

  axesWorldGroup.add(new ArrowHelper(dirX, origin, 2.2, 0xef4444, 0.2, 0.1));
  axesWorldGroup.add(new ArrowHelper(dirY, origin, 2.2, 0x10b981, 0.2, 0.1));
  axesWorldGroup.add(new ArrowHelper(dirZ, origin, 2.2, 0x3b82f6, 0.2, 0.1));
  scene.add(axesWorldGroup);

  // Rotating Frame Group
  const frameGroup = new Group();

  // Local Transformed Axes: Right r (Red), Forward f (Green), Up u (Blue)
  const arrowR = new ArrowHelper(dirX, origin, 2.0, 0xef4444, 0.3, 0.15);
  const arrowF = new ArrowHelper(dirY, origin, 2.0, 0x10b981, 0.3, 0.15);
  const arrowU = new ArrowHelper(dirZ, origin, 2.0, 0x3b82f6, 0.3, 0.15);
  frameGroup.add(arrowR);
  frameGroup.add(arrowF);
  frameGroup.add(arrowU);

  // Dynamically constructed Parallelepiped Mesh & Wireframe pinned at origin (0,0,0)
  const cubeMeshGeom = new BufferGeometry();
  const cubeLineGeom = new BufferGeometry();

  const cubeMeshMat = new MeshStandardMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.25,
    side: DoubleSide,
  });
  const cubeLineMat = new LineBasicMaterial({
    color: 0x2563eb,
    linewidth: 1.5,
  });

  const cubeMesh = new Mesh(cubeMeshGeom, cubeMeshMat);
  const cubeLines = new LineSegments(cubeLineGeom, cubeLineMat);
  frameGroup.add(cubeMesh);
  frameGroup.add(cubeLines);

  // Camera Frustum Pyramidal Model (Apex strictly at origin 0,0,0)
  const frustumGeom = new BufferGeometry();
  const frustumLines = new LineSegments(
    frustumGeom,
    new LineBasicMaterial({ color: 0x10b981, linewidth: 2 }),
  );
  frameGroup.add(frustumLines);

  scene.add(frameGroup);

  return {
    scene,
    setTransformation(r, f, u, showFrustum) {
      const worldR = new Vector3(...mathToWorld(r.x, r.y, r.z)).normalize();
      const worldF = new Vector3(...mathToWorld(f.x, f.y, f.z)).normalize();
      const worldU = new Vector3(...mathToWorld(u.x, u.y, u.z)).normalize();

      arrowR.setDirection(worldR);
      arrowF.setDirection(worldF);
      arrowU.setDirection(worldU);

      // 8 vertices of parallelepiped anchored with V0 at (0, 0, 0)
      const v0 = mathToWorld(0, 0, 0);
      const v1 = mathToWorld(r.x, r.y, r.z);
      const v2 = mathToWorld(r.x + f.x, r.y + f.y, r.z + f.z);
      const v3 = mathToWorld(f.x, f.y, f.z);
      const v4 = mathToWorld(u.x, u.y, u.z);
      const v5 = mathToWorld(r.x + u.x, r.y + u.y, r.z + u.z);
      const v6 = mathToWorld(r.x + f.x + u.x, r.y + f.y + u.y, r.z + f.z + u.z);
      const v7 = mathToWorld(f.x + u.x, f.y + u.y, f.z + u.z);

      // 12 edges for parallelepiped wireframe
      const linePositions: number[] = [
        ...v0,
        ...v1,
        ...v1,
        ...v2,
        ...v2,
        ...v3,
        ...v3,
        ...v0, // Bottom face
        ...v4,
        ...v5,
        ...v5,
        ...v6,
        ...v6,
        ...v7,
        ...v7,
        ...v4, // Top face
        ...v0,
        ...v4,
        ...v1,
        ...v5,
        ...v2,
        ...v6,
        ...v3,
        ...v7, // Vertical edges
      ];
      cubeLineGeom.setAttribute(
        "position",
        new Float32BufferAttribute(linePositions, 3),
      );

      // 12 triangles (6 faces) for translucent solid mesh
      const facePositions: number[] = [
        ...v0,
        ...v2,
        ...v1,
        ...v0,
        ...v3,
        ...v2, // Bottom
        ...v4,
        ...v5,
        ...v6,
        ...v4,
        ...v6,
        ...v7, // Top
        ...v3,
        ...v2,
        ...v6,
        ...v3,
        ...v6,
        ...v7, // Front
        ...v0,
        ...v5,
        ...v1,
        ...v0,
        ...v4,
        ...v5, // Back
        ...v1,
        ...v6,
        ...v5,
        ...v1,
        ...v2,
        ...v6, // Right
        ...v0,
        ...v7,
        ...v3,
        ...v0,
        ...v4,
        ...v7, // Left
      ];
      cubeMeshGeom.setAttribute(
        "position",
        new Float32BufferAttribute(facePositions, 3),
      );
      cubeMeshGeom.computeVertexNormals();

      // Camera Frustum 4 corner rays from (0,0,0) forward along f
      const fTL = mathToWorld(
        1.6 * f.x - 0.6 * r.x + 0.45 * u.x,
        1.6 * f.y - 0.6 * r.y + 0.45 * u.y,
        1.6 * f.z - 0.6 * r.z + 0.45 * u.z,
      );
      const fTR = mathToWorld(
        1.6 * f.x + 0.6 * r.x + 0.45 * u.x,
        1.6 * f.y + 0.6 * r.y + 0.45 * u.y,
        1.6 * f.z + 0.6 * r.z + 0.45 * u.z,
      );
      const fBR = mathToWorld(
        1.6 * f.x + 0.6 * r.x - 0.45 * u.x,
        1.6 * f.y + 0.6 * r.y - 0.45 * u.y,
        1.6 * f.z + 0.6 * r.z - 0.45 * u.z,
      );
      const fBL = mathToWorld(
        1.6 * f.x - 0.6 * r.x - 0.45 * u.x,
        1.6 * f.y - 0.6 * r.y - 0.45 * u.y,
        1.6 * f.z - 0.6 * r.z - 0.45 * u.z,
      );

      const frustumPositions: number[] = [
        ...v0,
        ...fTL,
        ...v0,
        ...fTR,
        ...v0,
        ...fBR,
        ...v0,
        ...fBL,
        ...fTL,
        ...fTR,
        ...fTR,
        ...fBR,
        ...fBR,
        ...fBL,
        ...fBL,
        ...fTL,
      ];
      frustumGeom.setAttribute(
        "position",
        new Float32BufferAttribute(frustumPositions, 3),
      );

      frustumLines.visible = showFrustum;
      cubeMesh.visible = !showFrustum;
      cubeLines.visible = !showFrustum;
    },
    setAxesVisible(visible) {
      axesWorldGroup.visible = visible;
    },
    dispose() {
      disposeObject(scene);
    },
  };
}

export default function ChangeOfBasisDemo({ height }: { height?: string }) {
  const [demoMode, setDemoMode] = useState<DemoMode>("2d");

  // ---------------- 2D State ----------------
  const [presetKey2D, setPresetKey2D] = useState<Preset2D>("rot45");
  const [vVec, setVVec] = useState<{ x: number; y: number }>({
    x: 1.5,
    y: 1.2,
  });

  const activePreset2D = PRESETS_2D[presetKey2D];
  const { c1, c2 } = activePreset2D;

  const detP = c1.x * c2.y - c2.x * c1.y;
  const invP = useMemo(
    () => ({
      a11: c2.y / detP,
      a12: -c2.x / detP,
      a21: -c1.y / detP,
      a22: c1.x / detP,
    }),
    [c1, c2, detP],
  );

  const vC = useMemo(
    () => ({
      x: invP.a11 * vVec.x + invP.a12 * vVec.y,
      y: invP.a21 * vVec.x + invP.a22 * vVec.y,
    }),
    [invP, vVec],
  );

  // ---------------- 3D State ----------------
  const [presetKey3D, setPresetKey3D] = useState<Preset3D | "custom">("fps");
  const [yaw, setYaw] = useState<number>(60);
  const [pitch, setPitch] = useState<number>(-20);
  const [roll, setRoll] = useState<number>(0);
  const [showFrustum, setShowFrustum] = useState<boolean>(false);

  const applyPreset3D = useCallback((key: Preset3D) => {
    setPresetKey3D(key);
    const cfg = PRESETS_3D[key];
    setYaw(cfg.yaw);
    setPitch(cfg.pitch);
    setRoll(cfg.roll);
  }, []);

  const radYaw = (yaw * Math.PI) / 180;
  const cosY = Math.cos(radYaw);
  const sinY = Math.sin(radYaw);

  const radPitch = (pitch * Math.PI) / 180;
  const cosP = Math.cos(radPitch);
  const sinP = Math.sin(radPitch);

  const radRoll = (roll * Math.PI) / 180;
  const cosR = Math.cos(radRoll);
  const sinR = Math.sin(radRoll);

  const matR = useMemo(() => {
    const matRz = [
      [cosY, -sinY, 0],
      [sinY, cosY, 0],
      [0, 0, 1],
    ];
    const matRx = [
      [1, 0, 0],
      [0, cosP, -sinP],
      [0, sinP, cosP],
    ];
    const matRy = [
      [cosR, 0, sinR],
      [0, 1, 0],
      [-sinR, 0, cosR],
    ];
    const matRzRx = multiply3x3(matRz, matRx);
    return multiply3x3(matRzRx, matRy);
  }, [cosY, sinY, cosP, sinP, cosR, sinR]);

  const rVec = useMemo(
    () => ({ x: matR[0][0], y: matR[1][0], z: matR[2][0] }),
    [matR],
  );
  const fVec = useMemo(
    () => ({ x: matR[0][1], y: matR[1][1], z: matR[2][1] }),
    [matR],
  );
  const uVec = useMemo(
    () => ({ x: matR[0][2], y: matR[1][2], z: matR[2][2] }),
    [matR],
  );

  const detR = useMemo(
    () =>
      rVec.x * (fVec.y * uVec.z - fVec.z * uVec.y) -
      rVec.y * (fVec.x * uVec.z - fVec.z * uVec.x) +
      rVec.z * (fVec.x * uVec.y - fVec.y * uVec.x),
    [rVec, fVec, uVec],
  );

  const lenR = Math.hypot(rVec.x, rVec.y, rVec.z);
  const lenF = Math.hypot(fVec.x, fVec.y, fVec.z);
  const lenU = Math.hypot(uVec.x, uVec.y, uVec.z);

  const dotRF = rVec.x * fVec.x + rVec.y * fVec.y + rVec.z * fVec.z;
  const dotRU = rVec.x * uVec.x + rVec.y * uVec.y + rVec.z * uVec.z;
  const dotFU = fVec.x * uVec.x + fVec.y * uVec.y + fVec.z * uVec.z;

  const matrixValueTex = `R = \\begin{pmatrix} ${fmt(cosY)} & ${fmt(-sinY)} & 0.00 \\\\ ${fmt(sinY)} & ${fmt(cosY)} & 0.00 \\\\ 0.00 & 0.00 & 1.00 \\end{pmatrix} \\begin{pmatrix} 1.00 & 0.00 & 0.00 \\\\ 0.00 & ${fmt(cosP)} & ${fmt(-sinP)} \\\\ 0.00 & ${fmt(sinP)} & ${fmt(cosP)} \\end{pmatrix} \\begin{pmatrix} ${fmt(cosR)} & 0.00 & ${fmt(sinR)} \\\\ 0.00 & 1.00 & 0.00 \\\\ ${fmt(-sinR)} & 0.00 & ${fmt(cosR)} \\end{pmatrix} = \\begin{pmatrix} \\color{#ef4444}{${fmt(rVec.x)}} & \\color{#10b981}{${fmt(fVec.x)}} & \\color{#3b82f6}{${fmt(uVec.x)}} \\\\ \\color{#ef4444}{${fmt(rVec.y)}} & \\color{#10b981}{${fmt(fVec.y)}} & \\color{#3b82f6}{${fmt(uVec.y)}} \\\\ \\color{#ef4444}{${fmt(rVec.z)}} & \\color{#10b981}{${fmt(fVec.z)}} & \\color{#3b82f6}{${fmt(uVec.z)}} \\end{pmatrix}`;

  // ---------------- 2D Draw Callback ----------------
  const handleDraw2D = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      plot: Plot2D,
      theme: ThemeColors,
      scene: Scene2D,
    ) => {
      scene.addAxes("x", "y");

      // 1. Deformed Grid for Basis C
      const visible = getVisibleBounds(plot);
      const maxExtent =
        Math.max(
          Math.abs(visible.xMin),
          Math.abs(visible.xMax),
          Math.abs(visible.yMin),
          Math.abs(visible.yMax),
        ) + 2;
      const gridLines = Math.min(18, Math.ceil(maxExtent));

      ctx.save();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.22)";
      ctx.lineWidth = 1;
      for (let i = -gridLines; i <= gridLines; i++) {
        const p1x = plot.toScreenX(i * c1.x - gridLines * c2.x);
        const p1y = plot.toScreenY(i * c1.y - gridLines * c2.y);
        const p2x = plot.toScreenX(i * c1.x + gridLines * c2.x);
        const p2y = plot.toScreenY(i * c1.y + gridLines * c2.y);
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.stroke();

        const q1x = plot.toScreenX(-gridLines * c1.x + i * c2.x);
        const q1y = plot.toScreenY(-gridLines * c1.y + i * c2.y);
        const q2x = plot.toScreenX(gridLines * c1.x + i * c2.x);
        const q2y = plot.toScreenY(gridLines * c1.y + i * c2.y);
        ctx.beginPath();
        ctx.moveTo(q1x, q1y);
        ctx.lineTo(q2x, q2y);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Parallelogram decomposition along c1 and c2
      const compC1x = vC.x * c1.x;
      const compC1y = vC.x * c1.y;
      scene.addPolyline({
        points: [
          [compC1x, compC1y],
          [vVec.x, vVec.y],
        ],
        color: "#06b6d4",
        dash: [4, 4],
        width: 1.5,
        alpha: 0.6,
      });
      scene.addPolyline({
        points: [
          [0, 0],
          [compC1x, compC1y],
        ],
        color: "#3b82f6",
        dash: [4, 4],
        width: 1.5,
        alpha: 0.6,
      });

      // 3. Basis vectors c1, c2
      scene.addVector({
        from: [0, 0],
        to: [c1.x, c1.y],
        color: "#3b82f6",
        label: `c₁ (${c1.x.toFixed(2)}, ${c1.y.toFixed(2)})`,
        width: 2.5,
      });
      scene.addVector({
        from: [0, 0],
        to: [c2.x, c2.y],
        color: "#06b6d4",
        label: `c₂ (${c2.x.toFixed(2)}, ${c2.y.toFixed(2)})`,
        width: 2.5,
      });

      // 4. Target vector v (Draggable with physical hit test)
      scene.addVector({
        from: [0, 0],
        to: [vVec.x, vVec.y],
        color: "#f59e0b",
        label: "向量 v",
        width: 3.5,
        draggable: true,
        handleRadius: 6,
        handleRing: true,
        hitRadiusPx: 24,
        onDrag: (tip) => setVVec({ x: tip[0], y: tip[1] }),
      });

      scene.render(ctx, plot, theme);
    },
    [c1, c2, vVec, vC],
  );

  const is2D = demoMode === "2d";

  return (
    <ExpandableDemo id="change-of-basis" height={height}>
      <KdeWindowShell
        title={is2D ? "2D 基变换与坐标换算" : "3D 图形学矩阵与局部坐标系"}
        eyebrow={
          is2D
            ? "Linear Algebra · Change of Basis"
            : "Computer Graphics · Local Frame"
        }
        mark={is2D ? "[v]_C = P^-1 [v]_B" : "[r, f, u]"}
        modeTag={is2D ? "2D Planar Space" : "3D Frame Space"}
        display={
          <KdeTabContext.Provider value={{ activeTab: demoMode }}>
            <div className="relative">
              <KdeTabPanel id="2d">
                <CanvasViewport
                  initialBounds={BOUNDS_2D}
                  onDraw={handleDraw2D}
                  className="h-[var(--demo-height,26rem)]"
                >
                  <CanvasOverlay position="top-left">
                    <CanvasOverlay.Title>
                      [v]_C = P^-1 [v]_B
                    </CanvasOverlay.Title>
                    <CanvasOverlay.Subtitle>
                      基变换与坐标网格映射
                    </CanvasOverlay.Subtitle>
                  </CanvasOverlay>
                  <CanvasOverlay position="bottom-left">
                    <CanvasOverlay.Item
                      color="#f59e0b"
                      label={`[v]_B = (${vVec.x.toFixed(2)}, ${vVec.y.toFixed(2)})`}
                    />
                    <CanvasOverlay.Item
                      color="#38bdf8"
                      label={`[v]_C = (${vC.x.toFixed(2)}, ${vC.y.toFixed(2)})`}
                    />
                  </CanvasOverlay>
                </CanvasViewport>
              </KdeTabPanel>

              <KdeTabPanel id="3d">
                <Viewer3DViewport
                  factory={create3DScene}
                  onUpdate={({ api, viewer }) => {
                    api.setTransformation(rVec, fVec, uVec, showFrustum);
                    api.setAxesVisible(true);
                    viewer.render();
                  }}
                  deps={[rVec, fVec, uVec, showFrustum]}
                  className="h-[var(--demo-height,26rem)]"
                >
                  <CanvasOverlay position="top-left">
                    <CanvasOverlay.Title>
                      3D 局部坐标系 [r, f, u]
                    </CanvasOverlay.Title>
                    <CanvasOverlay.Subtitle>
                      {`R = R_z(${yaw}°) R_x(${pitch}°) R_y(${roll}°)`}
                    </CanvasOverlay.Subtitle>
                  </CanvasOverlay>
                  <CanvasOverlay position="bottom-left">
                    <CanvasOverlay.Item
                      color="#ef4444"
                      label={`r = (${fmt(rVec.x)}, ${fmt(rVec.y)}, ${fmt(rVec.z)})`}
                    />
                    <CanvasOverlay.Item
                      color="#10b981"
                      label={`f = (${fmt(fVec.x)}, ${fmt(fVec.y)}, ${fmt(fVec.z)})`}
                    />
                    <CanvasOverlay.Item
                      color="#3b82f6"
                      label={`u = (${fmt(uVec.x)}, ${fmt(uVec.y)}, ${fmt(uVec.z)})`}
                    />
                  </CanvasOverlay>
                </Viewer3DViewport>
              </KdeTabPanel>
            </div>
          </KdeTabContext.Provider>
        }
        controls={
          <div className="space-y-3">
            <KdeTabs
              options={DEMO_MODES}
              value={demoMode}
              onChange={(val: string) => setDemoMode(val as DemoMode)}
            />

            <KdeTabContext.Provider value={{ activeTab: demoMode }}>
              <KdeTabPanel id="2d">
                <div className="space-y-3">
                  <KdeCard
                    title="新基 $\mathcal{C}$ 几何预设与基向量"
                    variant="dense"
                  >
                    <PresetSelector
                      label={"新基 $\\mathcal{C}$ 预设:"}
                      options={PRESETS_2D}
                      value={presetKey2D}
                      onChange={setPresetKey2D}
                    />
                  </KdeCard>

                  <KdeCard title="同一向量在两组基下的坐标快照" variant="dense">
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          标准基坐标：
                        </span>
                        <span className="font-semibold text-amber-500 font-mono">
                          {`$[v]_{\\mathcal{B}} = (${vVec.x.toFixed(2)},\\, ${vVec.y.toFixed(2)})^\\top$`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          新基坐标：
                        </span>
                        <span className="font-semibold text-blue-400 font-mono">
                          {`$[v]_{\\mathcal{C}} = P_{\\mathcal{C}}^{-1} [v]_{\\mathcal{B}} = (${vC.x.toFixed(2)},\\, ${vC.y.toFixed(2)})^\\top$`}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[11px] pt-1 border-t border-slate-700/50">
                        <span className="mr-1">几何恒等验证：</span>
                        {`$${vC.x.toFixed(2)} c_1 + ${vC.y.toFixed(2)} c_2 = (${vVec.x.toFixed(2)},\\, ${vVec.y.toFixed(2)})^\\top$`}
                      </div>
                    </div>
                  </KdeCard>

                  <div className="grid grid-cols-2 gap-1.5">
                    <KdeReadout
                      label="基矩阵 $P_{\mathcal{C}}$"
                      value={`[${c1.x.toFixed(2)} ${c2.x.toFixed(2)}; ${c1.y.toFixed(2)} ${c2.y.toFixed(2)}]`}
                      dense
                    />
                    <KdeReadout
                      label="过渡矩阵 $P_{\mathcal{C} \leftarrow \mathcal{B}}$"
                      value={`[${invP.a11.toFixed(2)} ${invP.a12.toFixed(2)}; ${invP.a21.toFixed(2)} ${invP.a22.toFixed(2)}]`}
                      variant="accent"
                      dense
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {activePreset2D.desc}
                  </p>
                </div>
              </KdeTabPanel>

              <KdeTabPanel id="3d">
                <div className="space-y-3">
                  <KdeCard title="典型姿态预设与显示模式" variant="dense">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <PresetSelector<string>
                        label="典型姿态预设:"
                        options={PRESETS_3D}
                        value={presetKey3D}
                        onChange={(key) => applyPreset3D(key as Preset3D)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowFrustum(!showFrustum)}
                        className="rounded border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        {showFrustum
                          ? "切换为基向量立方体"
                          : "切换为相机视锥台"}
                      </button>
                    </div>
                  </KdeCard>

                  <KdeCard title="欧拉角姿态调节 (Z-up 约定)" variant="dense">
                    <div className="space-y-2">
                      <ParamSlider
                        label="偏航角 Yaw (Z轴 / 向上)"
                        labelMode="adaptive"
                        widthClass="w-full"
                        value={yaw}
                        min={-180}
                        max={180}
                        step={5}
                        onChange={(v) => {
                          setYaw(v);
                          setPresetKey3D("custom");
                        }}
                      />
                      <ParamSlider
                        label="俯仰角 Pitch (X轴 / 右向)"
                        labelMode="adaptive"
                        widthClass="w-full"
                        value={pitch}
                        min={-90}
                        max={90}
                        step={5}
                        onChange={(v) => {
                          setPitch(v);
                          setPresetKey3D("custom");
                        }}
                      />
                      <ParamSlider
                        label="翻滚角 Roll (Y轴 / 深度)"
                        labelMode="adaptive"
                        widthClass="w-full"
                        value={roll}
                        min={-180}
                        max={180}
                        step={5}
                        onChange={(v) => {
                          setRoll(v);
                          setPresetKey3D("custom");
                        }}
                      />
                    </div>
                  </KdeCard>

                  <KdeCard
                    title="3×3 旋转矩阵复合公式与实时数值分解"
                    variant="dense"
                  >
                    <div className="space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--kde-border,#bec5cc)]/60 pb-1.5">
                        <span className="font-semibold text-foreground">
                          复合旋转矩阵 R
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          R = R_z({yaw}°) R_x({pitch}°) R_y({roll}°)
                        </span>
                      </div>
                      <div className="p-2 rounded border border-[var(--kde-border,#bec5cc)] bg-[var(--kde-panel,#eff0f1)]/50 dark:bg-slate-900/60 dark:border-slate-700/60 overflow-x-auto text-xs text-foreground">
                        {`$${matrixValueTex}$`}
                      </div>
                    </div>
                  </KdeCard>

                  <div className="space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                      <KdeReadout
                        label="det(R) 正交行列式"
                        value={detR.toFixed(2)}
                        variant={
                          Math.abs(detR - 1) < 0.05 ? "success" : "danger"
                        }
                        dense
                      />
                      <KdeReadout
                        label="模长 ‖r‖, ‖f‖, ‖u‖"
                        value={`${lenR.toFixed(2)}, ${lenF.toFixed(2)}, ${lenU.toFixed(2)}`}
                        dense
                      />
                    </div>
                    <KdeReadout
                      label="两两正交积 r·f, r·u, f·u"
                      value={`${dotRF.toFixed(2)}, ${dotRU.toFixed(2)}, ${dotFU.toFixed(2)}`}
                      variant="accent"
                      dense
                    />
                  </div>
                </div>
              </KdeTabPanel>
            </KdeTabContext.Provider>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
