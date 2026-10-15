import { useRef } from "react";
import KdeButton from "../../framework/KdeButton";
import KdeCard from "../../framework/KdeCard";
import KdeTabs from "../../framework/KdeTabs";
import type { ExecutionTask } from "../../../visualizations/scenes/systems/execution-model";

export default function ExecutionTaskEditor({
  tasks,
  onChange,
}: {
  tasks: ExecutionTask[];
  onChange(tasks: ExecutionTask[]): void;
}) {
  const nextId = useRef(1);
  const update = (id: string, patch: Partial<ExecutionTask>) => {
    onChange(
      tasks.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    );
  };
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <div className="flex items-center justify-between gap-2 text-xs text-muted md:col-span-2 xl:col-span-3">
        <span>任务编排（最多 8 个任务）</span>
        <KdeButton
          size="xs"
          disabled={tasks.length >= 8}
          onClick={() => {
            let id: string;
            do {
              id = `custom-${nextId.current++}`;
            } while (tasks.some((task) => task.id === id));
            onChange([
              ...tasks,
              {
                id,
                label: `任务 ${tasks.length + 1}`,
                startTick: 0,
                computeBefore: 2,
                waitDuration: 3,
                computeAfter: 1,
                waitMode: "nonblocking",
                completion: "async",
              },
            ]);
          }}
        >
          添加任务
        </KdeButton>
      </div>
      {tasks.map((task) => (
        <KdeCard
          key={task.id}
          title={task.label || "未命名任务"}
          variant="dense"
        >
          <div className="mb-3 flex gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">任务名称</span>
              <input
                aria-label="任务名称"
                value={task.label}
                className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-ink"
                onChange={(event) =>
                  update(task.id, { label: event.target.value })
                }
              />
            </label>
            <KdeButton
              size="xs"
              variant="danger"
              disabled={tasks.length <= 1}
              onClick={() =>
                onChange(tasks.filter((item) => item.id !== task.id))
              }
            >
              删除
            </KdeButton>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] text-muted">
            {(
              [
                ["startTick", "就绪时间"],
                ["computeBefore", "前段计算"],
                ["waitDuration", "等待时长"],
                ["computeAfter", "后段计算"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex flex-col gap-1">
                {label}
                <input
                  type="number"
                  min={0}
                  max={24}
                  step={1}
                  value={task[key]}
                  aria-label={label}
                  className="w-full rounded border border-border bg-surface px-2 py-1 text-xs text-ink"
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    update(task.id, {
                      [key]: Number.isFinite(value)
                        ? Math.min(24, Math.max(0, Math.round(value)))
                        : 0,
                    });
                  }}
                />
              </label>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            <KdeTabs
              size="xs"
              label="等待："
              value={task.waitMode}
              options={[
                { id: "blocking", label: "线程阻塞等待" },
                { id: "nonblocking", label: "任务挂起等待" },
              ]}
              onChange={(waitMode) => update(task.id, { waitMode })}
            />
            <p className="text-[11px] text-muted">
              线程阻塞等待占用工作线程；任务挂起等待不占用工作线程。
            </p>
            <KdeTabs
              size="xs"
              label="交付："
              value={task.completion}
              options={[
                { id: "sync", label: "同步返回" },
                { id: "async", label: "异步通知" },
              ]}
              onChange={(completion) => update(task.id, { completion })}
            />
          </div>
        </KdeCard>
      ))}
    </div>
  );
}
