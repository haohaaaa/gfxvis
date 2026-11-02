import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";

export interface KdeTabContextValue {
  activeTab: string;
}

export const KdeTabContext = createContext<KdeTabContextValue | null>(null);

export interface KdeTabPanelProps {
  id: string;
  activeId?: string;
  keepAlive?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Cohesive Tab Panel Component for KDE Breeze Tab Bars.
 * Seamlessly manages keep-alive visibility (via CSS hidden),
 * prevents canvas destruction across tab switches, and triggers
 * automatic microtask resize/redraw on child viewports when activated.
 */
export default function KdeTabPanel({
  id,
  activeId: directActiveId,
  keepAlive = true,
  className = "",
  children,
}: KdeTabPanelProps) {
  const context = useContext(KdeTabContext);
  const activeTab = directActiveId ?? context?.activeTab ?? "";
  const isActive = activeTab === id;
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isActive && panelRef.current) {
      // Trigger a frame-aligned resize notification so child viewports immediately redraw
      window.requestAnimationFrame(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }
  }, [isActive]);

  if (!isActive && !keepAlive) {
    return null;
  }

  return (
    <div
      ref={panelRef}
      role="tabpanel"
      aria-hidden={!isActive}
      className={`${isActive ? "space-y-4" : "hidden"} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
