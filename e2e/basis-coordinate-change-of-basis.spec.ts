import { expect, test } from "@playwright/test";
import { captureIsland } from "./utils/screenshot";

test.describe("Change of Basis 文章与 ChangeOfBasisDemo E2E 交互与视觉测试", () => {
  test("页面加载、2D 坐标基变换、3D 局部坐标系与 Tab 保活切换", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/posts/linear-algebra/basis-coordinate-change-of-basis");
    await page.waitForLoadState("domcontentloaded");

    // 1. 验证文章标题与 KaTeX 渲染
    await expect(page).toHaveTitle(/基、坐标表示与基变换/);
    await expect(page.locator(".katex").first()).toBeVisible();
    await expect(page.locator(".katex-error")).toHaveCount(0);

    const demo = page.locator("#change-of-basis");
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toBeVisible();

    // 2. 验证 2D 初始视图与 Canvas 挂载
    await expect(demo.getByText("2D 基变换与坐标换算").first()).toBeVisible();
    const canvas2D = demo.locator("canvas").first();
    await expect(canvas2D).toBeVisible();

    // 验证 2D HUD 覆盖层文字
    await expect(demo.locator("text=[v]_C = P^-1 [v]_B").first()).toBeVisible();
    await expect(demo.locator("text=基变换与坐标网格映射")).toBeVisible();

    // 验证基矩阵读数
    await expect(demo.getByText("基矩阵").first()).toBeVisible();

    // 3. 切换 2D 预设为 "水平剪切基"
    const shearBtn = demo.getByRole("button", { name: "水平剪切基" });
    await shearBtn.click();
    await expect(demo.locator("text=保持 x 轴基底不变")).toBeVisible();

    // 截图保存 2D 剪切基状态
    await captureIsland(page, "change-of-basis-2d-shear", {
      locator: demo,
      subDir: "basis",
    });

    // 4. 切换到 3D Tab
    const tab3DBtn = demo.getByRole("tab", {
      name: /3D 图形学矩阵与局部坐标系/,
    });
    await tab3DBtn.click();

    // 验证 3D 视图与 WebGL 视口
    await expect(
      demo.getByText("3D 图形学矩阵与局部坐标系").first(),
    ).toBeVisible();
    await expect(
      demo.locator("text=3D 局部坐标系 [r, f, u]").first(),
    ).toBeVisible();
    await expect(demo.locator("text=复合旋转矩阵 R")).toBeVisible();

    // 切换视锥台模式
    const frustumBtn = demo.getByRole("button", {
      name: /切换为相机视锥台/,
    });
    await frustumBtn.click();
    await expect(
      demo.getByRole("button", { name: /切换为基向量立方体/ }),
    ).toBeVisible();

    // 截图保存 3D 视锥台状态
    await captureIsland(page, "change-of-basis-3d-frustum", {
      locator: demo,
      subDir: "basis",
    });

    // 5. 切换回 2D Tab，验证状态保活（未发生重新挂载死黑）
    const tab2DBtn = demo.getByRole("tab", {
      name: /2D 基变换与坐标换算/,
    });
    await tab2DBtn.click();
    await expect(canvas2D).toBeVisible();
    await expect(demo.locator("text=保持 x 轴基底不变")).toBeVisible();

    // 6. 验证全流程无运行时未捕获异常
    expect(errors).toEqual([]);
  });
});
