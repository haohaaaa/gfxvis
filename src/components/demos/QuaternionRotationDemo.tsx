import { useState, useMemo } from "react";
import {
  Scene,
  Group,
  Vector3,
  ArrowHelper,
  Mesh,
  BoxGeometry,
  ConeGeometry,
  MeshStandardMaterial,
  GridHelper,
  BufferGeometry,
  Line,
  LineDashedMaterial,
  Matrix4,
  Quaternion as ThreeQuaternion,
} from "three";
import ExpandableDemo from "../framework/ExpandableDemo";
import Viewer3DViewport from "../framework/Viewer3DViewport";
import ParamSlider from "../framework/ParamSlider";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import PresetSelector from "../framework/PresetSelector";
import {
  type Vec3,
  type Quat,
  type Matrix3x3,
  normalize,
  axisAngleToQuat,
  slerp,
  quatToMatrix3x3,
  determinant3x3,
  getColumn3,
} from "@math";
import { mathToWorld } from "../../visualizations/core/3d/coords";
import {
  addStandardLights,
  disposeObject,
} from "../../visualizations/core/3d/three-utils";

type DemoTab = "inspect" | "interpolation";

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

const TABS = [
  { id: "inspect", label: "1. 轴角与双重覆盖 (SO(3) vs Spin(3))" },
  { id: "interpolation", label: "2. 旋转插值对比 (SLERP vs LERP)" },
] as const;

const PRESETS: Record<string, { label: string; desc: string }> = {
  identity: {
    label: "恒等姿态 (0°)",
    desc: "无旋转，单位四元数 q = (1, 0, 0, 0)",
  },
  yaw_90: { label: "偏航 Yaw 90° (+Z轴)", desc: "绕垂直轴旋转90度" },
  pitch_90: { label: "俯仰 Pitch 90° (+X轴)", desc: "抬头90度旋转" },
  roll_90: { label: "滚转 Roll 90° (+Y轴)", desc: "顺时针滚转90度" },
  diagonal_120: {
    label: "体对角线 120° (1,1,1)",
    desc: "三轴坐标轮换对称，循环交换 X->Y->Z",
  },
};

function createAircraftMesh(color: number, opacity: number = 1.0) {
  const group = new Group();

  // Fuselage
  const bodyGeo = new ConeGeometry(0.4, 1.8, 16);
  bodyGeo.rotateX(Math.PI / 2);
  const bodyMat = new MeshStandardMaterial({
    color,
    roughness: 0.3,
    metalness: 0.7,
    transparent: opacity < 1.0,
    opacity,
  });
  group.add(new Mesh(bodyGeo, bodyMat));

  // Wings
  const wingGeo = new BoxGeometry(1.8, 0.5, 0.06);
  const wingMat = new MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.4,
    metalness: 0.5,
    transparent: opacity < 1.0,
    opacity,
  });
  const wings = new Mesh(wingGeo, wingMat);
  wings.position.set(0, -0.2, 0);
  group.add(wings);

  // Tail fin
  const finGeo = new BoxGeometry(0.06, 0.4, 0.5);
  const finMat = new MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.3,
    metalness: 0.6,
    transparent: opacity < 1.0,
    opacity,
  });
  const fin = new Mesh(finGeo, finMat);
  fin.position.set(0, -0.6, 0.25);
  group.add(fin);

  // Local Coordinate Axes
  const arrowLen = 1.2;
  group.add(
    new ArrowHelper(
      new Vector3(1, 0, 0),
      new Vector3(0, 0, 0),
      arrowLen,
      0xef4444,
      0.2,
      0.1,
    ),
  );
  group.add(
    new ArrowHelper(
      new Vector3(0, 0, -1),
      new Vector3(0, 0, 0),
      arrowLen,
      0x10b981,
      0.2,
      0.1,
    ),
  );
  group.add(
    new ArrowHelper(
      new Vector3(0, 1, 0),
      new Vector3(0, 0, 0),
      arrowLen,
      0x3b82f6,
      0.2,
      0.1,
    ),
  );

  return group;
}

