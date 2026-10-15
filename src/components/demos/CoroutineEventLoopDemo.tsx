import { useMemo, useState } from "react";
import { AutoMath } from "../framework/AutoMath";
import ExpandableDemo from "../framework/ExpandableDemo";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeWindowShell from "../framework/KdeWindowShell";
import PresetSelector from "../framework/PresetSelector";
import ExecutionCanvas from "./execution/ExecutionCanvas";
import {
  ExecutionFacts,
  ExecutionPlayback,
  ExecutionTaskStates,
} from "./execution/ExecutionControls";
import ExecutionTaskEditor from "./execution/ExecutionTaskEditor";
import { useExecutionPlayback } from "./execution/useExecutionPlayback";
import {
  INITIAL_TASKS,
  simulateExecution,
  type ExecutionTask,
} from "../../visualizations/scenes/systems/execution-model";

const PRESETS = [
  { id: "async", label: "任务挂起等待" },
  { id: "blocking", label: "线程阻塞等待" },
  { id: "long-compute", label: "长计算延迟事件处理" },
];

function presetTasks(preset: string): ExecutionTask[] {
  return INITIAL_TASKS.map((task) => ({
    ...task,
    computeBefore:
      preset === "long-compute" && task.id === "geometry"
        ? 12
        : task.computeBefore,
    waitMode: preset === "blocking" ? "blocking" : "nonblocking",
    completion: "async",
  }));
}

export default function CoroutineEventLoopDemo() {
  const id = "coroutine-event-loop-demo";
  const [tasks, setTasks] = useState<ExecutionTask[]>(() =>
    presetTasks("async"),
  );
  const [preset, setPreset] = useState("async");
  const result = useMemo(
    () => simulateExecution(tasks, { threadCount: 1, cpuCount: 1 }),
    [tasks],
  );
  const playback = useExecutionPlayback(result.duration);
  const edit = (next: ExecutionTask[]) => {
    playback.reset();
    setPreset("custom");
    setTasks(next);
  };

  return (
    <AutoMath>
      <ExpandableDemo id={id} height="12rem" label="展开事件循环与协程实验">
        <KdeWindowShell
          title="事件循环与协程"
          eyebrow="One Thread · Cooperative Tasks"
          mark="LOOP"
          modeTag="单线程协作"
          testId={id}
          layoutPreset="dense-dock"
          className="execution-demo"
          display={
            <ExecutionCanvas
              id={id}
              tasks={tasks}
              result={result}
              tick={playback.tick}
              mode="tasks"
            />
          }
          controls={
            <div className="space-y-3">
              <div className="grid gap-3 lg:grid-cols-3">
                <KdeCard title="等待与执行场景" variant="dense">
                  <PresetSelector
                    options={PRESETS}
                    value={preset}
                    layout="horizontal"
                    size="xs"
                    onChange={(selected) => {
                      playback.reset();
                      setPreset(selected);
                      setTasks(presetTasks(selected));
                    }}
                  />
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <KdeReadout label="承载线程" value="固定 1 条" dense />
                    <KdeReadout label="可用逻辑 CPU" value="固定 1 个" dense />
                  </div>
                  <p className="mt-2 text-[11px] text-muted">
                    计算阶段结束或任务挂起后，事件循环才能接手其他任务。
                    {preset === "custom" ? "当前为自定义场景。" : ""}
                  </p>
                </KdeCard>
                <ExecutionPlayback
                  playback={playback}
                  duration={result.duration}
                />
                <ExecutionFacts result={result} tick={playback.tick} />
              </div>
              <details className="rounded border border-border bg-surface px-3 py-2 text-xs text-muted">
                <summary className="cursor-pointer">
                  协程状态与任务编排（{tasks.length} 个任务）
                </summary>
                <div className="mt-3 space-y-3">
                  <ExecutionTaskStates
                    tasks={tasks}
                    result={result}
                    tick={playback.tick}
                  />
                  <ExecutionTaskEditor tasks={tasks} onChange={edit} />
                </div>
              </details>
            </div>
          }
          footer={
            <p className="text-xs text-muted">
              这是可挂起任务的状态模型，不创建真实线程或调用 Linux
              epoll。单线程没有 CPU
              任务级并行；网络等待结束后，恢复代码仍需等事件循环获得执行机会。
            </p>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
