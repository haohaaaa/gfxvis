import { expect, test } from "@playwright/test";
import { captureIsland } from "./utils/screenshot";

test.describe("3D 空间投影与幂等分解 E2E 交互与视觉测试", () => {
  test("页面加载、Viewer3DViewport 挂载、3D Pin 硬件加速定位与平面切换", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));

    await page.goto("/posts/linear-algebra/projection-operators");
    await page.waitForLoadState("domcontentloaded");

    const demo = page.locator("#projection-3d");
    await demo.scrollIntoViewIfNeeded();
    await expect(demo).toBeVisible();

    // 等待 Client:visible hydration 完成
    await expect(demo.getByText("3D 空间平面投影与幂等分解")).toBeVisible();

    // 1. 验证 3D WebGL Canvas 正常挂载且具有合理尺寸
    const canvas = demo.locator("canvas").first();
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(200);
    expect(box!.height).toBeGreaterThan(200);

    // 2. 验证 3D Pin (浮动向量标签) 正常定位与可见性
    const xPin = demo.locator("text=x = (2.00, 1.50, 1.00)");
    const pxPin = demo.locator("text=Px = (2.00, 1.50, 0.00)");
    await expect(xPin).toBeVisible({ timeout: 5000 });
    await expect(pxPin).toBeVisible({ timeout: 5000 });

    // 截取默认 xy 平面正交投影截图
    await captureIsland(page, "projection-3d-xy-ortho", {
      locator: demo,
      subDir: "projection-3d",
    });

    // 3. 切换目标平面到 x+y+z=0
    const planeXyzBtn = demo.getByRole("tab", { name: "x+y+z=0" });
    await planeXyzBtn.click();

    // 验证代数读数更新且无页面级错误
    await expect(demo.locator("text=严格成立 (落点重合)")).toBeVisible();
    expect(errors).toHaveLength(0);

    // 4. 切换到斜投影模式
    const obliqueBtn = demo.getByRole("tab", { name: /斜投影/ });
    await obliqueBtn.click();

    // 截取斜投影态截图
    await captureIsland(page, "projection-3d-oblique", {
      locator: demo,
      subDir: "projection-3d",
    });

    // 5. 验证无运行时 JavaScript 崩溃
    expect(errors).toHaveLength(0);
  });
});
