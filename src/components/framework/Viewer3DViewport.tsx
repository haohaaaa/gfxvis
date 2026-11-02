import {
  type ReactNode,
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
  createContext,
  useContext,
  useState,
} from "react";
import type { Scene } from "three";
import { Vector3 } from "three";
import {
  createViewer3D,
  type Viewer3D,
} from "../../visualizations/core/3d/viewer3d";
import { mathToWorld } from "../../visualizations/core/3d/coords";
import CanvasToolbar from "./CanvasToolbar";
import CanvasResizer from "./CanvasResizer";
import AutoMath from "./AutoMath";

export interface Viewer3DContext<T> {
  api: T;
  viewer: Viewer3D;
}

export interface Viewer3DViewportHandle<T = unknown> {
  render(): void;
  resetControls(): void;
  getViewer(): Viewer3D | null;
  getApi(): T | null;
}

export interface Viewer3DViewportProps<
  T extends { scene: Scene; dispose(): void },
> {
  /** Scene factory returning a Three.js scene and api controller */
  factory: () => T;
  /**
   * Update handler called on initial mount and whenever deps change.
   * Can return a cleanup function (e.g. from attachGizmo3D) which is guaranteed
   * to be executed before the next update and upon unmount, preventing event leaks.
   */
  onUpdate?: (ctx: Viewer3DContext<T>) => (() => void) | void;
  /** Dependencies that trigger onUpdate */
  deps?: unknown[];
  /** Reset view handler. If omitted, defaults to viewer.controls.reset() */
  onReset?: () => void;
  /** CSS class for outer container */
  className?: string;
  /** Height class override, default "h-[var(--demo-height,28rem)]" */
  heightClass?: string;
  /** Fixed background clear color (default 0x020617 for dark chassis) */
  clearColor?: string | number;
  /** Whether to show the bottom resizer bar (default true) */
  resizer?: boolean;
  /** Whether to show the toolbar reset button (default true) */
  toolbar?: boolean;
  /** Children elements, e.g. <CanvasOverlay> or <Viewer3DViewport.Pin> */
  children?: ReactNode;
}

interface PinRegistration {
  id: string;
  getPoint: () => [number, number, number];
  isMathCoord: boolean;
  offset: [number, number];
  element: HTMLDivElement;
  hideBehind: boolean;
}

interface PinContextValue {
  registerPin(pin: PinRegistration): () => void;
}

const PinContext = createContext<PinContextValue | null>(null);

/**
 * Standardized 3D WebGL Viewport Component.
 * Encapsulates dark chassis, Retina WebGL renderer, OrbitControls, drawer HUD CanvasToolbar,
 * CanvasResizer, IntersectionObserver offscreen sleep, leak-free onUpdate cleanup,
 * and zero-overhead direct DOM 3D Pins.
 */
