import { useMemo, useState } from "react";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeButton from "../framework/KdeButton";
import CanvasResizer from "../framework/CanvasResizer";
import ParamSlider from "../framework/ParamSlider";

// ─── helpers ───────────────────────────────────────────────────────────────

function buildTriangle(maxRow: number): number[][] {
  const rows: number[][] = [];
  for (let n = 0; n <= maxRow; n++) {
    const row: number[] = [];
    for (let r = 0; r <= n; r++) {
      row.push(
        n === 0 || r === 0 || r === n ? 1 : rows[n - 1][r - 1] + rows[n - 1][r],
      );
    }
    rows.push(row);
  }
  return rows;
}

interface CellKey {
  n: number;
  r: number;
}
function cellId(n: number, r: number) {
  return `${n},${r}`;
}

// ─── layout constants ──────────────────────────────────────────────────────

const HEADER_W = 40; // left header column width (px)
const HEADER_H = 32; // top header row height (px)
const CELL_W = 50; // cell width (px)
const CELL_H = 40; // cell height (px)

/** Pixel centre of cell (n, r) in the absolute coordinate space. */
function cellCx(r: number) {
  return HEADER_W + r * CELL_W + CELL_W / 2;
}
function cellCy(n: number) {
  return HEADER_H + n * CELL_H + CELL_H / 2;
}

// ─── component ─────────────────────────────────────────────────────────────

