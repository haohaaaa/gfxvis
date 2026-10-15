import { useState } from "react";
import { AutoMath } from "../framework/AutoMath";
import KdeButton from "../framework/KdeButton";
import KdeBadge from "../framework/KdeBadge";

type FocusMode = "all" | "stack-heap" | "segments";

interface MemorySegment {
  id: string;
  name: string;
  sub: string;
  addressRange: string;
  permissions: "r-x" | "rw-" | "r--" | "---" | "Kernel";
  growth?: "down" | "up";
  colorClass: string;
  borderClass: string;
  description: string;
  details: string;
}

const SEGMENTS: MemorySegment[] = [
  {
    id: "kernel",
    name: "内核虚拟内存空间 (Kernel Space)",
    sub: "Ring 0 专属 · 用户态不可直接访问",
    addressRange: "0xFFFF_8000_0000_0000 ~ 0xFFFF_FFFF_FFFF",
    permissions: "Kernel",
    colorClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    borderClass: "border-rose-500/40",
    description: "操作系统内核、页表、驱动及中断处理服务区域。",
    details:
      "在 x86-64 Linux 中，高地址虚拟内存留给内核。用户态指令若尝试直接访存，MMU 硬件将立即触发 #GP（通用保护错误）或 #PF（页面错误）。",
  },
  {
    id: "stack",
    name: "用户调用栈 (User Stack)",
    sub: "栈顶 RSP · 向低物理地址生长 ▼",
    addressRange: "0x7FFF_FFFF_E000 往下递减",
    permissions: "rw-",
    growth: "down",
    colorClass: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
    borderClass: "border-amber-500/50",
    description: "函数栈帧、返回地址、局部变量与被调用者寄存器保存区。",
    details:
      "栈底固定在最高有效地址处。每执行一次 push 或 sub rsp，RSP 向下沉入更低的物理地址；pop 则上抬。通常上限默认限制为 8MB。",
  },
  {
    id: "mmap",
    name: "内存映射与共享库区 (Memory Mapping / Shared Libraries)",
    sub: "动态链接库 · mmap 系统调用分配区",
    addressRange: "0x7F... 动态随机化映射 (ASLR)",
    permissions: "r-x",
    colorClass: "bg-purple-500/10 text-purple-700 dark:text-purple-300",
    borderClass: "border-purple-500/40",
    description: "加载 libc.so、动态链接库以及通过 mmap 映射的文件数据。",
    details:
      "现代操作系统在此区域放置共享库代码段与数据段，以及用于大块内存分配（>128KB）的匿名私有映射区。",
  },
  {
    id: "free",
    name: "自由未映射虚拟地址空间 (Unmapped Gap)",
    sub: "栈与堆的巨大弹性缓冲对向延伸区",
    addressRange: "动态自由空隙",
    permissions: "---",
    colorClass: "bg-zinc-500/5 text-muted",
    borderClass: "border-dashed border-border/70",
    description: "64 位虚拟地址提供的浩瀚自由空间，无需立即分配物理页帧。",
    details:
      "在 48 位虚拟地址空间下，用户态拥有高达 128TB 的空间。栈从上方往下生长，堆从下方往上生长，中间留有极为广袤的缓冲区。",
  },
  {
    id: "heap",
    name: "运行时运行时堆 (Heap)",
    sub: "brk / sbrk · 向高物理地址生长 ▲",
    addressRange: "0x... 紧随 BSS 向上延伸",
    permissions: "rw-",
    growth: "up",
    colorClass: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
    borderClass: "border-emerald-500/50",
    description: "malloc / free 动态内存分配区，由 brk 边界指针向上推进。",
    details:
      "堆的起始位置在数据段之上。程序调用 malloc 时，glibc 运行时会通过 brk 系统调用将堆顶向高地址推进。",
  },
  {
    id: "bss_data",
    name: "全局数据段 (.data / .bss)",
    sub: "静态数据 · 全局变量",
    addressRange: "0x0040_xxxx 附近",
    permissions: "rw-",
    colorClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    borderClass: "border-blue-500/40",
    description: ".data 保存已初始化的全局变量；.bss 保存未初始化全局变量。",
    details:
      "在 ELF 可执行文件中，.bss 不占用物理磁盘文件体积，由内核载入器在进程启动时映射为全零匿名页面。",
  },
  {
    id: "text",
    name: "代码段 (.text)",
    sub: "只读机器指令 · RIP 寻址",
    addressRange: "0x0040_0000 向上",
    permissions: "r-x",
    colorClass: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
    borderClass: "border-sky-500/50",
    description: "CPU 执行的机器指令段，严格设置为可读可执行、禁止写入。",
    details:
      "代码段标记为 RX（Read-Execute）。任何尝试往代码段写入数据的操作（如写写指针错乱）将直接引发段错误（Segmentation Fault）。",
  },
];

