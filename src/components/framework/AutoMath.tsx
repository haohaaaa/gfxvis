import React from "react";
import katex from "katex";
import { M, type MathProps } from "./M";

export { M, type MathProps };

const mathCache = new Map<string, string>();

/**
 * 缓存渲染 KaTeX 字符串为 HTML
 */
export function renderKaTeXToString(tex: string, displayMode = false): string {
  const cacheKey = (displayMode ? "D:" : "I:") + tex;
  const cached = mathCache.get(cacheKey);
  if (cached !== undefined) {
    return cached;
  }
  try {
    const rendered = katex.renderToString(tex, {
      throwOnError: false,
      displayMode,
      output: "html",
    });
    mathCache.set(cacheKey, rendered);
    return rendered;
  } catch {
    return tex;
  }
}

/**
 * 匹配 $$...$$ (块级公式)、$...$ (行内公式) 以及 \$ (转义美元符号)
 */
const MATH_TOKEN_REGEX = /(\$\$[\s\S]+?\$\$|\$(?!\$)(?:\\\$|[^$])+\$|\\\$)/g;

/**
 * 将含有 $...$ 或 $$...$$ 的文本字符串解析为包含纯文本与 KaTeX HTML 节点的 React 数组
 */
export function parseMathText(
  text: string,
  keyPrefix = "math",
): React.ReactNode[] {
  if (!text || (!text.includes("$") && !text.includes("\\$"))) {
    return [text];
  }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // 必须重置 regex.lastIndex，因为这是模块级正则
  MATH_TOKEN_REGEX.lastIndex = 0;

  while ((match = MATH_TOKEN_REGEX.exec(text)) !== null) {
    const matchStart = match.index;
    const matchStr = match[0];

    // 压入匹配项之前的普通文本
    if (matchStart > lastIndex) {
      parts.push(
        <React.Fragment key={`${keyPrefix}-txt-${lastIndex}`}>
          {text.slice(lastIndex, matchStart)}
        </React.Fragment>,
      );
    }
    lastIndex = MATH_TOKEN_REGEX.lastIndex;

    // 1. 处理转义美元符 \$ -> 输出单个字面量 $
    if (matchStr === "\\$") {
      parts.push(
        <React.Fragment key={`${keyPrefix}-esc-${matchStart}`}>
          $
        </React.Fragment>,
      );
      continue;
    }

    // 2. 处理块级公式 $$...$$
    if (matchStr.startsWith("$$") && matchStr.endsWith("$$")) {
      const tex = matchStr.slice(2, -2).trim();
      const html = renderKaTeXToString(tex, true);
      parts.push(
        <span
          key={`${keyPrefix}-block-${matchStart}`}
          className="katex-display"
          dangerouslySetInnerHTML={{ __html: html }}
        />,
      );
      continue;
    }

    // 3. 处理行内公式 $...$
    if (matchStr.startsWith("$") && matchStr.endsWith("$")) {
      const tex = matchStr.slice(1, -1).trim();
      const html = renderKaTeXToString(tex, false);
      parts.push(
        <span
          key={`${keyPrefix}-inline-${matchStart}`}
          className="katex-inline"
          dangerouslySetInnerHTML={{ __html: html }}
        />,
      );
      continue;
    }

    // 兜底：未识别则作为普通文本
    parts.push(
      <React.Fragment key={`${keyPrefix}-raw-${matchStart}`}>
        {matchStr}
      </React.Fragment>,
    );
  }

  // 剩余末尾文本
  if (lastIndex < text.length) {
    parts.push(
      <React.Fragment key={`${keyPrefix}-end-${lastIndex}`}>
        {text.slice(lastIndex)}
      </React.Fragment>,
    );
  }

  return parts;
}

const SKIP_TAGS = new Set(["code", "pre", "script", "style", "svg", "math"]);

/**
 * 递归遍历并转换 React 子节点中的纯文本为 KaTeX 节点。
 *
 * 核心安全准则（Component Barrier）：
 * 1. 纯文本 / 字符串：正常解析并转换为 KaTeX 渲染节点；
 * 2. 纯数值 / 布尔 / 空值：原样返回，绝对不包装多余 Fragment 或修改数据类型；
 * 3. 数组（Array）：递归处理各子项，对元素补齐必要 key；
 * 4. React 片段（Fragment）：仅递归处理其 children；
 * 5. 自定义 React 组件（typeof type !== "string"）：立即短路原样返回！绝对不穿透克隆其 props，避免破坏数据模型；
 * 6. 原生 DOM 标签（typeof type === "string"）：仅递归处理其 props.children，绝不修改其他 props。
 */
