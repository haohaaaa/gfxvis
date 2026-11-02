import { useEffect, useRef, useState } from "react";
import { clamp } from "@math";
import {
  drawAdaptiveAxes,
  drawArrow,
  drawPoint,
  type Bounds2,
} from "../../visualizations/core/2d/plot2d";
import { attachDrag3D } from "../../visualizations/core/3d/drag3d";
import {
  FIELDS2D,
  buildFieldImage,
  contourLevels,
  marchingSquares,
  sampleField,
  type Field2DId,
  type FieldSample,
  type Segment,
} from "../../visualizations/scenes/calculus/scalar-field-2d";
import {
  createScalarFieldSurfaceScene,
  type GradientArrowMode,
  type ScalarFieldSurfaceScene,
} from "../../visualizations/scenes/calculus/scalar-field-surface";
import CanvasViewport, {
  type CanvasViewportHandle,
} from "../framework/CanvasViewport";
import Viewer3DViewport, {
  type Viewer3DViewportHandle,
} from "../framework/Viewer3DViewport";
import ExpandableDemo from "../framework/ExpandableDemo";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeCheckbox from "../framework/KdeCheckbox";
import KdeReadout from "../framework/KdeReadout";
import ParamSlider from "../framework/ParamSlider";

const NX = 180;
const NY = 140;
const MARGIN = 24;

const FIELD_OPTIONS: { id: Field2DId; label: string }[] = [
  { id: "sincos", label: "sin x cos y" },
  { id: "circle", label: "圆族" },
  { id: "parabola", label: "抛物线族" },
];

const GRADIENT_MODES: { id: GradientArrowMode; label: string }[] = [
  { id: "horizontal", label: "水平梯度" },
  { id: "steepest", label: "最陡上升(曲面)" },
];

interface HeatData {
  image: HTMLCanvasElement | null;
  contourSegments: Segment[];
  bounds: Bounds2;
  sample: FieldSample | null;
}

/** Sample a field once (c = 0) and precompute heatmap + contours. */
function buildHeat(fieldId: Field2DId): HeatData {
  if (typeof document === "undefined") {
    return {
      image: null,
      contourSegments: [],
      bounds: FIELDS2D[fieldId].bounds,
      sample: null,
    };
  }
  const f = FIELDS2D[fieldId];
  const sample = sampleField(f, f.bounds, NX, NY, 0);
  return {
    image: buildFieldImage(sample),
    contourSegments: contourLevels(sample.min, sample.max, 9).flatMap((level) =>
      marchingSquares(sample.values, sample.nx, sample.ny, f.bounds, level),
    ),
    bounds: f.bounds,
    sample,
  };
}

const INITIAL_HEAT: HeatData = {
  image: null,
  contourSegments: [],
  bounds: FIELDS2D.sincos.bounds,
  sample: null,
};

/**
 * Combined scalar-field experiment: 2D heatmap (left) + 3D surface z = phi(x,y)
 * (right) of the same function, sharing one probe. The field F can be switched
 * (sin x cos y / circle family / parabola family) and the level constant c
 * adjusts the zero level set.
 */
