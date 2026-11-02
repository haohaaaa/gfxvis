import { createContext, useContext, type ReactNode } from "react";
import AutoMath from "./AutoMath";

export type CanvasOverlayPosition =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface CanvasOverlayContextValue {
  variant: "card" | "chips";
}

const CanvasOverlayContext = createContext<CanvasOverlayContextValue>({
  variant: "card",
});

export interface CanvasOverlayProps {
  position?: CanvasOverlayPosition;
  variant?: "card" | "chips";
  className?: string;
  children: ReactNode;
}

const POSITION_CLASSES: Record<CanvasOverlayPosition, string> = {
  "top-left": "top-3 left-3",
  "top-right": "top-3 right-12", // 48px offset to avoid Retractable Drawer CanvasToolbar
  "bottom-left": "bottom-7 left-3.5", // 28px bottom offset to float safely above 16px CanvasResizer
  "bottom-right": "bottom-7 right-3.5",
};

/**
 * Standardized High-Contrast Glassmorphic Overlay for 2D & 3D Canvas Viewports.
 * Uses KDE Plasma Breeze raised-surface tokens with backdrop blur, subtle borders,
 * and adaptive light/dark theme contrast.
 *
 * Supports variant="card" (default grouped container) and variant="chips" (individual pill badges like KDE Breeze chips).
 */
export default function CanvasOverlay({
  position = "top-left",
  variant = "card",
  className = "",
  children,
}: CanvasOverlayProps) {
  const posClass = POSITION_CLASSES[position];

  if (variant === "chips") {
    return (
      <CanvasOverlayContext.Provider value={{ variant }}>
        <div
          className={`pointer-events-none absolute ${posClass} z-10 flex flex-col items-start gap-1.5 select-none ${className}`.trim()}
        >
          <AutoMath>{children}</AutoMath>
        </div>
      </CanvasOverlayContext.Provider>
    );
  }

  return (
    <CanvasOverlayContext.Provider value={{ variant }}>
      <div
        className={`pointer-events-none absolute ${posClass} z-10 flex flex-col gap-1.5 select-none rounded-[var(--kde-control-radius,0.35rem)] bg-[var(--kde-raised,#ffffff)]/90 dark:bg-slate-900/90 px-3 py-2 text-xs border border-[var(--kde-border,#cbd5e1)]/80 dark:border-slate-700/80 backdrop-blur-md shadow-xs text-[var(--kde-ink,#0f172a)] dark:text-slate-100 ${className}`.trim()}
      >
        <AutoMath>{children}</AutoMath>
      </div>
    </CanvasOverlayContext.Provider>
  );
}

export interface CanvasOverlayTitleProps {
  children: ReactNode;
  className?: string;
}

CanvasOverlay.Title = function CanvasOverlayTitle({
  children,
  className = "",
}: CanvasOverlayTitleProps) {
  return (
    <div
      className={`flex items-center gap-2 font-semibold text-[var(--kde-ink,#0f172a)] dark:text-white tracking-wide ${className}`.trim()}
    >
      <AutoMath>{children}</AutoMath>
    </div>
  );
};

export interface CanvasOverlaySubtitleProps {
  children: ReactNode;
  className?: string;
}

CanvasOverlay.Subtitle = function CanvasOverlaySubtitle({
  children,
  className = "",
}: CanvasOverlaySubtitleProps) {
  return (
    <div
      className={`text-[11.5px] text-[var(--kde-muted,#64748b)] dark:text-slate-300 font-sans font-medium tracking-normal opacity-95 leading-snug ${className}`.trim()}
    >
      <AutoMath>{children}</AutoMath>
    </div>
  );
};

export interface CanvasOverlayBadgeProps {
  variant?: "rose" | "emerald" | "amber" | "sky" | "purple";
  children: ReactNode;
  className?: string;
}

const BADGE_VARIANTS = {
  rose: "bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30 dark:border-rose-500/40",
  emerald:
    "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 dark:border-emerald-500/40",
  amber:
    "bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 dark:border-amber-500/40",
  sky: "bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30 dark:border-sky-500/40",
  purple:
    "bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30 dark:border-purple-500/40",
};

CanvasOverlay.Badge = function CanvasOverlayBadge({
  variant = "sky",
  children,
  className = "",
}: CanvasOverlayBadgeProps) {
  const vClass = BADGE_VARIANTS[variant];
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-bold border ${vClass} ${className}`.trim()}
    >
      {children}
    </span>
  );
};

export interface CanvasOverlayItemProps {
  color?: string;
  label: ReactNode;
  className?: string;
}

CanvasOverlay.Item = function CanvasOverlayItem({
  color,
  label,
  className = "",
}: CanvasOverlayItemProps) {
  const { variant } = useContext(CanvasOverlayContext);

  if (variant === "chips") {
    // Generate chip border and text styling based on color if available
    let chipColorClass =
      "border-[var(--kde-border,#cbd5e1)] text-[var(--kde-ink,#0f172a)] dark:border-slate-700 dark:text-slate-100";
    if (
      color === "#0284c7" ||
      color === "#0ea5e9" ||
      color?.includes("38bdf8")
    ) {
      chipColorClass = "border-sky-500/35 text-[#0284c7] dark:text-[#38bdf8]";
    } else if (
      color === "#f43f5e" ||
      color === "#e11d48" ||
      color?.includes("rose")
    ) {
      chipColorClass = "border-rose-500/35 text-[#f43f5e] dark:text-rose-400";
    } else if (
      color === "#10b981" ||
      color === "#059669" ||
      color?.includes("emerald")
    ) {
      chipColorClass =
        "border-emerald-500/35 text-[#10b981] dark:text-emerald-400";
    } else if (
      color === "#f59e0b" ||
      color === "#d97706" ||
      color?.includes("amber")
    ) {
      chipColorClass = "border-amber-500/35 text-[#f59e0b] dark:text-amber-400";
    } else if (
      color === "#a855f7" ||
      color === "#9333ea" ||
      color?.includes("purple")
    ) {
      chipColorClass =
        "border-purple-500/35 text-[#a855f7] dark:text-purple-400";
    }

    return (
      <div
        className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-bold bg-[var(--kde-raised,#ffffff)]/90 dark:bg-slate-900/90 border shadow-2xs backdrop-blur-md whitespace-nowrap ${chipColorClass} ${className}`.trim()}
      >
        {color && (
          <span
            className="inline-block h-1.5 w-1.5 rounded-full shrink-0 shadow-2xs"
            style={{ backgroundColor: color }}
          />
        )}
        <span>
          <AutoMath>{label}</AutoMath>
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-1.5 font-mono text-[11px] text-[var(--kde-ink,#0f172a)] dark:text-slate-200 ${className}`.trim()}
    >
      {color && (
        <span
          className="inline-block h-2 w-2 rounded-full shrink-0 shadow-2xs"
          style={{ backgroundColor: color }}
        />
      )}
      <span>
        <AutoMath>{label}</AutoMath>
      </span>
    </div>
  );
};
