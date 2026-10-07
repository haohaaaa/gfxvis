import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { AutoMath } from "../framework/AutoMath";
import CanvasResizer from "../framework/CanvasResizer";
import CanvasToolbar from "../framework/CanvasToolbar";
import ExpandableDemo from "../framework/ExpandableDemo";
import KdeButton from "../framework/KdeButton";
import KdeTabs, { type KdeTabOption } from "../framework/KdeTabs";
import PresetSelector, { type PresetOption } from "../framework/PresetSelector";
import { useCanvas2D } from "../framework/useCanvas2D";
import {
  computeNiceTicks,
  drawArrow,
  drawAxes,
  type Bounds2,
  type Plot2D,
  type ThemeColors,
} from "../../visualizations/core/2d/plot2d";

type WaitMode = "blocking" | "nonblocking";
type CompletionMode = "sync" | "async";
type DemoView = "timeline" | "event-loop";
type PresetId =
  "single-blocking" | "single-async" | "multi-blocking" | "parallel";

type TaskModel = {
  id: string;
  label: string;
  color: string;
  startTick: number;
  computeBefore: number;
  waitDuration: number;
  computeAfter: number;
  waitMode: WaitMode;
  completion: CompletionMode;
};

type TaskPhase = {
  start: number;
  end: number;
  kind: "compute" | "wait";
  label: string;
};

type TimelineFacts = {
  concurrent: boolean;
  parallel: boolean;
  blockedTicks: number;
  activeTicks: number;
};

const MAX_TICK = 24;
const TASK_COLORS = ["accent", "success", "warning", "muted"] as const;

const INITIAL_TASKS: TaskModel[] = [
  {
    id: "task-a",
    label: "A：网络读取",
    color: "accent",
    startTick: 1,
    computeBefore: 2,
    waitDuration: 5,
    computeAfter: 2,
    waitMode: "nonblocking",
    completion: "async",
  },
  {
    id: "task-b",
    label: "B：几何计算",
    color: "success",
    startTick: 2,
    computeBefore: 6,
    waitDuration: 0,
    computeAfter: 0,
    waitMode: "blocking",
    completion: "sync",
  },
  {
    id: "task-c",
    label: "C：日志写入",
    color: "warning",
    startTick: 8,
    computeBefore: 2,
    waitDuration: 4,
    computeAfter: 1,
    waitMode: "blocking",
    completion: "sync",
  },
];

const PRESETS: Record<PresetId, { tasks: TaskModel[]; threads: number }> = {
  "single-blocking": {
    threads: 1,
    tasks: INITIAL_TASKS.map((task) => ({
      ...task,
      waitMode: "blocking",
      completion: "sync",
    })),
  },
  "single-async": {
    threads: 1,
    tasks: INITIAL_TASKS.map((task) => ({
      ...task,
      waitMode: "nonblocking",
      completion: "async",
    })),
  },
  "multi-blocking": {
    threads: 2,
    tasks: INITIAL_TASKS.map((task) => ({ ...task, waitMode: "blocking" })),
  },
  parallel: {
    threads: 2,
    tasks: [
      { ...INITIAL_TASKS[0], startTick: 1, waitMode: "nonblocking" },
      { ...INITIAL_TASKS[1], startTick: 1, computeBefore: 7, waitDuration: 0 },
      { ...INITIAL_TASKS[2], startTick: 3, waitMode: "nonblocking" },
    ],
  },
};

const PRESET_OPTIONS: PresetOption<PresetId>[] = [
  { id: "single-blocking", label: "单线程同步阻塞" },
  { id: "single-async", label: "单线程异步非阻塞" },
  { id: "multi-blocking", label: "多线程同步阻塞" },
  { id: "parallel", label: "多线程并行计算" },
];

const VIEW_OPTIONS: KdeTabOption<DemoView>[] = [
  { id: "timeline", label: "任务时间线" },
  { id: "event-loop", label: "事件循环与协程" },
];

function cloneTasks(tasks: TaskModel[]): TaskModel[] {
  return tasks.map((task) => ({ ...task }));
}

