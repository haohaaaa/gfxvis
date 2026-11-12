import katex from "katex";
import {
  drawAdaptiveAxes,
  drawArrow,
  drawPixelPoint,
  getVisibleBounds,
  type Plot2D,
  type ThemeColors,
} from "./plot2d";

const sceneMathCache = new Map<string, string>();
const SCENE_MATH_REGEX = /(\$\$[\s\S]+?\$\$|\$(?!\$)(?:\\\$|[^$])+\$)/g;

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderKatexCached(tex: string, displayMode: boolean): string {
  const key = `${displayMode ? "D:" : "I:"}${tex}`;
  const hit = sceneMathCache.get(key);
  if (hit !== undefined) return hit;
  try {
    const html = katex.renderToString(tex, {
      throwOnError: false,
      displayMode,
      output: "html",
    });
    sceneMathCache.set(key, html);
    return html;
  } catch {
    return escapeHtml(tex);
  }
}

/**
 * Render a label string that may contain inline `$...$` LaTeX math into HTML.
 */
export function renderSceneLabelHtml(text: string): string {
  if (!text.includes("$")) {
    return escapeHtml(text);
  }
  SCENE_MATH_REGEX.lastIndex = 0;
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = SCENE_MATH_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("$$") && token.endsWith("$$")) {
      result += renderKatexCached(token.slice(2, -2).trim(), true);
    } else if (token.startsWith("$") && token.endsWith("$")) {
      result += renderKatexCached(token.slice(1, -1).trim(), false);
    } else {
      result += escapeHtml(token);
    }
    lastIndex = SCENE_MATH_REGEX.lastIndex;
  }
  if (lastIndex < text.length) {
    result += escapeHtml(text.slice(lastIndex));
  }
  return result;
}

export interface SceneLineOptions {
  normal?: [number, number]; // [a, b] for ax + by = c
  offset?: number; // c in ax + by = c
  p1?: [number, number]; // Alternatively [x1, y1]
  p2?: [number, number]; // [x2, y2]
  stroke?: string;
  width?: number;
  dash?: number[];
  label?: string;
}

export interface SceneVectorOptions {
  from?: [number, number];
  to: [number, number];
  color?: string;
  width?: number;
  headLength?: number;
  headWidth?: number;
  label?: string;
  dashed?: boolean;
  dash?: number[];
  labelPosition?: "auto" | "top" | "bottom" | "left" | "right";
  draggable?: boolean;
  hitRadiusPx?: number;
  handleRadius?: number;
  handleRing?: boolean;
  onDrag?(tip: [number, number]): void;
}

export interface ScenePointOptions {
  at: [number, number];
  color?: string;
  radius?: number;
  label?: string;
  ring?: boolean;
  draggable?: boolean;
  hitRadius?: number; // legacy world units fallback
  hitRadiusPx?: number; // physical screen pixels (default 24)
  onDrag?(newPos: [number, number]): void;
}

export interface ScenePolylineOptions {
  points: Array<[number, number]>;
  color?: string;
  width?: number;
  dash?: number[];
  alpha?: number;
  closed?: boolean;
  fillColor?: string;
}

export interface SceneControlPointsOptions {
  points: Array<[number, number]>;
  color?: string;
  radius?: number;
  hitRadiusPx?: number;
  draggable?: boolean;
  onDrag?: (index: number, newPos: [number, number]) => void;
  labels?: (index: number) => string;
  showPolygon?: boolean;
  polygonColor?: string;
  polygonWidth?: number;
  polygonDash?: number[];
}

export interface SceneRawBlock {
  fn(ctx: CanvasRenderingContext2D, plot: Plot2D, theme: ThemeColors): void;
}

export interface SceneLabelOptions {
  at: [number, number];
  text: string;
  color?: string;
  offset?: [number, number];
  priority?: number;
  chip?: boolean;
}

export interface QueuedLabel {
  text: string;
  x: number;
  y: number;
  color: string;
  font: string;
  priority: number;
  chip?: boolean;
}

interface PooledDomLabel {
  el: HTMLDivElement;
  lastText: string;
  lastColor: string;
  lastLight: boolean;
  lastChip: boolean;
}

/**
 * Lightweight 2D Mathematical Scene Graph & Pipeline.
 * Eliminates repetitive trigonometry, coordinate projection, manual hit-testing,
 * and text overlap bugs in interactive 2D geometry canvases.
 */
