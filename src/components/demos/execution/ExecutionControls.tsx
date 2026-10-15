import KdeButton from "../../framework/KdeButton";
import KdeCard from "../../framework/KdeCard";
import KdeReadout from "../../framework/KdeReadout";
import type {
  ExecutionResult,
  ExecutionTask,
} from "../../../visualizations/scenes/systems/execution-model";
import type { useExecutionPlayback } from "./useExecutionPlayback";

export function ExecutionResources({
  threadCount,
  cpuCount,
  onThreads,
  onCpus,
  threadLabel = "工作线程数",
}: {
  threadCount: number;
  cpuCount: number;
  onThreads(value: number): void;
  onCpus(value: number): void;
  threadLabel?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[
        { label: threadLabel, value: threadCount, max: 12, change: onThreads },
        { label: "可用逻辑 CPU 数", value: cpuCount, max: 4, change: onCpus },
      ].map((field) => (
        <label
          key={field.label}
          className="flex flex-col gap-1 text-xs text-muted"
        >
          <span>
            {field.label}：{field.value}
          </span>
          <input
            type="range"
            min={1}
            max={field.max}
            step={1}
            value={field.value}
            aria-label={field.label}
            className="w-full accent-accent"
            onChange={(event) => field.change(Number(event.target.value))}
          />
        </label>
      ))}
    </div>
  );
}

export function ExecutionTaskStates({
  tasks,
  result,
  tick,
}: {
  tasks: readonly ExecutionTask[];
  result: ExecutionResult;
  tick: number;
}) {
  const labels = {
    pending: "尚未就绪",
    ready: "就绪排队",
    running: "执行中",
    blocked: "线程阻塞等待",
    waiting: "任务挂起等待",
    done: "已完成",
  };
  return (
    <KdeCard title="当前任务状态" variant="dense">
      <div className="grid grid-cols-2 gap-2">
        {result.snapshots[tick].tasks.map((state, index) => (
          <KdeReadout
            key={state.taskId}
            label={tasks[index].label}
            value={
              state.status === "running" &&
              state.phase === "after" &&
              tasks[index].waitDuration > 0
                ? tasks[index].completion === "async"
                  ? "恢复后处理"
                  : "返回后处理"
                : labels[state.status]
            }
            subValue={
              state.threadId !== null
                ? `线程 T${state.threadId + 1}${state.cpuId === null ? "" : `／CPU ${state.cpuId}`}`
                : state.status === "waiting"
                  ? "不占用工作线程"
                  : undefined
            }
            variant={
              state.status === "running"
                ? "accent"
                : state.status === "blocked"
                  ? "warning"
                  : "default"
            }
            dense
          />
        ))}
      </div>
    </KdeCard>
  );
}

export function ExecutionPlayback({
  playback,
  duration,
}: {
  playback: ReturnType<typeof useExecutionPlayback>;
  duration: number;
}) {
  return (
    <KdeCard title="播放与时间定位" variant="dense">
      <div className="flex flex-wrap gap-2">
        <KdeButton
          size="xs"
          variant="primary"
          onClick={playback.toggle}
          disabled={duration === 0}
        >
          {playback.playing
            ? "暂停"
            : playback.tick === duration && duration > 0
              ? "重新播放"
              : "播放"}
        </KdeButton>
        <KdeButton
          size="xs"
          onClick={playback.step}
          disabled={playback.tick >= duration}
        >
          单步 +1
        </KdeButton>
        <KdeButton size="xs" onClick={playback.reset}>
          重置进度
        </KdeButton>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-xs text-muted">
        <span>
          当前时间：{playback.tick}／{duration} tick
        </span>
        <input
          type="range"
          min={0}
          max={Math.max(1, duration)}
          step={1}
          value={playback.tick}
          disabled={duration === 0}
          aria-label="时间定位"
          className="w-full accent-accent"
          onChange={(event) => playback.seek(Number(event.target.value))}
        />
      </label>
    </KdeCard>
  );
}

export function ExecutionFacts({
  result,
  tick,
  unit = "任务",
}: {
  result: ExecutionResult;
  tick: number;
  unit?: "线程" | "任务";
}) {
  const frame = result.snapshots[tick];
  const running = frame.tasks.filter(
    (task) => task.status === "running",
  ).length;
  const ready = frame.tasks.filter((task) => task.status === "ready").length;
  return (
    <KdeCard title="此刻状态与全过程结论" variant="dense">
      <div className="grid grid-cols-2 gap-2">
        <KdeReadout
          label={`当前运行${unit}`}
          value={`${running}／${result.cpuCount} CPU`}
          dense
        />
        <KdeReadout label={`当前就绪${unit}`} value={ready} dense />
        <KdeReadout
          label="全过程存在并发"
          value={result.concurrent ? "是" : "否"}
          variant={result.concurrent ? "accent" : "default"}
          dense
        />
        <KdeReadout
          label="全过程出现并行"
          value={result.parallel ? "是" : "否"}
          variant={result.parallel ? "success" : "default"}
          dense
        />
      </div>
      <p className="mt-2 text-[11px] text-muted">
        全过程结论分析整张时间线；当前读数只描述竖线所在时刻。
      </p>
    </KdeCard>
  );
}
