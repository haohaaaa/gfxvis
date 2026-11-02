# GFXVis

GFXVis 是一个本地托管的计算机图形学、数学与系统级程序设计**交互式可视化技术博客**。

全站内容页面在构建阶段进行静态预渲染（SSG），配合 Node.js standalone 服务端，提供高帧率 WebGL 3D 渲染、2D 交互几何探针、可拖拽参数流形以及沉浸式代码与代数结构演示。

---

## 技术架构

- **框架与构建**：Astro（Node.js standalone 服务端 + 静态预渲染页面）+ 全量 TypeScript
- **排版与内容**：MDX + KaTeX（原生渲染插件）+ Shiki 代码高亮
- **样式与设计系统**：Tailwind CSS v4 + KDE Plasma Breeze 统一机箱视窗体系
- **可视化引擎**：React 19 Islands + Three.js + HTML5 Canvas（Retina 像素级高分屏适配）
- **质量保障体系**：Biome + Prettier + TypeScript + Playwright E2E 自动化测试管线

---

## 快速开始

```bash
# 1. 安装项目依赖
pnpm install

# 2. 启动本地开发服务器（支持 HMR）
pnpm dev
# 访问地址：http://localhost:51730

# 3. 运行静态语法与类型门禁校验
pnpm validate

# 4. 构建预渲染页面与服务端产物至 dist/
pnpm build

# 5. 预览生产环境 Node standalone 构建产物
pnpm preview
```

---

## 常用命令与质量门禁

| 命令                    | 说明                                                                                   |
| :---------------------- | :------------------------------------------------------------------------------------- |
| `pnpm dev`              | 启动本地热重载开发服务器（默认端口 51730）                                             |
| `pnpm validate`         | **核心质量门禁**：执行 TypeScript 类型检查、Biome Lint、文档标题规则检查与加粗规范检查 |
| `pnpm build`            | 校验代码并构建生产环境预渲染静态页面与 Node standalone 服务端                          |
| `pnpm preview`          | 启动本地生产预览服务器                                                                 |
| `pnpm test:e2e`         | 运行全站 Playwright 端到端交互与功能冒烟测试（默认零截图，快速回归）                   |
| `pnpm test:screenshots` | 开启视觉截图模式运行测试，捕获 Island 渲染图片至 `.playwright-screenshots/`            |
| `pnpm format`           | 运行自动代码与排版格式化（迁移 Markdown `**` 至 `<strong>` + Biome + Prettier）        |
| `pnpm format:check`     | 检查全站代码与 Markdown 文档格式规范                                                   |
| `pnpm format:bold`      | 独立执行 Markdown `**` 语法向标准 `<strong>` 标签的自动化迁移                          |

---

## 目录结构图谱

```text
gfxvis/
├── docs/                       # 核心技术规范与架构设计文档
│   ├── conventions.md          # 全站唯一可视化、数学体系与设计系统契约手册
│   └── katex-version-mismatch.md # KaTeX 依赖与样式版本对齐说明
├── src/
│   ├── content/posts/          # 技术文章（按学科主题组织）
│   │   ├── linear-algebra/     # 线性代数、矩阵分解、解集流形
│   │   ├── calculus/           # 多元微积分、微分几何、切空间、场论
│   │   ├── discrete-math/      # 离散数学、集合论、二元关系、图论
│   │   ├── type-systems/       # 类型论、系统 F、代数效应、Curry-Howard 同构
│   │   └── compilers/          # 体系结构与系统底层仿真
│   ├── visualizations/         # 可视化与几何核心层
│   │   ├── core/2d/            # 2D Canvas 画布控制器、Plot2D 坐标系、Scene2D 管线
│   │   ├── core/3d/            # Three.js 视口基础、相机与 OrbitControls、mathToWorld 映射
│   │   ├── core/common/        # 采样插值、数值分析、Transform Gizmo 交互动力学
│   │   └── scenes/             # 预设数学场与几何场景模型定义
│   ├── components/             # React 交互 Island 与 UI 组件
│   │   ├── framework/          # 框架级基础设施（CanvasViewport / Viewer3DViewport / KdeWindowShell / KdeTabs / ParamSlider）
│   │   ├── demos/              # 复杂多模态交互 Demo（配合文章演练）
│   │   └── diagrams/           # 原生解释性 SVG / Canvas 结构图谱
│   └── styles/                 # 全局样式与 Tailwind CSS v4 主题 Token
├── e2e/                        # Playwright 端到端自动化交互与视觉回归测试
├── scripts/                    # 工程校验辅助脚本（check-headings / format-bold / preview-server 等）
└── public/models/              # 3D 几何网格与模型资源（如 bunny.glb、helmet.glb 等）
```

---

## 创作技术文章

1. **新建文章**：在 `src/content/posts/<category>/<slug>.mdx` 下创建文件。
2. **文章 Frontmatter 声明**：
   ```yaml
   ---
   title: "文章标题"
   description: "文章精确导读与几何物理直觉简述（1-2句）"
   date: "YYYY-MM-DD"
   tags: ["linear-algebra", "visualization", "matrix"]
   # draft: true # 草稿模式，构建时不发布
   ---
   ```
3. **数学公式书写**：正文行内公式写 `$ ... $`，块级公式写 `$$ ... $$`；KaTeX 插件会自动完成极速服务端渲染。
4. **引入交互组件**：
   ```mdx
   import LinearSystemsDemo from "../../../components/demos/LinearSystemsDemo";

   <LinearSystemsDemo client:visible />
   ```
5. **排版规范**：加粗强调**必须且只能使用 `<strong>重点内容</strong>`**（严禁使用裸 `**...**`）；中文语句必须使用全角标点符号。

---

## 规范与文档导航

- [数学、图形学与设计系统契约手册 (`docs/conventions.md`)](file:///Users/xachey/Projects/gfxvis/docs/conventions.md) — 详尽查阅右手系空间映射、`mathToWorld`、KDE Breeze 机箱视窗体系、`CanvasViewport` / `Viewer3DViewport` 规范、`Scene2D` 管线与组件防呆纪律。
- [AI 智能体开发规则与核心红线 (`AGENTS.md`)](file:///Users/xachey/Projects/gfxvis/AGENTS.md) — 查阅 AI Agent 与开发者的最高工程红线清单、质量门禁与工作流指令。
- [KaTeX 版本对齐报告 (`docs/katex-version-mismatch.md`)](file:///Users/xachey/Projects/gfxvis/docs/katex-version-mismatch.md) — 查阅自写 KaTeX 渲染插件历史与依赖锁定背景。