export class Scene2D {
  private axesConfig: { xLabel: string; yLabel: string } | null = null;
  private lines: SceneLineOptions[] = [];
  private vectors: SceneVectorOptions[] = [];
  private polylines: ScenePolylineOptions[] = [];
  private points: ScenePointOptions[] = [];
  private labels: SceneLabelOptions[] = [];
  private rawBlocks: ((
    ctx: CanvasRenderingContext2D,
    plot: Plot2D,
    theme: ThemeColors,
  ) => void)[] = [];

  private draggingPoint: ScenePointOptions | null = null;
  private hasRendered = false;
  private labelLayer: HTMLElement | null = null;
  private labelPool: PooledDomLabel[] = [];

  /** Attach a managed DOM overlay container for hardware-accelerated KaTeX/HTML labels */
  attachLabelLayer(layer: HTMLElement | null): void {
    if (this.labelLayer === layer) return;
    if (this.labelLayer) {
      this.labelLayer.innerHTML = "";
    }
    this.labelLayer = layer;
    this.labelPool = [];
  }

  private hideAllDomLabels(): void {
    for (const item of this.labelPool) {
      if (item.el.style.display !== "none") {
        item.el.style.display = "none";
      }
    }
  }

  get isRendered(): boolean {
    return this.hasRendered;
  }

  get isEmpty(): boolean {
    return (
      !this.axesConfig &&
      this.lines.length === 0 &&
      this.vectors.length === 0 &&
      this.polylines.length === 0 &&
      this.points.length === 0 &&
      this.labels.length === 0 &&
      this.rawBlocks.length === 0
    );
  }

  /** Clear all queued entities for a fresh frame */
  clear(): void {
    this.axesConfig = null;
    this.lines = [];
    this.vectors = [];
    this.polylines = [];
    this.points = [];
    this.labels = [];
    this.rawBlocks = [];
    this.hasRendered = false;
    this.hideAllDomLabels();
  }

  /** Add standard adaptive axes with ticks */
  addAxes(xLabel = "x", yLabel = "y"): this {
    this.axesConfig = { xLabel, yLabel };
    return this;
  }

  /** Add a mathematical line or affine hyperplane */
  addLine(options: SceneLineOptions): this {
    this.lines.push(options);
    return this;
  }

  /** Add a 2D vector arrow from origin or specified base point */
  addVector(options: SceneVectorOptions): this {
    this.vectors.push(options);
    if (options.draggable && options.onDrag) {
      this.addPoint({
        at: options.to,
        color: options.color,
        radius: options.handleRadius ?? 5,
        ring: options.handleRing ?? true,
        hitRadiusPx: options.hitRadiusPx ?? 24,
        draggable: true,
        onDrag: options.onDrag,
      });
    }
    return this;
  }

  /** Add a multi-point polyline or closed polygon */
  addPolyline(options: ScenePolylineOptions): this {
    this.polylines.push(options);
    return this;
  }

  /** Add a set of control points with optional connecting polygon and indexed drag handler */
  addControlPoints(options: SceneControlPointsOptions): this {
    if (options.showPolygon ?? true) {
      this.addPolyline({
        points: options.points,
        color: options.polygonColor ?? "#94a3b8",
        width: options.polygonWidth ?? 1.5,
        dash: options.polygonDash ?? [4, 4],
      });
    }
    options.points.forEach((pt, idx) => {
      this.addPoint({
        at: pt,
        color: options.color,
        radius: options.radius ?? 5,
        hitRadiusPx: options.hitRadiusPx ?? 24,
        draggable: options.draggable,
        label: options.labels?.(idx),
        onDrag: options.onDrag
          ? (newPos) => options.onDrag?.(idx, newPos)
          : undefined,
      });
    });
    return this;
  }

  /** Add a point, probe or interactive draggable handle */
  addPoint(options: ScenePointOptions): this {
    this.points.push(options);
    return this;
  }

  /** Add a standalone text or LaTeX ($...$) label at a mathematical coordinate */
  addLabel(options: SceneLabelOptions): this {
    this.labels.push(options);
    return this;
  }

  /** Escape hatch for custom canvas commands */
  raw(
    fn: (
      ctx: CanvasRenderingContext2D,
      plot: Plot2D,
      theme: ThemeColors,
    ) => void,
  ): this {
    this.rawBlocks.push(fn);
    return this;
  }

