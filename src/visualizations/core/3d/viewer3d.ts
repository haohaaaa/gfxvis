import * as THREE from "three";
import { createCamera } from "./camera";
import { createControls } from "./controls";
import { createRenderer } from "./renderer";

export interface CreateViewer3DOptions {
  /** Fixed background clear color (e.g. 0x020617 for dark chassis). If omitted, tracks --gfx-bg theme. */
  clearColor?: string | number;
  clearAlpha?: number;
  /** Callback invoked every frame inside the RAF loop. */
  onFrame?: (viewer: Viewer3D) => void;
}

export interface Viewer3D {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: ReturnType<typeof createControls>;
  render(): void;
  setPaused(paused: boolean): void;
  setOnFrame(cb: ((viewer: Viewer3D) => void) | null): void;
  dispose(): void;
}

/**
 * Shared Three.js viewer: renderer/camera/controls creation, theme-aware clear
 * color, render-on-demand, ResizeObserver (so the scene grows with an expanded
 * interaction area), and full cleanup.
 */
export function createViewer3D(
  container: HTMLElement,
  scene: THREE.Scene,
  options?: CreateViewer3DOptions,
): Viewer3D {
  const renderer = createRenderer(container);
  const camera = createCamera(container.clientWidth / container.clientHeight);
  const controls = createControls(camera, renderer.domElement);

  const applyClearColor = () => {
    if (options?.clearColor !== undefined) {
      renderer.setClearColor(options.clearColor, options.clearAlpha ?? 1);
      return;
    }
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue("--gfx-bg").trim() || "#ffffff";
    renderer.setClearColor(bg, 1);
  };
  const render = () => renderer.render(scene, camera);

  let currentOnFrame = options?.onFrame ?? null;
  let isPaused = false;

  const viewerInstance: Viewer3D = {
    renderer,
    camera,
    controls,
    render,
    setPaused(paused: boolean) {
      if (isPaused === paused) return;
      isPaused = paused;
      if (paused) {
        if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      } else {
        if (!raf) {
          loop();
        }
      }
    },
    setOnFrame(cb) {
      currentOnFrame = cb;
    },
    dispose() {
      if (raf) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      themeObserver?.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };

  // OrbitControls with damping applies motion only inside update(), so keep a
  // rAF loop: without it wheel zoom / middle dolly / rotate / pan never move.
  let raf = 0;
  const loop = () => {
    if (isPaused) return;
    raf = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
    currentOnFrame?.(viewerInstance);
  };

  applyClearColor();
  loop();

  const onResize = () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    render();
  };
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);

  let themeObserver: MutationObserver | null = null;
  if (options?.clearColor === undefined) {
    themeObserver = new MutationObserver(() => {
      applyClearColor();
      render();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  return viewerInstance;
}
