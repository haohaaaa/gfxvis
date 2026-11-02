import { useState } from "react";
import {
  Scene,
  Group,
  PerspectiveCamera,
  Vector3,
  ArrowHelper,
  Mesh,
  BoxGeometry,
  SphereGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  BufferGeometry,
  LineSegments,
  LineBasicMaterial,
  Float32BufferAttribute,
} from "three";
import ExpandableDemo from "../framework/ExpandableDemo";
import Viewer3DViewport from "../framework/Viewer3DViewport";
import ParamSlider from "../framework/ParamSlider";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import PresetSelector from "../framework/PresetSelector";
import { mathToWorld } from "../../visualizations/core/3d/coords";
import {
  addStandardLights,
  addGroundGrid,
  disposeObject,
} from "../../visualizations/core/3d/three-utils";

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

type PresetKey = "front" | "isometric" | "top" | "close_tilt";

const PRESETS: Record<
  PresetKey,
  { label: string; desc: string; eye: Vec3; target: Vec3; up: Vec3 }
> = {
  front: {
    label: "正前方观察 (Front View)",
    desc: "相机沿正前方水平注视原点，Up 方向严格沿 +Z 轴",
    eye: { x: 0, y: -4.0, z: 1.2 },
    target: { x: 0, y: 0, z: 0.5 },
    up: { x: 0, y: 0, z: 1 },
  },
  isometric: {
    label: "标准等轴测视角 (Isometric)",
    desc: "斜上方观察目标，三个坐标轴呈现等量投影",
    eye: { x: 3.2, y: -3.2, z: 2.8 },
    target: { x: 0, y: 0, z: 0.5 },
    up: { x: 0, y: 0, z: 1 },
  },
  top: {
    label: "顶俯视视角 (Top-down View)",
    desc: "相机位于正上方俯瞰 xy 平面，Up 设为 +Y 轴以避免奇异性",
    eye: { x: 0, y: -0.01, z: 4.8 },
    target: { x: 0, y: 0, z: 0.5 },
    up: { x: 0, y: 1, z: 0 },
  },
  close_tilt: {
    label: "特写仰视倾斜 (Dramatic Low-angle)",
    desc: "低机位仰拍中央物体，带有一定 Roll 轴横滚倾角",
    eye: { x: -1.8, y: -2.2, z: 0.2 },
    target: { x: 0, y: 0, z: 0.8 },
    up: { x: 0.3, y: 0, z: 0.95 },
  },
};

function normalize(v: Vec3): Vec3 {
  const len = Math.hypot(v.x, v.y, v.z) || 1e-6;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function populateSceneObjects(scene: Scene) {
  addStandardLights(scene);
  addGroundGrid(scene, 12, 12);

  // Red Box at (1.2, 0.8, 0.4)
  const boxGeom = new BoxGeometry(0.8, 0.8, 0.8);
  const boxMat = new MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.3,
    metalness: 0.2,
  });
  const box = new Mesh(boxGeom, boxMat);
  const [bx, by, bz] = mathToWorld(1.2, 0.8, 0.4);
  box.position.set(bx, by, bz);
  scene.add(box);

  // Green Cylinder at (-1.0, 0.9, 0.6)
  const cylGeom = new CylinderGeometry(0.4, 0.4, 1.2, 24);
  const cylMat = new MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.2,
    metalness: 0.3,
  });
  const cyl = new Mesh(cylGeom, cylMat);
  const [yx, yy, yz] = mathToWorld(-1.0, 0.9, 0.6);
  cyl.position.set(yx, yy, yz);
  scene.add(cyl);

  // Blue / Amber Sphere at (0, 0, 0.5)
  const sphGeom = new SphereGeometry(0.5, 32, 24);
  const sphMat = new MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.2,
    metalness: 0.4,
  });
  const sph = new Mesh(sphGeom, sphMat);
  const [sx, sy, sz] = mathToWorld(0, 0, 0.5);
  sph.position.set(sx, sy, sz);
  scene.add(sph);

  // World Origin Tripod Marker
  const arrowLen = 1.2;
  const origin = new Vector3(...mathToWorld(0, 0, 0));
  scene.add(
    new ArrowHelper(
      new Vector3(...mathToWorld(1, 0, 0)).normalize(),
      origin,
      arrowLen,
      0xef4444,
      0.15,
      0.08,
    ),
  );
  scene.add(
    new ArrowHelper(
      new Vector3(...mathToWorld(0, 1, 0)).normalize(),
      origin,
      arrowLen,
      0x10b981,
      0.15,
      0.08,
    ),
  );
  scene.add(
    new ArrowHelper(
      new Vector3(...mathToWorld(0, 0, 1)).normalize(),
      origin,
      arrowLen,
      0x3b82f6,
      0.15,
      0.08,
    ),
  );
}