  /**
   * Handle mouse/pointer press using physical screen pixel distance.
   * Returns true if an interactive entity (point) claimed the drag gesture.
   */
  handlePointerDown(
    plot: Plot2D,
    clientPxX: number,
    clientPxY: number,
  ): boolean {
    for (const pt of this.points) {
      if (!pt.draggable || !pt.onDrag) continue;
      const sx = plot.toScreenX(pt.at[0]);
      const sy = plot.toScreenY(pt.at[1]);
      const hitRadius =
        pt.hitRadiusPx ??
        (pt.hitRadius != null
          ? Math.abs(plot.toScreenX(pt.hitRadius) - plot.toScreenX(0))
          : 24);
      const dist = Math.hypot(clientPxX - sx, clientPxY - sy);
      if (dist <= hitRadius) {
        this.draggingPoint = pt;
        return true;
      }
    }
    return false;
  }

  /**
   * Handle mouse/pointer drag.
   */
  handlePointerMove(plot: Plot2D, clientPxX: number, clientPxY: number): void {
    if (!this.draggingPoint || !this.draggingPoint.onDrag) return;
    const wx = plot.toWorldX(clientPxX);
    const wy = plot.toWorldY(clientPxY);
    this.draggingPoint.onDrag([wx, wy]);
  }

  /**
   * Handle pointer release.
   */
  handlePointerUp(): void {
    this.draggingPoint = null;
  }