export function transformMathChildren(
  children: React.ReactNode,
  keyPrefix = "am",
): React.ReactNode {
  if (typeof children === "string") {
    const parsed = parseMathText(children, keyPrefix);
    if (parsed.length === 1) return parsed[0];
    return <React.Fragment key={keyPrefix}>{parsed}</React.Fragment>;
  }

  if (
    typeof children === "number" ||
    typeof children === "boolean" ||
    children === null ||
    children === undefined
  ) {
    return children;
  }

  if (Array.isArray(children)) {
    let hasChanges = false;
    const mapped = children.map((child, index) => {
      const fallbackKey = `${keyPrefix}-${index}`;
      const transformed = transformMathChildren(child, fallbackKey);

      if (transformed !== child) {
        hasChanges = true;
      }

      if (React.isValidElement(transformed) && transformed.key == null) {
        return React.cloneElement(transformed, { key: fallbackKey });
      }

      return transformed;
    });

    return hasChanges ? mapped : children;
  }

  if (React.isValidElement(children)) {
    const type = children.type;

    // 1. 如果是 Fragment，递归处理其 children
    if (type === React.Fragment) {
      const props = (children.props || {}) as { children?: React.ReactNode };
      if (!props.children) return children;
      const transformedChildren = transformMathChildren(
        props.children,
        keyPrefix,
      );
      if (transformedChildren !== props.children) {
        return React.cloneElement(children, undefined, transformedChildren);
      }
      return children;
    }

    // 2. 组件防火墙（Component Barrier）：
    // 若不是原生 DOM/SVG 字符串标签（说明是自定义组件，如 <KdeWindowShell>, <KdeCard>, <CanvasViewport> 等），
    // 绝对不穿透！立即原样返回，交由组件自身负责。杜绝任何跨组件 Props 篡改！
    if (typeof type !== "string") {
      return children;
    }

    // 3. 忽略特定不适合渲染公式的原生标签（代码块、脚本、底层原生 math 标签等）
    if (SKIP_TAGS.has(type.toLowerCase())) {
      return children;
    }

    const props = (children.props || {}) as Record<string, unknown>;

    // 4. 忽略带有显式 data-no-math 或已包含 KaTeX 渲染产物的节点
    if (
      Boolean(props["data-no-math"]) ||
      Boolean(props["dangerouslySetInnerHTML"]) ||
      (typeof props.className === "string" && props.className.includes("katex"))
    ) {
      return children;
    }

    // 5. 对原生 DOM 标签，仅处理其 children，绝不遍历修改原生属性！
    if (props.children !== undefined && props.children !== null) {
      const transformedChildren = transformMathChildren(
        props.children as React.ReactNode,
        `${keyPrefix}-c`,
      );
      if (transformedChildren !== props.children) {
        return React.cloneElement(children, undefined, transformedChildren);
      }
    }

    return children;
  }

  return children;
}

export interface AutoMathProps extends React.HTMLAttributes<HTMLElement> {
  /** 显式公式内容（优先使用） */
  math?: string;
  /** 是否以块级公式 (displayMode) 渲染 */
  block?: boolean;
  /** 作为自定义 HTML 标签包裹输出，例如 "span"、"div"、"p" 等 */
  as?: React.ElementType;
  /** 子节点 */
  children?: React.ReactNode;
}

/**
 * AutoMath 容器组件
 *
 * 适用于段落文本、几何解说等文字较多、混排行内公式的区域。
 * 具备组件防火墙，不会侵入下游任何自定义 React 组件或破坏数据 Props。
 */
export function AutoMath({
  math,
  block = false,
  as: Component,
  children,
  className,
  style,
  ...rest
}: AutoMathProps): React.JSX.Element {
  // 1. 显式 math 属性优先
  if (math !== undefined) {
    const html = renderKaTeXToString(math, block);
    const Container = Component || (block ? "div" : "span");
    return (
      <Container
        className={className}
        style={style}
        dangerouslySetInnerHTML={{ __html: html }}
        {...rest}
      />
    );
  }

  // 2. 自动解析 children
  const transformed = transformMathChildren(children);

  // 如果指定了包装标签或传入了 className/style 等 DOM 属性，则输出外层容器
  if (Component) {
    return (
      <Component className={className} style={style} {...rest}>
        {transformed}
      </Component>
    );
  }

  if (
    className !== undefined ||
    style !== undefined ||
    Object.keys(rest).length > 0
  ) {
    return (
      <span className={className} style={style} {...rest}>
        {transformed}
      </span>
    );
  }

  // 无额外属性时，若为单个有效 React 元素直接返回，否则以 Fragment 输出，零多余 DOM
  if (React.isValidElement(transformed)) {
    return transformed;
  }
  return <>{transformed}</>;
}

export { AutoMath as Math };
export default AutoMath;