function createWorldObserverScene() {
  const scene = new Scene();
  populateSceneObjects(scene);

  // Camera Visual Representation inside World Scene
  const camMarkerGroup = new Group();
  const camBodyGeom = new BoxGeometry(0.35, 0.25, 0.25);
  const camBodyMat = new MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.4,
    metalness: 0.8,
  });
  const camBody = new Mesh(camBodyGeom, camBodyMat);
  camMarkerGroup.add(camBody);

  const lensGeom = new CylinderGeometry(0.1, 0.12, 0.2, 16);
  const lensMat = new MeshStandardMaterial({
    color: 0x3b82f6,
    roughness: 0.2,
    metalness: 0.5,
  });
  const lens = new Mesh(lensGeom, lensMat);
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.18;
  camMarkerGroup.add(lens);

  scene.add(camMarkerGroup);

  // Camera Frustum Wireframe
  const frustumGeom = new BufferGeometry();
  const frustumLines = new LineSegments(
    frustumGeom,
    new LineBasicMaterial({
      color: 0x3b82f6,
      transparent: true,
      opacity: 0.7,
      linewidth: 2,
    }),
  );
  scene.add(frustumLines);

  // Sightline Ray
  const sightGeom = new BufferGeometry();
  const sightLine = new LineSegments(
    sightGeom,
    new LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.8,
      linewidth: 1.5,
    }),
  );
  scene.add(sightLine);

  return {
    scene,
    update(eye: Vec3, target: Vec3, upRaw: Vec3) {
      const f = normalize({
        x: target.x - eye.x,
        y: target.y - eye.y,
        z: target.z - eye.z,
      });
      const r = normalize(cross(f, upRaw));
      const u = cross(r, f);

      const [cWx, cWy, cWz] = mathToWorld(eye.x, eye.y, eye.z);
      const [tWx, tWy, tWz] = mathToWorld(target.x, target.y, target.z);

      camMarkerGroup.position.set(cWx, cWy, cWz);
      camMarkerGroup.lookAt(tWx, tWy, tWz);

      // Sightline line geometry
      sightGeom.setAttribute(
        "position",
        new Float32BufferAttribute([cWx, cWy, cWz, tWx, tWy, tWz], 3),
      );

      // Frustum wireframe
      const dist = Math.hypot(
        target.x - eye.x,
        target.y - eye.y,
        target.z - eye.z,
      );
      const aspect = 1.33;
      const fovRad = (50 * Math.PI) / 180;
      const halfH = Math.tan(fovRad / 2) * dist;
      const halfW = halfH * aspect;

      const pTL = mathToWorld(
        target.x - r.x * halfW + u.x * halfH,
        target.y - r.y * halfW + u.y * halfH,
        target.z - r.z * halfW + u.z * halfH,
      );
      const pTR = mathToWorld(
        target.x + r.x * halfW + u.x * halfH,
        target.y + r.y * halfW + u.y * halfH,
        target.z + r.z * halfW + u.z * halfH,
      );
      const pBR = mathToWorld(
        target.x + r.x * halfW - u.x * halfH,
        target.y + r.y * halfW - u.y * halfH,
        target.z + r.z * halfW - u.z * halfH,
      );
      const pBL = mathToWorld(
        target.x - r.x * halfW - u.x * halfH,
        target.y - r.y * halfW - u.y * halfH,
        target.z - r.z * halfW - u.z * halfH,
      );

      const frustumPositions = [
        cWx,
        cWy,
        cWz,
        ...pTL,
        cWx,
        cWy,
        cWz,
        ...pTR,
        cWx,
        cWy,
        cWz,
        ...pBR,
        cWx,
        cWy,
        cWz,
        ...pBL,
        ...pTL,
        ...pTR,
        ...pTR,
        ...pBR,
        ...pBR,
        ...pBL,
        ...pBL,
        ...pTL,
      ];
      frustumGeom.setAttribute(
        "position",
        new Float32BufferAttribute(frustumPositions, 3),
      );
    },
    dispose() {
      disposeObject(camMarkerGroup);
      disposeObject(frustumLines);
      disposeObject(sightLine);
      disposeObject(scene);
    },
  };
}

function createFirstPersonScene() {
  const scene = new Scene();
  populateSceneObjects(scene);

  return {
    scene,
    update(eye: Vec3, target: Vec3, upRaw: Vec3, camera: PerspectiveCamera) {
      const [cWx, cWy, cWz] = mathToWorld(eye.x, eye.y, eye.z);
      const [tWx, tWy, tWz] = mathToWorld(target.x, target.y, target.z);
      const [uWx, uWy, uWz] = mathToWorld(upRaw.x, upRaw.y, upRaw.z);

      camera.position.set(cWx, cWy, cWz);
      camera.up.set(uWx, uWy, uWz).normalize();
      camera.lookAt(tWx, tWy, tWz);
      camera.updateProjectionMatrix();
    },
    dispose() {
      disposeObject(scene);
    },
  };
}