function clampNumber(value: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function phasesFor(task: TaskModel): TaskPhase[] {
  const firstEnd = task.startTick + task.computeBefore;
  const waitEnd = firstEnd + task.waitDuration;
  const finalEnd = waitEnd + task.computeAfter;
  const phases: TaskPhase[] = [];

  if (firstEnd > task.startTick) {
    phases.push({
      start: task.startTick,
      end: firstEnd,
      kind: "compute",
      label: "计算",
    });
  }
  if (waitEnd > firstEnd) {
    phases.push({
      start: firstEnd,
      end: waitEnd,
      kind: "wait",
      label: task.waitMode === "blocking" ? "阻塞等待" : "非阻塞等待",
    });
  }
  if (finalEnd > waitEnd) {
    phases.push({
      start: waitEnd,
      end: finalEnd,
      kind: "compute",
      label: task.completion === "async" ? "恢复后处理" : "返回后处理",
    });
  }

  return phases;
}

function taskEnd(task: TaskModel): number {
  const phases = phasesFor(task);
  return phases.length === 0 ? task.startTick : phases[phases.length - 1].end;
}

function taskColor(color: string, theme: ThemeColors): string {
  if (color === "success") return "#16a34a";
  if (color === "warning") return "#d97706";
  if (color === "muted") return theme.muted;
  return theme.accent;
}

function drawPhase(
  ctx: CanvasRenderingContext2D,
  plot: Plot2D,
  theme: ThemeColors,
  phase: TaskPhase,
  row: number,
  rows: number,
  color: string,
  label: string,
  currentTick?: number,
): void {
  const left = plot.toScreenX(Math.max(0, phase.start));
  const right = plot.toScreenX(Math.min(MAX_TICK, phase.end));
  const top = plot.toScreenY(row + 0.78);
  const bottom = plot.toScreenY(row + 0.22);
  const width = Math.max(1, right - left);

  ctx.save();
  ctx.globalAlpha = phase.kind === "wait" ? 0.35 : 0.78;
  ctx.fillStyle = color;
  ctx.fillRect(left, top, width, bottom - top);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash(phase.kind === "wait" ? [4, 3] : []);
  ctx.strokeRect(left, top, width, bottom - top);
  ctx.setLineDash([]);

  if (width > 34) {
    ctx.fillStyle = theme.ink;
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(phase.label, left + width / 2, top + (bottom - top) / 2);
  }
  ctx.restore();

  if (
    currentTick !== undefined &&
    currentTick >= phase.start &&
    currentTick <= phase.end
  ) {
    const x = plot.toScreenX(currentTick);
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, top - 3);
    ctx.lineTo(x, bottom + 3);
    ctx.stroke();
  }

  void rows;
  void label;
}

function drawTimeline(
  ctx: CanvasRenderingContext2D,
  plot: Plot2D,
  theme: ThemeColors,
  tasks: TaskModel[],
  threads: number,
): void {
  const rows = Math.max(1, threads);
  const xTicks = computeNiceTicks(0, MAX_TICK, 7);
  const yTicks = Array.from({ length: rows }, (_, index) => index + 1);
  drawAxes(ctx, plot, theme, xTicks, yTicks, "时间", "线程");

  tasks.forEach((task, index) => {
    const row = (index % rows) + 1;
    const color = taskColor(task.color, theme);
    phasesFor(task).forEach((phase) =>
      drawPhase(ctx, plot, theme, phase, row, rows, color, task.label),
    );

    const end = taskEnd(task);
    ctx.fillStyle = theme.ink;
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(
      task.label + " · " + end + "t",
      plot.toScreenX(task.startTick),
      plot.toScreenY(row + 0.83),
    );
  });
}

function drawEventLoop(
  ctx: CanvasRenderingContext2D,
  plot: Plot2D,
  theme: ThemeColors,
  tasks: TaskModel[],
  currentTick: number,
): void {
  const rows = Math.max(1, tasks.length);
  const xTicks = computeNiceTicks(0, MAX_TICK, 7);
  const yTicks = Array.from({ length: rows }, (_, index) => index + 1);
  drawAxes(ctx, plot, theme, xTicks, yTicks, "事件循环时间", "协程");
  tasks.forEach((task, index) => {
    const row = index + 1;
    const color = taskColor(task.color, theme);
    phasesFor(task).forEach((phase) =>
      drawPhase(
        ctx,
        plot,
        theme,
        phase,
        row,
        rows,
        color,
        task.label,
        currentTick,
      ),
    );
    ctx.fillStyle = theme.ink;
    ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(task.label, plot.toScreenX(0.2), plot.toScreenY(row + 0.83));
  });

  const currentX = plot.toScreenX(currentTick);
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(currentX, plot.toScreenY(rows + 0.1));
  ctx.lineTo(currentX, plot.toScreenY(0.1));
  ctx.stroke();
  ctx.setLineDash([]);
  drawArrow(ctx, currentX, plot.toScreenY(rows + 0.1), 0, -8, theme.accent);
}

