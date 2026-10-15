import { useEffect, useMemo, useState } from "react";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import KdeButton from "../framework/KdeButton";
import CanvasResizer from "../framework/CanvasResizer";
import ParamSlider from "../framework/ParamSlider";

type CountingMode =
  | "permutation"
  | "combination"
  | "repeat-permutation"
  | "repeat-combination";

const MAX_ENUMERATED = 120;
const SYMBOLS = "ABCDEFGH".split("");

const MODE_OPTIONS: { id: CountingMode; label: string }[] = [
  { id: "permutation", label: "无重复排列" },
  { id: "combination", label: "无重复组合" },
  { id: "repeat-permutation", label: "可重复排列" },
  { id: "repeat-combination", label: "可重复组合" },
];

const MODE_DETAILS: Record<
  CountingMode,
  { order: string; repeat: string; hint: string }
> = {
  permutation: {
    order: "顺序不同算不同",
    repeat: "不可重复",
    hint: "适合职位、密码位置等有先后次序的选取。",
  },
  combination: {
    order: "只看选中的集合",
    repeat: "不可重复",
    hint: "适合组队、抽样等只关心成员的选取。",
  },
  "repeat-permutation": {
    order: "顺序不同算不同",
    repeat: "允许重复",
    hint: "每个位置都可重新选择同一个元素。",
  },
  "repeat-combination": {
    order: "只看选中的多重集合",
    repeat: "允许重复",
    hint: "适合购买多件同类物品等不计顺序的重复选取。",
  },
};

function factorial(value: number): number {
  let result = 1;
  for (let i = 2; i <= value; i += 1) result *= i;
  return result;
}

function choose(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  const reducedR = Math.min(r, n - r);
  let result = 1;
  for (let i = 1; i <= reducedR; i += 1) {
    result = (result * (n - reducedR + i)) / i;
  }
  return result;
}

function count(mode: CountingMode, n: number, r: number): number {
  if ((mode === "permutation" || mode === "combination") && r > n) {
    return 0;
  }
  if (mode === "permutation") return factorial(n) / factorial(n - r);
  if (mode === "combination") return choose(n, r);
  if (mode === "repeat-permutation") return n ** r;
  return choose(n + r - 1, r);
}

function formula(mode: CountingMode): string {
  if (mode === "permutation") return "P(n,r)=\\frac{n!}{(n-r)!}";
  if (mode === "combination") return "\\binom{n}{r}=\\frac{n!}{r!(n-r)!}";
  if (mode === "repeat-permutation") return "n^r";
  return "\\binom{n+r-1}{r}";
}

function description(mode: CountingMode): string {
  if (mode === "permutation") return "顺序不同算不同，元素不能重复。";
  if (mode === "combination") return "只看选中的集合，元素不能重复。";
  if (mode === "repeat-permutation")
    return "顺序不同算不同，每个位置都可重新选择。";
  return "只看选中的多重集合，元素可以重复。";
}

function enumerate(
  mode: CountingMode,
  n: number,
  r: number,
  limit: number,
): string[] | null {
  const total = count(mode, n, r);
  if (total > limit) return null;
  if ((mode === "permutation" || mode === "combination") && r > n) {
    return [];
  }

  const results: string[] = [];
  const path: string[] = [];
  const used = new Set<number>();

  const visit = (start: number, allowRepeat: boolean) => {
    if (path.length === r) {
      results.push(path.join(""));
      return;
    }
    for (let index = allowRepeat ? start : 0; index < n; index += 1) {
      if (!allowRepeat && used.has(index)) continue;
      if (mode === "combination" || mode === "repeat-combination") {
        if (index < start) continue;
      }
      path.push(SYMBOLS[index]);
      if (!allowRepeat) used.add(index);
      visit(
        mode === "combination" || mode === "repeat-combination" ? index : start,
        allowRepeat,
      );
      if (!allowRepeat) used.delete(index);
      path.pop();
    }
  };

  if (r === 0) return [""];
  visit(0, mode === "repeat-permutation" || mode === "repeat-combination");
  return results;
}