export default function PascalTriangleDemo() {
  const [maxRow, setMaxRow] = useState(7);
  const [selected, setSelected] = useState<CellKey | null>(null);

  const triangle = useMemo(() => buildTriangle(maxRow), [maxRow]);
  const sel = selected && selected.n <= maxRow ? selected : null;

  const totalW = HEADER_W + (maxRow + 1) * CELL_W;
  const totalH = HEADER_H + (maxRow + 1) * CELL_H;

  // Parent cells (Pascal recursion: cell above-left and cell above)
  const parents: CellKey[] = sel
    ? [
        ...(sel.r > 0 ? [{ n: sel.n - 1, r: sel.r - 1 }] : []),
        ...(sel.r <= sel.n - 1 ? [{ n: sel.n - 1, r: sel.r }] : []),
      ]
    : [];

  const selVal = sel ? triangle[sel.n][sel.r] : null;
  const parentVals = parents.map((p) => triangle[p.n][p.r]);

  const handleClick = (n: number, r: number) => {
    setSelected(sel?.n === n && sel?.r === r ? null : { n, r });
  };

  const handleReset = () => {
    setSelected(null);
    setMaxRow(7);
  };

  // Shared border/bg tokens used in SVG (must match Tailwind tokens)
  const accentColor = "var(--color-accent)";

  return (
    <AutoMath>
      <ExpandableDemo id="pascal-triangle">
        <KdeWindowShell
          title="Pascal 三角形 · 组合数网格与加法递推"
          eyebrow="DISCRETE LAB"
          mark="C(n,r)"
          modeTag={`展开至第 ${maxRow} 行`}
          display={
            <div className="relative p-4 overflow-x-auto min-h-[18rem]">
              <div
                className="relative mx-auto select-none"
                style={{ width: totalW, height: totalH }}
                role="grid"
                aria-label="Pascal 三角形（直角三角格式）"
              >
                {/* ── SVG: connection lines only ── */}
                <svg
                  width={totalW}
                  height={totalH}
                  viewBox={`0 0 ${totalW} ${totalH}`}
                  className="pointer-events-none absolute inset-0"
                  aria-hidden="true"
                >
                  {sel &&
                    parents.map((p) => (
                      <line
                        key={cellId(p.n, p.r)}
                        x1={cellCx(sel.r)}
                        y1={cellCy(sel.n)}
                        x2={cellCx(p.r)}
                        y2={cellCy(p.n)}
                        stroke={accentColor}
                        strokeWidth="1.5"
                        strokeDasharray="5 3"
                        opacity="0.7"
                      />
                    ))}
                </svg>

                {/* ── Corner cell ── */}
                <div
                  className="absolute flex items-center justify-center border-b border-r border-[var(--kde-border)] bg-[var(--kde-panel)] text-[10px] text-[var(--kde-muted)]"
                  style={{ left: 0, top: 0, width: HEADER_W, height: HEADER_H }}
                >
                  n\r
                </div>

                {/* ── Column headers (r = 0 … maxRow) ── */}
                {Array.from({ length: maxRow + 1 }, (_, r) => {
                  const isActive = sel?.r === r;
                  return (
                    <div
                      key={`ch${r}`}
                      className={`absolute flex items-center justify-center border-b border-r border-[var(--kde-border)] text-xs font-mono font-semibold transition-colors ${
                        isActive
                          ? "bg-[var(--kde-accent)]/20 text-[var(--kde-accent)]"
                          : "bg-[var(--kde-panel)] text-[var(--kde-muted)]"
                      }`}
                      style={{
                        left: HEADER_W + r * CELL_W,
                        top: 0,
                        width: CELL_W,
                        height: HEADER_H,
                      }}
                    >
                      {r}
                    </div>
                  );
                })}

                {/* ── Row headers (n = 0 … maxRow) ── */}
                {triangle.map((_, n) => {
                  const isActive = sel?.n === n;
                  return (
                    <div
                      key={`rh${n}`}
                      className={`absolute flex items-center justify-center border-b border-r border-[var(--kde-border)] text-xs font-mono font-semibold transition-colors ${
                        isActive
                          ? "bg-[var(--kde-accent)]/20 text-[var(--kde-accent)]"
                          : "bg-[var(--kde-panel)] text-[var(--kde-muted)]"
                      }`}
                      style={{
                        left: 0,
                        top: HEADER_H + n * CELL_H,
                        width: HEADER_W,
                        height: CELL_H,
                      }}
                    >
                      {n}
                    </div>
                  );
                })}

                {/* ── Data cells ── */}
                {triangle.map((row, n) =>
                  row.map((val, r) => {
                    const isSel = sel?.n === n && sel?.r === r;
                    const isParent = parents.some(
                      (p) => p.n === n && p.r === r,
                    );

                    let cls =
                      "bg-[var(--kde-base)] hover:bg-[var(--kde-panel)] border-[var(--kde-border)] text-[var(--kde-ink)]";
                    if (isSel)
                      cls =
                        "bg-[var(--kde-accent)] text-[var(--kde-accent-contrast)] border-[var(--kde-accent)] shadow-sm scale-105 font-bold";
                    else if (isParent)
                      cls =
                        "bg-[var(--kde-accent)]/15 text-[var(--kde-accent)] border-[var(--kde-accent)]/60 font-semibold";

                    return (
                      <button
                        key={cellId(n, r)}
                        type="button"
                        role="gridcell"
                        aria-label={`C(${n},${r}) = ${val}${isSel ? "，已选中" : ""}`}
                        aria-pressed={isSel}
                        onClick={() => handleClick(n, r)}
                        style={{
                          position: "absolute",
                          left: HEADER_W + r * CELL_W + 3,
                          top: HEADER_H + n * CELL_H + 3,
                          width: CELL_W - 6,
                          height: CELL_H - 6,
                        }}
                        className={`flex cursor-pointer items-center justify-center rounded border text-xs font-mono transition-all duration-150 active:scale-95 ${cls}`}
                      >
                        <span className={val > 999 ? "text-[10px]" : ""}>
                          {val}
                        </span>
                      </button>
                    );
                  }),
                )}
              </div>
              <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
            </div>
          }
          controls={
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <ParamSlider
                  label="最大行数 $n$"
                  value={maxRow}
                  min={2}
                  max={10}
                  step={1}
                  display={String(maxRow + 1)}
                  digits={0}
                  onChange={(v) => {
                    setMaxRow(v);
                    if (selected && selected.n > v) setSelected(null);
                  }}
                />
                <KdeButton variant="default" size="xs" onClick={handleReset}>
                  重置选择
                </KdeButton>
              </div>

              <KdeCard title="Pascal 递推关系解析" variant="dense">
                <div className="space-y-1" aria-live="polite">
                  {sel === null ? (
                    <p className="text-xs text-[var(--kde-muted)]">
                      点击上方任意网格单元，查看二项式系数与 Pascal
                      加法递推路径。
                    </p>
                  ) : sel.n === 0 ? (
                    <KdeReadout
                      label="顶点边界条件"
                      value="$\binom{0}{0} = 1$"
                      variant="formula"
                      dense
                    />
                  ) : parents.length === 1 ? (
                    <KdeReadout
                      label="侧边边界单元"
                      value={`$\\binom{${sel.n}}{${sel.r}} = ${selVal}$`}
                      variant="accent"
                      dense
                    />
                  ) : (
                    <div className="space-y-1">
                      <KdeReadout
                        label={`单元 C(${sel.n}, ${sel.r}) 递推式`}
                        value={`$\\binom{${sel.n}}{${sel.r}} = \\binom{${parents[0].n}}{${parents[0].r}} + \\binom{${parents[1].n}}{${parents[1].r}} = ${parentVals[0]} + ${parentVals[1]} = ${selVal}$`}
                        variant="formula"
                        dense
                      />
                    </div>
                  )}
                </div>
              </KdeCard>

              <p className="text-xs text-muted">
                左侧纵坐标为行序号 $n$（总元素数），顶部横坐标为列序号
                $r$（选取数）；虚线连接其上方两个加数来源单元格。
              </p>
            </div>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