export default function RotationViewDemo({ height }: { height?: string }) {
  const [presetKey, setPresetKey] = useState<PresetKey | "custom">("front");
  const [eye, setEye] = useState<Vec3>({ x: 0, y: -4.0, z: 1.2 });
  const [target, setTarget] = useState<Vec3>({ x: 0, y: 0, z: 0.5 });
  const [upRaw, setUpRaw] = useState<Vec3>({ x: 0, y: 0, z: 1 });

  // Handle Preset Switching
  const handlePreset = (key: string) => {
    setPresetKey(key as PresetKey);
    const p = PRESETS[key as PresetKey];
    if (p) {
      setEye({ ...p.eye });
      setTarget({ ...p.target });
      setUpRaw({ ...p.up });
    }
  };

  // Compute LookAt orthonormal basis (Gram-Schmidt)
  const f = normalize({
    x: target.x - eye.x,
    y: target.y - eye.y,
    z: target.z - eye.z,
  });
  const r = normalize(cross(f, upRaw));
  const u = cross(r, f);

  const tx = -dot(r, eye);
  const ty = -dot(u, eye);
  const tz = dot(f, eye);

  const fmt = (num: number) => num.toFixed(2);

  const viewMatrixTex = `V = \\begin{pmatrix}
\\mathbf{r}_x & \\mathbf{r}_y & \\mathbf{r}_z & -\\mathbf{r}\\cdot\\mathbf{eye} \\\\
\\mathbf{u}_x & \\mathbf{u}_y & \\mathbf{u}_z & -\\mathbf{u}\\cdot\\mathbf{eye} \\\\
-\\mathbf{f}_x & -\\mathbf{f}_y & -\\mathbf{f}_z & \\mathbf{f}\\cdot\\mathbf{eye} \\\\
0 & 0 & 0 & 1
\\end{pmatrix} = \\begin{pmatrix}
${fmt(r.x)} & ${fmt(r.y)} & ${fmt(r.z)} & ${fmt(tx)} \\\\
${fmt(u.x)} & ${fmt(u.y)} & ${fmt(u.z)} & ${fmt(ty)} \\\\
${fmt(-f.x)} & ${fmt(-f.y)} & ${fmt(-f.z)} & ${fmt(tz)} \\\\
0 & 0 & 0 & 1
\\end{pmatrix}`;

  return (
    <ExpandableDemo id="rotation-so3-view-demo" height={height}>
      <KdeWindowShell
        title="3D 相机视图变换与 LookAt 矩阵"
        eyebrow="3D 几何与刚体变换"
        mark="VIEW"
        modeTag="双视口空间几何"
        display={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left Viewport: Observer View */}
            <div className="relative h-[var(--demo-height,24rem)] w-full overflow-hidden rounded border border-border/70 bg-surface">
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded bg-surface/90 px-2 py-1 text-[11px] font-semibold text-foreground border border-border/60 shadow-xs backdrop-blur-xs">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                第三人称观察视口（世界坐标系）
              </div>
              <Viewer3DViewport
                factory={createWorldObserverScene}
                className="h-full w-full"
                onUpdate={({ api, viewer }) => {
                  api.update(eye, target, upRaw);
                  viewer.render();
                }}
                deps={[eye, target, upRaw]}
              >
                <div className="pointer-events-none absolute bottom-2 left-2 z-10 flex flex-col gap-1 rounded bg-surface/90 p-1.5 text-[11px] text-muted-foreground backdrop-blur-xs border border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 font-bold">● r (Right)</span>
                    <span className="text-emerald-500 font-bold">● u (Up)</span>
                    <span className="text-blue-500 font-bold">
                      ● f (Forward)
                    </span>
                  </div>
                </div>
              </Viewer3DViewport>
            </div>

            {/* Right Viewport: Camera View */}
            <div className="relative h-[var(--demo-height,24rem)] w-full overflow-hidden rounded border border-border/70 bg-surface">
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded bg-surface/90 px-2 py-1 text-[11px] font-semibold text-foreground border border-border/60 shadow-xs backdrop-blur-xs">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                第一人称相机视野（View 变换结果）
              </div>
              <Viewer3DViewport
                factory={createFirstPersonScene}
                className="h-full w-full"
                onUpdate={({ api, viewer }) => {
                  api.update(eye, target, upRaw, viewer.camera);
                  viewer.render();
                }}
                deps={[eye, target, upRaw]}
              >
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-6 w-6">
                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/40 shadow-xs" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/40 shadow-xs" />
                    <div className="absolute inset-0 rounded-full border border-white/30" />
                  </div>
                </div>
                <div className="pointer-events-none absolute bottom-2 right-2 z-10 rounded bg-surface/90 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur-xs border border-border/60">
                  FOV: 50° | LookAt
                </div>
              </Viewer3DViewport>
            </div>
          </div>
        }
        controls={
          <div className="space-y-3">
            <KdeCard title="相机姿态预设" variant="dense">
              <PresetSelector
                options={PRESETS}
                value={presetKey}
                onChange={handlePreset}
                size="xs"
              />
              <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                {presetKey === "custom"
                  ? "自定义相机姿态：根据滑块动态调整视点与朝向。"
                  : PRESETS[presetKey]?.desc}
              </p>
            </KdeCard>

            <KdeCard title="相机空间位置与朝向" variant="dense">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-foreground">
                  {"相机位置 $\\mathbf{eye} = (x,y,z)$"}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <ParamSlider
                    label="Eye X"
                    value={eye.x}
                    min={-6}
                    max={6}
                    step={0.1}
                    onChange={(v) => {
                      setEye({ ...eye, x: v });
                      setPresetKey("custom");
                    }}
                    widthClass="w-full"
                  />
                  <ParamSlider
                    label="Eye Y"
                    value={eye.y}
                    min={-6}
                    max={6}
                    step={0.1}
                    onChange={(v) => {
                      setEye({ ...eye, y: v });
                      setPresetKey("custom");
                    }}
                    widthClass="w-full"
                  />
                  <ParamSlider
                    label="Eye Z"
                    value={eye.z}
                    min={-2}
                    max={6}
                    step={0.1}
                    onChange={(v) => {
                      setEye({ ...eye, z: v });
                      setPresetKey("custom");
                    }}
                    widthClass="w-full"
                  />
                </div>

                <div className="pt-2 text-[11px] font-semibold text-foreground">
                  {"注视目标点 $\\mathbf{target} = (x,y,z)$"}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <ParamSlider
                    label="Target X"
                    value={target.x}
                    min={-4}
                    max={4}
                    step={0.1}
                    onChange={(v) => {
                      setTarget({ ...target, x: v });
                      setPresetKey("custom");
                    }}
                    widthClass="w-full"
                  />
                  <ParamSlider
                    label="Target Y"
                    value={target.y}
                    min={-4}
                    max={4}
                    step={0.1}
                    onChange={(v) => {
                      setTarget({ ...target, y: v });
                      setPresetKey("custom");
                    }}
                    widthClass="w-full"
                  />
                  <ParamSlider
                    label="Target Z"
                    value={target.z}
                    min={-2}
                    max={4}
                    step={0.1}
                    onChange={(v) => {
                      setTarget({ ...target, z: v });
                      setPresetKey("custom");
                    }}
                    widthClass="w-full"
                  />
                </div>

                <div className="pt-2 text-[11px] font-semibold text-foreground">
                  {"上方向向量 $\\mathbf{up} = (x,y,z)$"}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <ParamSlider
                    label="Up X"
                    value={upRaw.x}
                    min={-1}
                    max={1}
                    step={0.05}
                    onChange={(v) => {
                      setUpRaw({ ...upRaw, x: v });
                      setPresetKey("custom");
                    }}
                    widthClass="w-full"
                  />
                  <ParamSlider
                    label="Up Y"
                    value={upRaw.y}
                    min={-1}
                    max={1}
                    step={0.05}
                    onChange={(v) => {
                      setUpRaw({ ...upRaw, y: v });
                      setPresetKey("custom");
                    }}
                    widthClass="w-full"
                  />
                  <ParamSlider
                    label="Up Z"
                    value={upRaw.z}
                    min={-1}
                    max={1}
                    step={0.05}
                    onChange={(v) => {
                      setUpRaw({ ...upRaw, z: v });
                      setPresetKey("custom");
                    }}
                    widthClass="w-full"
                  />
                </div>
              </div>
            </KdeCard>

            <div className="grid grid-cols-2 gap-1.5">
              <KdeReadout
                label="视线方向 f (单位)"
                value={`(${fmt(f.x)}, ${fmt(f.y)}, ${fmt(f.z)})`}
                variant="accent"
                dense
              />
              <KdeReadout
                label="相机右向量 r"
                value={`(${fmt(r.x)}, ${fmt(r.y)}, ${fmt(r.z)})`}
                dense
              />
              <KdeReadout
                label="相机真上向量 u"
                value={`(${fmt(u.x)}, ${fmt(u.y)}, ${fmt(u.z)})`}
                dense
              />
              <KdeReadout
                label="正交基积 r · u"
                value={dot(r, u).toFixed(4)}
                variant="success"
                dense
              />
            </div>

            <KdeCard title="4x4 视图矩阵推导" variant="dense">
              <div className="overflow-x-auto rounded bg-surface p-2 font-mono text-xs text-primary border border-border/40">
                {`$${viewMatrixTex}$`}
              </div>
            </KdeCard>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
