import { useState } from "react";
import {
  MAX_BEZIER_DEGREE,
  MIN_BEZIER_DEGREE,
  appendExtrapolatedControlPoint,
  createBezierPointsForDegree,
  deCasteljauLevels,
  evaluateBezier,
  getBezierLevelLabel,
  getPointsBounds,
  removeLastControlPoint,
  sampleBezier,
  type Point2,
} from "../../visualizations/scenes/graphics/bezier-splines";
import CanvasViewport from "../framework/CanvasViewport";
import ExpandableDemo from "../framework/ExpandableDemo";
import KdeButton from "../framework/KdeButton";
import KdeButtonGroup from "../framework/KdeButtonGroup";
import KdeCard from "../framework/KdeCard";
import KdeCheckbox from "../framework/KdeCheckbox";
import KdeReadout from "../framework/KdeReadout";
import KdeWindowShell from "../framework/KdeWindowShell";
import ParamSlider from "../framework/ParamSlider";

import "./BezierCasteljauDemo.css";
import "./BezierSplineWorkspace.css";

function formatPoint(point: Point2): string {
  return `(${point[0].toFixed(2)}, ${point[1].toFixed(2)})`;
}

function createDefaultHighlightedLevels(levelCount: number): boolean[] {
  return Array.from(
    { length: levelCount },
    (_, index) => index === 0 || index === levelCount - 1,
  );
}

function resizeHighlightedLevels(
  previous: readonly boolean[],
  levelCount: number,
): boolean[] {
  const next = Array.from(
    { length: levelCount },
    (_, index) => previous[index] ?? false,
  );
  next[0] = true;
  next[levelCount - 1] = true;
  return next;
}

function formatBezierFormula(degree: number): string {
  if (degree === 1) return "C(t) = (1-t)P_0 + tP_1";
  if (degree === 2) {
    return "C(t) = (1-t)^2P_0 + 2t(1-t)P_1 + t^2P_2";
  }
  if (degree === 3) {
    return "C(t) = (1-t)^3P_0 + 3t(1-t)^2P_1 + 3t^2(1-t)P_2 + t^3P_3";
  }
  return `C(t) = \\sum_{i=0}^{${degree}} B_i^{${degree}}(t)P_i`;
}