  /**
   * Render all queued entities and raw blocks onto the canvas.
   * Includes automated smart label positioning and collision avoidance.
   */
  render(
    ctx: CanvasRenderingContext2D,
    plot: Plot2D,
    theme: ThemeColors,
  ): void {
    this.hasRendered = true;
    const { width, height } = plot;

    // 1. Draw Axes
    if (this.axesConfig) {
      drawAdaptiveAxes(
        ctx,
        plot,
        theme,
        this.axesConfig.xLabel,
        this.axesConfig.yLabel,
      );
    }

    const queuedLabels: QueuedLabel[] = [];

    // 2. Draw Lines
    for (const line of this.lines) {
      ctx.save();
      ctx.strokeStyle = line.stroke ?? theme.ink;
      ctx.lineWidth = line.width ?? 2;
      if (line.dash) ctx.setLineDash(line.dash);

      if (line.normal) {
        const [a, b] = line.normal;
        const c = line.offset ?? 0;
        const len = Math.hypot(a, b);
        if (len > 1e-5) {
          const nx = a / len;
          const ny = b / len;
          const dx = -ny;
          const dy = nx;
          const d0 = c / len;
          const p0x = nx * d0;
          const p0y = ny * d0;

          // Mathematical visible span instead of raw pixel dimensions
          const bounds = getVisibleBounds(plot);
          const mathSpan =
            Math.hypot(bounds.xMax - bounds.xMin, bounds.yMax - bounds.yMin) *
            2;

          const x1 = plot.toScreenX(p0x - dx * mathSpan);
          const y1 = plot.toScreenY(p0y - dy * mathSpan);
          const x2 = plot.toScreenX(p0x + dx * mathSpan);
          const y2 = plot.toScreenY(p0y + dy * mathSpan);

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          if (line.label) {
            queuedLabels.push({
              text: line.label,
              x: Math.max(30, Math.min(width - 120, x2 - 80)),
              y: Math.max(40, Math.min(height - 40, y2 - 12)),
              color: line.stroke ?? theme.ink,
              font: "bold 11px system-ui, sans-serif",
              priority: 1,
            });
          }
        }
      } else if (line.p1 && line.p2) {
        const x1 = plot.toScreenX(line.p1[0]);
        const y1 = plot.toScreenY(line.p1[1]);
        const x2 = plot.toScreenX(line.p2[0]);
        const y2 = plot.toScreenY(line.p2[1]);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2.5. Draw Polylines & Polygons
    for (const poly of this.polylines) {
      if (poly.points.length < 2) continue;
      ctx.save();
      if (poly.alpha !== undefined) ctx.globalAlpha = poly.alpha;
      ctx.strokeStyle = poly.color ?? theme.accent;
      ctx.lineWidth = poly.width ?? 2;
      if (poly.dash) ctx.setLineDash(poly.dash);

      ctx.beginPath();
      const [p0x, p0y] = poly.points[0];
      ctx.moveTo(plot.toScreenX(p0x), plot.toScreenY(p0y));
      for (let i = 1; i < poly.points.length; i++) {
        const [px, py] = poly.points[i];
        ctx.lineTo(plot.toScreenX(px), plot.toScreenY(py));
      }
      if (poly.closed) {
        ctx.closePath();
        if (poly.fillColor) {
          ctx.fillStyle = poly.fillColor;
          ctx.fill();
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Vectors
    for (const vec of this.vectors) {
      const from = vec.from ?? [0, 0];
      const pFromX = plot.toScreenX(from[0]);
      const pFromY = plot.toScreenY(from[1]);
      const pToX = plot.toScreenX(vec.to[0]);
      const pToY = plot.toScreenY(vec.to[1]);
      const color = vec.color ?? theme.accent;
      const lineWidth = vec.width ?? 2.5;
      const dx = pToX - pFromX;
      const dy = pToY - pFromY;

      ctx.save();
      if (vec.dashed || vec.dash) {
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(vec.dash ?? [4, 3]);
        ctx.beginPath();
        ctx.moveTo(pFromX, pFromY);
        ctx.lineTo(pToX, pToY);
        ctx.stroke();
      } else {
        drawArrow(
          ctx,
          pFromX,
          pFromY,
          dx,
          dy,
          color,
          vec.headLength ?? 9,
          vec.headWidth ?? 6,
          lineWidth,
        );
      }
      ctx.restore();

      if (vec.label) {
        let lx = pToX + 8;
        let ly = pToY - 6;
        if (vec.labelPosition === "top") {
          lx = pToX;
          ly = pToY - 14;
        } else if (vec.labelPosition === "bottom") {
          lx = pToX;
          ly = pToY + 14;
        } else if (vec.labelPosition === "left") {
          lx = pToX - 36;
          ly = pToY;
        } else if (vec.labelPosition === "right") {
          lx = pToX + 10;
          ly = pToY;
        }
        queuedLabels.push({
          text: vec.label,
          x: lx,
          y: ly,
          color,
          font: "bold 11px system-ui, sans-serif",
          priority: 2,
          chip: true,
        });
      }
    }

    // 4. Draw Points
    for (const pt of this.points) {
      const px = plot.toScreenX(pt.at[0]);
      const py = plot.toScreenY(pt.at[1]);
      const color = pt.color ?? theme.accent;
      const radius = pt.radius ?? 5.5;

      drawPixelPoint(ctx, px, py, color, radius);

      if (pt.ring) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, radius + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (pt.label) {
        queuedLabels.push({
          text: pt.label,
          x: px > width - 140 ? px - 130 : px + 10,
          y: py < 40 ? py + 16 : py - 10,
          color,
          font: "bold 12px system-ui, sans-serif",
          priority: 3,
          chip: true,
        });
      }
    }

    // 4.5. Standalone Labels
    for (const lbl of this.labels) {
      const px = plot.toScreenX(lbl.at[0]) + (lbl.offset?.[0] ?? 0);
      const py = plot.toScreenY(lbl.at[1]) + (lbl.offset?.[1] ?? 0);
      queuedLabels.push({
        text: lbl.text,
        x: px,
        y: py,
        color: lbl.color ?? theme.ink,
        font: "bold 11px system-ui, sans-serif",
        priority: lbl.priority ?? 2,
        chip: lbl.chip ?? true,
      });
    }

    // 5. Custom Raw Blocks
    for (const raw of this.rawBlocks) {
      ctx.save();
      try {
        raw(ctx, plot, theme);
      } finally {
        ctx.restore();
      }
    }

    // 6. Intelligent Label Collision Avoidance
    // If two labels are too close (< 24px in Y and < 90px in X), shift one vertically
    for (let i = 0; i < queuedLabels.length; i++) {
      for (let j = i + 1; j < queuedLabels.length; j++) {
        const l1 = queuedLabels[i];
        const l2 = queuedLabels[j];
        const dx = Math.abs(l1.x - l2.x);
        const dy = Math.abs(l1.y - l2.y);
        if (dx < 90 && dy < 20) {
          // Push lower priority label downward
          if (l1.priority >= l2.priority) {
            l2.y += 18;
          } else {
            l1.y += 18;
          }
        }
      }
    }

    const isLight =
      theme.bg === "#ffffff" ||
      theme.bg === "#f8fafc" ||
      theme.bg.startsWith("#f");

    // 7. Managed DOM Label Layer (supports full KaTeX $...$ math and KDE Breeze chip pills)
    if (this.labelLayer) {
      this.syncDomLabels(queuedLabels, isLight);
      return;
    }

    // Fallback: Render queued labels onto Canvas when no DOM labelLayer is attached
    ctx.save();
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    for (const label of queuedLabels) {
      const text = label.text;
      const metrics = ctx.measureText(text);
      const textW = metrics.width;
      const chipH = 19;
      const padX = 6;
      const chipW = textW + padX * 2;
      const chipX = label.x - padX;
      const chipY = label.y - chipH / 2;
      const radius = 4;

      if (label.chip !== false) {
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(chipX, chipY, chipW, chipH, radius);
        } else {
          ctx.rect(chipX, chipY, chipW, chipH);
        }

        ctx.fillStyle = isLight
          ? "rgba(255, 255, 255, 0.92)"
          : "rgba(30, 41, 59, 0.92)";
        ctx.fill();

        ctx.strokeStyle = label.color.startsWith("#")
          ? `${label.color}44`
          : "rgba(148, 163, 184, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = label.color;
      ctx.fillText(text, label.x, label.y);
    }
    ctx.restore();
  }

  private syncDomLabels(queuedLabels: QueuedLabel[], isLight: boolean): void {
    const layer = this.labelLayer;
    if (!layer) return;

    for (let i = 0; i < queuedLabels.length; i++) {
      const label = queuedLabels[i];
      const useChip = label.chip !== false;
      let item = this.labelPool[i];

      if (!item) {
        const el = document.createElement("div");
        el.style.position = "absolute";
        el.style.left = "0";
        el.style.top = "0";
        el.style.pointerEvents = "none";
        el.style.userSelect = "none";
        el.style.whiteSpace = "nowrap";
        el.style.fontSize = "11px";
        el.style.fontWeight = "600";
        el.style.lineHeight = "1.2";
        el.style.willChange = "transform";
        layer.appendChild(el);
        item = {
          el,
          lastText: "",
          lastColor: "",
          lastLight: !isLight,
          lastChip: !useChip,
        };
        this.labelPool.push(item);
      }

      const { el } = item;
      if (el.style.display !== "inline-flex") {
        el.style.display = "inline-flex";
        el.style.alignItems = "center";
        el.style.gap = "2px";
      }

      if (item.lastText !== label.text) {
        el.innerHTML = renderSceneLabelHtml(label.text);
        item.lastText = label.text;
      }

      if (
        item.lastColor !== label.color ||
        item.lastLight !== isLight ||
        item.lastChip !== useChip
      ) {
        el.style.color = label.color;
        if (useChip) {
          el.style.padding = "2px 6px";
          el.style.borderRadius = "4px";
          el.style.backgroundColor = isLight
            ? "rgba(255, 255, 255, 0.92)"
            : "rgba(30, 41, 59, 0.92)";
          const borderColor = label.color.startsWith("#")
            ? `${label.color}44`
            : "rgba(148, 163, 184, 0.4)";
          el.style.border = `1px solid ${borderColor}`;
          el.style.boxShadow = isLight
            ? "0 1px 2px rgba(15, 23, 42, 0.06)"
            : "0 1px 2px rgba(0, 0, 0, 0.25)";
        } else {
          el.style.padding = "0";
          el.style.borderRadius = "0";
          el.style.backgroundColor = "transparent";
          el.style.border = "none";
          el.style.boxShadow = "none";
        }
        item.lastColor = label.color;
        item.lastLight = isLight;
        item.lastChip = useChip;
      }

      const offsetX = useChip ? label.x - 6 : label.x;
      const offsetY = label.y;
      el.style.transform = `translate3d(${Math.round(offsetX)}px, ${Math.round(offsetY)}px, 0) translateY(-50%)`;
    }

    for (let i = queuedLabels.length; i < this.labelPool.length; i++) {
      const el = this.labelPool[i].el;
      if (el.style.display !== "none") {
        el.style.display = "none";
      }
    }
  }
}
