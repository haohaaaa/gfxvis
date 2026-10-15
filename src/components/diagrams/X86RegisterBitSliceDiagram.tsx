import { useState } from "react";
import { AutoMath } from "../framework/AutoMath";
import KdeButton from "../framework/KdeButton";

type WriteOperation = "full-64" | "write-32" | "write-16" | "write-8";

interface SliceHighlight {
  id: "rax" | "eax" | "ax" | "ah" | "al" | "high32";
  label: string;
  bits: string;
  bytes: number;
  desc: string;
}

const SLICE_INFO: Record<string, SliceHighlight> = {
  rax: {
    id: "rax",
    label: "RAX (64 位)",
    bits: "位 0 ~ 63 (8 字节)",
    bytes: 8,
    desc: "全量 64 位寄存器，由 64 位指令读写操作（如 mov rax, ...）。",
  },
  high32: {
    id: "high32",
    label: "高 32 位 (RAX[63:32])",
    bits: "位 32 ~ 63 (4 字节)",
    bytes: 4,
    desc: "当执行 32 位写入（如 mov eax）时，微架构硬件会自动将其强制清零！",
  },
  eax: {
    id: "eax",
    label: "EAX (32 位)",
    bits: "位 0 ~ 31 (4 字节)",
    bytes: 4,
    desc: "32 位向下兼容子寄存器。写入 EAX 具有强制清零 RAX 高 32 位的特殊硬件特性。",
  },
  ax: {
    id: "ax",
    label: "AX (16 位)",
    bits: "位 0 ~ 15 (2 字节)",
    bytes: 2,
    desc: "16 位实模式/保护模式向下兼容子寄存器。写入 AX 不会清零高位（保留旧值）。",
  },
  ah: {
    id: "ah",
    label: "AH (8 位高半部)",
    bits: "位 8 ~ 15 (1 字节)",
    bytes: 1,
    desc: "AX 的高 8 位。历史遗留寻址，写入保留所有其他位不变。",
  },
  al: {
    id: "al",
    label: "AL (8 位低半部)",
    bits: "位 0 ~ 7 (1 字节)",
    bytes: 1,
    desc: "AX 的低 8 位。常用于返回单字节字符或布尔状态值。",
  },
};

