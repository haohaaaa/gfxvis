# AGENTS.md

GFXVis:本地托管的图形学/可视化技术博客(Astro Node standalone 服务端 + 预渲染页面 + MDX + KaTeX + Shiki + Tailwind CSS v4 + React/Three.js)。

## 项目规则

- **可视化约定**:实现或修改可视化前先读 `docs/conventions.md`(坐标系与 `mathToWorld` 映射、方向与符号、记号与命名、渲染与交互约定)。
  - **KDE Breeze 统一机箱体系与交互 Island 规范**:
    - **机箱视窗外壳**: 交互 Island 统一遵循 KDE Plasma Breeze 机箱体系，顶层采用 `<AutoMath> > <ExpandableDemo id="..."> > <KdeWindowShell title="..." eyebrow="..." mark="..." modeTag="...">`；
    - **视口与控制插槽**: `display` 插槽承载主画布/视口（内部必须含 `relative overflow-hidden`、`<CanvasToolbar onReset={...} />` 及 `<CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />`，高度统一为 `h-[var(--demo-height,20rem)]` 或 3D `28rem`）；`controls` 插槽承载参数控制区（统一放入 `<div className="space-y-3">`，子面板使用 `<KdeCard title="..." variant="dense">` 分组，读数与状态监视统一使用 `<KdeReadout label=... value=... dense />`）；
    - **选项卡与复选框规范**: 严禁手写裸 `<button>` 配合自定义背景自制 Tab；**已彻底废除并严禁重新引入旧 `CapsuleTabs` 与旧 `Checkbox`**；模式/算法/视图切换**必须且只能使用 `<KdeTabs>`**（一级模式用默认 `size="sm"`，参数/细项用 `size="xs"`，options 为 `{ label, value }` 格式）；复选框**必须使用 `<KdeCheckbox>`**；数据场景预设统一使用 `<PresetSelector>`。技术细节以 `docs/conventions.md` 为唯一权威来源。
- **KaTeX 数学渲染**:正文公式由自写插件 `src/plugins/remark-katex.ts` 渲染(直接调用 katex 0.18.2),与 `BaseLayout.astro` 导入的 `katex/dist/katex.min.css` 同版本。**不要重新引入 `rehype-katex`**——它已停更且锁定 `katex ^0.16.0`,曾因类名与 0.18 CSS 不匹配导致 `≠` 显示成 `/=`。详见 `docs/katex-version-mismatch.md`。
  - **AutoMath 自动公式渲染**: 交互 Island 顶层统一使用 `<AutoMath>` 包裹一次，组件内部所有 JSX 节点、自定义属性（如 `ParamSlider label="$x$"`）及字符串均可直接写 `$ ... $` / `$$ ... $$`，自动完成 KaTeX 解析并自带全局渲染缓存。严禁在 Island 内部碎片化嵌套多个 `<AutoMath>`。
    - **JS 表达式/字符串转义**: 在 JS 字符串（如 `{"$\\mathbf{v}$"}` 或 `` `$\\lambda = ${val}$` ``）中，反斜杠需转义为 `\\`；包含 `{...}` 或 `< 0` 的 TeX 公式在 JSX 文本中建议用字符串 `{"$...$"}` 包裹，避免 TSX 语法冲突。
    - **KaTeX 数学模式标点**: `$...$` / `$$...$$` 内的标点统一使用 ASCII（如 `,`、`;`），包括 `\text{...}` 里的标点；不要在公式中使用全角 `，`、`；` 等符号，以免触发 KaTeX `unicodeTextInMathMode` 警告。中文正文仍按全角标点规范书写。
- **MDX 排版**:
  - **加粗与重点统一使用 `<strong>` 标签（严禁使用 `**...**`）**: 文章中一律使用标准 HTML/MDX 标签 `<strong>重点内容</strong>` 进行加粗强调，**严禁使用 Markdown `**...**`**。这消除了 CommonMark 规范中由内外侧空格、中英文紧贴或全角引号引发的定界符误配与乱码风险。CI 及 `pnpm validate` 会自动执行 `scripts/format-bold.ts --check` 拦截裸 `**`。
  - **标点规范**: **中文语句用全角标点**（`,;:?!` → `，；：？！`、引号用 `“”`），公式/代码/Markdown 链接保持英文标点。详见 `docs/conventions.md`"记号与命名"。
- **TypeScript 优先**:所有支持 TypeScript 的文件必须使用 `.ts` / `.tsx`,不允许 `.js` / `.mjs` / `.cjs` 变体。
  - 配置文件同样适用:`astro.config.ts`、`biome.json`(不得写成 `.mjs` / `.js`)。
  - 例外:无 TS 形态的格式(JSON/YAML/纯文本,如 `package.json`、`tsconfig.json`、`biome.json`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`、`.gitignore`、`.prettierignore`),以及 `.astro`、`.mdx`、`.css` 等框架/内容/样式文件。
- **按需具名导入（禁止整包/默认导入大对象）**:
  - 引入模块（特别是 Node.js 内置模块如 `node:fs`、`node:http`、`node:path` 等或第三方库）时，**禁止使用 `import http from "node:http"`、`import fs from "node:fs"` 这种默认全量导入**；
  - **必须按需具名导入具体使用的接口**，如 `import { createServer } from "node:http"`、`import { readFile, writeFile } from "node:fs/promises"`、`import { join, dirname } from "node:path"`。用到哪些就导入哪些，保持依赖树最小化和代码意图清晰。
- **测试与 Island 截图规范 (Playwright E2E & Visual Inspection)**:
  - 统一使用 `e2e/utils/screenshot.ts` 的 `captureIsland(page, name, options)` 原语；
  - **默认零截图开销**：常规测试 `pnpm test:e2e` 默认不会生成任何截图，仅做可见性与运行时断言；
  - **按运行时间戳隔离目录**：开启截图模式时，截图统一按执行启动时间分目录存放在 `.playwright-screenshots/<YYYY-MM-DD_HH-mm-ss>/<subDir>/<name>.png`，避免历次运行相互覆盖；
  - **Agent 截图查阅边界**：**严禁在日常开发中主动无端运行/查阅截图**。**仅当用户明确报告存在渲染/排版/视觉 Bug，或明确要求查看最终渲染效果时**，才运行 `pnpm test:screenshots`（或 `SCREENSHOT=1 playwright test <spec-path>`），并通过 `view_file` 查阅 `.playwright-screenshots/` 下生成的图片进行视觉验证。

## 常用命令

- `pnpm dev` — 本地开发
- `pnpm build` — 校验并构建预渲染页面与 Node standalone 服务端到 `dist/`
- `pnpm lint` — Biome 检查
- `pnpm format` / `pnpm format:check` — 加粗规范迁移/检查 + Biome 格式化代码与 Astro + Prettier 格式化 Markdown、MDX、CSS 和 YAML
- `pnpm format:bold` / `pnpm format:bold:check` — 独立执行将 `**` 迁移为 `<strong>` / 检查是否存在违规裸 `**`
- `pnpm test:e2e` — 运行 Playwright E2E 冒烟与交互测试（默认无截图）
- `pnpm test:screenshots` — 运行测试并生成 Island 截图至 `.playwright-screenshots/`（仅在排查视觉 Bug 时按需使用）
