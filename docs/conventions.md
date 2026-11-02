# 数学、图形学与设计系统契约手册

本文件是 GFXVis 全站可视化、数学建模、交互组件设计与内容排版的**唯一权威规范手册（Single Source of Truth）**。在实现新场景、编写交互组件或撰写技术文章前，请严格遵从本手册各项契约。

---

## 一、数学底座与空间映射

### 1.1 坐标系与 3D 世界映射

- **数学空间约定**：采用标准右手坐标系，**$z$ 轴朝上**。所有数学对象（曲面、空间曲线、切平面、向量场等）一律在纯数学坐标系 $(x, y, z)$ 中定义（如曲面方程 $z = f(x, y)$）。
- **Three.js 世界约定**：采用 Three.js 原生右手坐标系，**$y$ 轴朝上**。相机统一使用 `createCamera` 并配置带阻尼的 `OrbitControls`。
- **唯一保右手系映射**：
  数学坐标进入 Three.js 渲染世界时，必须且只能经过 [`src/visualizations/core/3d/coords.ts`](file:///Users/xachey/Projects/gfxvis/src/visualizations/core/3d/coords.ts) 中的 `mathToWorld` 映射：
  $$\operatorname{mathToWorld}(x, y, z) = (x, z, -y)$$
  - 该映射矩阵的行列式 $\det = +1$，严格保持手性不变；将数学的 $+z$（向上）映射为渲染世界的 $+y$（向上）。
  - 点坐标与方向向量共用同一线性映射。
  - 射线拾取与逆向投影反向换算：数学 $x = \text{world } x$，数学 $y = -\text{world } z$，数学 $z = \text{world } y$。
  - **严禁在具体场景代码中手写等价的坐标轴调换**。

### 1.2 2D 画布坐标系统

- 2D 画布统一采用数学平面坐标系，**屏幕向上为 $+y$ 方向**。
- 坐标变换与屏幕像素映射统一经由 [`src/visualizations/core/2d/plot2d.ts`](file:///Users/xachey/Projects/gfxvis/src/visualizations/core/2d/plot2d.ts) 的 `createPlot2D`。
- **等比例轴（Equal Aspect Ratio）**：2D 视图默认强制开启等比例尺（`equalScale = true`），视口恒为居中矩形，确保 $x$ 轴与 $y$ 轴每单位像素严格一致，圆不会被拉伸成椭圆；缩放时按统一比例系数同步作用于两轴。

### 1.3 方向向量、场算子与轴色规范

- **曲面法向**：曲面切平面由切向量 $\mathbf{r}_x = (1, 0, f_x)^T$ 与 $\mathbf{r}_y = (0, 1, f_y)^T$ 张成，外法向统一取上指向：
  $$\mathbf{n} = \mathbf{r}_x \times \mathbf{r}_y = (-f_x, -f_y, 1)^T, \quad n_z > 0$$
- **微分算子符号**：
  - 二维旋度以**逆时针旋转为正向**（$\nabla \times \mathbf{F} > 0$ 表示逆时针旋涡）；
  - 散度符号：$\nabla \cdot \mathbf{F} > 0$ 为正源（Source），$\nabla \cdot \mathbf{F} < 0$ 为负汇（Sink）；
  - 梯度算子 $\nabla \varphi$ 恒指向函数值上升最陡峭的方向。
- **3D 曲面梯度箭头模式**：
  - **水平模式（默认）**：绘制纯二维梯度投影 $(\varphi_x, \varphi_y, 0)$，位于基准面或水平参考切面上；
  - **曲面切向模式**：绘制沿三维曲面最陡上升切线方向 $(\varphi_x, \varphi_y, |\nabla \varphi|^2)$，物理切于曲面表面；当驻点处 $|\nabla \varphi| = 0$ 时自动隐藏。
- **坐标轴着色标准**：
  - **3D 轴色**：严格遵循图形学经典 RGB 约定——$x$ 轴为**红色（Red）**、$y$ 轴为**绿色（Green）**、$z$ 轴为**蓝色（Blue）**；
  - **2D 轴色**：一律使用 CSS 变量语义 Token（`theme.border`、`theme.ink`、`theme.muted`），禁止硬编码固定色值。

---

## 二、KDE Plasma Breeze 机箱体系与交互规范

GFXVis 交互 Island 整体遵循 **KDE Plasma Breeze 桌面视窗体系**，提供严谨、连贯的桌面级沉浸式交互质感。

### 2.1 机箱视窗外壳 `<KdeWindowShell>`

- **统一顶层结构**：全站交互 Island 顶层结构统一为：
  ```tsx
  <ExpandableDemo id="my-interactive-demo">
    <KdeWindowShell
      title="线性方程组几何：行列视角与解集流形"
      eyebrow="LINEAR ALGEBRA · ROW & COLUMN PICTURE"
      mark="SYS-01"
      modeTag="超平面交集"
      layoutPreset="bottom-split"
      display={/* 主视口区域 */}
      controls={/* 参数与读数控制区 */}
    />
  </ExpandableDemo>
  ```
- **插槽分工契约**：
  - **`display` 插槽**：承载主画布/视口容器。内部必须具备 `relative overflow-hidden`，高度统一绑定 `h-[var(--demo-height,20rem)]`（2D）或 `28rem`（3D）。
  - **`controls` 插槽**：承载参数调节、场景预设与状态监控。统一放置在 `<div className="space-y-3">` 中，子面板使用 `<KdeCard title="..." variant="dense">` 分组，读数展示统一使用 `<KdeReadout label=... value=... dense />`。
  - **`layoutPreset` 布局预设**：支持 `bottom-split`（底部左右分屏）、`side-right`（右侧控制侧边栏）、`dual-view`（双主视口并列）、`dense-dock`（紧凑控制坞）等标准布局。

### 2.2 标准化视口架构

严禁在业务组件中手写底层的原生 `<canvas>` 或裸 `new THREE.WebGLRenderer()`，必须统一使用以下内聚视口组件：

1. **2D 画布视口 `<CanvasViewport>`**：
   - 封装了暗色机箱底层、Retina 高分屏像素比自适应、主题监听与自动重绘调度。
   - 内部已内置挂耳式 `<CanvasToolbar>`（复位视野）与贴底高度伸缩手柄 `<CanvasResizer>`。
   - 采用 Callback Ref 与 `ResizeObserver`，彻底杜绝切 Tab 或 DOM 隐藏后画板死黑问题。
2. **3D 画布视口 `<Viewer3DViewport>`**：
   - 封装了 WebGL 渲染器、带阻尼 OrbitControls、挂耳式 `<CanvasToolbar>` 与伸缩手柄。
   - 内置 `IntersectionObserver` 离屏节能调度（离开视口自动暂停 RAF 循环）。
   - 提供 `<Viewer3DViewport.Pin>` 硬件加速 DOM 复合定位机制，避免在 RAF 循环中调用 React `setState` 触发整组件高频重渲染。
3. **声明式画布覆盖层 `<CanvasOverlay>`**：
   - 画布内部的状态读数、图例与代数方程必须使用 `<CanvasOverlay position="top-left" | "bottom-left" | ...>` 呈现。
   - 内置暗色主题作用域，并自动计算边距避让右上角 Toolbar 与贴底 Resizer 手柄。
4. **2D 高阶场景管线 `Scene2D`**：
   - 在 2D 几何演示中，优先通过 `Scene2D` 声明几何实体：`scene.addAxes()`、`scene.addLine()`、`scene.addVector()` 与 `scene.addPoint()`。
   - `addVector` 原生支持 `{ draggable: true, onDrag: (tip) => ... }`，自动生成屏幕像素级（`hitRadiusPx = 24`）磁吸手柄与标签碰撞避让。

### 2.3 控件与输入规范

- **选项卡切换 `<KdeTabs>`**：
  - **严禁手写裸 `<button>` 配合自定义背景自制 Tab**；
  - **已彻底废除并严禁重新引入旧 `CapsuleTabs`**；
  - 核心模态/算法切换使用默认 `size="sm"`，参数细项/视图模式使用 `size="xs"`；
  - 选项格式统一为 `{ id, label, icon?, badge? }`。
- **保活选项卡容器 `<KdeTabPanel>`**：
  - 配合 `<KdeTabs>` 使用，通过 CSS `hidden` 保活 DOM 节点并于激活时调度重绘，**严禁使用三元条件渲染直接销毁画布 DOM**。
- **复选框 `<KdeCheckbox>`**：
  - **已彻底废除旧 `Checkbox`**，布尔开关一律使用 `<KdeCheckbox checked={...} onChange={...} label="..." />`。
- **数据场景预设 `<PresetSelector>`**：
  - 矩阵、函数、几何图形等典型预设选择统一使用 `<PresetSelector>`。

### 2.4 Transform Gizmo 拖拽体系（2D & 3D 对偶）

- 交互常数由 [`src/visualizations/core/common/interaction.ts`](file:///Users/xachey/Projects/gfxvis/src/visualizations/core/common/interaction.ts) 统一提供：`FADE_DELAY_MS = 1200`（延时 1.2s）、`FADE_DURATION_MS = 500`（渐隐 0.5s）、`FADE_EASE_EXPONENT = 1.2`。
- **视觉层级**：数学点与向量端点始终 100% 常驻渲染；平移轴向与平面控件在鼠标靠近时平滑淡入，移开后延时淡出；当前抓取的轴/手柄呈现强高亮（`#facc15` 金色），未激活手柄适度暗化。

---

## 三、数学公式与组件架构约束

### 3.1 双轨公式渲染体系（`<M>` 与 `<AutoMath>`）

- <strong>双轨渲染分工</strong>：
  - <strong>原子公式组件 `<M>`</strong>（`import { M } from "../framework/AutoMath"` 或 `import M from "../framework/M"`）：<strong>零 VDOM 遍历、零多余包装、直接基于 KaTeX 字符串缓存极速渲染</strong>。适用于单行公式、行内符号、SVG 标签、参数滑块 Label（如 `<M math="x = 2" />` 或 `<M>x = 2</M>`）。
  - <strong>文本容器组件 `<AutoMath>`</strong>：适用于段落说明、问答卡片等大段混合文本，自动按 `$ ... $` / `$$ ... $$` 分词并渲染行内或块级公式。
- <strong>组件防火墙（Component Barrier）铁律</strong>：`<AutoMath>` 严格恪守组件边界，遇到任何自定义 React 组件（`typeof type !== "string"`）立即短路原样返回，<strong>严禁通过 `Object.entries(props)` 递归遍历修改组件 Props</strong>（彻底杜绝破坏数字数组、权重序列与事件回调等非 React 节点数据模型）。
- <strong>机箱视窗完全隔离</strong>：`<KdeWindowShell>` 仅在 `title`、`controls` 与 `bottomContent` 等文本插槽局部应用 `<AutoMath>`，对核心 `display` 视口（Canvas/Three.js/复杂 SVG）实施完全隔离，绝不侵入视口层级。
- <strong>机箱 Island 无需外层包裹</strong>：组件顶层使用 `<KdeWindowShell>` 时，<strong>最外层严禁重复包裹 `<AutoMath>`</strong>。
- <strong>独立 SVG 图表单层包裹</strong>：对于不带 `KdeWindowShell` 机箱外壳的独立 SVG 结构图，仅在组件顶层包裹单一 `<AutoMath>` 一次。

### 3.2 严禁在 React Island 中使用原生 `<h1~h6>` 标题

- **故障原理**：在 Astro MDX SSR 预渲染阶段，Markdown 管线（`rehype-slug`）会自动对整篇文章（包含嵌入的 JSX）中的原生 `<h1>~<h6>` 标题注入服务端 `id` 属性；而客户端 React 挂载（Hydration）时不带该属性，直接引发严重的水合失配（React Hydration Mismatch）并放弃 DOM patch up。
- **规范标准**：交互组件内部的所有标题、子标题、卡片头部一律使用无水合副作用的标准无障碍标签：
  ```tsx
  <span className="text-sm font-bold text-ink" role="heading" aria-level={3}>
    窗口标题
  </span>
  ```
- **自动化拦截**：`scripts/check-headings.ts` 已内置静态语法拦截规则（`no-raw-heading-in-island`），任何误写的原生标题均会在 `pnpm validate` 时直接阻断构建。

### 3.3 公式与转义书写纪律

- **JS 字符串转义**：在 JS 模板字符串（如 `{"$\\mathbf{v}$"}` 或 `` `$\\lambda = ${val}$` ``）中，反斜杠需转义为 `\\`；包含 `{...}` 或 `< 0` 的 TeX 公式在 JSX 文本中建议用字符串 `{"$...$"}` 包裹，避免 TSX 语法冲突。
- **KaTeX 数学模式 ASCII 标点**：`$...$` / `$$...$$` 公式内部的标点符号必须统一使用英文半角 ASCII（如 `,`、`;`），包括 `\text{...}` 内部；严禁在公式模式中使用全角中文标点，避免触发 KaTeX `unicodeTextInMathMode` 警告。

---

## 四、内容排版与写作规范

### 4.1 加粗与强调铁律：统一使用 `<strong>`

- 文章正文中进行加粗强调时，**一律使用标准 HTML/MDX 标签 `<strong>重点内容</strong>`**，**严禁使用 Markdown `**...**`**。
- **原因**：CommonMark 规范中由内外侧空格、中英文紧贴或全角标点混排引发的定界符误配与乱码风险彻底消除。
- **门禁校验**：CI 与 `pnpm validate` 会自动执行 `scripts/format-bold.ts --check`，检测到裸 `**` 将直接报错拦截；可通过 `pnpm format:bold` 自动完成迁移。

### 4.2 标点与排版间距规范

- **中文正文一律使用全角标点**：逗号、分号、冒号、问号、感叹号分别使用 `，`、`；`、`：`、`？`、`！`；中文双引号使用成对的 `“”`（严禁使用英文直引号 `"`）；中文说明括号使用 `（）`。
- **公式、代码与 Markdown 链接保持英文半角**：Markdown 链接 `[文字](url)`、行内代码 `` `code` ``、英文术语与数字内部一律保持半角标点（如 `rank(A)`、`Vector3(x, y, z)`）。
- **中英文与数字间距**：汉字与英文字符/数字之间保持自然空格（如 `2D 视口`、`利用 Three.js 进行渲染`）。

### 4.3 文章 Frontmatter 与分类体系

文章统一放置在 `src/content/posts/<category>/<slug>.mdx`，遵循以下核心学科分类：

- `linear-algebra/`：线性代数、矩阵分解、谱理论、四女子空间与解集流形；
- `calculus/`：多元微积分、微分几何、切空间、梯度/旋度场与积分变换；
- `discrete-math/`：离散数学、集合论、二元关系、图论基础与置换组合；
- `type-systems/`：类型论、系统 F 多态、代数效应、依赖类型与 Curry-Howard 同构；
- `compilers/`：编译技术、计算机体系结构与系统底层仿真。

Frontmatter 必须完整提供：

```yaml
---
title: "文章标题"
description: "文章精确导读与几何物理直觉简述（1-2句）"
date: "YYYY-MM-DD"
tags: ["linear-algebra", "visualization", "matrix"]
# draft: true  # 仅草稿时保留
---
```