export default function CombinatoricsCountingDemo() {
  const [n, setN] = useState(4);
  const [r, setR] = useState(2);
  const [mode, setMode] = useState<CountingMode>("permutation");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [picked, setPicked] = useState<number[]>([]);

  const total = count(mode, n, r);
  const isInvalid = (mode === "permutation" || mode === "combination") && r > n;
  const items = useMemo(
    () => (isInvalid ? [] : enumerate(mode, n, r, MAX_ENUMERATED)),
    [isInvalid, mode, n, r],
  );
  const isTooLarge = !isInvalid && total > MAX_ENUMERATED;
  const detail = MODE_DETAILS[mode];
  const selected =
    selectedItem && items?.includes(selectedItem) ? selectedItem : items?.[0];

  useEffect(() => {
    setSelectedItem(null);
    setPicked([]);
  }, [mode, n, r]);

  const isRepeatMode =
    mode === "repeat-permutation" || mode === "repeat-combination";
  const isCombinationMode =
    mode === "combination" || mode === "repeat-combination";
  const manualResult = picked.map((index) => SYMBOLS[index]).join("");

  const handlePick = (index: number) => {
    if (r === 0) return;
    if (isRepeatMode) {
      if (picked.length < r) setPicked((current) => [...current, index]);
      return;
    }
    if (isCombinationMode) {
      setPicked((current) => {
        if (current.includes(index))
          return current.filter((item) => item !== index);
        if (current.length >= r) return current;
        return [...current, index].sort((a, b) => a - b);
      });
      return;
    }
    if (!picked.includes(index) && picked.length < r) {
      setPicked((current) => [...current, index]);
    }
  };

  return (
    <AutoMath>
      <ExpandableDemo id="combinatorics-counting">
        <KdeWindowShell
          title="组合计数模型 · 排列组合与重集选择"
          eyebrow="DISCRETE LAB"
          mark="Σ"
          modeTag={MODE_OPTIONS.find((m) => m.id === mode)?.label ?? "排列组合"}
          display={
            <div className="relative min-h-[18rem] p-4 space-y-4">
              {/* 手动构造区 */}
              <div className="rounded-lg border border-[var(--kde-border)] bg-[var(--kde-panel)] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--kde-ink)]">
                    自己构造一个结果
                  </span>
                  <KdeButton
                    variant="flat"
                    size="xs"
                    onClick={() => setPicked([])}
                  >
                    重置选择
                  </KdeButton>
                </div>
                <p className="mt-1 text-xs text-[var(--kde-muted)]">
                  {isCombinationMode
                    ? "点击元素进行选择，再次点击可取消。"
                    : "按顺序点击元素，构造各个位置。"}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {SYMBOLS.slice(0, n).map((symbol, index) => {
                    const isPicked = picked.includes(index);
                    const disabled =
                      !isRepeatMode && !isCombinationMode && isPicked;
                    return (
                      <KdeButton
                        key={symbol}
                        size="xs"
                        variant={isPicked ? "primary" : "default"}
                        aria-pressed={isPicked}
                        aria-label={`选择元素 ${symbol}`}
                        disabled={disabled}
                        onClick={() => handlePick(index)}
                        className="font-mono"
                      >
                        {symbol}
                      </KdeButton>
                    );
                  })}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[var(--kde-muted)]">生成位置：</span>
                  {Array.from({ length: r }, (_, index) => {
                    const value = picked[index];
                    return (
                      <button
                        type="button"
                        className="min-w-7 border-b border-[var(--kde-border)] px-1.5 py-0.5 text-center font-mono text-[var(--kde-accent)] hover:border-[var(--kde-accent)]"
                        key={index}
                        aria-label={
                          value === undefined
                            ? `第 ${index + 1} 个位置为空`
                            : `移除第 ${index + 1} 个位置`
                        }
                        onClick={() => {
                          if (value === undefined) return;
                          setPicked((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          );
                        }}
                      >
                        {value === undefined ? "·" : SYMBOLS[value]}
                      </button>
                    );
                  })}
                  <span className="ml-2 font-mono font-semibold text-[var(--kde-ink)]">
                    {manualResult || "∅"}
                  </span>
                </div>
              </div>

              {/* 小规模枚举区 */}
              <div className="rounded-lg border border-[var(--kde-border)] bg-[var(--kde-panel)] p-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold text-[var(--kde-ink)]">
                    小规模枚举空间
                  </span>
                  <span className="text-[11px] text-[var(--kde-muted)]">
                    {isInvalid
                      ? "当前参数无定义"
                      : `显示 ${items?.length ?? 0} / ${total} 项`}
                  </span>
                </div>
                {isTooLarge ? (
                  <p className="text-xs text-[var(--kde-muted)]">
                    结果超过 {MAX_ENUMERATED}{" "}
                    项，为保持流畅暂不展开；公式计数仍然有效。
                  </p>
                ) : (
                  <div
                    className="grid grid-cols-4 gap-x-2 gap-y-1 text-xs sm:grid-cols-6 max-h-48 overflow-y-auto"
                    role="group"
                    aria-label="枚举结果"
                  >
                    {items?.map((item, index) => (
                      <button
                        type="button"
                        className={`text-left font-mono transition-colors hover:text-[var(--kde-accent)] ${
                          selected === item
                            ? "text-[var(--kde-accent)] font-semibold underline underline-offset-2"
                            : "text-[var(--kde-muted)]"
                        }`}
                        key={`${item}-${index}`}
                        aria-label={`选择结果 ${item || "空集"}`}
                        aria-pressed={selected === item}
                        onClick={() => setSelectedItem(item)}
                      >
                        {item || "∅"}
                      </button>
                    ))}
                  </div>
                )}
                {!isInvalid && selected !== undefined && (
                  <p
                    className="mt-2 text-[11px] text-[var(--kde-muted)]"
                    aria-live="polite"
                  >
                    当前选定项{" "}
                    <span className="font-mono font-semibold text-[var(--kde-accent)]">
                      {selected || "∅"}
                    </span>
                    ；
                    {mode === "combination" || mode === "repeat-combination"
                      ? "组合模型：元素集合无序，交换顺序不产生新结果。"
                      : "排列模型：元素位置有序，交换顺序产生不同排列。"}
                  </p>
                )}
              </div>
              <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
            </div>
          }
          controls={
            <div className="space-y-3">
              <KdeTabs
                options={MODE_OPTIONS}
                value={mode}
                onChange={(id) => setMode(id as CountingMode)}
              />

              <div className="grid gap-2 sm:grid-cols-2">
                <ParamSlider
                  label="总体元素数 $n$"
                  value={n}
                  min={1}
                  max={8}
                  step={1}
                  display={String(n)}
                  digits={0}
                  onChange={setN}
                />
                <ParamSlider
                  label="选取数量 $r$"
                  value={r}
                  min={0}
                  max={8}
                  step={1}
                  display={String(r)}
                  digits={0}
                  onChange={setR}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <KdeCard title="计数定理与计算结果" variant="dense">
                  <div className="space-y-1">
                    <KdeReadout
                      label="计数公式"
                      value={`$${formula(mode)}$`}
                      variant="formula"
                      dense
                    />
                    <KdeReadout
                      label="总计数"
                      value={isInvalid ? "无定义 (r > n)" : String(total)}
                      variant={isInvalid ? "danger" : "accent"}
                      dense
                    />
                  </div>
                </KdeCard>

                <KdeCard title="模型特征说明" variant="dense">
                  <div className="space-y-1 text-xs">
                    <p className="text-[var(--kde-ink)]">
                      <strong>顺序性：</strong>
                      <span className="text-[var(--kde-muted)]">
                        {detail.order}
                      </span>
                    </p>
                    <p className="text-[var(--kde-ink)]">
                      <strong>重复性：</strong>
                      <span className="text-[var(--kde-muted)]">
                        {detail.repeat}
                      </span>
                    </p>
                    <p className="text-[11px] text-[var(--kde-muted)] pt-0.5 border-t border-[var(--kde-border)]">
                      {detail.hint}
                    </p>
                  </div>
                </KdeCard>
              </div>

              <p
                className={
                  isInvalid ? "text-xs text-rose-500" : "text-xs text-muted"
                }
                aria-live="polite"
              >
                {isInvalid
                  ? "无重复模式要求 r ≤ n，请减小 r 或切换到可重复模式。"
                  : description(mode)}
              </p>
            </div>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
