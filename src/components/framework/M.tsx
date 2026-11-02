import type React from "react";
import { renderKaTeXToString } from "./AutoMath";

export interface MathProps {
  /** TeX formula string passed as children (e.g. <M>x = 2</M> or <M>$x = 2$</M>) */
  children?: React.ReactNode;
  /** TeX formula string passed as prop (e.g. <M math="R_1 \leftarrow R_1 + \frac13R_2'" />) */
  math?: string;
  /** Whether to render as block display math ($$ ... $$) */
  block?: boolean;
  /** Additional CSS class names */
  className?: string;
}

/**
 * M (Math): Atomic, zero-overhead KaTeX formula rendering component.
 *
 * Designed for precise formula rendering in control labels, SVG text, readouts,
 * and anywhere VDOM cloning is undesirable. Zero AST traversal, zero props tampering,
 * and immune to JSX line-split issues.
 */
export function M({
  children,
  math,
  block = false,
  className = "",
}: MathProps): React.JSX.Element {
  let tex = math;

  if (tex === undefined) {
    if (typeof children === "string") {
      tex = children.trim();
      // Strip optional surrounding single ($) or double ($$) dollar signs
      if (tex.startsWith("$$") && tex.endsWith("$$") && tex.length >= 4) {
        tex = tex.slice(2, -2).trim();
      } else if (tex.startsWith("$") && tex.endsWith("$") && tex.length >= 2) {
        tex = tex.slice(1, -1).trim();
      }
    } else if (typeof children === "number") {
      tex = String(children);
    } else {
      tex = "";
    }
  }

  const html = renderKaTeXToString(tex, block);

  if (block) {
    return (
      <div
        className={`katex-display ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      className={`katex-inline ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default M;