function createQuaternionScene() {
  const scene = new Scene();
  addStandardLights(scene);

  const grid = new GridHelper(8, 8, 0x94a3b8, 0x334155);
  grid.position.y = -1.2;
  scene.add(grid);

  const dynamicGroup = new Group();
  scene.add(dynamicGroup);

  return {
    scene,
    update(
      activeTab: DemoTab,
      currentMat: Matrix3x3,
      axis: Vec3,
      slerpMat: Matrix3x3,
      lerpMat: Matrix3x3,
    ) {
      disposeObject(dynamicGroup);
      dynamicGroup.clear();

      if (activeTab === "inspect") {
        const craft = createAircraftMesh(0x0284c7, 1.0);

        const c0 = getColumn3(currentMat, 0);
        const c1 = getColumn3(currentMat, 1);
        const c2 = getColumn3(currentMat, 2);
        const [c0x, c0y, c0z] = mathToWorld(c0.x, c0.y, c0.z);
        const [c1x, c1y, c1z] = mathToWorld(c1.x, c1.y, c1.z);
        const [c2x, c2y, c2z] = mathToWorld(c2.x, c2.y, c2.z);

        const threeMat = new Matrix4().makeBasis(
          new Vector3(c0x, c0y, c0z),
          new Vector3(c2x, c2y, c2z),
          new Vector3(-c1x, -c1y, -c1z),
        );
        craft.quaternion.setFromRotationMatrix(threeMat);
        dynamicGroup.add(craft);

        // Rotation axis
        const uNorm = normalize(axis);
        const [uWx, uWy, uWz] = mathToWorld(uNorm.x, uNorm.y, uNorm.z);
        const axisDir = new Vector3(uWx, uWy, uWz).normalize();

        const axisLineGeo = new BufferGeometry().setFromPoints([
          axisDir.clone().multiplyScalar(-2.5),
          axisDir.clone().multiplyScalar(2.5),
        ]);
        const axisLineMat = new LineDashedMaterial({
          color: 0xf59e0b,
          dashSize: 0.15,
          gapSize: 0.08,
        });
        const axisLine = new Line(axisLineGeo, axisLineMat);
        axisLine.computeLineDistances();
        dynamicGroup.add(axisLine);

        const axisArrow = new ArrowHelper(
          axisDir,
          new Vector3(0, 0, 0),
          2.5,
          0xf59e0b,
          0.3,
          0.18,
        );
        dynamicGroup.add(axisArrow);
      } else {
        // SLERP Craft (Left)
        const slerpCraft = createAircraftMesh(0x10b981, 1.0);
        const s0 = getColumn3(slerpMat, 0);
        const s1 = getColumn3(slerpMat, 1);
        const s2 = getColumn3(slerpMat, 2);
        const [s0x, s0y, s0z] = mathToWorld(s0.x, s0.y, s0.z);
        const [s1x, s1y, s1z] = mathToWorld(s1.x, s1.y, s1.z);
        const [s2x, s2y, s2z] = mathToWorld(s2.x, s2.y, s2.z);

        const slerpThreeMat = new Matrix4().makeBasis(
          new Vector3(s0x, s0y, s0z),
          new Vector3(s2x, s2y, s2z),
          new Vector3(-s1x, -s1y, -s1z),
        );
        slerpCraft.quaternion.setFromRotationMatrix(slerpThreeMat);
        const [sPosWx, sPosWy, sPosWz] = mathToWorld(-1.8, 0, 0);
        slerpCraft.position.set(sPosWx, sPosWy, sPosWz);
        dynamicGroup.add(slerpCraft);

        // LERP Craft (Right)
        const lerpCraft = createAircraftMesh(0xf97316, 0.85);
        const l0 = getColumn3(lerpMat, 0);
        const l1 = getColumn3(lerpMat, 1);
        const l2 = getColumn3(lerpMat, 2);
        const [l0x, l0y, l0z] = mathToWorld(l0.x, l0.y, l0.z);
        const [l1x, l1y, l1z] = mathToWorld(l1.x, l1.y, l1.z);
        const [l2x, l2y, l2z] = mathToWorld(l2.x, l2.y, l2.z);

        const lerpThreeMat = new Matrix4().makeBasis(
          new Vector3(l0x, l0y, l0z),
          new Vector3(l2x, l2y, l2z),
          new Vector3(-l1x, -l1y, -l1z),
        );
        const pos = new Vector3();
        const rot = new ThreeQuaternion();
        const scl = new Vector3();
        lerpThreeMat.decompose(pos, rot, scl);

        lerpCraft.quaternion.copy(rot);
        lerpCraft.scale.copy(scl);
        const [lPosWx, lPosWy, lPosWz] = mathToWorld(1.8, 0, 0);
        lerpCraft.position.set(lPosWx, lPosWy, lPosWz);
        dynamicGroup.add(lerpCraft);
      }
    },
    dispose() {
      disposeObject(dynamicGroup);
      disposeObject(grid);
      disposeObject(scene);
    },
  };
}