export default function ScalarFieldDemo({ height }: { height?: string }) {
  const [fieldId, setFieldId] = useState<Field2DId>("sincos");
  const [c, setC] = useState(0);
  const [probe, setProbe] = useState({ x: 0.6, y: 0.6 });
  const showAxes = true;
  const [gradientMode, setGradientMode] =
    useState<GradientArrowMode>("horizontal");
  const [surfaceTransparent, setSurfaceTransparent] = useState(true);

  const fieldIdRef = useRef<Field2DId>("sincos");
  const cRef = useRef(0);
  const probeRef = useRef({ x: 0.6, y: 0.6 });
  const axesRef = useRef(true);
  const heatRef = useRef<HeatData>(INITIAL_HEAT);

  fieldIdRef.current = fieldId;
  cRef.current = c;
  probeRef.current = probe;
  axesRef.current = showAxes;

  const vp2dRef = useRef<CanvasViewportHandle | null>(null);
  const vp3dRef =
    useRef<Viewer3DViewportHandle<ScalarFieldSurfaceScene> | null>(null);

  const field = FIELDS2D[fieldId];

  // Rebuild heatmap when field changes
  useEffect(() => {
    heatRef.current = buildHeat(fieldId);
    vp2dRef.current?.redraw();
  }, [fieldId]);

  useEffect(() => {
    vp2dRef.current?.redraw();
  }, [c, probe, showAxes]);

  const handleFieldChange = (id: Field2DId): void => {
    setFieldId(id);
    fieldIdRef.current = id;
    const f = FIELDS2D[id];
    heatRef.current = buildHeat(id);
    vp2dRef.current?.setBounds(f.bounds);
    setC(f.defaultC);
    setProbe((p) => ({
      x: clamp(p.x, f.bounds.xMin, f.bounds.xMax),
      y: clamp(p.y, f.bounds.yMin, f.bounds.yMax),
    }));
  };

  const value = field.phi(probe.x, probe.y, c);
  const gx = field.gradX(probe.x, probe.y);
  const gy = field.gradY(probe.x, probe.y);

  return (
    <ExpandableDemo id="scalar-field-2d" height={height}>
      <KdeWindowShell
        title="二维标量场、等高线与梯度曲面"
        eyebrow="微积分 · 多元标量场"
        mark="∇φ"
        modeTag="双视口联动分析"
        tabs={
          <KdeTabs
            options={FIELD_OPTIONS}
            value={fieldId}
            onChange={(id) => handleFieldChange(id as Field2DId)}
          />
        }
        display={
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 2D Contour Heatmap */}
            <CanvasViewport
              ref={vp2dRef}
              initialBounds={FIELDS2D.sincos.bounds}
              margin={MARGIN}
              heightClass="h-[var(--demo-height,22rem)]"
              onReset={() => vp2dRef.current?.setBounds(field.bounds)}
              onHover={(e, plot) => {
                const f = FIELDS2D[fieldIdRef.current];
                const rect = (
                  e.target as HTMLElement | null
                )?.getBoundingClientRect();
                if (!rect) return;
                setProbe({
                  x: clamp(
                    plot.toWorldX(e.clientX - rect.left),
                    f.bounds.xMin,
                    f.bounds.xMax,
                  ),
                  y: clamp(
                    plot.toWorldY(e.clientY - rect.top),
                    f.bounds.yMin,
                    f.bounds.yMax,
                  ),
                });
              }}
              onLeftDown={() => true}
              onLeftMove={(e, plot) => {
                const f = FIELDS2D[fieldIdRef.current];
                const rect = (
                  e.target as HTMLElement | null
                )?.getBoundingClientRect();
                if (!rect) return;
                setProbe({
                  x: clamp(
                    plot.toWorldX(e.clientX - rect.left),
                    f.bounds.xMin,
                    f.bounds.xMax,
                  ),
                  y: clamp(
                    plot.toWorldY(e.clientY - rect.top),
                    f.bounds.yMin,
                    f.bounds.yMax,
                  ),
                });
              }}
              onDraw={(ctx, plot, theme) => {
                const f = FIELDS2D[fieldIdRef.current];
                const pc = cRef.current;
                const { image, contourSegments, bounds, sample } =
                  heatRef.current;
                if (axesRef.current) drawAdaptiveAxes(ctx, plot, theme);
                if (!image) return;

                // Heatmap anchored to its world rect
                const hx0 = plot.toScreenX(bounds.xMin);
                const hx1 = plot.toScreenX(bounds.xMax);
                const hy0 = plot.toScreenY(bounds.yMax);
                const hy1 = plot.toScreenY(bounds.yMin);
                ctx.imageSmoothingEnabled = true;
                ctx.drawImage(image, hx0, hy1, hx1 - hx0, hy0 - hy1);
                ctx.strokeStyle = theme.border;
                ctx.lineWidth = 1;
                ctx.strokeRect(hx0, hy0, hx1 - hx0, hy1 - hy0);

                // Level curves (world-space segments)
                ctx.globalAlpha = 0.55;
                ctx.strokeStyle = theme.ink;
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (const [p0, p1] of contourSegments) {
                  ctx.moveTo(plot.toScreenX(p0[0]), plot.toScreenY(p0[1]));
                  ctx.lineTo(plot.toScreenX(p1[0]), plot.toScreenY(p1[1]));
                }
                ctx.stroke();
                ctx.globalAlpha = 1;

                // Highlight the current level set F = c (via marching squares)
                if (f.hasC && sample) {
                  const level = clamp(pc, sample.min, sample.max);
                  const segments = marchingSquares(
                    sample.values,
                    sample.nx,
                    sample.ny,
                    bounds,
                    level,
                  );
                  ctx.strokeStyle = theme.accent;
                  ctx.lineWidth = 2.2;
                  ctx.beginPath();
                  for (const [p0, p1] of segments) {
                    ctx.moveTo(plot.toScreenX(p0[0]), plot.toScreenY(p0[1]));
                    ctx.lineTo(plot.toScreenX(p1[0]), plot.toScreenY(p1[1]));
                  }
                  ctx.stroke();
                }

                // Sparse gradient arrows across the field bounds
                const kx = plot.toScreenX(1) - plot.toScreenX(0);
                const ky = plot.toScreenY(0) - plot.toScreenY(1);
                const arrowScale = 0.42;
                const n = 5;
                for (let i = 0; i <= n; i++) {
                  for (let j = 0; j <= n; j++) {
                    const x =
                      bounds.xMin + ((bounds.xMax - bounds.xMin) * i) / n;
                    const y =
                      bounds.yMin + ((bounds.yMax - bounds.yMin) * j) / n;
                    const curGx = f.gradX(x, y);
                    const curGy = f.gradY(x, y);
                    const mag = Math.hypot(curGx, curGy);
                    if (mag < 1e-4) continue;
                    const len = Math.min(arrowScale, 0.3 * mag);
                    drawArrow(
                      ctx,
                      plot.toScreenX(x),
                      plot.toScreenY(y),
                      (curGx / mag) * len * kx,
                      -(curGy / mag) * len * ky,
                      theme.ink,
                      7,
                      5,
                      1.3,
                    );
                  }
                }

                // Probe point + gradient arrow
                const px = probeRef.current.x;
                const py = probeRef.current.y;
                const curGx = f.gradX(px, py);
                const curGy = f.gradY(px, py);
                const mag = Math.hypot(curGx, curGy);
                drawPoint(ctx, plot, px, py, {
                  color: theme.accent,
                  filled: true,
                  radius: 5,
                });
                if (mag > 1e-4) {
                  const len = Math.min(0.55, 0.38 * mag);
                  drawArrow(
                    ctx,
                    plot.toScreenX(px),
                    plot.toScreenY(py),
                    (curGx / mag) * len * kx,
                    -(curGy / mag) * len * ky,
                    theme.accent,
                    10,
                    7,
                    2,
                  );
                }
              }}
            >
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded bg-surface/90 px-2 py-1 text-[11px] font-semibold text-foreground border border-border/60 shadow-xs backdrop-blur-xs pointer-events-none">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                2D 等高线与热力图 (Marching Squares)
              </div>
            </CanvasViewport>

            {/* 3D Surface Viewport */}
            <Viewer3DViewport
              ref={vp3dRef}
              heightClass="h-[var(--demo-height,22rem)]"
              factory={() => createScalarFieldSurfaceScene(FIELDS2D.sincos)}
              onUpdate={({ api, viewer }) => {
                api.setField(field);
                api.setPoint(probe.x, probe.y);
                api.setC(c);
                api.setAxesVisible(showAxes);
                api.setGradientMode(gradientMode);
                api.setSurfaceTransparent(surfaceTransparent);
                viewer.render();

                const hitToProbe = (
                  hit: { point: { x: number; z: number } } | null,
                ): void => {
                  if (!hit) return;
                  const f = FIELDS2D[fieldIdRef.current];
                  const nx = clamp(hit.point.x, f.bounds.xMin, f.bounds.xMax);
                  const ny = clamp(-hit.point.z, f.bounds.yMin, f.bounds.yMax);
                  probeRef.current = { x: nx, y: ny };
                  setProbe({ x: nx, y: ny });
                  api.setPoint(nx, ny);
                  viewer.render();
                };

                return attachDrag3D({
                  domElement: viewer.renderer.domElement,
                  camera: viewer.camera,
                  controls: viewer.controls,
                  targets: [api.surface],
                  onHover(hit) {
                    hitToProbe(hit);
                  },
                  onDrag(hit) {
                    hitToProbe(hit);
                  },
                });
              }}
              deps={[
                fieldId,
                probe.x,
                probe.y,
                c,
                showAxes,
                gradientMode,
                surfaceTransparent,
              ]}
            >
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 rounded bg-surface/90 px-2 py-1 text-[11px] font-semibold text-foreground border border-border/60 shadow-xs backdrop-blur-xs pointer-events-none">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                3D 高程曲面与空间梯度流
              </div>
            </Viewer3DViewport>
          </div>
        }
        controls={
          <div className="space-y-3">
            <KdeCard title="梯度箭头与显示设置" variant="dense">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    3D 箭头模式:
                  </span>
                  <KdeTabs
                    options={GRADIENT_MODES}
                    value={gradientMode}
                    onChange={(id) => setGradientMode(id as GradientArrowMode)}
                    size="xs"
                    variant="pill"
                  />
                </div>

                <div className="pt-2 border-t border-border/50">
                  <KdeCheckbox
                    label="3D 曲面半透明渲染"
                    checked={surfaceTransparent}
                    onChange={setSurfaceTransparent}
                    size="xs"
                  />
                </div>

                {field.hasC && (
                  <div className="pt-2 border-t border-border/50">
                    <ParamSlider
                      label="等值面参数 $c$"
                      min={field.cMin}
                      max={field.cMax}
                      step={0.05}
                      value={c}
                      onChange={setC}
                      widthClass="w-full"
                      labelMode="adaptive"
                    />
                  </div>
                )}
              </div>
              <p className="mt-2 text-[11px] text-muted">
                双视口联动：在任一视口移动鼠标或拖拽红点，两边同步定位探针；2D
                滚轮缩放/中键平移；3D 左键旋转/滚轮缩放/右键平移。
              </p>
            </KdeCard>

            <KdeCard title="标量场与梯度读数" variant="dense">
              <div className="space-y-2">
                <KdeReadout
                  label="标量场解析式 φ(x, y)"
                  value={`$\\varphi(x,y) = ${field.texAt(c)}$`}
                  dense
                />
                <KdeReadout
                  label={`探针位置 (${probe.x.toFixed(2)}, ${probe.y.toFixed(2)}) 标量值`}
                  value={value.toFixed(3)}
                  variant="accent"
                  dense
                />
                <div className="grid grid-cols-2 gap-2">
                  <KdeReadout
                    label="梯度向量 ∇φ"
                    value={`(${gx.toFixed(3)}, ${gy.toFixed(3)})`}
                    dense
                  />
                  <KdeReadout
                    label="最陡坡度 ‖∇φ‖"
                    value={Math.hypot(gx, gy).toFixed(3)}
                    variant="success"
                    dense
                  />
                </div>
                {field.hasC && (
                  <KdeReadout
                    label="当前等值线方程 F(x,y) = c"
                    value={`$${field.levelTex(c)}$`}
                    dense
                  />
                )}
              </div>
            </KdeCard>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