function computeTimelineFacts(
  tasks: TaskModel[],
  threads: number,
): TimelineFacts {
  const activeIntervals = tasks.map((task, index) => ({
    start: task.startTick,
    end: taskEnd(task),
    lane: index % Math.max(1, threads),
  }));
  const computeIntervals = tasks.flatMap((task, index) =>
    phasesFor(task)
      .filter((phase) => phase.kind === "compute")
      .map((phase) => ({ ...phase, lane: index % Math.max(1, threads) })),
  );

  let concurrent = false;
  let parallel = false;
  for (let i = 0; i < activeIntervals.length; i += 1) {
    for (let j = i + 1; j < activeIntervals.length; j += 1) {
      const first = activeIntervals[i];
      const second = activeIntervals[j];
      if (
        Math.max(first.start, second.start) < Math.min(first.end, second.end)
      ) {
        concurrent = true;
      }
    }
  }
  for (let i = 0; i < computeIntervals.length; i += 1) {
    for (let j = i + 1; j < computeIntervals.length; j += 1) {
      const first = computeIntervals[i];
      const second = computeIntervals[j];
      if (
        first.lane !== second.lane &&
        Math.max(first.start, second.start) < Math.min(first.end, second.end)
      ) {
        parallel = true;
      }
    }
  }

  return {
    concurrent,
    parallel: threads > 1 && parallel,
    blockedTicks: tasks.reduce(
      (total, task) =>
        total + (task.waitMode === "blocking" ? task.waitDuration : 0),
      0,
    ),
    activeTicks: tasks.reduce(
      (total, task) => total + taskEnd(task) - task.startTick,
      0,
    ),
  };
}

function loopStatus(task: TaskModel, tick: number): string {
  const phases = phasesFor(task);
  if (tick < task.startTick) return "ready";
  const first = phases[0];
  const wait = phases.find((phase) => phase.kind === "wait");
  const final = phases[phases.length - 1];
  if (first && tick < first.end) return "running";
  if (wait && tick < wait.end) {
    return task.waitMode === "blocking" ? "blocked" : "waiting";
  }
  if (final && tick < final.end) return "resumed";
  return "done";
}