export default function X86RegisterBitSliceDiagram() {
  const [activeSlice, setActiveSlice] = useState<string>("eax");
  const [op, setOp] = useState<WriteOperation>("write-32");

  // 当前寄存器十六进制值（模拟）
  let high32Hex = "00000000";
  let eaxHigh16Hex = "0000";
  let ahHex = "00";
  let alHex = "2A";
  let note =
    "写入 32 位 EAX = 42 (0x2A)：硬件电路自动将高 32 位强制置零（Zero-Extension），消除了对 RAX 旧值的数据依赖（False Dependency）！";

  if (op === "full-64") {
    high32Hex = "11223344";
    eaxHigh16Hex = "5566";
    ahHex = "77";
    alHex = "88";
    note =
      "执行 mov rax, 0x1122334455667788：写入全量 64 位值，覆盖全部 8 字节。";
  } else if (op === "write-16") {
    high32Hex = "11223344"; // 假定原有值
    eaxHigh16Hex = "5566"; // 假定原有值
    ahHex = "AB";
    alHex = "CD";
    note =
      "执行 mov ax, 0xABCD：仅更新低 16 位！高 48 位（位 16 ~ 63）完全保持原有旧值不变（微架构需生成归并操作，易引发流水线依赖停顿）。";
  } else if (op === "write-8") {
    high32Hex = "11223344";
    eaxHigh16Hex = "5566";
    ahHex = "77";
    alHex = "FF";
    note =
      "执行 mov al, 0xFF：仅更新最低 8 位！位 8 ~ 63 全部保持原有旧值不变。";
  }

  const activeInfo = SLICE_INFO[activeSlice] ?? SLICE_INFO.eax;

  return (
    <AutoMath>
      <div className="not-prose my-6 overflow-hidden rounded-2xl border border-border bg-surface/80 p-4 shadow-xs backdrop-blur-xs transition-colors md:p-6">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <h4 className="text-sm font-bold text-ink">
              x86-64 寄存器物理分片拓扑与 32 位清零硬件机制
            </h4>
          </div>
          <span className="rounded-md border border-border/80 bg-surface px-2 py-0.5 font-mono text-[11px] text-muted">
            以累加器 RAX 为例
          </span>
        </div>

        {/* 交互模拟写入控制器 */}
        <div className="mb-5 rounded-xl border border-border/70 bg-[var(--kde-panel,#eff0f1)]/50 p-3 dark:bg-[var(--kde-panel,#282d33)]/50">
          <div className="mb-2 text-xs font-semibold text-ink">
            🎮 交互模拟：向子寄存器注入写入指令
          </div>
          <div className="flex flex-wrap gap-2">
            <KdeButton
              size="xs"
              variant={op === "write-32" ? "primary" : "default"}
              onClick={() => setOp("write-32")}
            >
              mov eax, 42 (32位清零演示)
            </KdeButton>
            <KdeButton
              size="xs"
              variant={op === "full-64" ? "primary" : "default"}
              onClick={() => setOp("full-64")}
            >
              mov rax, 0x1122... (64位全量)
            </KdeButton>
            <KdeButton
              size="xs"
              variant={op === "write-16" ? "primary" : "default"}
              onClick={() => setOp("write-16")}
            >
              mov ax, 0xABCD (16位写入保留高位)
            </KdeButton>
            <KdeButton
              size="xs"
              variant={op === "write-8" ? "primary" : "default"}
              onClick={() => setOp("write-8")}
            >
              mov al, 0xFF (8位写入)
            </KdeButton>
          </div>
        </div>

        {/* 64-bit Register Visual Slicing Bar */}
        <div className="space-y-2">
          {/* Bit range indices */}
          <div className="grid grid-cols-8 text-center font-mono text-[10px] text-muted">
            <span className="text-left font-bold">63 (高位)</span>
            <span />
            <span />
            <span className="text-right">32</span>
            <span className="text-left font-bold">31</span>
            <span className="text-right">16</span>
            <span className="font-bold">15 8</span>
            <span className="text-right font-bold">7 0</span>
          </div>

          {/* Slicing diagram visual bars */}
          <div className="overflow-hidden rounded-xl border border-border/80 bg-background shadow-inner">
            {/* Level 1: RAX (64-bit) */}
            <div
              className={`flex items-center justify-between border-b border-border/60 p-2.5 transition-colors cursor-pointer ${
                activeSlice === "rax"
                  ? "bg-accent/15 border-accent/40"
                  : "hover:bg-surface-hover"
              }`}
              onClick={() => setActiveSlice("rax")}
            >
              <div className="flex items-center gap-2">
                <span className="rounded bg-accent/20 px-1.5 py-0.5 font-mono text-xs font-bold text-accent">
                  RAX
                </span>
                <span className="text-xs font-semibold text-ink">
                  全量 64 位寄存器 (0 ~ 63)
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-ink">
                0x{high32Hex}
                {eaxHigh16Hex}
                {ahHex}
                {alHex}
              </span>
            </div>

            {/* Level 2: High 32 bits vs EAX (32-bit) */}
            <div className="grid grid-cols-2 divide-x divide-border/60 border-b border-border/60 font-mono text-xs">
              <div
                className={`p-2 transition-colors cursor-pointer ${
                  activeSlice === "high32"
                    ? "bg-amber-500/20"
                    : "bg-surface/40 hover:bg-surface"
                }`}
                onClick={() => setActiveSlice("high32")}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted">
                    RAX[63:32] 高 32 位
                  </span>
                  <span
                    className={`font-bold ${
                      op === "write-32"
                        ? "text-amber-600 dark:text-amber-400 font-extrabold"
                        : "text-ink"
                    }`}
                  >
                    0x{high32Hex}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted">
                  {op === "write-32"
                    ? "⚡ 硬件强制清零 (0x00000000)"
                    : "保留或全量载入位"}
                </div>
              </div>

              <div
                className={`p-2 transition-colors cursor-pointer ${
                  activeSlice === "eax"
                    ? "bg-sky-500/20"
                    : "bg-surface/60 hover:bg-surface"
                }`}
                onClick={() => setActiveSlice("eax")}
              >
                <div className="flex items-center justify-between">
                  <span className="rounded bg-sky-500/20 px-1 py-0.5 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                    EAX (32 位)
                  </span>
                  <span className="font-bold text-ink">
                    0x{eaxHigh16Hex}
                    {ahHex}
                    {alHex}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted">
                  位 0 ~ 31（写入时触发高位清零机制）
                </div>
              </div>
            </div>

            {/* Level 3: EAX high 16 vs AX (16-bit) */}
            <div className="grid grid-cols-4 divide-x divide-border/60 border-b border-border/60 font-mono text-xs">
              <div className="col-span-2 bg-surface/20 p-1.5 text-center text-[10px] text-muted/60">
                (已折叠在高 32 位中)
              </div>
              <div className="bg-surface/30 p-1.5 text-center text-[10px] text-muted">
                EAX[31:16] (0x{eaxHigh16Hex})
              </div>
              <div
                className={`p-1.5 transition-colors cursor-pointer ${
                  activeSlice === "ax"
                    ? "bg-indigo-500/20"
                    : "bg-surface/50 hover:bg-surface"
                }`}
                onClick={() => setActiveSlice("ax")}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    AX (16位)
                  </span>
                  <span className="font-bold text-ink">
                    0x{ahHex}
                    {alHex}
                  </span>
                </div>
              </div>
            </div>

            {/* Level 4: AH (8-bit) and AL (8-bit) */}
            <div className="grid grid-cols-8 divide-x divide-border/60 font-mono text-xs">
              <div className="col-span-6 bg-surface/10 p-1 text-center text-[10px] text-muted/50">
                (位 16 ~ 63 保持不变)
              </div>
              <div
                className={`p-1.5 text-center transition-colors cursor-pointer ${
                  activeSlice === "ah"
                    ? "bg-emerald-500/20"
                    : "bg-surface/60 hover:bg-surface"
                }`}
                onClick={() => setActiveSlice("ah")}
              >
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  AH (8位)
                </div>
                <div className="font-bold text-ink">0x{ahHex}</div>
              </div>
              <div
                className={`p-1.5 text-center transition-colors cursor-pointer ${
                  activeSlice === "al"
                    ? "bg-rose-500/20"
                    : "bg-surface/60 hover:bg-surface"
                }`}
                onClick={() => setActiveSlice("al")}
              >
                <div className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                  AL (8位)
                </div>
                <div className="font-bold text-ink">0x{alHex}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Explanation & Insight Card */}
        <div className="mt-4 rounded-xl border border-border/80 bg-surface p-3.5">
          <div className="flex items-center justify-between border-b border-border/50 pb-2">
            <span className="text-xs font-bold text-ink">
              💡 当前选定分片说明：{activeInfo.label}
            </span>
            <span className="font-mono text-[11px] text-muted">
              {activeInfo.bits}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {activeInfo.desc}
          </p>
          <div className="mt-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-xs font-medium text-amber-900 dark:text-amber-200">
            <strong>硬件物理行为</strong>：{note}
          </div>
        </div>
      </div>
    </AutoMath>
  );
}
