import { useMemo, useState } from "react";
import { AutoMath } from "../framework/AutoMath";
import ExpandableDemo from "../framework/ExpandableDemo";
import KdeCard from "../framework/KdeCard";
import KdeWindowShell from "../framework/KdeWindowShell";
import PresetSelector from "../framework/PresetSelector";
import ExecutionCanvas from "./execution/ExecutionCanvas";
import {
  ExecutionFacts,
  ExecutionPlayback,
  ExecutionResources,
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
  {
    id: "single-blocking",
    label: "单线程同步阻塞",
    threadCount: 1,
    cpuCount: 1,
    nonblocking: false,
  },
  {
    id: "single-async",
    label: "单线程异步等待",
    threadCount: 1,
    cpuCount: 1,
    nonblocking: true,
  },
  {
    id: "multi-blocking",
    label: "多线程／单 CPU",
    threadCount: 2,
    cpuCount: 1,
    nonblocking: false,
  },
  {
    id: "parallel",
    label: "多线程／双 CPU",
    threadCount: 2,
    cpuCount: 2,
    nonblocking: true,
  },
];

function presetTasks(nonblocking: boolean): ExecutionTask[] {
  return INITIAL_TASKS.map((task) => ({
    ...task,
    waitMode: nonblocking ? "nonblocking" : "blocking",
    completion: nonblocking ? "async" : "sync",
  }));
}

export default function TaskSchedulingDemo() {
  const id = "task-scheduling-demo";
  const [tasks, setTasks] = useState<ExecutionTask[]>(() => presetTasks(true));
  const [threadCount, setThreadCount] = useState(2);
  const [cpuCount, setCpuCount] = useState(2);
  const [preset, setPreset] = useState("parallel");
  const result = useMemo(
    () => simulateExecution(tasks, { threadCount, cpuCount }),
    [tasks, threadCount, cpuCount],
  );
  const playback = useExecutionPlayback(result.duration);
  const edit = (next: ExecutionTask[]) => {
    playback.reset();
    setPreset("custom");
    setTasks(next);
  };

  return (
    <AutoMath>
      <ExpandableDemo id={id} height="12rem" label="展开任务调度与等待实验">
        <KdeWindowShell
          title="任务调度与等待"
          eyebrow="Tasks · Workers · Logical CPUs"
          mark="TASK"
          modeTag="资源与等待"
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
                <KdeCard title="场景与执行资源" variant="dense">
                  <PresetSelector
                    options={PRESETS}
                    value={preset}
                    size="xs"
                    layout="grid"
                    columns={2}
                    onChange={(selected) => {
                      const next = PRESETS.find((item) => item.id === selected);
                      if (!next) return;
                      playback.reset();
                      setPreset(selected);
                      setTasks(presetTasks(next.nonblocking));
                      setThreadCount(next.threadCount);
                      setCpuCount(next.cpuCount);
                    }}
                  />
                  <div className="mt-3">
                    <ExecutionResources
                      threadCount={threadCount}
                      cpuCount={cpuCount}
                      onThreads={(value) => {
                        playback.reset();
                        setPreset("custom");
                        setThreadCount(value);
                      }}
                      onCpus={(value) => {
                        playback.reset();
                        setPreset("custom");
                        setCpuCount(value);
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted">
                    就绪时间表示任务何时可以排队，实际执行取决于线程与 CPU
                    是否可用。{preset === "custom" ? "当前为自定义场景。" : ""}
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
                  任务状态与编排（{tasks.length} 个任务）
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
              线程阻塞等待占用工作线程，但不占
              CPU；任务挂起等待不占用工作线程，线程仍可执行其他任务。
              结果交付方式只影响说明，不自动改变调度。模型忽略切换开销。
            </p>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