export default function QuaternionRotationDemo({
  height,
}: {
  height?: string;
}) {
  const [activeTab, setActiveTab] = useState<DemoTab>("inspect");
  const [presetKey, setPresetKey] = useState<string>("identity");

  // Inspect mode state
  const [axis, setAxis] = useState<Vec3>({ x: 0, y: 0, z: 1 });
  const [angleDeg, setAngleDeg] = useState<number>(0);
  const [isNegated, setIsNegated] = useState<boolean>(false);

  // Interpolation mode state
  const [tInterp, setTInterp] = useState<number>(0.5);

  const baseQuat: Quat = useMemo(() => {
    return axisAngleToQuat(axis, (angleDeg * Math.PI) / 180);
  }, [axis, angleDeg]);

  const currentQuat: Quat = useMemo(() => {
    return isNegated
      ? {
          w: -baseQuat.w,
          x: -baseQuat.x,
          y: -baseQuat.y,
          z: -baseQuat.z,
        }
      : baseQuat;
  }, [baseQuat, isNegated]);

  const currentMat: Matrix3x3 = useMemo(() => {
    return quatToMatrix3x3(currentQuat);
  }, [currentQuat]);

  const qStart: Quat = { w: 1, x: 0, y: 0, z: 0 };
  const qEnd: Quat = useMemo(
    () => axisAngleToQuat({ x: 1, y: 1, z: 1 }, (160 * Math.PI) / 180),
    [],
  );
  const mStart: Matrix3x3 = useMemo(() => quatToMatrix3x3(qStart), []);
  const mEnd: Matrix3x3 = useMemo(() => quatToMatrix3x3(qEnd), [qEnd]);

  const slerpQuat = useMemo(
    () => slerp(qStart, qEnd, tInterp),
    [qEnd, tInterp],
  );
  const slerpMat = useMemo(() => quatToMatrix3x3(slerpQuat), [slerpQuat]);
  const lerpMat = useMemo(
    () => matrix3x3Lerp(mStart, mEnd, tInterp),
    [mStart, mEnd, tInterp],
  );
  const lerpDet = useMemo(() => determinant3x3(lerpMat), [lerpMat]);

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

  return (
    <ExpandableDemo id="quaternion-rotation-3d-demo" height={height}>
      <KdeWindowShell
        title="四元数与三维旋转 (Quaternions & 3D Rotations)"
        eyebrow="Linear Algebra · SO(3) & Quaternions"
        mark="q = cos(θ/2) + u sin(θ/2)"
        modeTag={
          activeTab === "inspect" ? "双重覆盖与欧拉旋转" : "球面线性插值 SLERP"
        }
        display={
          <Viewer3DViewport
            factory={createQuaternionScene}
            className="h-[var(--demo-height,28rem)]"
            onUpdate={({ api, viewer }) => {
              api.update(activeTab, currentMat, axis, slerpMat, lerpMat);
              viewer.render();
            }}
            deps={[activeTab, currentMat, axis, slerpMat, lerpMat]}
          >
            {activeTab === "interpolation" && (
              <div className="absolute top-3 inset-x-0 flex justify-center gap-12 pointer-events-none text-xs font-bold">
                <div className="rounded-md border border-emerald-500/50 bg-emerald-950/80 px-2.5 py-1 text-emerald-300 shadow-md backdrop-blur-xs">
                  左侧：四元数 SLERP (刚体测地线，行列式恒等于 1.0)
                </div>
                <div className="rounded-md border border-orange-500/50 bg-orange-950/80 px-2.5 py-1 text-orange-300 shadow-md backdrop-blur-xs">
                  右侧：矩阵直角 LERP (非刚体形变，体积缩水 det ={" "}
                  {lerpDet.toFixed(2)})
                </div>
              </div>
            )}
          </Viewer3DViewport>
        }
        controls={
          <div className="space-y-3">
            <KdeTabs
              options={TABS}
              value={activeTab}
              onChange={(tab: string) => setActiveTab(tab as DemoTab)}
            />

            {activeTab === "inspect" ? (
              <>
                <KdeCard title="典型旋转预设" variant="dense">
                  <PresetSelector
                    options={PRESETS}
                    value={presetKey}
                    onChange={handlePreset}
                  />
                </KdeCard>

                <KdeCard title="旋转轴 u 与转角 θ 控制" variant="dense">
                  <div className="space-y-2">
                    <ParamSlider
                      label="旋转角 $\theta$"
                      value={angleDeg}
                      min={-360}
                      max={360}
                      step={1}
                      onChange={(v) => {
                        setAngleDeg(v);
                        setPresetKey("custom");
                      }}
                      display={`${angleDeg.toFixed(0)}°`}
                      widthClass="w-full"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <ParamSlider
                        label="轴 $u_x$"
                        value={axis.x}
                        min={-2}
                        max={2}
                        step={0.1}
                        onChange={(x) => {
                          setAxis((prev: Vec3) => ({ ...prev, x }));
                          setPresetKey("custom");
                        }}
                        widthClass="w-full"
                      />
                      <ParamSlider
                        label="轴 $u_y$"
                        value={axis.y}
                        min={-2}
                        max={2}
                        step={0.1}
                        onChange={(y) => {
                          setAxis((prev: Vec3) => ({ ...prev, y }));
                          setPresetKey("custom");
                        }}
                        widthClass="w-full"
                      />
                      <ParamSlider
                        label="轴 $u_z$"
                        value={axis.z}
                        min={-2}
                        max={2}
                        step={0.1}
                        onChange={(z) => {
                          setAxis((prev: Vec3) => ({ ...prev, z }));
                          setPresetKey("custom");
                        }}
                        widthClass="w-full"
                      />
                    </div>
                  </div>
                </KdeCard>

                <KdeCard title="双重覆盖与拓扑反演 (2:1 覆盖)" variant="dense">
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setIsNegated(!isNegated)}
                      className={`w-full py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                        isNegated
                          ? "bg-purple-600 hover:bg-purple-500 text-white shadow-xs"
                          : "bg-surface-elevated/70 border border-border/80 text-foreground hover:bg-accent/15 hover:border-accent"
                      }`}
                    >
                      {isNegated
                        ? "✓ 当前为反向对跖四元数 (-q)"
                        : "点击反转符号测试对跖四元数 (q → -q)"}
                    </button>
                    <p className="text-[11px] text-muted-foreground leading-normal">
                      四元数单位超球面 $S^3$ 对三维正交群 $SO(3)$ 构成 $2:1${" "}
                      <strong>双重覆盖</strong>：$q$ 与 $-q$
                      虽然符号相反，但代表空间中<strong>完全相同</strong>
                      的旋转姿态！
                    </p>
                  </div>
                </KdeCard>

                <div className="grid grid-cols-2 gap-1.5">
                  <KdeReadout
                    label="实部标量 w"
                    value={currentQuat.w.toFixed(3)}
                    variant="accent"
                    dense
                  />
                  <KdeReadout
                    label="虚部向量 (x, y, z)"
                    value={`(${currentQuat.x.toFixed(2)}, ${currentQuat.y.toFixed(2)}, ${currentQuat.z.toFixed(2)})`}
                    dense
                  />
                  <KdeReadout
                    label="四元数模长 ‖q‖"
                    value={Math.hypot(
                      currentQuat.w,
                      currentQuat.x,
                      currentQuat.y,
                      currentQuat.z,
                    ).toFixed(4)}
                    variant="success"
                    dense
                  />
                  <KdeReadout
                    label="行列式 det(R)"
                    value={determinant3x3(currentMat).toFixed(3)}
                    dense
                  />
                </div>
              </>
            ) : (
              <>
                <KdeCard title="插值进度 t" variant="dense">
                  <ParamSlider
                    label="时间轴 $t \in [0, 1]$"
                    value={tInterp}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={setTInterp}
                    widthClass="w-full"
                  />
                </KdeCard>

                <div className="grid grid-cols-2 gap-1.5">
                  <KdeReadout
                    label="SLERP 体积 det(R)"
                    value="1.000 (保刚体)"
                    variant="success"
                    dense
                  />
                  <KdeReadout
                    label="LERP 体积 det(M)"
                    value={lerpDet.toFixed(3)}
                    variant={lerpDet < 0.9 ? "danger" : "warning"}
                    dense
                  />
                </div>
              </>
            )}
          </div>
        }
      />
    </ExpandableDemo>
  );
}
