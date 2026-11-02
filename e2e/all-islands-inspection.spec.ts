import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const ROUTES = [
  "/posts/calculus/curves-and-surfaces",
  "/posts/calculus/derivative-gradient-jacobian",
  "/posts/calculus/derivatives-and-tangent-spaces",
  "/posts/calculus/fields-and-operators",
  "/posts/discrete-math/combinations-and-permutations",
  "/posts/discrete-math/functions-and-mappings",
  "/posts/discrete-math/graph-theory-fundamentals",
  "/posts/discrete-math/set-theory-relations-and-partitions",
  "/posts/linear-algebra/abstract-vector-spaces-and-linear-maps",
  "/posts/linear-algebra/affine-spaces-and-affine-maps",
  "/posts/linear-algebra/basis-coordinate-change-of-basis",
  "/posts/linear-algebra/dual-spaces-and-linear-functionals",
  "/posts/linear-algebra/eigenvalues-and-eigenvectors",
  "/posts/linear-algebra/four-fundamental-subspaces",
  "/posts/linear-algebra/gram-matrix",
  "/posts/linear-algebra/inner-product-spaces",
  "/posts/linear-algebra/least-squares",
  "/posts/linear-algebra/linear-systems-row-column-and-solution-manifolds",
  "/posts/linear-algebra/matrix-decompositions",
  "/posts/linear-algebra/matrix-fundamentals-linear-mappings",
  "/posts/linear-algebra/matrix-inverse",
  "/posts/linear-algebra/matrix-rank-column-row-space",
  "/posts/linear-algebra/matrix-similarity-and-invariants",
  "/posts/linear-algebra/permutation-matrices",
  "/posts/linear-algebra/projection-operators",
  "/posts/linear-algebra/projective-geometry",
  "/posts/linear-algebra/quaternions-rotations-and-so3",
  "/posts/linear-algebra/rotation-so3-view-transform",
  "/posts/linear-algebra/singular-value-decomposition",
  "/posts/linear-algebra/trace-and-determinant",
  "/posts/systems/cpp-memory-management-matrix",
  "/posts/systems/x86-64-execution-model-and-assembly",
  "/posts/type-systems/algebraic-data-types-and-recursive-types",
  "/posts/type-systems/dependent-types",
  "/posts/type-systems/effects",
  "/posts/type-systems/execution-models-concurrency-and-parallelism",
  "/posts/type-systems/existential-types",
  "/posts/type-systems/formal-model-of-rust-borrow-checker",
  "/posts/type-systems/interactive-polyglot-code-execution-in-articles",
  "/posts/type-systems/parametric-polymorphism-system-f",
  "/posts/type-systems/simply-typed-lambda-calculus",
  "/posts/type-systems/subtyping-and-variance",
  "/posts/type-systems/type-classes-traits",
  "/posts/type-systems/untyped-lambda-calculus",
  "/posts/visualization/bezier-to-b-spline",
  "/posts/visualization/interaction-style-lab",
];

test.describe("All Islands Formula & Screenshot Verification", () => {
  for (const route of ROUTES) {
    const slug = route.replace(/^\/posts\//, "").replace(/\//g, "--");

    test(`Verify & screenshot islands in ${route}`, async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      await page.addStyleTag({
        content:
          "* { scroll-behavior: auto !important; transition: none !important; animation: none !important; }",
      });

      // Locate all top-level interactive island containers without nested duplication
      const islandLocator = page.locator(
        '[data-window-shell="kde"], .not-prose > div[id]:not(:has([data-window-shell="kde"]))',
      );
      const count = await islandLocator.count();

      if (count === 0) {
        test.skip();
        return;
      }

      console.log(`[${slug}] Found ${count} islands.`);

      const screenshotDir = join(
        ".playwright-screenshots",
        "all-islands",
        slug,
      );
      await mkdir(screenshotDir, { recursive: true });

      for (let i = 0; i < count; i++) {
        const island = islandLocator.nth(i);
        const idAttr =
          (await island.getAttribute("data-testid")) ||
          (await island.getAttribute("id")) ||
          `island-${i + 1}`;
        console.log(`[${slug}] Processing island ${i + 1}/${count}: ${idAttr}`);

        await island.evaluate((el) =>
          el.scrollIntoView({ block: "center", behavior: "instant" }),
        );
        await page.waitForTimeout(600);

        // Scan island DOM for unrendered math tokens outside of code / monaco / katex
        const violations = await island.evaluate((node) => {
          const results: { text: string; tag: string; classes: string }[] = [];
          const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
            acceptNode(textNode) {
              const parent = textNode.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              if (
                parent.closest(
                  "pre, code, script, style, .monaco-editor, .katex, [data-no-math], svg",
                )
              ) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            },
          });

          const mathPattern = /(\$\$[\s\S]+?\$\$|\$(?!\$)[^$]+\$)/;
          const latexPattern =
            /\\(mathbf|leftarrow|rightarrow|frac|begin|sum|operatorname|approx|in\b|times|det\b|dim\b|ker\b|lambda\b|alpha\b|beta\b|theta\b|sigma\b|le\b|ge\b|neq\b|sim\b)/;

          let curr: Node | null;
          while ((curr = walker.nextNode())) {
            const text = curr.textContent || "";
            if (mathPattern.test(text) || latexPattern.test(text)) {
              results.push({
                text: text.trim(),
                tag: curr.parentElement
                  ? curr.parentElement.tagName
                  : "unknown",
                classes: curr.parentElement ? curr.parentElement.className : "",
              });
            }
          }
          return results;
        });

        const screenshotPath = join(screenshotDir, `${idAttr}.png`);

        const box = await island.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          await page.screenshot({
            path: screenshotPath,
            clip: box,
            animations: "disabled",
          });
        } else {
          await island.screenshot({
            path: screenshotPath,
            animations: "disabled",
            timeout: 10000,
          });
        }

        expect(
          violations,
          `Found unrendered math in ${route} [${idAttr}]: ${JSON.stringify(violations, null, 2)}`,
        ).toEqual([]);
      }
    });
  }
});
