/** CSS theme tokens in this project are hex or rgb() colors. */
function rgb(color: string): [number, number, number] {
  if (/^#[\da-f]{3}$/i.test(color)) {
    return [1, 2, 3].map((index) => parseInt(color[index].repeat(2), 16)) as [
      number,
      number,
      number,
    ];
  }
  if (/^#[\da-f]{6}$/i.test(color)) {
    return [1, 3, 5].map((index) =>
      parseInt(color.slice(index, index + 2), 16),
    ) as [number, number, number];
  }
  const channels = color.match(/[\d.]+/g);
  if (!channels || channels.length < 3)
    throw new Error("无法解析执行模型的主题颜色。");
  return channels.slice(0, 3).map(Number) as [number, number, number];
}

/** Rotate the theme accent's hue without recycling colors every four tasks. */
export function taskColorPalette(
  count: number,
  accent: string,
  background: string,
): string[] {
  const [r, g, b] = rgb(accent).map((value) => value / 255);
  const high = Math.max(r, g, b);
  const low = Math.min(r, g, b);
  const delta = high - low;
  const lightness = (high + low) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue =
    delta === 0
      ? 0
      : high === r
        ? ((g - b) / delta) % 6
        : high === g
          ? (b - r) / delta + 2
          : (r - g) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  const bg = rgb(background);
  const dark = (bg[0] * 0.2126 + bg[1] * 0.7152 + bg[2] * 0.0722) / 255 < 0.5;
  const s = Math.round(Math.min(80, Math.max(55, saturation * 100)));
  const l = Math.round(
    dark
      ? Math.max(60, Math.min(70, lightness * 100))
      : Math.max(38, Math.min(48, lightness * 100)),
  );
  return Array.from(
    { length: count },
    (_, index) =>
      `hsl(${((hue + index * 137.508) % 360).toFixed(2)} ${s}% ${l}%)`,
  );
}
