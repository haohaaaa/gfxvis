import { AutoMath } from "../framework/AutoMath";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  Scene,
  Group,
  PerspectiveCamera,
  WebGLRenderer,
  Vector3,
  ArrowHelper,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  AmbientLight,
  DirectionalLight,
  GridHelper,
} from "three";
import ExpandableDemo from "../framework/ExpandableDemo";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import ParamSlider from "../framework/ParamSlider";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import { createControls } from "../../visualizations/core/3d/controls";
import { mathToWorld } from "../../visualizations/core/3d/coords";
import { S3_PERMUTATIONS } from "../../math/permutation";

type DemoTab = "geometry" | "sparse";

export default function PermutationMatrixDemo() {
  const [activeTab, setActiveTab] = useState<DemoTab>("geometry");
  const [selectedPermId, setSelectedPermId] = useState<string>("t12");
  const [opMode, setOpMode] = useState<"left" | "right">("left");
  const [animProgress, setAnimProgress] = useState<number>(1.0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [showGrid] = useState<boolean>(true);
  const [showBasis] = useState<boolean>(true);
  const [showObject] = useState<boolean>(true);

  // Sparse comparison state
  const [sparsePermuted, setSparsePermuted] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<WebGLRenderer | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<PerspectiveCamera | null>(null);
  const controlsRef = useRef<ReturnType<typeof createControls> | null>(null);
  const dynamicGroupRef = useRef<Group | null>(null);
  const gridHelperRef = useRef<GridHelper | null>(null);
  const animReqRef = useRef<number | null>(null);

  const currentPerm = useMemo(() => {
    return (
      S3_PERMUTATIONS.find((p) => p.id === selectedPermId) || S3_PERMUTATIONS[0]
    );
  }, [selectedPermId]);

  // Handle smooth animation when permutation changes
  const triggerTransition = (newPermId: string) => {
    setSelectedPermId(newPermId);
    setAnimProgress(0);
    setIsAnimating(true);
  };

  useEffect(() => {
    if (!isAnimating) return;
    let start: number | null = null;
    const duration = 600; // ms

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(1.0, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(eased);

      if (progress < 1.0) {
        animReqRef.current = requestAnimationFrame(step);
      } else {
        setIsAnimating(false);
      }
    };

    animReqRef.current = requestAnimationFrame(step);
    return () => {
      if (animReqRef.current) cancelAnimationFrame(animReqRef.current);
    };
  }, [isAnimating]);

  // Three.js Scene Setup
  useEffect(() => {
    if (!containerRef.current || activeTab !== "geometry") return;

    const width = containerRef.current.clientWidth;
    const height = 460;

    const scene = new Scene();
    sceneRef.current = scene;

    const camera = new PerspectiveCamera(45, width / height, 0.1, 100);
    const [wx, wy, wz] = mathToWorld(3.8, -4.5, 3.2);
    camera.position.set(wx, wy, wz);
    camera.up.set(0, 1, 0);
    cameraRef.current = camera;

    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;

    containerRef.current.replaceChildren(renderer.domElement);

    const controls = createControls(camera, renderer.domElement);
    const [tx, ty, tz] = mathToWorld(0, 0, 0.5);
    controls.target.set(tx, ty, tz);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new DirectionalLight(0x90b0ff, 0.6);
    dirLight2.position.set(-5, -5, -3);
    scene.add(dirLight2);

    // Ground Grid on xy plane (z = 0 in math coords -> y = 0 in world)
    const grid = new GridHelper(10, 20, 0x3b82f6, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);
    gridHelperRef.current = grid;

    const dynamicGroup = new Group();
    scene.add(dynamicGroup);
    dynamicGroupRef.current = dynamicGroup;

    let isSubscribed = true;
    const renderLoop = () => {
      if (!isSubscribed) return;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(renderLoop);
    };
    renderLoop();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isSubscribed = false;
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      scene.clear();
    };
  }, [activeTab]);

  // Update Grid visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Update Dynamic 3D Objects (Basis & Geometry) under current interpolation
  useEffect(() => {
    const group = dynamicGroupRef.current;
    if (!group || activeTab !== "geometry") return;

    // Clear previous dynamic meshes
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    // Interpolate matrix between Identity and P
    const t = animProgress;
    const P = currentPerm.matrix;
    // Lerped matrix L = (1-t)I + t P
    const L: number[][] = [
      [
        (1 - t) * 1 + t * P[0][0],
        (1 - t) * 0 + t * P[0][1],
        (1 - t) * 0 + t * P[0][2],
      ],
      [
        (1 - t) * 0 + t * P[1][0],
        (1 - t) * 1 + t * P[1][1],
        (1 - t) * 0 + t * P[1][2],
      ],
      [
        (1 - t) * 0 + t * P[2][0],
        (1 - t) * 0 + t * P[2][1],
        (1 - t) * 1 + t * P[2][2],
      ],
    ];

    // Compute transformed basis vectors
    const basisColors = [0xef4444, 0x10b981, 0x3b82f6]; // X: Red, Y: Green, Z: Blue
    const unitVectors: [number, number, number][] = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];

    if (showBasis) {
      unitVectors.forEach((uv, i) => {
        // Transformed vector v = L * uv
        const vx = L[0][0] * uv[0] + L[0][1] * uv[1] + L[0][2] * uv[2];
        const vy = L[1][0] * uv[0] + L[1][1] * uv[1] + L[1][2] * uv[2];
        const vz = L[2][0] * uv[0] + L[2][1] * uv[1] + L[2][2] * uv[2];

        const [wx, wy, wz] = mathToWorld(vx, vy, vz);
        const dir = new Vector3(wx, wy, wz);
        const len = dir.length() || 0.001;
        dir.normalize();

        const arrow = new ArrowHelper(
          dir,
          new Vector3(0, 0, 0),
          len * 1.6,
          basisColors[i],
          0.32,
          0.16,
        );
        group.add(arrow);
      });
    }

    if (showObject) {
      // Create an asymmetric 3D reference letter "F" / Tetrahedron
      const objectGroup = new Group();

      // Stem along Z
      const stemGeom = new CylinderGeometry(0.08, 0.08, 1.4, 16);
      const stemMat = new MeshStandardMaterial({
        color: 0x6366f1,
        metalness: 0.2,
        roughness: 0.3,
      });
      const stem = new Mesh(stemGeom, stemMat);
      stem.position.y = 0.7;
      objectGroup.add(stem);

      // Top bar along X
      const topGeom = new BoxGeometry(0.8, 0.12, 0.12);
      const topMat = new MeshStandardMaterial({
        color: 0xec4899,
        metalness: 0.2,
        roughness: 0.3,
      });
      const topBar = new Mesh(topGeom, topMat);
      topBar.position.set(0.35, 1.34, 0);
      objectGroup.add(topBar);

      // Mid bar along Y
      const midGeom = new BoxGeometry(0.12, 0.12, 0.55);
      const midMat = new MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.2,
        roughness: 0.3,
      });
      const midBar = new Mesh(midGeom, midMat);
      midBar.position.set(0, 0.85, 0.22);
      objectGroup.add(midBar);

      group.add(objectGroup);
    }
  }, [currentPerm, animProgress, showBasis, showObject, activeTab]);

  const modeTabs = (
    <KdeTabs
      options={[
        { id: "geometry", label: "3D 几何手性与基底置换" },
        { id: "sparse", label: "稀疏矩阵 Cholesky 填充优化" },
      ]}
      value={activeTab}
      onChange={(tab) => setActiveTab(tab as DemoTab)}
    />
  );

  const geometryDisplay = (
    <div className="relative w-full h-[var(--demo-height,28rem)] rounded-xl overflow-hidden border border-border bg-slate-950 shadow-inner">
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Overlay Chirality & Parity Badge */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md shadow-md ${
            currentPerm.det === 1
              ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-300"
              : "bg-rose-950/80 border border-rose-500/50 text-rose-300"
          }`}
        >
          <span>
            {currentPerm.det === 1
              ? "👍 右手系保持 (det = +1)"
              : "👎 左手系翻转 (det = -1)"}
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-900/80 border border-slate-700/60 text-slate-300 backdrop-blur-md">
          <span>{currentPerm.geometricDesc}</span>
        </div>
      </div>

      {/* 3D Axis Legend */}
      <div className="absolute bottom-4 right-3 flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-700/60 text-[11px] font-mono text-slate-300 backdrop-blur-md pointer-events-none">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          e₁ (X)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          e₂ (Y)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          e₃ (Z)
        </span>
      </div>

      <CanvasToolbar
        onReset={() => {
          setAnimProgress(1.0);
          if (controlsRef.current && cameraRef.current) {
            const [wx, wy, wz] = mathToWorld(3.8, -4.5, 3.2);
            cameraRef.current.position.set(wx, wy, wz);
            const [tx, ty, tz] = mathToWorld(0, 0, 0.5);
            controlsRef.current.target.set(tx, ty, tz);
          }
        }}
      />
      <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
    </div>
  );

  const geometryControls = (
    <div className="space-y-3">
      <KdeCard title="工作台视图" variant="dense">
        {modeTabs}
      </KdeCard>

      <KdeCard title="乘法作用方式" variant="dense">
        <KdeTabs
          options={[
            { id: "left", label: "左乘 PA (行置换)" },
            { id: "right", label: "右乘 AP (列置换)" },
          ]}
          value={opMode}
          onChange={(mode) => setOpMode(mode as "left" | "right")}
          size="xs"
        />
      </KdeCard>

      <KdeCard title="基底插值过渡" variant="dense">
        <ParamSlider
          label="过渡进度 (Identity → Permuted)"
          value={animProgress}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => setAnimProgress(v)}
        />
      </KdeCard>

      <KdeCard title="对称群 S₃ 置换元素 (n! = 6)" variant="dense">
        <div className="grid grid-cols-2 gap-1.5">
          {S3_PERMUTATIONS.map((p) => {
            const isSelected = p.id === currentPerm.id;
            return (
              <button
                key={p.id}
                onClick={() => triggerTransition(p.id)}
                className={`flex flex-col items-start p-2 rounded border text-left transition-all ${
                  isSelected
                    ? "bg-accent/15 border-accent text-accent font-semibold shadow-xs"
                    : "bg-surface-elevated/40 border-border/60 text-ink hover:border-accent/40"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold">{p.name}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                      p.det === 1
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    det={p.det > 0 ? "+1" : "-1"}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-muted mt-0.5">
                  循环: {p.cycleNotation}
                </span>
              </button>
            );
          })}
        </div>
      </KdeCard>

      <KdeCard title="代数结构与正交性诊断" variant="dense">
        <div className="space-y-2">
          <div>
            <div className="text-[11px] text-muted mb-1">置换矩阵 P：</div>
            <div className="font-mono bg-surface-elevated/50 p-2 rounded border border-border flex flex-col items-center">
              {currentPerm.matrix.map((row: number[], rIdx: number) => (
                <div key={rIdx} className="flex gap-3">
                  {row.map((val: number, cIdx: number) => (
                    <span
                      key={cIdx}
                      className={`w-4 text-center font-bold ${
                        val === 1 ? "text-accent" : "text-muted/40"
                      }`}
                    >
                      {val}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <KdeReadout
              label="逆序数 inv"
              value={currentPerm.inversions}
              dense
            />
            <KdeReadout
              label="置换奇偶性"
              value={
                currentPerm.parity === "even" ? "偶置换 (Even)" : "奇置换 (Odd)"
              }
              variant={currentPerm.parity === "even" ? "success" : "danger"}
              dense
            />
            <KdeReadout
              label="行列式 det(P)"
              value={currentPerm.det > 0 ? "+1" : "-1"}
              variant={currentPerm.det > 0 ? "success" : "danger"}
              dense
            />
            <KdeReadout
              label="正交检验 PᵀP"
              value="I (单位阵)"
              variant="success"
              dense
            />
            <KdeReadout
              label="逆矩阵 P⁻¹"
              value="Pᵀ (转置)"
              variant="accent"
              dense
            />
          </div>
        </div>
      </KdeCard>
    </div>
  );

  const sparseDisplay = (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Natural Ordering Matrix */}
        <div className="p-4 rounded-xl border border-border bg-surface flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-ink">
              1. 自然标号矩阵 A 与分解 L
            </span>
            <span className="text-xs font-mono text-rose-500 font-bold">
              Fill-in: +8 个非零元
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 p-3 bg-background rounded-lg border border-border max-w-[280px] mx-auto">
            {[
              [1, 1, 0, 0, 1],
              [1, 1, 1, 0, 0],
              [0, 1, 1, 1, 0],
              [0, 0, 1, 1, 1],
              [1, 0, 0, 1, 1],
            ].map((row, r) =>
              row.map((val, c) => {
                const isFillin =
                  (r === 4 && c === 1) ||
                  (r === 4 && c === 2) ||
                  (r === 3 && c === 0);
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-10 h-10 rounded flex items-center justify-center font-mono text-xs font-bold ${
                      isFillin
                        ? "bg-rose-500/20 text-rose-500 border border-rose-500/40"
                        : val === 1
                          ? "bg-accent/20 text-accent border border-accent/40"
                          : "bg-surface/40 text-muted/20 border border-border/40"
                    }`}
                  >
                    {isFillin ? "F" : val === 1 ? "●" : "0"}
                  </div>
                );
              }),
            )}
          </div>
          <p className="text-[11px] text-muted text-center">
            自然编号下，远离对角线的端点连接导致消元时发生连锁填充（Fill-in
            泛滥）。
          </p>
        </div>

        {/* Permuted Matrix PAP^T */}
        <div className="p-4 rounded-xl border border-accent/40 bg-accent/5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <span className="text-xs font-bold text-ink">
              2. RCM / AMD 置换后矩阵 P A Pᵀ 与 L
            </span>
            <span className="text-xs font-mono text-emerald-500 font-bold">
              Fill-in: 仅 +1 个非零元
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 p-3 bg-background rounded-lg border border-border max-w-[280px] mx-auto">
            {[
              [1, 1, 0, 0, 0],
              [1, 1, 1, 0, 0],
              [0, 1, 1, 1, 0],
              [0, 0, 1, 1, 1],
              [0, 0, 0, 1, 1],
            ].map((row, r) =>
              row.map((val, c) => {
                const isFillin = r === 4 && c === 2;
                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-10 h-10 rounded flex items-center justify-center font-mono text-xs font-bold ${
                      isFillin
                        ? "bg-emerald-500/20 text-emerald-500 border border-emerald-500/40"
                        : val === 1
                          ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40"
                          : "bg-surface/40 text-muted/20 border border-border/40"
                    }`}
                  >
                    {isFillin ? "F" : val === 1 ? "●" : "0"}
                  </div>
                );
              }),
            )}
          </div>
          <p className="text-[11px] text-muted text-center">
            通过置换矩阵重编号后，矩阵严格收缩为紧凑带状矩阵，Cholesky
            计算速度提升 3~10 倍！
          </p>
        </div>
      </div>
    </div>
  );

  const sparseControls = (
    <div className="space-y-3">
      <KdeCard title="工作台视图" variant="dense">
        {modeTabs}
      </KdeCard>

      <KdeCard title="重编号算法控制" variant="dense">
        <button
          onClick={() => setSparsePermuted(!sparsePermuted)}
          className={`w-full py-2 px-3 text-xs font-bold rounded-lg transition-all ${
            sparsePermuted
              ? "bg-accent text-white shadow-md shadow-accent/20"
              : "bg-surface border border-border text-ink hover:border-accent"
          }`}
        >
          {sparsePermuted
            ? "✓ 已启用 AMD / RCM 置换 P A Pᵀ"
            : "切换为 AMD 最小填充置换"}
        </button>
      </KdeCard>

      <KdeCard title="Cholesky 填充对比" variant="dense">
        <div className="space-y-1.5">
          <KdeReadout
            label="自然标号填充"
            value="+8 个非零元"
            variant="danger"
            dense
          />
          <KdeReadout
            label="AMD/RCM 置换填充"
            value="+1 个非零元"
            variant="success"
            dense
          />
          <p className="text-[11px] text-muted mt-2">
            重排矩阵节点标号 PAPᵀ
            可将非零元集中于主对角线带状区域（Bandwidth），大幅减少 LLᵀ
            分解中新增的非零填充。
          </p>
        </div>
      </KdeCard>
    </div>
  );

  return (
    <AutoMath>
      <ExpandableDemo id="permutation-matrix-demo">
        <KdeWindowShell
          title="置换矩阵 (Permutation Matrix)"
          eyebrow="Linear Algebra Workbench"
          mark="P"
          modeTag={
            activeTab === "geometry"
              ? "3D 几何手性与基底置换"
              : "稀疏矩阵 Cholesky 填充优化"
          }
          display={activeTab === "geometry" ? geometryDisplay : sparseDisplay}
          controls={
            activeTab === "geometry" ? geometryControls : sparseControls
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
