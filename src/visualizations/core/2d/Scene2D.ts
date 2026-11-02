import {
  drawAdaptiveAxes,
  drawArrow,
  drawPixelPoint,
  getVisibleBounds,
  type Plot2D,
  type ThemeColors,
} from "./plot2d";

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

export interface QueuedLabel {
  text: string;
  x: number;
  y: number;
  color: string;
  font: string;
  priority: number;
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
  private rawBlocks: ((
    ctx: CanvasRenderingContext2D,
    plot: Plot2D,
    theme: ThemeColors,
  ) => void)[] = [];

  private draggingPoint: ScenePointOptions | null = null;
  private hasRendered = false;

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
    this.rawBlocks = [];
    this.hasRendered = false;
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
        queuedLabels.push({
          text: vec.label,
          x: pToX + 8,
          y: pToY - 6,
          color,
          font: "bold 11px system-ui, sans-serif",
          priority: 2,
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
        });
      }
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

    // Render queued labels cleanly with KDE Breeze glassmorphic chip pills
    ctx.save();
    ctx.font = "bold 11px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    const isLight =
      theme.bg === "#ffffff" ||
      theme.bg === "#f8fafc" ||
      theme.bg.startsWith("#f");

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

      // Draw glassmorphism chip pill background
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

      // Colored border matching entity color
      ctx.strokeStyle = label.color.startsWith("#")
        ? `${label.color}44`
        : "rgba(148, 163, 184, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Text inside chip
      ctx.fillStyle = label.color;
      ctx.fillText(text, label.x, label.y);
    }
    ctx.restore();
  }
}
