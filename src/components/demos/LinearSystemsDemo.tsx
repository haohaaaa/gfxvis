import { useState, useRef, useEffect, useMemo } from "react";
import { useCanvas2D } from "../framework/useCanvas2D";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import PresetSelector from "../framework/PresetSelector";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeTabs from "../framework/KdeTabs";
import ParamSlider from "../framework/ParamSlider";
import {
  drawAdaptiveAxes,
  drawPixelPoint,
  getVisibleBounds,
  type Bounds2,
} from "../../visualizations/core/2d/plot2d";

type MainTab = "row_col" | "affine_manifold";

type RowColPreset = "ortho" | "skew" | "parallel" | "coincident";

interface RowColPresetData {
  name: string;
  desc: string;
  a11: number;
  a12: number;
  a21: number;
  a22: number;
  b1: number;
  b2: number;
}

const ROW_COL_PRESETS: Record<RowColPreset, RowColPresetData> = {
  ortho: {
    name: "正交独立 (唯一解)",
    desc: "两行方程法向量正交垂直，行超平面正交相交于一点；两列向量正交独立，可唯一张成目标向量 b。",
    a11: 1,
    a12: 1,
    a21: 1,
    a22: -1,
    b1: 2,
    b2: 0,
  },
  skew: {
    name: "斜交独立 (唯一解)",
    desc: "一般非正交线性无关系统，两直线倾斜相交于一点；列向量张成全空间并以平行四边形定则合成 b。",
    a11: 2,
    a12: 1,
    a21: 1,
    a22: 2,
    b1: 3,
    b2: 3,
  },
  parallel: {
    name: "平行矛盾 (无解)",
    desc: "两行方程法向共线且常数项矛盾，两直线严格平行无交点；列向量共线但目标向量 b 落在列空间外。",
    a11: 1,
    a12: 2,
    a21: 2,
    a22: 4,
    b1: 2,
    b2: 6,
  },
  coincident: {
    name: "重合退化 (无穷多解)",
    desc: "两行方程完全等价，在几何上重合为同一条一维直线；列向量共线且目标向量 b 恰好落在列空间内。",
    a11: 1,
    a12: 2,
    a21: 2,
    a22: 4,
    b1: 2,
    b2: 4,
  },
};

type AffinePreset = "standard" | "symmetric" | "homogeneous" | "steep";

interface AffinePresetData {
  name: string;
  desc: string;
  a: number;
  b: number;
  c: number;
}

const AFFINE_PRESETS: Record<AffinePreset, AffinePresetData> = {
  standard: {
    name: "标准非齐次 (x + 2y = 4)",
    desc: "常数项非零，解线不经过原点，整体脱离原点形成仿射子空间 S = xr + ker(A)。",
    a: 1,
    b: 2,
    c: 4,
  },
  symmetric: {
    name: "对称斜切 (2x + y = 3)",
    desc: "行向量 (2, 1) 决定了垂直法向，正交最小范数特解为从原点指向解线的最短向量。",
    a: 2,
    b: 1,
    c: 3,
  },
  homogeneous: {
    name: "齐次特例 (x + 2y = 0)",
    desc: "常数项为零，解线恰好穿过原点，此时仿射子空间退化为标准的过原点线性子空间 ker(A)。",
    a: 1,
    b: 2,
    c: 0,
  },
  steep: {
    name: "陡峭方程 (3x - y = 6)",
    desc: "方向向量与行空间呈现大倾角，最小范数特解与零空间方向严格保持 90° 垂直。",
    a: 3,
    b: -1,
    c: 6,
  },
};

const BOUNDS_2D: Bounds2 = { xMin: -4.5, xMax: 4.5, yMin: -4.5, yMax: 4.5 };

