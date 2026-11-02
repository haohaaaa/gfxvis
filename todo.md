# TODO

首页换为 KDE 风格

度量空间

置换奇偶性, 逆序数

lattice

---

C++ trait 萃取 类型构造器, 特化白名单

template template parameter

Rust for<'a>

---

Category = Objects + Morphisms + Morphism composition​ + Identity morphisms

Set category: object -> set, morphism -> function, Morphism composition -> function composition, Identity morphism -> identity function

vector space over field category: object -> vector space, morphism -> linear map, composition -> matrix(linear map) composition, Identity morphism -> identity matrix(identity linear map)

Functor, rust functor example, option vec result map

monoid in set: (M, ★, e) e.g. (Z, +, 0) (string, concat, "") ({f | f: X -> X}, compose , id)

Monoidal Category: Category + ⊗ + I + α + λ + ρ + coherence​

monoid object: (M,μ,η)​ -> M, μ: M ⊗ M → M, η : 1 → M​

endofunctor

natural transformation

category of endofunctors

monoid object in that category

monad

---

Set -> Quiver -> Semicategory -> Category -> Monoidal Category

---

Set -> Magma -> Semigroup -> Monoid -> Group -> Abelian group

---

typescript 类型体操

---

引入 tailwind css lint

公式复制

---

抽象向量空间1: 欧几里得空间, 矩阵空间, 线性映射空间, 线性泛函空间(对偶空间)
抽象向量空间2: 多项式空间, 函数空间

我看这个主页面是不是该改一下了?

---

图形学投影矩阵

---

## 可视化框架核心重构（彻底治理架构缺陷与抽象漏洞）

> **目标**：不妥协兼容性，全量重构中间胶水层，内聚样板容器，彻底消除生命周期静默失效、Canvas 状态污染与主题/文字重叠等系统性隐患。

- [x] **M1: Canvas 绘制上下文防御性沙箱与状态隔离**
  - [x] 在 `src/visualizations/core/2d/plot2d.ts` 的所有基础设施绘图函数（`drawAxes`、`drawAdaptiveAxes`、`drawPoint`、`drawPolyline` 等）中强制加入 `ctx.save()` / `ctx.restore()` 保护；
  - [x] 确保坐标轴绘制后重置 `textAlign = "left"` 与 `textBaseline = "alphabetic"`，严禁向外泄漏居中或右对齐等污染状态。
- [x] **M2: useCanvas2D 生命周期与 DOM 挂载重构（回调 Ref 机制）**
  - [x] 废弃静态 `containerRef` / `canvasRef` 盲目读取，改用标准 Callback Ref 或挂载感知机制；
  - [x] 彻底解决条件分支/动态 Tab 切换下初始 DOM 不在树中导致的 Hook 静默提前返回与画板永久死黑缺陷；
  - [x] 收敛并消除割裂的 `deps` 与 `mountDeps` 双依赖心智负担。
- [x] **M3: 内聚样板代码：声明式 `<CanvasViewport>` 高阶容器组件**
  - [x] 抽象统一的 `<CanvasViewport>`（集成 `relative overflow-hidden`、`<CanvasToolbar>` 挂耳、`<CanvasResizer>` 高度自适应手柄与 `ResizeObserver`）；
  - [x] 消除每个 Demo 手写 5 层“俄罗斯套娃”样板代码与“依靠 50 行文档警示防漏写”的脆弱规约；
  - [x] 内置局部暗色主题作用域（`Theme Scope: dark`），统一视口内部悬浮卡片/徽章的文本高对比度语义 token。
- [x] **M4: 多选项卡保活与受控容器 `<KdeViewSwitcher>` / `<KdeTabPanel>`**
  - [x] 升级 `<KdeTabs>` 体系，提供声明式 Panel 容器；
  - [x] 统一内置基于 CSS `hidden` 的多画板保活切换与激活微任务 `redraw()` 自动调度，消除各 Demo 互不兼容的三元销毁。
- [x] **M5: 2D 轻量几何图元与标签避让支持**
  - [x] 针对高频的法向超平面、空间直线、拼装向量提供轻量化几何封装（`Scene2D`）；
  - [x] 内置多向量共线/端点重合时的标签自动碰撞检测与垂直微偏置避让算法。
- [x] **M3D: 3D 视口架构统一抽象（`<Viewer3DViewport>` & 硬件加速 Pin）**
  - [x] 抽象统一的 `<Viewer3DViewport>` 容器（封装暗色机箱外壳、WebGL 渲染器、带阻尼 OrbitControls、`<CanvasToolbar>` 挂耳复位、`<CanvasResizer>` 高度自适应手柄）；
  - [x] 内置 `IntersectionObserver` 离屏自动暂停 WebGL RAF 渲染循环，解决 GPU/CPU 空转过热顽疾；
  - [x] 严格受控执行 `onUpdate` 返回的 cleanup 函数，彻底根除 `attachGizmo3D` 频繁重复绑定导致的 DOM 监听器泄漏；
  - [x] 提供 `<Viewer3DViewport.Pin>` 机制，每帧直接通过 CSS `transform: translate3d(...)` 复合定位，彻底消除 RAF 循环内 React `setState` 导致的整组件 60fps 重渲；
  - [x] 3D 旗舰标杆 `Projection3DDemo` 全量重构并建立 `e2e/projection-3d.spec.ts` 交互与截图测试闭环。
- [x] **M6: 全站已有交互 Demo 全量迁移与旧基础设施淘汰**
  - [x] 2D 旗舰重构标杆 `LinearSystemsDemo` 迁移至 `<CanvasViewport>` + `<CanvasOverlay>` + `Scene2D` + `<KdeTabPanel>` 并建立 `e2e/linear-systems.spec.ts` 端到端交互断言；
  - [x] 3D 旗舰重构标杆 `Projection3DDemo` 迁移至 `<Viewer3DViewport>` 并建立 `e2e/projection-3d.spec.ts` 端到端交互断言；
  - [x] 2D/3D 复合旗舰标杆 `ChangeOfBasisDemo` 迁移至 `<CanvasViewport>` + `Scene2D`（一等公民声明式拖拽）+ `<Viewer3DViewport>` + `<KdeTabs>`/`<KdeTabPanel>` 保活体系，并建立 `e2e/basis-coordinate-change-of-basis.spec.ts` 端到端测试；
  - [x] 线性代数核心视口全量迁移（`FourSubspacesDemo`、`MatrixInverseDemo`、`EigenDemo`、`DeterminantVolumeDemo` 等共 12 篇）；
  - [x] 曲线与样条视口全量迁移（`BezierCasteljauDemo`、`BezierBasisDemo`、`BSplineBasisStepDemo`、`NurbsWeightGravityDemo` 等共 10 篇）；
  - [x] 微积分与曲面视口全量迁移（`TangentLineDemo`、`TangentPlaneDemo`、`ParametricCurveDemo`、`ParametricCurve3DDemo`、`ParametricSurfaceDemo`、`ScalarFieldDemo`、`ScalarField3DDemo`、`PartialDerivativesDemo`、`LevelSetDemo`、`VectorFieldDemo` 共 10 篇）；
  - [x] 交互样式实验室与执行模型全量迁移（`InteractionStyleLabDemo`、`ExecutionCanvas`、`EdgeFunctionRasterizerDemo`）；
  - [x] 永久淘汰并移除旧版 `useCanvas2D.ts` 与 `useViewer3D.ts`，实现全库零历史兼容包袱。

---

二次曲线和二次曲面
