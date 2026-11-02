import {
  type ReactNode,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import {
  createCanvas2D,
  type Canvas2DController,
} from "../../visualizations/core/2d/canvas2d";
import type {
  Bounds2,
  Plot2D,
  ThemeColors,
} from "../../visualizations/core/2d/plot2d";
import CanvasToolbar from "./CanvasToolbar";
import CanvasResizer from "./CanvasResizer";
import AutoMath from "./AutoMath";
import { Scene2D } from "../../visualizations/core/2d/Scene2D";

export interface CanvasViewportHandle {
  redraw(): void;
  setBounds(bounds: Bounds2): void;
  resetBounds(): void;
  getCanvas(): HTMLCanvasElement | null;
}

export interface CanvasViewportProps {
  /** Initial bounds in mathematical coordinate space */
  initialBounds?: Bounds2;
  /** Primary draw function. Receives ctx, plot, theme, and the high-level Scene2D engine */
  onDraw?(
    ctx: CanvasRenderingContext2D,
    plot: Plot2D,
    theme: ThemeColors,
    scene: Scene2D,
  ): void;
  /** Reset view handler. If provided, renders CanvasToolbar with reset button */
  onReset?(): void;
  /** Extra controls to render inside the top-right CanvasToolbar */
  toolbarChildren?: ReactNode;
  /** Interactive gesture handlers */
  onLeftDown?(e: PointerEvent, plot: Plot2D, scene: Scene2D): boolean;
  onLeftMove?(e: PointerEvent, plot: Plot2D, scene: Scene2D): void;
  onLeftUp?(e: PointerEvent, scene: Scene2D): void;
  onHover?(
    e: PointerEvent,
    plot: Plot2D,
    redraw: () => void,
    scene: Scene2D,
  ): void;
  onPointerLeave?(
    e: PointerEvent,
    plot: Plot2D,
    redraw: () => void,
    scene: Scene2D,
  ): void;
  /** Margin around canvas framing in pixels (default: 24) */
  margin?: number;
  /** CSS class for outer container */
  className?: string;
  /** Height class override, default "h-[var(--demo-height,20rem)]" */
  heightClass?: string;
  /** Children elements, e.g. <CanvasOverlay> badges */
  children?: ReactNode;
  /** Whether to enable equal aspect ratio scale (default true) */
  equalScale?: boolean;
  /** Whether to show the bottom resizer bar (default true) */
  resizer?: boolean;
  /** Props forwarded to the underlying <canvas> element */
  canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement> & {
    "data-testid"?: string;
  };
  /** Optional data-testid for the container */
  testId?: string;
  "data-testid"?: string;
}

const DEFAULT_BOUNDS: Bounds2 = {
  xMin: -4.5,
  xMax: 4.5,
  yMin: -4.5,
  yMax: 4.5,
};

/**
 * Standardized 2D Canvas Viewport Component.
 * Encapsulates the entire 5-layer nesting (KDE styling, Retina canvas, CanvasToolbar,
 * CanvasResizer, Theme Scope, and lifecycle binding) into a single declarative component.
 *
 * Uses Callback Ref to eliminate silent mount failures in dynamic tabs or conditionals.
 */
const CanvasViewport = forwardRef<CanvasViewportHandle, CanvasViewportProps>(
  function CanvasViewport(
    {
      initialBounds = DEFAULT_BOUNDS,
      onDraw,
      onReset,
      onLeftDown,
      onLeftMove,
      onLeftUp,
      onHover,
      onPointerLeave,
      margin,
      className = "",
      heightClass = "h-[var(--demo-height,20rem)]",
      children,
      equalScale = true,
      resizer = true,
      toolbarChildren,
      testId,
      "data-testid": dataTestId,
      canvasProps,
    },
    ref,
  ) {
    const containerNodeRef = useRef<HTMLDivElement | null>(null);
    const canvasNodeRef = useRef<HTMLCanvasElement | null>(null);
    const controllerRef = useRef<Canvas2DController | null>(null);
    const sceneRef = useRef<Scene2D>(new Scene2D());

    // Keep dynamic callbacks fresh without rebuilding controller
    const propsRef = useRef({
      initialBounds,
      onDraw,
      onLeftDown,
      onLeftMove,
      onLeftUp,
      onHover,
      onPointerLeave,
      margin,
      equalScale,
    });
    propsRef.current = {
      initialBounds,
      onDraw,
      onLeftDown,
      onLeftMove,
      onLeftUp,
      onHover,
      onPointerLeave,
      margin,
      equalScale,
    };

    // Forward imperative handle
    useImperativeHandle(
      ref,
      () => ({
        redraw() {
          controllerRef.current?.redraw();
        },
        setBounds(bounds: Bounds2) {
          controllerRef.current?.setBounds(bounds);
        },
        resetBounds() {
          controllerRef.current?.resetBounds();
        },
        getCanvas() {
          return canvasNodeRef.current;
        },
      }),
      [],
    );

    const initController = useCallback(() => {
      const container = containerNodeRef.current;
      const canvas = canvasNodeRef.current;
      if (!container || !canvas) return;

      // Clean up previous controller if any
      if (controllerRef.current) {
        controllerRef.current.dispose();
        controllerRef.current = null;
      }

      const scene = sceneRef.current;

      const controller = createCanvas2D(container, canvas, {
        get initialBounds() {
          return propsRef.current.initialBounds;
        },
        get equalScale() {
          return propsRef.current.equalScale;
        },
        get margin() {
          return propsRef.current.margin;
        },
        draw(ctx, plot, theme) {
          scene.clear();
          propsRef.current.onDraw?.(ctx, plot, theme, scene);
          if (!scene.isRendered && !scene.isEmpty) {
            scene.render(ctx, plot, theme);
          }
        },
        onLeftDown(e, plot) {
          // Check Scene2D interactive objects first
          if (scene.handlePointerDown(plot, e.offsetX, e.offsetY)) {
            return true;
          }
          return propsRef.current.onLeftDown?.(e, plot, scene) ?? false;
        },
        onLeftMove(e, plot) {
          scene.handlePointerMove(plot, e.offsetX, e.offsetY);
          propsRef.current.onLeftMove?.(e, plot, scene);
        },
        onLeftUp(e) {
          scene.handlePointerUp();
          propsRef.current.onLeftUp?.(e, scene);
        },
        onHover(e, plot, redraw) {
          if (propsRef.current.onHover) {
            const doRedraw = redraw ?? (() => controllerRef.current?.redraw());
            propsRef.current.onHover(e, plot, doRedraw, scene);
          }
        },
        onPointerLeave(e, plot, redraw) {
          if (propsRef.current.onPointerLeave) {
            const doRedraw = redraw ?? (() => controllerRef.current?.redraw());
            propsRef.current.onPointerLeave(e, plot, doRedraw, scene);
          }
        },
      });

      controllerRef.current = controller;
    }, []);

    // Callback Ref for container DOM attachment
    const setContainerRef = useCallback(
      (node: HTMLDivElement | null) => {
        containerNodeRef.current = node;
        if (node && canvasNodeRef.current) {
          initController();
        } else if (!node && controllerRef.current) {
          controllerRef.current.dispose();
          controllerRef.current = null;
        }
      },
      [initController],
    );

    // Callback Ref for canvas DOM attachment
    const setCanvasRef = useCallback(
      (node: HTMLCanvasElement | null) => {
        canvasNodeRef.current = node;
        if (node && containerNodeRef.current) {
          initController();
        }
      },
      [initController],
    );

    const isFirstMount = useRef(true);
    useEffect(() => {
      if (isFirstMount.current) {
        isFirstMount.current = false;
        return;
      }
      controllerRef.current?.redraw();
    });

    // Window resize & layout synchronization
    useEffect(() => {
      const handleResize = () => {
        controllerRef.current?.redraw();
      };
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    // IntersectionObserver: automatically redraw when transitioning from hidden/offscreen (e.g. tab switch)
    useEffect(() => {
      const container = containerNodeRef.current;
      if (!container) return;

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting && entry.intersectionRatio > 0) {
              controllerRef.current?.redraw();
            }
          }
        },
        { threshold: 0.01 },
      );

      observer.observe(container);
      return () => observer.disconnect();
    }, []);

    useEffect(() => {
      return () => {
        controllerRef.current?.dispose();
        controllerRef.current = null;
      };
    }, []);

    const handleReset = () => {
      onReset?.();
      controllerRef.current?.resetBounds();
    };

    return (
      <div
        ref={setContainerRef}
        data-testid={dataTestId ?? testId}
        className={`relative ${heightClass} w-full overflow-hidden rounded-[var(--kde-control-radius,0.35rem)] border border-[var(--kde-border,#bec5cc)] bg-[var(--kde-canvas,#ffffff)] dark:bg-slate-950 dark:border-slate-800 ${className}`.trim()}
      >
        <CanvasToolbar onReset={handleReset}>{toolbarChildren}</CanvasToolbar>
        <canvas
          ref={setCanvasRef}
          className={`absolute inset-0 h-full w-full ${canvasProps?.className ?? ""}`.trim()}
          {...canvasProps}
        />
        <AutoMath>{children}</AutoMath>
        {resizer && (
          <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
        )}
      </div>
    );
  },
);

export default CanvasViewport;
