import {
  ArrowHelper,
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Line,
  LineDashedMaterial,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Scene,
  Vector3,
} from "three";
import { createAxesGroup } from "../../core/3d/axes3d";
import {
  addGroundGrid,
  addStandardLights,
  disposeObject,
} from "../../core/3d/three-utils";

export interface LeastSquares3DScene {
  scene: Scene;
  update(
    points: Array<{ x: number; y: number }>,
    bHat: [number, number, number],
    showColPlane: boolean,
  ): void;
  dispose(): void;
}

export function createLeastSquares3DScene(): LeastSquares3DScene {
  const scene = new Scene();

  addStandardLights(scene);
  addGroundGrid(scene, 10, 10);
  const axes = createAxesGroup(5);
  scene.add(axes);

  let planeMesh: Mesh | null = null;
  let arrowA1: ArrowHelper | null = null;
  let arrowA2: ArrowHelper | null = null;
  let arrowB: ArrowHelper | null = null;
  let arrowBHat: ArrowHelper | null = null;
  let arrowE: ArrowHelper | null = null;
  let normalLine: Line | null = null;

  const origin0 = new Vector3(0, 0, 0);

  const makeArrow = (dir: Vector3, origin: Vector3, color: number) => {
    const len = dir.length();
    if (len < 0.001) return null;
    const normalized = dir.clone().normalize();
    const arrow = new ArrowHelper(
      normalized,
      origin,
      len,
      color,
      Math.min(0.3, len * 0.25),
      Math.min(0.18, len * 0.15),
    );
    scene.add(arrow);
    return arrow;
  };

  const removeHelper = (obj: Object3D | null) => {
    if (obj) {
      obj.removeFromParent();
      disposeObject(obj);
    }
  };

  return {
    scene,
    update(points, bHat, showColPlane) {
      // Remove old geometry
      if (planeMesh) {
        removeHelper(planeMesh);
        planeMesh = null;
      }
      if (arrowA1) {
        removeHelper(arrowA1);
        arrowA1 = null;
      }
      if (arrowA2) {
        removeHelper(arrowA2);
        arrowA2 = null;
      }
      if (arrowB) {
        removeHelper(arrowB);
        arrowB = null;
      }
      if (arrowBHat) {
        removeHelper(arrowBHat);
        arrowBHat = null;
      }
      if (arrowE) {
        removeHelper(arrowE);
        arrowE = null;
      }
      if (normalLine) {
        removeHelper(normalLine);
        normalLine = null;
      }

      if (points.length < 3) return;

      const a1 = new Vector3(1, 1, 1);
      const a2 = new Vector3(points[0].x, points[1].x, points[2].x);
      const bVec = new Vector3(points[0].y, points[1].y, points[2].y);
      const bHatVec = new Vector3(bHat[0] ?? 0, bHat[1] ?? 0, bHat[2] ?? 0);
      const eVec = new Vector3().subVectors(bVec, bHatVec);

      // 1. Column Space col(A) Plane Mesh
      if (showColPlane) {
        const planeGeom = new BufferGeometry();
        const uSteps = 8;
        const vSteps = 8;
        const uMin = -0.5;
        const uMax = 2.5;
        const vMin = -0.5;
        const vMax = 2.0;

        const vertices: number[] = [];
        const indices: number[] = [];

        for (let i = 0; i <= uSteps; i++) {
          const u = uMin + (i / uSteps) * (uMax - uMin);
          for (let j = 0; j <= vSteps; j++) {
            const v = vMin + (j / vSteps) * (vMax - vMin);
            const p = new Vector3()
              .addScaledVector(a1, u)
              .addScaledVector(a2, v);
            vertices.push(p.x, p.y, p.z);
          }
        }

        for (let i = 0; i < uSteps; i++) {
          for (let j = 0; j < vSteps; j++) {
            const a = i * (vSteps + 1) + j;
            const b = (i + 1) * (vSteps + 1) + j;
            const c = (i + 1) * (vSteps + 1) + (j + 1);
            const d = i * (vSteps + 1) + (j + 1);
            indices.push(a, b, d);
            indices.push(b, c, d);
          }
        }

        planeGeom.setAttribute(
          "position",
          new Float32BufferAttribute(vertices, 3),
        );
        planeGeom.setIndex(indices);
        planeGeom.computeVertexNormals();

        const planeMat = new MeshStandardMaterial({
          color: 0x0ea5e9,
          transparent: true,
          opacity: 0.35,
          side: DoubleSide,
          wireframe: false,
        });
        planeMesh = new Mesh(planeGeom, planeMat);
        scene.add(planeMesh);
      }

      // Arrows
      arrowA1 = makeArrow(a1, origin0, 0xfacc15); // Yellow
      arrowA2 = makeArrow(a2, origin0, 0x06b6d4); // Cyan
      arrowB = makeArrow(bVec, origin0, 0xef4444); // Red
      arrowBHat = makeArrow(bHatVec, origin0, 0x10b981); // Emerald
      arrowE = makeArrow(eVec, bHatVec, 0xa855f7); // Purple

      // Normal line representing Left Nullspace ker(A^T)
      const lineGeom = new BufferGeometry().setFromPoints([
        new Vector3().addScaledVector(eVec, -1.5),
        new Vector3().addScaledVector(eVec, 1.5),
      ]);
      const lineMat = new LineDashedMaterial({
        color: 0xc084fc,
        dashSize: 0.15,
        gapSize: 0.1,
      });
      normalLine = new Line(lineGeom, lineMat);
      normalLine.computeLineDistances();
      scene.add(normalLine);
    },
    dispose() {
      removeHelper(planeMesh);
      removeHelper(arrowA1);
      removeHelper(arrowA2);
      removeHelper(arrowB);
      removeHelper(arrowBHat);
      removeHelper(arrowE);
      removeHelper(normalLine);
      disposeObject(axes);
    },
  };
}