const Viewer3DViewport = forwardRef(function Viewer3DViewport<
  T extends { scene: Scene; dispose(): void },
>(
  {
    factory,
    onUpdate,
    deps,
    onReset,
    className = "",
    heightClass = "h-[var(--demo-height,28rem)]",
    clearColor = 0x020617, // Slate-950 dark chassis
    resizer = true,
    toolbar = true,
    children,
  }: Viewer3DViewportProps<T>,
  ref: React.ForwardedRef<Viewer3DViewportHandle<T>>,
) {
  const containerNodeRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<T | null>(null);
  const viewerRef = useRef<Viewer3D | null>(null);
  const detachRef = useRef<(() => void) | void>(undefined);
  const factoryRef = useRef(factory);
  factoryRef.current = factory;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Active Pins for hardware-accelerated direct positioning
  const pinsRef = useRef<Map<string, PinRegistration>>(new Map());

  const registerPin = useCallback((pin: PinRegistration) => {
    pinsRef.current.set(pin.id, pin);
    return () => {
      pinsRef.current.delete(pin.id);
    };
  }, []);

  // Update pin positions directly via CSS transform inside the RAF loop
  const updatePins = useCallback((viewer: Viewer3D) => {
    const container = containerNodeRef.current;
    if (!container || pinsRef.current.size === 0) return;

    const camera = viewer.camera;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w <= 0 || h <= 0) return;

    const tempV = new Vector3();

    for (const pin of pinsRef.current.values()) {
      const pt = pin.getPoint();
      const [wx, wy, wz] = pin.isMathCoord
        ? mathToWorld(pt[0], pt[1], pt[2])
        : pt;

      tempV.set(wx, wy, wz);
      tempV.project(camera);

      const isBehind = pin.hideBehind && tempV.z >= 1;
      const isOutOfBounds =
        tempV.x < -1.2 || tempV.x > 1.2 || tempV.y < -1.2 || tempV.y > 1.2;

      if (isBehind || isOutOfBounds) {
        pin.element.style.opacity = "0";
        pin.element.style.pointerEvents = "none";
      } else {
        const screenX = (tempV.x * 0.5 + 0.5) * w + pin.offset[0];
        const screenY = (-tempV.y * 0.5 + 0.5) * h + pin.offset[1];
        pin.element.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -50%)`;
        pin.element.style.opacity = "1";
        pin.element.style.pointerEvents = "auto";
      }
    }
  }, []);

  // Initialize or re-initialize viewer
  const initViewer = useCallback(() => {
    const container = containerNodeRef.current;
    if (!container) return;

    // Dispose existing viewer if any
    if (viewerRef.current) {
      if (detachRef.current) {
        detachRef.current();
        detachRef.current = undefined;
      }
      viewerRef.current.dispose();
      viewerRef.current = null;
    }
    if (apiRef.current) {
      apiRef.current.dispose();
      apiRef.current = null;
    }

    const api = factoryRef.current();
    apiRef.current = api;

    const viewer = createViewer3D(container, api.scene, {
      clearColor,
      onFrame: (v) => updatePins(v),
    });
    viewerRef.current = viewer;

    // Run initial update and record cleanup
    if (onUpdateRef.current) {
      detachRef.current = onUpdateRef.current({ api, viewer });
    }
  }, [clearColor, updatePins]);

  // Callback Ref for container DOM attachment
  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerNodeRef.current = node;
      if (node) {
        initViewer();
      } else {
        if (detachRef.current) {
          detachRef.current();
          detachRef.current = undefined;
        }
        if (viewerRef.current) {
          viewerRef.current.dispose();
          viewerRef.current = null;
        }
        if (apiRef.current) {
          apiRef.current.dispose();
          apiRef.current = null;
        }
      }
    },
    [initViewer],
  );

  // IntersectionObserver: sleep RAF when offscreen to save GPU/CPU
  useEffect(() => {
    const container = containerNodeRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry?.isIntersecting ?? false;
        viewerRef.current?.setPaused(!isVisible);
      },
      { threshold: 0.05 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Run onUpdate when deps change (with strict cleanup of previous execution)
  useEffect(() => {
    const api = apiRef.current;
    const viewer = viewerRef.current;
    if (!api || !viewer) return;

    if (detachRef.current) {
      detachRef.current();
      detachRef.current = undefined;
    }

    if (onUpdateRef.current) {
      detachRef.current = onUpdateRef.current({ api, viewer });
      viewer.render();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? []);

  // Expose imperative handle
  useImperativeHandle(
    ref,
    () => ({
      render() {
        viewerRef.current?.render();
      },
      resetControls() {
        viewerRef.current?.controls.reset();
      },
      getViewer() {
        return viewerRef.current;
      },
      getApi() {
        return apiRef.current;
      },
    }),
    [],
  );

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      viewerRef.current?.controls.reset();
    }
  };

  return (
    <PinContext.Provider value={{ registerPin }}>
      <div
        ref={setContainerRef}
        className={`relative w-full overflow-hidden rounded-xl border border-border bg-slate-950 dark text-slate-200 select-none ${heightClass} ${className}`.trim()}
      >
        {toolbar && <CanvasToolbar onReset={handleReset} />}
        <AutoMath>{children}</AutoMath>
        {resizer && (
          <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
        )}
      </div>
    </PinContext.Provider>
  );
}) as <T extends { scene: Scene; dispose(): void }>(
  props: Viewer3DViewportProps<T> & {
    ref?: React.ForwardedRef<Viewer3DViewportHandle<T>>;
  },
) => React.ReactElement;

export interface Viewer3DPinProps {
  /** Math space coordinates [x, y, z] (converted via mathToWorld) */
  at?: [number, number, number] | { x: number; y: number; z: number };
  /** World space coordinates [x, y, z] directly */
  worldAt?: [number, number, number] | { x: number; y: number; z: number };
  /** Pixel offset from projected point [dx, dy] (default [0, 0]) */
  offset?: [number, number];
  /** Whether the pin should hide if behind the camera (default true) */
  hideBehind?: boolean;
  className?: string;
  children: ReactNode;
}

let pinCounter = 0;

function Viewer3DPin({
  at,
  worldAt,
  offset = [0, 0],
  hideBehind = true,
  className = "",
  children,
}: Viewer3DPinProps) {
  const pinContext = useContext(PinContext);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [pinId] = useState(() => `pin_${++pinCounter}`);

  const atRef = useRef({ at, worldAt, offset, hideBehind });
  atRef.current = { at, worldAt, offset, hideBehind };

  useEffect(() => {
    const el = elementRef.current;
    if (!el || !pinContext) return;

    return pinContext.registerPin({
      id: pinId,
      getPoint: () => {
        const cur = atRef.current;
        if (cur.at) {
          const pt = cur.at;
          return Array.isArray(pt) ? pt : [pt.x, pt.y, pt.z];
        }
        if (cur.worldAt) {
          const pt = cur.worldAt;
          return Array.isArray(pt) ? pt : [pt.x, pt.y, pt.z];
        }
        return [0, 0, 0];
      },
      isMathCoord: !atRef.current.worldAt,
      offset: atRef.current.offset,
      element: el,
      hideBehind: atRef.current.hideBehind,
    });
  }, [pinContext, pinId]);

  return (
    <div
      ref={elementRef}
      className={`pointer-events-none absolute top-0 left-0 will-change-transform opacity-0 z-10 select-none ${className}`.trim()}
      style={{ transform: "translate3d(-9999px, -9999px, 0)" }}
    >
      <AutoMath>{children}</AutoMath>
    </div>
  );
}

// Attach subcomponents
export default Object.assign(Viewer3DViewport, {
  Pin: Viewer3DPin,
});