function drawPixelSegment(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 1.5,
  dash: number[] = [],
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawPixelArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  width = 2,
  headLen = 9,
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy);
  if (len < 1e-4) return;
  const angle = Math.atan2(dy, dx);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headLen * Math.cos(angle - Math.PI / 6),
    toY - headLen * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    toX - headLen * Math.cos(angle + Math.PI / 6),
    toY - headLen * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export default function LinearSystemsDemo() {
  const [activeTab, setActiveTab] = useState<MainTab>("row_col");

  // Mode 1: Row vs Column states
  const [rcPreset, setRcPreset] = useState<RowColPreset>("ortho");
  const [a11, setA11] = useState(1);
  const [a12, setA12] = useState(1);
  const [a21, setA21] = useState(1);
  const [a22, setA22] = useState(-1);
  const [b1, setB1] = useState(2);
  const [b2, setB2] = useState(0);

  // Sync Mode 1 preset
  useEffect(() => {
    const p = ROW_COL_PRESETS[rcPreset];
    setA11(p.a11);
    setA12(p.a12);
    setA21(p.a21);
    setA22(p.a22);
    setB1(p.b1);
    setB2(p.b2);
  }, [rcPreset]);

  // Mode 2: Affine Manifold states
  const [afPreset, setAfPreset] = useState<AffinePreset>("standard");
  const [coeffA, setCoeffA] = useState(1);
  const [coeffB, setCoeffB] = useState(2);
  const [constC, setConstC] = useState(4);
  const [paramT, setParamT] = useState(1.2);

  // Sync Mode 2 preset
  useEffect(() => {
    const p = AFFINE_PRESETS[afPreset];
    setCoeffA(p.a);
    setCoeffB(p.b);
    setConstC(p.c);
    setParamT(1.0);
  }, [afPreset]);

  // Math for Mode 1:
  const detA = a11 * a22 - a12 * a21;
  const isSingular = Math.abs(detA) < 1e-4;

  const sol = useMemo(() => {
    if (!isSingular) {
      const x = (b1 * a22 - b2 * a12) / detA;
      const y = (a11 * b2 - a21 * b1) / detA;
      return { status: "unique" as const, x, y };
    }
    // Check consistency: cross product of (a11, b1) and (a21, b2)
    const isConsistent = Math.abs(a11 * b2 - a21 * b1) < 1e-3;
    if (isConsistent) {
      return { status: "infinite" as const, x: 0, y: 0 };
    }
    return { status: "none" as const, x: 0, y: 0 };
  }, [a11, a12, a21, a22, b1, b2, detA, isSingular]);

  // Dragging in Left Canvas (Row Picture): drag solution point x*
  const isDraggingSolRef = useRef(false);
  // Dragging in Right Canvas (Column Picture): drag target vector b
  const isDraggingBRef = useRef(false);

  // Refs for animation/redraw
  const rcStateRef = useRef({
    a11,
    a12,
    a21,
    a22,
    b1,
    b2,
    detA,
    isSingular,
    sol,
  });

  useEffect(() => {
    rcStateRef.current = {
      a11,
      a12,
      a21,
      a22,
      b1,
      b2,
      detA,
      isSingular,
      sol,
    };
  }, [a11, a12, a21, a22, b1, b2, detA, isSingular, sol]);

  // 1. LEFT CANVAS (Row Picture: Intersecting Lines in R^2)
  const leftCanvas = useCanvas2D({
    initialBounds: BOUNDS_2D,
    onLeftDown(e, plot) {
      if (sol.status === "unique") {
        const el = e.currentTarget as HTMLElement | null;
        const rect = el?.getBoundingClientRect();
        if (!rect) return false;
        const wx = plot.toWorldX(e.clientX - rect.left);
        const wy = plot.toWorldY(e.clientY - rect.top);
        const dist = Math.hypot(wx - sol.x, wy - sol.y);
        if (dist < 0.8) {
          isDraggingSolRef.current = true;
          return true;
        }
      }
      return false;
    },
    onLeftMove(e, plot) {
      if (isDraggingSolRef.current) {
        const el = e.currentTarget as HTMLElement | null;
        const rect = el?.getBoundingClientRect();
        if (!rect) return;
        const wx = plot.toWorldX(e.clientX - rect.left);
        const wy = plot.toWorldY(e.clientY - rect.top);
        // Update b = A * (wx, wy)
        const newB1 = a11 * wx + a12 * wy;
        const newB2 = a21 * wx + a22 * wy;
        setB1(Number(newB1.toFixed(2)));
        setB2(Number(newB2.toFixed(2)));
      }
    },
    onLeftUp() {
      isDraggingSolRef.current = false;
    },
    draw(ctx, plot, theme) {
      const { width, height } = plot;
      ctx.clearRect(0, 0, width, height);
      drawAdaptiveAxes(ctx, plot, theme);

      const st = rcStateRef.current;
      const visible = getVisibleBounds(plot);
      const span = Math.max(
        Math.abs(visible.xMax - visible.xMin),
        Math.abs(visible.yMax - visible.yMin),
      );

      const toCanvas = (wx: number, wy: number) => ({
        x: plot.toScreenX(wx),
        y: plot.toScreenY(wy),
      });

      // Draw Line 1: a11 * x + a12 * y = b1
      if (Math.hypot(st.a11, st.a12) > 1e-4) {
        ctx.save();
        ctx.strokeStyle = "#0284c7";
        ctx.lineWidth = 2.5;
        // Direction perpendicular to (a11, a12)
        const len = Math.hypot(st.a11, st.a12);
        const nx = st.a11 / len;
        const ny = st.a12 / len;
        const dx = -ny;
        const dy = nx;
        // Base point on line
        const d0 = st.b1 / len;
        const p0x = nx * d0;
        const p0y = ny * d0;

        const pA = toCanvas(p0x - dx * span * 2, p0y - dy * span * 2);
        const pB = toCanvas(p0x + dx * span * 2, p0y + dy * span * 2);
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();

        ctx.fillStyle = "#0284c7";
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.fillText(
          `第1行方程: ${st.a11}x + ${st.a12}y = ${st.b1}`,
          12,
          height - 28,
        );
        ctx.restore();
      }

      // Draw Line 2: a21 * x + a22 * y = b2
      if (Math.hypot(st.a21, st.a22) > 1e-4) {
        ctx.save();
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 2.5;
        const len = Math.hypot(st.a21, st.a22);
        const nx = st.a21 / len;
        const ny = st.a22 / len;
        const dx = -ny;
        const dy = nx;
        const d0 = st.b2 / len;
        const p0x = nx * d0;
        const p0y = ny * d0;

        const pA = toCanvas(p0x - dx * span * 2, p0y - dy * span * 2);
        const pB = toCanvas(p0x + dx * span * 2, p0y + dy * span * 2);
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();

        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.fillText(
          `第2行方程: ${st.a21}x + ${st.a22}y = ${st.b2}`,
          12,
          height - 12,
        );
        ctx.restore();
      }

      // Draw Solution Point or Status
      if (st.sol.status === "unique") {
        const pSol = toCanvas(st.sol.x, st.sol.y);
        drawPixelPoint(ctx, pSol.x, pSol.y, "#10b981", 6);
        ctx.save();
        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(pSol.x, pSol.y, 10, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#10b981";
        ctx.font = "bold 12px system-ui, sans-serif";
        ctx.fillText(
          `交点 x* = (${st.sol.x.toFixed(2)}, ${st.sol.y.toFixed(2)})`,
          pSol.x + 12,
          pSol.y - 12,
        );
        ctx.restore();
      } else if (st.sol.status === "none") {
        ctx.save();
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("【平行无交点】：方程组矛盾无解", 14, 60);
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = "#10b981";
        ctx.font = "bold 13px system-ui, sans-serif";
        ctx.fillText("【两线完全重合】：无穷多解（一维解空间）", 14, 60);
        ctx.restore();
      }
    },
  });

  // 2. RIGHT CANVAS (Column Picture: Vector Assembly in R^2)
  const rightCanvas = useCanvas2D({
    initialBounds: BOUNDS_2D,
    onLeftDown(e, plot) {
      const el = e.currentTarget as HTMLElement | null;
      const rect = el?.getBoundingClientRect();
      if (!rect) return false;
      const wx = plot.toWorldX(e.clientX - rect.left);
      const wy = plot.toWorldY(e.clientY - rect.top);
      const dist = Math.hypot(wx - b1, wy - b2);
      if (dist < 0.8) {
        isDraggingBRef.current = true;
        return true;
      }
      return false;
    },
    onLeftMove(e, plot) {
      if (isDraggingBRef.current) {
        const el = e.currentTarget as HTMLElement | null;
        const rect = el?.getBoundingClientRect();
        if (!rect) return;
        const wx = plot.toWorldX(e.clientX - rect.left);
        const wy = plot.toWorldY(e.clientY - rect.top);
        setB1(Number(wx.toFixed(2)));
        setB2(Number(wy.toFixed(2)));
      }
    },
    onLeftUp() {
      isDraggingBRef.current = false;
    },
    draw(ctx, plot, theme) {
      const { width, height } = plot;
      ctx.clearRect(0, 0, width, height);
      drawAdaptiveAxes(ctx, plot, theme);

      const st = rcStateRef.current;
      const toCanvas = (wx: number, wy: number) => ({
        x: plot.toScreenX(wx),
        y: plot.toScreenY(wy),
      });

      const p0 = toCanvas(0, 0);

      // Column 1: a1 = (a11, a21)
      const pA1 = toCanvas(st.a11, st.a21);
      drawPixelArrow(ctx, p0.x, p0.y, pA1.x, pA1.y, "#0284c7", 2.5);
      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillText(`列1 a₁ (${st.a11}, ${st.a21})`, pA1.x + 8, pA1.y - 6);

      // Column 2: a2 = (a12, a22)
      const pA2 = toCanvas(st.a12, st.a22);
      drawPixelArrow(ctx, p0.x, p0.y, pA2.x, pA2.y, "#f43f5e", 2.5);
      ctx.fillStyle = "#f43f5e";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillText(`列2 a₂ (${st.a12}, ${st.a22})`, pA2.x + 8, pA2.y - 6);

      if (st.sol.status === "unique") {
        const v1x = st.sol.x * st.a11;
        const v1y = st.sol.x * st.a21;
        const pV1 = toCanvas(v1x, v1y);

        const v2x = st.sol.y * st.a12;
        const v2y = st.sol.y * st.a22;
        const pV2 = toCanvas(v2x, v2y);

        const pB = toCanvas(st.b1, st.b2);

        // Parallelogram dashed lines
        drawPixelSegment(ctx, pV1.x, pV1.y, pB.x, pB.y, "#94a3b8", 1.2, [4, 4]);
        drawPixelSegment(ctx, pV2.x, pV2.y, pB.x, pB.y, "#94a3b8", 1.2, [4, 4]);

        // Scaled components
        drawPixelSegment(ctx, p0.x, p0.y, pV1.x, pV1.y, "#0284c7", 2, [3, 2]);
        drawPixelSegment(ctx, p0.x, p0.y, pV2.x, pV2.y, "#f43f5e", 2, [3, 2]);

        // Target Vector b = Ax
        drawPixelArrow(ctx, p0.x, p0.y, pB.x, pB.y, "#10b981", 3);
        drawPixelPoint(ctx, pB.x, pB.y, "#10b981", 6);

        ctx.fillStyle = "#10b981";
        ctx.font = "bold 12px system-ui, sans-serif";
        ctx.fillText(
          `b = x₁a₁ + x₂a₂ (${st.b1.toFixed(1)}, ${st.b2.toFixed(1)})`,
          pB.x + 10,
          pB.y - 10,
        );
      } else {
        const pB = toCanvas(st.b1, st.b2);
        drawPixelArrow(ctx, p0.x, p0.y, pB.x, pB.y, "#e11d48", 2.5);
        drawPixelPoint(ctx, pB.x, pB.y, "#e11d48", 6);
        ctx.fillStyle = "#e11d48";
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.fillText(
          `目标 b (${st.b1.toFixed(1)}, ${st.b2.toFixed(1)})`,
          pB.x + 8,
          pB.y - 6,
        );
      }
    },
  });

  // Redraw Mode 1 canvases when states change
  useEffect(() => {
    if (activeTab === "row_col") {
      leftCanvas.redraw();
      rightCanvas.redraw();
    }
  }, [
    activeTab,
    a11,
    a12,
    a21,
    a22,
    b1,
    b2,
    leftCanvas.redraw,
    rightCanvas.redraw,
  ]);

  // Math for Mode 2 (Affine Manifold: ax + by = c)
  const normSq = coeffA * coeffA + coeffB * coeffB;
  const norm = Math.sqrt(normSq);
  // Row space normal vector
  const nx = norm > 1e-5 ? coeffA / norm : 1;
  const ny = norm > 1e-5 ? coeffB / norm : 0;
  // Null space direction vector (dx, dy) orthogonal to (nx, ny)
  const dx = -ny;
  const dy = nx;
  // Minimum norm solution xr = (c / normSq) * (a, b)
  const xrX = normSq > 1e-5 ? (constC / normSq) * coeffA : 0;
  const xrY = normSq > 1e-5 ? (constC / normSq) * coeffB : 0;
  const xrDist = Math.hypot(xrX, xrY);

  // User-chosen particular solution xp = xr + paramT * d
  const xpX = xrX + paramT * dx;
  const xpY = xrY + paramT * dy;

  const afStateRef = useRef({
    coeffA,
    coeffB,
    constC,
    paramT,
    norm,
    nx,
    ny,
    dx,
    dy,
    xrX,
    xrY,
    xrDist,
    xpX,
    xpY,
  });

  useEffect(() => {
    afStateRef.current = {
      coeffA,
      coeffB,
      constC,
      paramT,
      norm,
      nx,
      ny,
      dx,
      dy,
      xrX,
      xrY,
      xrDist,
      xpX,
      xpY,
    };
  }, [
    coeffA,
    coeffB,
    constC,
    paramT,
    norm,
    nx,
    ny,
    dx,
    dy,
    xrX,
    xrY,
    xrDist,
    xpX,
    xpY,
  ]);

  const isDraggingXpRef = useRef(false);

  // 3. AFFINE CANVAS (Mode 2)
  const affineCanvas = useCanvas2D({
    initialBounds: BOUNDS_2D,
    onLeftDown(e, plot) {
      const el = e.currentTarget as HTMLElement | null;
      const rect = el?.getBoundingClientRect();
      if (!rect) return false;
      const wx = plot.toWorldX(e.clientX - rect.left);
      const wy = plot.toWorldY(e.clientY - rect.top);
      const dist = Math.hypot(wx - xpX, wy - xpY);
      if (dist < 0.9) {
        isDraggingXpRef.current = true;
        return true;
      }
      return false;
    },
    onLeftMove(e, plot) {
      if (isDraggingXpRef.current) {
        const el = e.currentTarget as HTMLElement | null;
        const rect = el?.getBoundingClientRect();
        if (!rect) return;
        const wx = plot.toWorldX(e.clientX - rect.left);
        const wy = plot.toWorldY(e.clientY - rect.top);
        // Project (wx, wy) onto direction (dx, dy) relative to xr
        const relX = wx - xrX;
        const relY = wy - xrY;
        const newT = relX * dx + relY * dy;
        setParamT(Number(newT.toFixed(2)));
      }
    },
    onLeftUp() {
      isDraggingXpRef.current = false;
    },
    draw(ctx, plot, theme) {
      const { width, height } = plot;
      ctx.clearRect(0, 0, width, height);
      drawAdaptiveAxes(ctx, plot, theme);

      const st = afStateRef.current;
      const visible = getVisibleBounds(plot);
      const span = Math.max(
        Math.abs(visible.xMax - visible.xMin),
        Math.abs(visible.yMax - visible.yMin),
      );

      const toCanvas = (wx: number, wy: number) => ({
        x: plot.toScreenX(wx),
        y: plot.toScreenY(wy),
      });

      const p0 = toCanvas(0, 0);

      // 1. Draw Nullspace line: ax + by = 0 (Green dashed line through origin)
      const nLineA = toCanvas(-st.dx * span * 2, -st.dy * span * 2);
      const nLineB = toCanvas(st.dx * span * 2, st.dy * span * 2);
      drawPixelSegment(
        ctx,
        nLineA.x,
        nLineA.y,
        nLineB.x,
        nLineB.y,
        "#10b981",
        2,
        [6, 4],
      );

      ctx.save();
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 11px system-ui, sans-serif";
      ctx.fillText(
        `零空间 Null(A): ${st.coeffA}x + ${st.coeffB}y = 0`,
        nLineB.x - 120,
        nLineB.y + 16,
      );
      ctx.restore();

      // 2. Draw Row Space Normal Line (Amber dashed line through origin)
      const rLineA = toCanvas(-st.nx * span * 2, -st.ny * span * 2);
      const rLineB = toCanvas(st.nx * span * 2, st.ny * span * 2);
      drawPixelSegment(
        ctx,
        rLineA.x,
        rLineA.y,
        rLineB.x,
        rLineB.y,
        "#f59e0b",
        1.2,
        [3, 3],
      );

      // 3. Draw Non-homogeneous Affine Flat S: ax + by = c (Sky Blue solid line)
      const sLineA = toCanvas(
        st.xrX - st.dx * span * 2,
        st.xrY - st.dy * span * 2,
      );
      const sLineB = toCanvas(
        st.xrX + st.dx * span * 2,
        st.xrY + st.dy * span * 2,
      );
      drawPixelSegment(
        ctx,
        sLineA.x,
        sLineA.y,
        sLineB.x,
        sLineB.y,
        "#0284c7",
        3,
      );

      ctx.save();
      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.fillText(
        `仿射解空间 S: ${st.coeffA}x + ${st.coeffB}y = ${st.constC}`,
        sLineB.x - 130,
        sLineB.y - 12,
      );
      ctx.restore();

      // 4. Draw Minimum Norm Solution xr (Amber vector from origin to xr)
      const pXr = toCanvas(st.xrX, st.xrY);
      if (st.xrDist > 0.05) {
        drawPixelArrow(ctx, p0.x, p0.y, pXr.x, pXr.y, "#f59e0b", 2.5);
        drawPixelPoint(ctx, pXr.x, pXr.y, "#f59e0b", 5);

        // Perpendicular symbol at xr
        ctx.save();
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(pXr.x - 7, pXr.y - 7, 7, 7);
        ctx.restore();

        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.fillText(
          `最小范数特解 xr (${st.xrX.toFixed(2)}, ${st.xrY.toFixed(2)})`,
          pXr.x + 8,
          pXr.y + 14,
        );
      }

      // 5. Draw Particular Solution xp = xr + xn
      const pXp = toCanvas(st.xpX, st.xpY);
      // Offset vector xn from xr to xp
      if (Math.abs(st.paramT) > 0.05) {
        drawPixelSegment(ctx, pXr.x, pXr.y, pXp.x, pXp.y, "#a855f7", 2, [3, 2]);
      }

      drawPixelPoint(ctx, pXp.x, pXp.y, "#a855f7", 6.5);
      ctx.save();
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pXp.x, pXp.y, 11, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#a855f7";
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.fillText(
        `特解 xp (${st.xpX.toFixed(2)}, ${st.xpY.toFixed(2)})`,
        pXp.x + 10,
        pXp.y - 10,
      );
      ctx.restore();
    },
  });

  useEffect(() => {
    if (activeTab === "affine_manifold") {
      affineCanvas.redraw();
    }
  }, [activeTab, coeffA, coeffB, constC, paramT, affineCanvas.redraw]);

  return (
    <AutoMath>
      <ExpandableDemo id="linear-systems-demo">
        <KdeWindowShell
          title="线性方程组几何：行列视角与非齐次解集流形"
          eyebrow="Linear Systems & Affine Manifolds"
          mark="SYS-01"
          modeTag={
            activeTab === "row_col"
              ? "行视角求交 vs 列视角拼装"
              : "非齐次仿射子空间平移"
          }
        >
          {/* Top Mode Tabs */}
          <div className="mb-3 flex items-center justify-between border-b border-[var(--kde-border)] pb-2">
            <KdeTabs<MainTab>
              options={[
                { id: "row_col", label: "双重视角：行求交 vs 列拼装" },
                {
                  id: "affine_manifold",
                  label: "解集流形：齐次 vs 非齐次平移",
                },
              ]}
              value={activeTab}
              onChange={setActiveTab}
              size="sm"
            />
          </div>

          {activeTab === "row_col" ? (
            /* Mode 1: Row vs Column Dual Canvas */
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {/* Left Canvas: Row Picture */}
                <div
                  ref={leftCanvas.containerRef}
                  className="relative h-[var(--demo-height,20rem)] w-full overflow-hidden rounded-md border border-slate-800 bg-slate-950"
                >
                  <CanvasToolbar onReset={leftCanvas.resetBounds} />
                  <canvas
                    ref={leftCanvas.canvasRef}
                    className="absolute inset-0 h-full w-full"
                  />
                  <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-0.5 select-none rounded bg-slate-900/80 p-1.5 text-xs border border-slate-700/60 backdrop-blur-sm">
                    <span className="font-semibold text-slate-200">
                      {"行视角（Row Picture）：超平面相交"}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {"解空间 $\\mathbb{R}^2$ 中两直线求交点 $x^*$"}
                    </span>
                  </div>
                  <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
                </div>

                {/* Right Canvas: Column Picture */}
                <div
                  ref={rightCanvas.containerRef}
                  className="relative h-[var(--demo-height,20rem)] w-full overflow-hidden rounded-md border border-slate-800 bg-slate-950"
                >
                  <CanvasToolbar onReset={rightCanvas.resetBounds} />
                  <canvas
                    ref={rightCanvas.canvasRef}
                    className="absolute inset-0 h-full w-full"
                  />
                  <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-0.5 select-none rounded bg-slate-900/80 p-1.5 text-xs border border-slate-700/60 backdrop-blur-sm">
                    <span className="font-semibold text-slate-200">
                      {"列视角（Column Picture）：向量积木拼装"}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {"目标空间 $\\mathbb{R}^2$ 中 $x_1 a_1 + x_2 a_2 = b$"}
                    </span>
                  </div>
                  <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
                </div>
              </div>

              {/* Mode 1 Controls */}
              <div className="grid gap-3 md:grid-cols-2">
                <KdeCard title="场景预设与方程参数" variant="dense">
                  <PresetSelector
                    label="典型几何构型:"
                    options={ROW_COL_PRESETS}
                    value={rcPreset}
                    onChange={(val) => setRcPreset(val as RowColPreset)}
                  />
                  <div className="mt-2.5 space-y-2">
                    <ParamSlider
                      label={"常数项 $b_1$"}
                      min={-4}
                      max={4}
                      step={0.5}
                      value={b1}
                      onChange={setB1}
                    />
                    <ParamSlider
                      label={"常数项 $b_2$"}
                      min={-4}
                      max={4}
                      step={0.5}
                      value={b2}
                      onChange={setB2}
                    />
                  </div>
                </KdeCard>

                <KdeCard title="解集状态与几何读数" variant="dense">
                  <div className="space-y-1.5">
                    <KdeReadout
                      label="方程组行列式"
                      value={`det(A) = ${detA.toFixed(2)}`}
                      variant={isSingular ? "danger" : "accent"}
                      dense
                    />
                    <KdeReadout
                      label="几何解状态"
                      value={
                        sol.status === "unique"
                          ? `唯一解 (${sol.x.toFixed(2)}, ${sol.y.toFixed(2)})`
                          : sol.status === "none"
                            ? "两线平行矛盾（无解）"
                            : "两线重合（无穷多解）"
                      }
                      variant={
                        sol.status === "unique"
                          ? "success"
                          : sol.status === "none"
                            ? "danger"
                            : "warning"
                      }
                      dense
                    />
                    <div className="rounded bg-[var(--kde-panel)] p-2 text-xs text-muted-foreground font-mono">
                      {`$\\begin{pmatrix} ${a11} & ${a12} \\\\ ${a21} & ${a22} \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} ${b1} \\\\ ${b2} \\end{pmatrix}$`}
                    </div>
                  </div>
                </KdeCard>
              </div>
            </div>
          ) : (
            /* Mode 2: Affine Manifold Canvas & Controls */
            <div className="space-y-4">
              <div
                ref={affineCanvas.containerRef}
                className="relative h-[var(--demo-height,22rem)] w-full overflow-hidden rounded-md border border-slate-800 bg-slate-950"
              >
                <CanvasToolbar onReset={affineCanvas.resetBounds} />
                <canvas
                  ref={affineCanvas.canvasRef}
                  className="absolute inset-0 h-full w-full"
                />
                <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-0.5 select-none rounded bg-slate-900/80 p-2 text-xs border border-slate-700/60 backdrop-blur-sm">
                  <span className="font-semibold text-slate-200">
                    {"非齐次约束 $a x + b y = c$ 与零空间平移"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {
                      "仿射子空间 $S = x_r + \\ker(A)$（平移向量 $x_r \\in \\operatorname{Row}(A)$）"
                    }
                  </span>
                </div>
                <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
              </div>

              {/* Mode 2 Controls */}
              <div className="grid gap-3 md:grid-cols-2">
                <KdeCard title="预设约束与参数滑块" variant="dense">
                  <PresetSelector
                    label="预设约束:"
                    options={AFFINE_PRESETS}
                    value={afPreset}
                    onChange={(val) => setAfPreset(val as AffinePreset)}
                  />
                  <div className="mt-2.5 space-y-2">
                    <ParamSlider
                      label={"常数项 $c$（非齐次平移量）"}
                      min={-6}
                      max={6}
                      step={0.5}
                      value={constC}
                      onChange={setConstC}
                    />
                    <ParamSlider
                      label={"特解在零空间方向的偏移 $t$"}
                      min={-3}
                      max={3}
                      step={0.2}
                      value={paramT}
                      onChange={setParamT}
                    />
                  </div>
                </KdeCard>

                <KdeCard title="代数与几何空间判定" variant="dense">
                  <div className="space-y-1.5">
                    <KdeReadout
                      label="解空间几何形态"
                      value={
                        Math.abs(constC) < 1e-4
                          ? "过原点线性子空间（ker A）"
                          : `仿射子空间（脱离原点，平移距离 ${xrDist.toFixed(2)}）`
                      }
                      variant={Math.abs(constC) < 1e-4 ? "accent" : "success"}
                      dense
                    />
                    <KdeReadout
                      label="正交最小范数特解 xr"
                      value={`(${xrX.toFixed(2)}, ${xrY.toFixed(2)})，垂直于零空间`}
                      variant="formula"
                      dense
                    />
                    <KdeReadout
                      label="当前特解 xp"
                      value={`(${xpX.toFixed(2)}, ${xpY.toFixed(2)}) = xr + ${paramT.toFixed(1)} d`}
                      variant="formula"
                      dense
                    />
                  </div>
                </KdeCard>
              </div>
            </div>
          )}
        </KdeWindowShell>
      </ExpandableDemo>
    </AutoMath>
  );
}
