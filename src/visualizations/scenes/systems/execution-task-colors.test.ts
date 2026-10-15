import { deepEqual, equal, ok } from "node:assert/strict";
import { test } from "node:test";
import { taskColorPalette } from "./execution-task-colors";

test("all twelve supported threads receive distinct colors without four-task cycling", () => {
  for (const background of ["#ffffff", "#1e2226"]) {
    const colors = taskColorPalette(12, "#3daee9", background);
    equal(new Set(colors).size, 12);
    ok(colors[0] !== colors[4]);
    deepEqual(taskColorPalette(2, "#3daee9", background), colors.slice(0, 2));
    deepEqual(taskColorPalette(12, "#3daee9", background), colors);
  }
});

test("colors follow theme tokens and adapt lightness for dark backgrounds", () => {
  const light = taskColorPalette(3, "#3daee9", "#fff");
  const dark = taskColorPalette(3, "rgb(61, 174, 233)", "rgb(30, 34, 38)");
  const values = (color: string) => color.match(/[\d.]+/g)!.map(Number);
  equal(values(light[0])[0], values(dark[0])[0]);
  ok(values(dark[0])[2] > values(light[0])[2]);
  ok(taskColorPalette(1, "#27ae60", "#fff")[0] !== light[0]);
  deepEqual(taskColorPalette(0, "#3daee9", "#fff"), []);
});