function TaskEditor({
  tasks,
  onChange,
  onAdd,
  onRemove,
}: {
  tasks: TaskModel[];
  onChange: (id: string, patch: Partial<TaskModel>) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2" data-testid="task-editor">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-muted">自由编排任务</span>
        <KdeButton
          size="xs"
          variant="primary"
          onClick={onAdd}
          disabled={tasks.length >= 8}
        >
          ＋ 添加任务
        </KdeButton>
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-lg border border-border/70 bg-surface/70 p-2.5"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: "var(--kde-accent)" }}
                />
                <span className="sr-only">任务名称</span>
                <input
                  className="min-w-0 flex-1 rounded border border-border bg-surface px-2 py-1 text-xs text-ink"
                  value={task.label}
                  aria-label="任务名称"
                  onChange={(event) =>
                    onChange(task.id, { label: event.target.value })
                  }
                />
              </label>
              <KdeButton
                size="xs"
                variant="danger"
                onClick={() => onRemove(task.id)}
                disabled={tasks.length <= 1}
              >
                删除
              </KdeButton>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-muted sm:grid-cols-4">
              <label className="flex flex-col gap-1">
                开始 t
                <input
                  type="number"
                  min={0}
                  max={MAX_TICK}
                  value={task.startTick}
                  aria-label="开始时间"
                  className="rounded border border-border bg-surface px-2 py-1 text-ink"
                  onChange={(event) =>
                    onChange(task.id, {
                      startTick: clampNumber(event.target.value, 0, MAX_TICK),
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                前段计算
                <input
                  type="number"
                  min={0}
                  max={MAX_TICK}
                  value={task.computeBefore}
                  aria-label="等待前计算时长"
                  className="rounded border border-border bg-surface px-2 py-1 text-ink"
                  onChange={(event) =>
                    onChange(task.id, {
                      computeBefore: clampNumber(
                        event.target.value,
                        0,
                        MAX_TICK,
                      ),
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                等待
                <input
                  type="number"
                  min={0}
                  max={MAX_TICK}
                  value={task.waitDuration}
                  aria-label="等待时长"
                  className="rounded border border-border bg-surface px-2 py-1 text-ink"
                  onChange={(event) =>
                    onChange(task.id, {
                      waitDuration: clampNumber(
                        event.target.value,
                        0,
                        MAX_TICK,
                      ),
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                后段计算
                <input
                  type="number"
                  min={0}
                  max={MAX_TICK}
                  value={task.computeAfter}
                  aria-label="等待后计算时长"
                  className="rounded border border-border bg-surface px-2 py-1 text-ink"
                  onChange={(event) =>
                    onChange(task.id, {
                      computeAfter: clampNumber(
                        event.target.value,
                        0,
                        MAX_TICK,
                      ),
                    })
                  }
                />
              </label>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted">
              <label className="flex flex-col gap-1">
                等待方式
                <select
                  value={task.waitMode}
                  aria-label="等待方式"
                  className="rounded border border-border bg-surface px-2 py-1 text-ink"
                  onChange={(event) =>
                    onChange(task.id, {
                      waitMode: event.target.value as WaitMode,
                    })
                  }
                >
                  <option value="blocking">阻塞，占用线程</option>
                  <option value="nonblocking">非阻塞，释放线程</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                完成语义
                <select
                  value={task.completion}
                  aria-label="完成语义"
                  className="rounded border border-border bg-surface px-2 py-1 text-ink"
                  onChange={(event) =>
                    onChange(task.id, {
                      completion: event.target.value as CompletionMode,
                    })
                  }
                >
                  <option value="sync">同步返回</option>
                  <option value="async">异步通知</option>
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineCanvas({
  threads,
  setBounds,
  resetBounds,
  containerRef,
  canvasRef,
}: {
  threads: number;
  setBounds: (bounds: Bounds2) => void;
  resetBounds: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  const bounds = useMemo<Bounds2>(
    () => ({
      xMin: 0,
      xMax: MAX_TICK,
      yMin: 0,
      yMax: Math.max(2, threads + 1),
    }),
    [threads],
  );
  useEffect(() => setBounds(bounds), [bounds, setBounds]);

  return (
    <div
      ref={containerRef}
      className="relative h-[var(--demo-height,20rem)] w-full overflow-hidden rounded-xl border border-border/80 bg-surface/50 shadow-inner"
      data-testid="timeline-canvas"
    >
      <CanvasToolbar onReset={resetBounds} />
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        aria-label="任务时间线画布"
      />
      <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
    </div>
  );
}

function EventLoopCanvas({
  tasks,
  setBounds,
  resetBounds,
  containerRef,
  canvasRef,
}: {
  tasks: TaskModel[];
  setBounds: (bounds: Bounds2) => void;
  resetBounds: () => void;
  containerRef: RefObject<HTMLDivElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}) {
  const bounds = useMemo<Bounds2>(
    () => ({
      xMin: 0,
      xMax: MAX_TICK,
      yMin: 0,
      yMax: Math.max(2, tasks.length + 1),
    }),
    [tasks.length],
  );
  useEffect(() => setBounds(bounds), [bounds, setBounds]);

  return (
    <div
      ref={containerRef}
      className="relative h-[var(--demo-height,20rem)] w-full overflow-hidden rounded-xl border border-border/80 bg-surface/50 shadow-inner"
      data-testid="event-loop-canvas"
    >
      <CanvasToolbar onReset={resetBounds} />
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        aria-label="事件循环与协程画布"
      />
      <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
    </div>
  );
}

export default function ConcurrencyExecutionModelDemo() {
  const [view, setView] = useState<DemoView>("timeline");
  const [timelinePreset, setTimelinePreset] = useState<PresetId>("parallel");
  const [timelineTasks, setTimelineTasks] = useState<TaskModel[]>(
    cloneTasks(PRESETS.parallel.tasks),
  );
  const [timelineThreads, setTimelineThreads] = useState(
    PRESETS.parallel.threads,
  );
  const [loopPreset, setLoopPreset] = useState<PresetId>("single-async");
  const [loopTasks, setLoopTasks] = useState<TaskModel[]>(
    cloneTasks(PRESETS["single-async"].tasks),
  );
  const [loopTick, setLoopTick] = useState(0);
  const [loopPlaying, setLoopPlaying] = useState(false);

  const timelineRef = useRef({
    tasks: timelineTasks,
    threads: timelineThreads,
  });
  timelineRef.current = { tasks: timelineTasks, threads: timelineThreads };
  const loopRef = useRef({ tasks: loopTasks, tick: loopTick });
  loopRef.current = { tasks: loopTasks, tick: loopTick };

  const timelineCanvas = useCanvas2D(
    {
      initialBounds: { xMin: 0, xMax: MAX_TICK, yMin: 0, yMax: 3 },
      margin: 38,
      draw(ctx, plot, theme) {
        drawTimeline(
          ctx,
          plot,
          theme,
          timelineRef.current.tasks,
          timelineRef.current.threads,
        );
      },
    },
    [timelineTasks, timelineThreads, view],
    [view],
  );

  const loopCanvas = useCanvas2D(
    {
      initialBounds: { xMin: 0, xMax: MAX_TICK, yMin: 0, yMax: 5 },
      margin: 38,
      draw(ctx, plot, theme) {
        drawEventLoop(
          ctx,
          plot,
          theme,
          loopRef.current.tasks,
          loopRef.current.tick,
        );
      },
    },
    [loopTasks, loopTick, view],
    [view],
  );

  useEffect(() => {
    if (!loopPlaying || view !== "event-loop") return;
    const timer = window.setInterval(() => {
      setLoopTick((previous) => {
        if (previous >= MAX_TICK) {
          setLoopPlaying(false);
          return previous;
        }
        return previous + 1;
      });
    }, 420);
    return () => window.clearInterval(timer);
  }, [loopPlaying, view]);

  const updateTimelineTask = useCallback(
    (id: string, patch: Partial<TaskModel>) => {
      setTimelineTasks((tasks) =>
        tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
      );
    },
    [],
  );

  const updateLoopTask = useCallback(
    (id: string, patch: Partial<TaskModel>) => {
      setLoopTasks((tasks) =>
        tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
      );
    },
    [],
  );

  const addTask = useCallback(
    (setter: Dispatch<SetStateAction<TaskModel[]>>) => {
      setter((tasks) => {
        const index = tasks.length + 1;
        return [
          ...tasks,
          {
            id: "task-" + Date.now() + "-" + index,
            label: "新任务 " + index,
            color: TASK_COLORS[tasks.length % TASK_COLORS.length],
            startTick: Math.min(20, 2 + tasks.length * 2),
            computeBefore: 2,
            waitDuration: 3,
            computeAfter: 1,
            waitMode: "nonblocking",
            completion: "async",
          },
        ];
      });
    },
    [],
  );

  const removeTask = useCallback(
    (setter: Dispatch<SetStateAction<TaskModel[]>>, id: string) => {
      setter((tasks) =>
        tasks.length <= 1 ? tasks : tasks.filter((task) => task.id !== id),
      );
    },
    [],
  );

  const applyTimelinePreset = useCallback((id: PresetId) => {
    const preset = PRESETS[id];
    setTimelinePreset(id);
    setTimelineTasks(cloneTasks(preset.tasks));
    setTimelineThreads(preset.threads);
  }, []);

  const applyLoopPreset = useCallback((id: PresetId) => {
    const preset = PRESETS[id];
    setLoopPreset(id);
    setLoopTasks(cloneTasks(preset.tasks));
    setLoopTick(0);
    setLoopPlaying(false);
  }, []);

  const timelineFacts = useMemo(
    () => computeTimelineFacts(timelineTasks, timelineThreads),
    [timelineTasks, timelineThreads],
  );

  const currentLoopStatuses = useMemo(
    () =>
      loopTasks.map((task) => ({ task, status: loopStatus(task, loopTick) })),
    [loopTasks, loopTick],
  );

  return (
    <AutoMath>
      <ExpandableDemo
        id="concurrency-execution-model-demo"
        label="展开执行模型实验"
      >
        <div
          className="flex flex-col gap-4"
          data-component="concurrency-execution-model-demo"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
            <KdeTabs<DemoView>
              options={VIEW_OPTIONS}
              value={view}
              onChange={setView}
              size="sm"
              variant="default"
              label="视图："
              testId="execution-model-tabs"
            />
            <span className="text-xs text-muted">
              {view === "timeline"
                ? "编辑任务、等待方式和执行资源，观察并发与并行"
                : "单线程事件循环，逐步观察协程挂起与恢复"}
            </span>
          </div>

          {view === "timeline" ? (
            <>
              <PresetSelector
                options={PRESET_OPTIONS}
                value={timelinePreset}
                onChange={applyTimelinePreset}
                label="时间线预设："
                size="xs"
                layout="grid"
                columns={2}
                testId="timeline-presets"
              />
              <label className="flex items-center gap-2 text-xs text-muted">
                <span>执行线程：{timelineThreads}</span>
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={timelineThreads}
                  aria-label="执行线程数量"
                  onChange={(event) =>
                    setTimelineThreads(Number(event.target.value))
                  }
                  className="w-40 accent-accent"
                />
              </label>
              <TimelineCanvas
                threads={timelineThreads}
                setBounds={timelineCanvas.setBounds}
                resetBounds={timelineCanvas.resetBounds}
                containerRef={timelineCanvas.containerRef}
                canvasRef={timelineCanvas.canvasRef}
              />
              <div
                className="grid gap-2 sm:grid-cols-4"
                data-testid="timeline-facts"
              >
                <Metric
                  label="任务并发"
                  value={timelineFacts.concurrent ? "存在" : "没有"}
                />
                <Metric
                  label="任务并行"
                  value={timelineFacts.parallel ? "存在" : "没有"}
                />
                <Metric
                  label="阻塞等待"
                  value={String(timelineFacts.blockedTicks) + " tick"}
                />
                <Metric
                  label="活跃时间"
                  value={String(timelineFacts.activeTicks) + " tick"}
                />
              </div>
              <TaskEditor
                tasks={timelineTasks}
                onChange={updateTimelineTask}
                onAdd={() => addTask(setTimelineTasks)}
                onRemove={(id) => removeTask(setTimelineTasks, id)}
              />
            </>
          ) : (
            <>
              <PresetSelector
                options={PRESET_OPTIONS}
                value={loopPreset}
                onChange={applyLoopPreset}
                label="事件循环预设："
                size="xs"
                layout="grid"
                columns={2}
                testId="event-loop-presets"
              />
              <EventLoopCanvas
                tasks={loopTasks}
                setBounds={loopCanvas.setBounds}
                resetBounds={loopCanvas.resetBounds}
                containerRef={loopCanvas.containerRef}
                canvasRef={loopCanvas.canvasRef}
              />
              <div className="flex flex-wrap items-center gap-2">
                <KdeButton
                  size="xs"
                  variant="primary"
                  onClick={() => setLoopPlaying((playing) => !playing)}
                >
                  {loopPlaying ? "暂停" : "自动播放"}
                </KdeButton>
                <KdeButton
                  size="xs"
                  onClick={() =>
                    setLoopTick((tick) => Math.min(MAX_TICK, tick + 1))
                  }
                >
                  单步 +1
                </KdeButton>
                <KdeButton
                  size="xs"
                  onClick={() => {
                    setLoopTick(0);
                    setLoopPlaying(false);
                  }}
                >
                  重置
                </KdeButton>
                <span className="text-xs text-muted">
                  当前事件循环 tick：{loopTick}
                </span>
              </div>
              <div
                className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
                data-testid="event-loop-status"
              >
                {currentLoopStatuses.map(({ task, status }) => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-border/70 bg-surface/70 px-3 py-2"
                  >
                    <div className="text-xs font-medium text-ink">
                      {task.label}
                    </div>
                    <div className="mt-1 text-xs text-muted">{status}</div>
                  </div>
                ))}
              </div>
              <TaskEditor
                tasks={loopTasks}
                onChange={updateLoopTask}
                onAdd={() => addTask(setLoopTasks)}
                onRemove={(id) => removeTask(setLoopTasks, id)}
              />
            </>
          )}
        </div>
      </ExpandableDemo>
    </AutoMath>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-surface/70 px-3 py-2">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}
