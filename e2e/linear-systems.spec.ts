import { expect, test } from "@playwright/test";
import { captureIsland } from "./utils/screenshot";

test.describe("线性方程组几何与解流形 E2E 交互与视觉测试", () => {
  test("页面加载、行列视角双视口、预设切换与仿射流形 Tab 渲染", async ({
    page,
  }) => {
    const errors: string[] = [];
    const consoleIssues: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        msg.type() === "error" ||
        text.includes("Each child in a list") ||
        text.includes("hydration-mismatch") ||
        text.includes("Hydration")
      ) {
        consoleIssues.push(`[${msg.type()}] ${text}`);
      }
    });

    await page.goto(
      "/posts/linear-algebra/linear-systems-row-column-and-solution-manifolds",
    );
    await page.waitForLoadState("domcontentloaded");

    const demo = page.locator("#linear-systems-demo");
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toBeVisible();

    // 等待 Client:visible hydration 完成
    await expect(
      demo.getByText("行视角（Row Picture）：超平面相交"),
    ).toBeVisible();

    // 1. 验证双重视角下的两个 Canvas
    const leftCanvas = demo.locator("canvas").nth(0);
    const rightCanvas = demo.locator("canvas").nth(1);
    await expect(leftCanvas).toBeVisible();
    await expect(rightCanvas).toBeVisible();

    // 2. 验证左上角徽章副标题清晰可见
    const leftSubtitle = demo.getByText("解空间").first();
    await expect(leftSubtitle).toBeVisible();

    // 3. 验证左下角方程徽章正常渲染且避让底部调整手柄
    const eqOverlay = demo.locator(".bottom-7.left-3\\.5").first();
    await expect(eqOverlay).toBeVisible();
    await expect(eqOverlay).toContainText("x+y=2");

    // 截取初始正交独立态截图
    await captureIsland(page, "linear-systems-initial", {
      locator: demo,
      subDir: "linear-systems",
    });

    // 4. 切换到 "平行矛盾 (无解)" 预设
    const parallelBtn = demo.getByRole("button", { name: "平行矛盾 (无解)" });
    await parallelBtn.click();
    await expect(demo.locator("text=平行矛盾无解")).toBeVisible();

    // 截取平行矛盾态截图
    await captureIsland(page, "linear-systems-parallel", {
      locator: demo,
      subDir: "linear-systems",
    });

    // 5. 切换到 "重合退化 (无穷多解)" 预设
    const coincidentBtn = demo.getByRole("button", {
      name: "重合退化 (无穷多解)",
    });
    await coincidentBtn.click();
    await expect(demo.locator("text=重合无穷多解")).toBeVisible();

    // 截取重合退化态截图
    await captureIsland(page, "linear-systems-coincident", {
      locator: demo,
      subDir: "linear-systems",
    });

    // 6. 切换到第二个 Tab: "解集流形：齐次 vs 非齐次平移"
    const tabAffine = demo.getByRole("tab", {
      name: "解集流形：齐次 vs 非齐次平移",
    });
    await tabAffine.click();

    // 验证仿射画布可见且尺寸正常（修复空画板 BUG）
    const affineCanvas = demo.locator("canvas").nth(2);
    await expect(affineCanvas).toBeVisible();
    const box = await affineCanvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(100);
    expect(box!.height).toBeGreaterThan(100);

    // 验证仿射模式副标题清晰可见
    const affineSubtitle = demo.getByText("仿射子空间").first();
    await expect(affineSubtitle).toBeVisible();

    // 截取仿射流动态截图
    await captureIsland(page, "linear-systems-affine-manifold", {
      locator: demo,
      subDir: "linear-systems",
    });

    // 7. 切回第一个 Tab，验证状态依然完好
    const tabRowCol = demo.getByRole("tab", {
      name: "双重视角：行求交 vs 列拼装",
    });
    await tabRowCol.click();
    await expect(leftCanvas).toBeVisible();
    await expect(rightCanvas).toBeVisible();

    // 8. 验证无运行时未捕获错误及水合/key警告
    expect(errors).toEqual([]);
    expect(consoleIssues).toEqual([]);
  });

  test("消元几何目的图谱 EliminationGeometryDiagram 挂载与三模式交互", async ({
    page,
  }) => {
    const errors: string[] = [];
    const consoleIssues: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        msg.type() === "error" ||
        text.includes("Each child in a list") ||
        text.includes("hydration-mismatch") ||
        text.includes("Hydration")
      ) {
        consoleIssues.push(`[${msg.type()}] ${text}`);
      }
    });

    await page.goto(
      "/posts/linear-algebra/linear-systems-row-column-and-solution-manifolds",
    );
    await page.waitForLoadState("domcontentloaded");

    const diagram = page.locator(
      '[data-testid="elimination-geometry-diagram"]',
    );
    await diagram.scrollIntoViewIfNeeded();
    await expect(diagram).toBeVisible();

    // 1. 验证默认在两阶段静态对比模式
    await expect(diagram.getByText("初始倾斜相交 (Coupled)")).toBeVisible();
    await expect(
      diagram.getByText("高斯消元·阶梯形摆平 (Echelon)"),
    ).toBeVisible();
    await expect(diagram.locator("text=不变铰链交点")).toBeVisible();

    // 2. 切换到连续铰链旋转动效
    const continuousTab = diagram.getByRole("tab", {
      name: /连续铰链旋转/,
    });
    await continuousTab.click();
    await expect(diagram.getByText("铰链旋转动态仿真")).toBeVisible();

    // 验证播放/暂停按钮或百分比步进
    const playBtn = diagram.getByRole("button", { name: /播放动效/ });
    await expect(playBtn).toBeVisible();
    await diagram.getByRole("button", { name: "完全对齐" }).click();
    await expect(diagram.getByText("剪切进度: 100%")).toBeVisible();

    // 3. 切换到 Gauss-Jordan Full Decoupling 模式
    const rrefTab = diagram.getByRole("tab", {
      name: /Gauss-Jordan Full Decoupling/,
    });
    await rrefTab.click();
    await expect(diagram.getByText("十字瞄准线")).toBeVisible();
    await expect(diagram.getByText("100% 完全解耦")).toBeVisible();

    // 截取 Gauss-Jordan Full Decoupling 态截图
    await captureIsland(page, "elimination-geometry-rref", {
      locator: diagram,
      subDir: "linear-systems",
    });

    // 4. 验证无控制台/运行时未捕获错误及水合/key警告
    expect(errors).toEqual([]);
    expect(consoleIssues).toEqual([]);
  });

  test("仿射子空间悬空平移图谱 AffineSubspaceFlatDiagram 挂载与动态交互", async ({
    page,
  }) => {
    const errors: string[] = [];
    const consoleIssues: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        msg.type() === "error" ||
        text.includes("Each child in a list") ||
        text.includes("hydration-mismatch") ||
        text.includes("Hydration")
      ) {
        consoleIssues.push(`[${msg.type()}] ${text}`);
      }
    });

    await page.goto(
      "/posts/linear-algebra/linear-systems-row-column-and-solution-manifolds",
    );
    await page.waitForLoadState("domcontentloaded");

    const flatDiagram = page.locator(
      '[data-testid="affine-subspace-flat-diagram"]',
    );
    await flatDiagram.scrollIntoViewIfNeeded();
    await expect(flatDiagram).toBeVisible();

    // 验证初始状态 (悬空仿射态)
    await expect(flatDiagram.getByText("仿射解集")).toBeVisible();
    await expect(flatDiagram.getByText("仿射子空间 (Flat)")).toBeVisible();

    // 播放/暂停动效与复位
    const playBtn = flatDiagram.getByRole("button", { name: /播放平移动效/ });
    await expect(playBtn).toBeVisible();

    const resetBtn = flatDiagram.getByRole("button", { name: "复位标准视角" });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // 截图捕获
    await captureIsland(page, "affine-subspace-flat-diagram", {
      locator: flatDiagram,
      subDir: "linear-systems",
    });

    expect(errors).toEqual([]);
    expect(consoleIssues).toEqual([]);
  });
});