export default function X86MemoryLayoutDiagram() {
  const [selectedId, setSelectedId] = useState<string>("stack");
  const [focus, setFocus] = useState<FocusMode>("stack-heap");

  const selectedSeg = SEGMENTS.find((s) => s.id === selectedId) ?? SEGMENTS[1];

  const visibleSegments = SEGMENTS.filter((seg) => {
    if (focus === "stack-heap") {
      return (
        seg.id === "kernel" ||
        seg.id === "stack" ||
        seg.id === "free" ||
        seg.id === "heap" ||
        seg.id === "text"
      );
    }
    if (focus === "segments") {
      return (
        seg.id === "stack" ||
        seg.id === "mmap" ||
        seg.id === "heap" ||
        seg.id === "bss_data" ||
        seg.id === "text"
      );
    }
    return true;
  });

  return (
    <AutoMath>
      <div className="not-prose my-6 overflow-hidden rounded-2xl border border-border bg-surface/80 p-4 shadow-xs backdrop-blur-xs transition-colors md:p-6">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <h4 className="text-sm font-bold text-ink">
              Linux x86-64 进程虚拟地址空间与栈/堆生长全景
            </h4>
          </div>
          <div className="flex items-center gap-1.5">
            <KdeButton
              size="xs"
              variant={focus === "stack-heap" ? "primary" : "default"}
              onClick={() => setFocus("stack-heap")}
            >
              聚焦：栈与堆生长
            </KdeButton>
            <KdeButton
              size="xs"
              variant={focus === "all" ? "primary" : "default"}
              onClick={() => setFocus("all")}
            >
              全景段分布
            </KdeButton>
          </div>
        </div>

        {/* Two-column layout: Left Diagram Stack, Right Detail Card */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 items-start">
          {/* Left Column: Virtual Memory Column Map */}
          <div className="lg:col-span-7 flex flex-col space-y-1.5 font-mono text-xs">
            {/* High address indicator */}
            <div className="flex items-center justify-between text-[11px] font-bold text-muted px-1">
              <span>▲ 高地址 (0x7FFF_FFFF_FFFF)</span>
              <span className="text-[10px] text-muted/70">用户态顶端</span>
            </div>

            {/* Segment blocks */}
            {visibleSegments.map((seg) => {
              const isSelected = seg.id === selectedId;
              return (
                <div
                  key={seg.id}
                  onClick={() => setSelectedId(seg.id)}
                  className={`group relative rounded-lg border p-2.5 transition-all cursor-pointer ${
                    seg.colorClass
                  } ${seg.borderClass} ${
                    isSelected
                      ? "ring-2 ring-accent font-semibold shadow-sm"
                      : "hover:border-accent/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-ink">
                        {seg.name}
                      </span>
                      {seg.growth === "down" && (
                        <span className="rounded bg-rose-500/20 px-1 py-0.2 text-[10px] font-bold text-rose-600 dark:text-rose-400 animate-pulse">
                          ▼ 向低地址生长 (PUSH)
                        </span>
                      )}
                      {seg.growth === "up" && (
                        <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
                          ▲ 向高地址生长 (BRK)
                        </span>
                      )}
                    </div>
                    <KdeBadge
                      variant={
                        seg.permissions === "Kernel"
                          ? "danger"
                          : seg.permissions === "r-x"
                            ? "primary"
                            : seg.permissions === "rw-"
                              ? "warning"
                              : "default"
                      }
                      size="xs"
                    >
                      {seg.permissions}
                    </KdeBadge>
                  </div>

                  <div className="mt-1 flex items-baseline justify-between text-[10px] text-muted">
                    <span>{seg.sub}</span>
                    <span className="font-mono text-[10px] opacity-80">
                      {seg.addressRange}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Low address indicator */}
            <div className="flex items-center justify-between text-[11px] font-bold text-muted px-1 pt-1">
              <span>▼ 低地址 (0x0000_0000_0000)</span>
              <span className="text-[10px] text-muted/70">
                空指针捕获防线 (0x0 ~ 0x400000)
              </span>
            </div>
          </div>

          {/* Right Column: Segment Deep Dive Inspector */}
          <div className="lg:col-span-5 flex flex-col rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <span className="text-xs font-bold text-ink">
                🔍 内存区域物理剖析
              </span>
              <KdeBadge variant="primary" size="xs">
                {selectedSeg.permissions} 权限
              </KdeBadge>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div>
                <div className="text-[10px] font-bold text-muted uppercase">
                  段标识与属性
                </div>
                <div className="mt-0.5 text-sm font-bold text-ink">
                  {selectedSeg.name}
                </div>
                <div className="font-mono text-[11px] text-muted">
                  {selectedSeg.addressRange}
                </div>
              </div>

              <div className="rounded-lg bg-surface/70 p-2.5 border border-border/50 leading-relaxed text-ink">
                {selectedSeg.description}
              </div>

              <div className="rounded-lg border border-accent/30 bg-accent/10 p-2.5 leading-relaxed text-muted">
                <div className="mb-1 font-bold text-accent text-[11px]">
                  ⚙️ 体系结构与内核行为：
                </div>
                {selectedSeg.details}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AutoMath>
  );
}