export default function BezierCasteljauDemo() {
  const [t, setT] = useState(0.5);
  const [points, setPoints] = useState<Point2[]>(() =>
    createBezierPointsForDegree(3),
  );
  const [highlightedLevels, setHighlightedLevels] = useState<boolean[]>(() =>
    createDefaultHighlightedLevels(4),
  );

  const degree = points.length - 1;
  const levels = deCasteljauLevels(points, t);
  const curvePoint = evaluateBezier(points, t);

  const setPointsAndPreserveLevels = (nextPoints: Point2[]) => {
    setPoints(nextPoints);
    setHighlightedLevels((previous) =>
      resizeHighlightedLevels(previous, nextPoints.length),
    );
  };

  const increaseDegree = () => {
    if (degree >= MAX_BEZIER_DEGREE) return;
    setPointsAndPreserveLevels(appendExtrapolatedControlPoint(points));
  };

  const decreaseDegree = () => {
    if (degree <= MIN_BEZIER_DEGREE) return;
    setPointsAndPreserveLevels(removeLastControlPoint(points));
  };

  const toggleLevel = (levelIndex: number, checked: boolean) => {
    setHighlightedLevels((previous) => {
      const next = [...previous];
      next[levelIndex] = checked;
      return next;
    });
  };

  const reset = () => {
    const restored = createBezierPointsForDegree(degree);
    setPoints(restored);
    setT(0.5);
    setHighlightedLevels(createDefaultHighlightedLevels(restored.length));
  };

  const formula = formatBezierFormula(degree);
  const highlightedLevelSummary = highlightedLevels
    .map((visible, index) => (visible ? `L${index}` : null))
    .filter((level): level is string => level !== null)
    .join(" · ");

  return (
    <ExpandableDemo id="bezier-casteljau">
      <KdeWindowShell
        title="Bézier · de Casteljau 递归插值"
        eyebrow="BREEZE WORKSPACE · CURVE CONSTRUCTION"
        mark="B"
        modeTag="BEZIER"
        layoutPreset="bottom-split"
        testId="bezier-casteljau-demo"
        className="bezier-spline-workspace"
        tabs={
          <div className="bezier-demo__topbar">
            <div className="bezier-demo__degree-control">
              <span className="bezier-demo__degree-label">次数</span>
              <KdeButtonGroup
                attached={false}
                size="xs"
                testId="bezier-degree-controls"
              >
                <KdeButton
                  size="xs"
                  variant="default"
                  onClick={decreaseDegree}
                  disabled={degree <= MIN_BEZIER_DEGREE}
                  aria-label="减少 Bézier 次数"
                  data-testid="bezier-degree-decrease"
                >
                  −
                </KdeButton>
                <span
                  className="bezier-demo__degree-readout"
                  data-testid="bezier-degree-readout"
                >
                  n = {degree}
                </span>
                <KdeButton
                  size="xs"
                  variant="primary"
                  onClick={increaseDegree}
                  disabled={degree >= MAX_BEZIER_DEGREE}
                  aria-label="增加 Bézier 次数"
                  data-testid="bezier-degree-increase"
                >
                  ＋
                </KdeButton>
              </KdeButtonGroup>
            </div>
            <span className="bezier-demo__topnote">
              选择要观察的递归层级；新控制点沿末端控制边外推
            </span>
          </div>
        }
        display={
          <CanvasViewport
            initialBounds={getPointsBounds(points)}
            margin={34}
            className="bezier-demo__canvas relative flex-1 min-h-[var(--demo-height,18rem)] h-full w-full overflow-hidden"
            onReset={reset}
            onDraw={(ctx, plot, theme, scene) => {
              scene.addAxes();

              // 1. Bézier continuous curve
              scene.addPolyline({
                points: sampleBezier(points),
                color: theme.accent,
                width: 2.8,
              });

              // 2. Control points polygon and draggable handles
              scene.addControlPoints({
                points,
                color: theme.accent,
                radius: 5,
                draggable: true,
                labels: (idx) => `P_${idx}`,
                showPolygon: true,
                polygonColor: theme.muted,
                polygonWidth: 1.4,
                polygonDash: [5, 5],
                onDrag: (index, newPos) => {
                  setPoints((current) =>
                    current.map((pt, ptIndex) =>
                      ptIndex === index ? newPos : pt,
                    ),
                  );
                },
              });

              // 3. Intermediate de Casteljau levels
              levels.forEach((level, levelIndex) => {
                if (levelIndex === 0) return; // Already drawn by addControlPoints
                if (!highlightedLevels[levelIndex]) return;

                const isFinalLevel = levelIndex === levels.length - 1;
                const levelColor = isFinalLevel ? theme.ink : theme.muted;

                if (level.length > 1) {
                  scene.addPolyline({
                    points: level,
                    color: levelColor,
                    width: isFinalLevel ? 2 : 1.5,
                    dash: isFinalLevel ? [] : [3, 4],
                    alpha: isFinalLevel
                      ? 1
                      : Math.max(0.45, 1 - levelIndex * 0.08),
                  });
                }

                level.forEach(([x, y], pointIndex) => {
                  scene.addPoint({
                    at: [x, y],
                    color: levelColor,
                    radius: isFinalLevel ? 5 : 3.5,
                    label: getBezierLevelLabel(
                      levelIndex,
                      pointIndex,
                      level.length,
                    ),
                  });
                });
              });

              // 4. Point on curve C(t)
              scene.addPoint({
                at: curvePoint,
                color: theme.ink,
                radius: 5,
                ring: true,
                label: `C(t) = ${formatPoint(curvePoint)}`,
              });

              scene.render(ctx, plot, theme);
            }}
          />
        }
        controls={
          <div className="bezier-demo__stack">
            <KdeCard title="递归控制" variant="dense">
              <div className="space-y-3">
                <ParamSlider
                  label="$t$"
                  min={0}
                  max={1}
                  step={0.01}
                  value={t}
                  onChange={setT}
                  widthClass="w-full"
                  labelMode="adaptive"
                  display={t.toFixed(2)}
                />
                <p className="bezier-demo__hint">
                  拖动画布上的控制点，或移动参数滑块，观察每一层插值点如何汇聚到曲线点。
                </p>
              </div>
            </KdeCard>
            <KdeCard
              title="显示层级"
              variant="dense"
              testId="bezier-level-toggles"
            >
              <div className="bezier-demo__level-toggle-list">
                {levels.map((level, index) => {
                  const isFinal = index === levels.length - 1;
                  const levelLabels = level.map((_, pointIndex) =>
                    getBezierLevelLabel(index, pointIndex, level.length),
                  );
                  return (
                    <KdeCheckbox
                      key={index}
                      checked={highlightedLevels[index] ?? false}
                      onChange={(checked) => toggleLevel(index, checked)}
                      size="xs"
                      testId={
                        isFinal
                          ? "bezier-level-toggle-final"
                          : `bezier-level-toggle-${index}`
                      }
                      label={
                        isFinal
                          ? `第 ${index} 层：曲线点 C(t)`
                          : index === 0
                            ? `第 0 层：初始控制多边形 (${levelLabels.join(", ")})`
                            : `第 ${index} 层：线段插值点 (${levelLabels.join(", ")})`
                      }
                    />
                  );
                })}
              </div>
              <div
                className="bezier-demo__level-label-list"
                data-testid="bezier-level-label-list"
              >
                {levels.map((level, index) =>
                  highlightedLevels[index] ? (
                    <span
                      key={index}
                      className="bezier-demo__level-label-group"
                    >
                      {level
                        .map((_, pointIndex) =>
                          getBezierLevelLabel(index, pointIndex, level.length),
                        )
                        .join(" · ")}
                    </span>
                  ) : null,
                )}
              </div>
            </KdeCard>
            <KdeCard title="曲线状态" variant="dense">
              <div className="bezier-demo__metric-grid">
                <KdeReadout
                  label="参数 t"
                  value={t.toFixed(2)}
                  subValue={`已激活层级: ${highlightedLevelSummary || "无"}`}
                />
                <KdeReadout
                  label="曲线点 C(t)"
                  value={formatPoint(curvePoint)}
                  subValue={`控制点数量: ${points.length}`}
                />
              </div>
            </KdeCard>
            <KdeCard title="数学定义" variant="dense">
              <div className="bezier-demo__formula-rack">
                <div className="bezier-demo__formula-chip">${formula}$</div>
                <div className="bezier-demo__formula-chip">
                  {"$P_i^k(t) = (1-t)P_i^{k-1}(t) + tP_{i+1}^{k-1}(t)$"}
                </div>
              </div>
            </KdeCard>
          </div>
        }
        footer={
          <div className="bezier-demo__readouts">
            <KdeReadout
              label="递归公式"
              value={`$${formula}$`}
              variant="formula"
            />
            <KdeReadout
              label={`曲线点 C(${t.toFixed(2)})`}
              value={`$${formatPoint(curvePoint)}$`}
              variant="accent"
              testId="bezier-casteljau-point-readout"
            />
            <KdeReadout
              label="控制点数量"
              value={`$n + 1 = ${points.length}$`}
              subValue={`当前次数 n = ${degree}；n 次 Bézier 使用 n + 1 个控制点`}
              testId="bezier-control-point-count"
            />
            <KdeReadout
              label="高亮层级"
              value={highlightedLevelSummary || "无"}
              variant="formula"
              testId="bezier-highlight-summary"
            />
          </div>
        }
      />
    </ExpandableDemo>
  );
}
