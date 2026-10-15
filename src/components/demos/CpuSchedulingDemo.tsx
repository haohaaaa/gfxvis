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
} from "./execution/ExecutionControls";
import { useExecutionPlayback } from "./execution/useExecutionPlayback";
import {
  CPU_PRESETS,
  createCpuTasks,
  simulateExecution,
} from "../../visualizations/scenes/systems/execution-model";

export default function CpuSchedulingDemo() {
  const id = "cpu-scheduling-demo";
  const [threadCount, setThreadCount] = useState(2);
  const [cpuCount, setCpuCount] = useState(1);
  const tasks = useMemo(() => createCpuTasks(threadCount), [threadCount]);
  const result = useMemo(
    () => simulateExecution(tasks, { threadCount, cpuCount }),
    [tasks, threadCount, cpuCount],
  );
  const playback = useExecutionPlayback(result.duration);
  const preset =
    CPU_PRESETS.find(
      (item) => item.threadCount === threadCount && item.cpuCount === cpuCount,
    )?.id ?? "custom";

  return (
    <AutoMath>
      <ExpandableDemo id={id} height="12rem" label="展开 CPU 并发与并行实验">
        <KdeWindowShell
          title="CPU 并发与并行"
          eyebrow="Linux · Threads & Logical CPUs"
          mark="CPU"
          modeTag="时间片轮转"
          testId={id}
          layoutPreset="dense-dock"
          className="execution-demo"
          display={
            <ExecutionCanvas
              id={id}
              tasks={tasks}
              result={result}
              tick={playback.tick}
              mode="cpu"
              inspectionResetKey={playback.resetVersion}
            />
          }
          controls={
            <div className="space-y-3">
              <div className="grid gap-3 lg:grid-cols-3">
                <KdeCard title="线程与执行资源" variant="dense">
                  <PresetSelector
                    options={[...CPU_PRESETS]}
                    value={preset}
                    size="xs"
                    layout="horizontal"
                    onChange={(selected) => {
                      const next = CPU_PRESETS.find(
                        (item) => item.id === selected,
                      );
                      if (!next) return;
                      playback.reset();
                      setThreadCount(next.threadCount);
                      setCpuCount(next.cpuCount);
                    }}
                  />
                  <div className="mt-3">
                    <ExecutionResources
                      threadCount={threadCount}
                      cpuCount={cpuCount}
                      threadLabel="线程数"
                      onThreads={(value) => {
                        playback.reset();
                        setThreadCount(value);
                      }}
                      onCpus={(value) => {
                        playback.reset();
                        setCpuCount(value);
                      }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-muted">
                    每条线程需要 4 tick 计算，每次分配 1
                    tick。参数变更会重置播放进度。
                  </p>
                </KdeCard>
                <ExecutionPlayback
                  playback={playback}
                  duration={result.duration}
                />
                <ExecutionFacts
                  result={result}
                  tick={playback.tick}
                  unit="线程"
                />
              </div>
            </div>
          }
          footer={
            <p className="text-xs text-muted">
              这是确定性的教学模型，不创建真实线程。逻辑 CPU
              数表示可同时承载线程的执行位置，不模拟 Linux 实际调度算法或 SMT
              内部资源竞争。
            </p>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
