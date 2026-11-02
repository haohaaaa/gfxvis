# AGENTS.md

GFXVis: 本地托管的图形学与数学可视化技术博客（Astro Node standalone 服务端 + 预渲染页面 + MDX + KaTeX + Shiki + Tailwind CSS v4 + React Islands + Three.js）。

本文档是 AI Agent 与开发者的**核心工程红线、禁令清单与最高决策入口**。实现细节与设计系统契约一律以 [`docs/conventions.md`](file:///Users/xachey/Projects/gfxvis/docs/conventions.md) 为唯一权威真值源，严禁双向重复维护。

---

## 核心工程红线与禁令（Hard Invariants）

1. **可视化唯一权威源**：
   - 实现或修改任何可视化组件、3D 场景或数学演示前，**必须先阅读 [`docs/conventions.md`](file:///Users/xachey/Projects/gfxvis/docs/conventions.md)**（数学右手系与 `mathToWorld` 空间映射、KDE Breeze 机箱视窗体系、Scene2D 管线与 Transform Gizmo 交互体系）；
   - 交互 Island 顶层统一使用 `<ExpandableDemo id="..."> > <KdeWindowShell title="..." eyebrow="..." mark="..." modeTag="...">`。`KdeWindowShell` 内部已内建 `<AutoMath>`，**外层严禁重复包裹 `<AutoMath>`**（仅无机箱的独立 SVG 图表顶层单层包裹）。

2. **严禁在 React Island 组件中使用原生 `<h1~h6>` 标签**：
   - Astro MDX SSR 会对所有原生标题自动执行 `rehype-slug` 注入服务端 `id` 属性，与客户端虚拟 DOM 不一致，导致致命的 React Hydration Mismatch 并破坏 DOM patch up；
   - 组件内部所有标题一律使用 `<span role="heading" aria-level={...}>`；
   - `scripts/check-headings.ts` 已内置静态语法拦截规则（`no-raw-heading-in-island`），`pnpm validate` 会自动阻断任何违规原生标题。

3. **控件与交互规范**：
   - 模式/视图/算法切换**必须且只能使用 `<KdeTabs>`**（一级模态 `size="sm"`，参数细项 `size="xs"`）；
   - 布尔开关**必须使用 `<KdeCheckbox>`**；数据预设统一使用 `<PresetSelector>`；
   - **严禁手写裸 `<button>` 配合自定义背景自制 Tab**，**已彻底废除并严禁重新引入旧 `CapsuleTabs` 与旧 `Checkbox`**。

4. **KaTeX 数学渲染**：
   - 正文公式由自写插件 `src/plugins/remark-katex.ts` 渲染（直接调用 KaTeX 0.18.2），与 `BaseLayout.astro` 导入的 `katex.min.css` 严格同版本；
   - **严禁重新引入 `rehype-katex`**（其已停更且锁定 `katex ^0.16.0`，曾导致 `≠` 错显为 `/=`，详见 [`docs/katex-version-mismatch.md`](file:///Users/xachey/Projects/gfxvis/docs/katex-version-mismatch.md)）。

5. **MDX 排版与标点铁律**：
   - **加粗一律使用 `<strong>重点</strong>`（严禁使用 `**...**`）**：彻底消除 CommonMark 在中英文混排、全角符号与空格交叉时的定界符错乱；CI 与 `pnpm validate`（`scripts/format-bold.ts --check`）自动拦截裸 `**`；
   - **中文语句一律使用全角标点**（`，；：？！` 与成对双引号 `“”`），公式、代码与 Markdown 链接保持英文半角标点。

6. **全量 TypeScript 优先**：
   - 所有支持 TypeScript 的文件（含配置文件 `astro.config.ts`、`biome.json`、脚本 `scripts/*.ts`）必须使用 `.ts` / `.tsx`，严禁 `.js` / `.mjs` / `.cjs` 变体。

7. **按需具名导入（禁止全包/默认导入）**：
   - 引入模块（特别是 Node.js 内置模块如 `node:fs/promises`、`node:path` 等或第三方大库）时，**禁止使用 `import fs from "node:fs"` 等全量默认导入**；必须按需具名导入具体使用的接口（如 `import { readFile } from "node:fs/promises"`），保持最小依赖树。

8. **测试与截图开销纪律（Playwright E2E & Visual Inspection）**：
   - 常规测试 `pnpm test:e2e` **默认零截图开销**，仅执行功能、可见性与运行时控制台断言；
   - **Agent 截图查阅边界**：**严禁在日常开发中主动无端运行/查阅截图**。**仅当用户明确报告存在渲染/排版/视觉 Bug，或明确要求查看最终渲染效果时**，才运行 `pnpm test:screenshots` 并通过 `read_file` 查阅图片进行针对性核对。

---

## 常用命令流水线

```bash
pnpm dev              # 本地开发服务 http://localhost:51730
pnpm validate         # 核心质量门禁：类型检查 + Biome Lint + 标题规则检查 + 加粗规范检查
pnpm build            # 执行 validate 并构建预渲染页面与 Node standalone 服务端到 dist/
pnpm test:e2e         # 运行全站 Playwright 端到端交互与冒烟测试（默认无截图，快速回归）
pnpm test:screenshots # 生成并捕获视口与 Island 截图至 .playwright-screenshots/（排查视觉 Bug 时按需使用）
pnpm format           # 执行自动修复：加粗迁移至 <strong> + Biome 格式化代码 + Prettier 格式化 MD/MDX/CSS
pnpm format:bold      # 独立执行 Markdown ** 语法向 <strong> 标签的迁移
```
