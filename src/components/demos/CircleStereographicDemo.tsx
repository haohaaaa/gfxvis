import { useState } from "react";
import {
  drawAdaptiveAxes,
  drawPoint,
  drawPolyline,
} from "../../visualizations/core/2d/plot2d";
import type { Point2 } from "../../visualizations/scenes/graphics/bezier-splines";
import CanvasViewport from "../framework/CanvasViewport";
import AutoMath from "../framework/AutoMath";
import ExpandableDemo from "../framework/ExpandableDemo";
import InteractiveViewportGroup from "../framework/InteractiveViewportGroup";
import KdeCard from "../framework/KdeCard";
import KdeReadout from "../framework/KdeReadout";
import KdeWindowShell from "../framework/KdeWindowShell";
import ParamSlider from "../framework/ParamSlider";
import PresetSelector, { type PresetOption } from "../framework/PresetSelector";

import "./CircleStereographicDemo.css";
import "./BezierSplineWorkspace.css";

const COLOR_CIRCLE = "#3daee9"; // Blue
const COLOR_SECANT = "#f67400"; // Orange
const COLOR_POLE = "#da4453"; // Red
const COLOR_X = "#3daee9"; // cosθ Blue
const COLOR_Y = "#27ae60"; // sinθ Green
const COLOR_SUM = "#9b59b6"; // Sum Purple

type PresetKey = "zero" | "quarter" | "orthogonal" | "onetwenty" | "south";

interface PresetConfig {
  label: string;
  desc: string;
  t: number;
}

const PRESETS: Record<PresetKey, PresetConfig> = {
  zero: {
    label: "t = 0 (θ = 0°, 半角 0°)",
    desc: "半角正切 0，对应正东极点 (1, 0)",
    t: 0,
  },
  quarter: {
    label: "t = √2 - 1 ≈ 0.414 (θ = 45°, 半角 22.5°)",
    desc: "45° 圆弧中点 (万能代换魔术斜率)",
    t: Math.SQRT2 - 1,
  },
  orthogonal: {
    label: "t = 1 (θ = 90°, 半角 45°)",
    desc: "半角正切 1，对应正北极点 (0, 1)",
    t: 1,
  },
  onetwenty: {
    label: "t = √3 ≈ 1.732 (θ = 120°, 半角 60°)",
    desc: "半角 60°，对应 120° 关键圆弧点",
    t: Math.sqrt(3),
  },
  south: {
    label: "t = -1 (θ = -90°, 半角 -45°)",
    desc: "负半角正切，对应正南极点 (0, -1)",
    t: -1,
  },
};

const PRESET_OPTIONS: PresetOption<PresetKey>[] = [
  { value: "zero", label: PRESETS.zero.label, description: PRESETS.zero.desc },
  {
    value: "quarter",
    label: PRESETS.quarter.label,
    description: PRESETS.quarter.desc,
  },
  {
    value: "orthogonal",
    label: PRESETS.orthogonal.label,
    description: PRESETS.orthogonal.desc,
  },
  {
    value: "onetwenty",
    label: PRESETS.onetwenty.label,
    description: PRESETS.onetwenty.desc,
  },
  {
    value: "south",
    label: PRESETS.south.label,
    description: PRESETS.south.desc,
  },
];

interface FunctionCanvasProps {
  currentT: number;
}

function FunctionCurvesCanvas({ currentT }: FunctionCanvasProps) {
  return (
    <div
      className="circle-stereographic__viewport flex-1"
      data-testid="circle-stereographic-func-viewport"
    >
      <div className="circle-stereographic__viewport-header">
        <span>参数空间 · 有理函数与代数单位圆恒等式</span>
        <span className="circle-stereographic__viewport-caption">
          <AutoMath>{"$x(t)^2 + y(t)^2 \\equiv 1$"}</AutoMath>
        </span>
      </div>
      <CanvasViewport
        initialBounds={{ xMin: -3.2, xMax: 3.2, yMin: -1.6, yMax: 1.6 }}
        equalScale={false}
        className="circle-stereographic__canvas relative flex-1 min-h-[var(--demo-height,14rem)] h-full w-full overflow-hidden"
        onDraw={(ctx, plot, theme) => {
          drawAdaptiveAxes(ctx, plot, theme, "t", "值");

          const samples = 160;
          const xCurve: Point2[] = [];
          const yCurve: Point2[] = [];
          const sumCurve: Point2[] = [];
          const tMin = -3.2;
          const tMax = 3.2;

          for (let i = 0; i <= samples; i++) {
            const t = tMin + (i / samples) * (tMax - tMin);
            const t2 = t * t;
            const denom = 1 + t2;
            const xt = (1 - t2) / denom;
            const yt = (2 * t) / denom;
            xCurve.push([t, xt]);
            yCurve.push([t, yt]);
            sumCurve.push([t, xt * xt + yt * yt]);
          }

          drawPolyline(ctx, plot, xCurve, {
            color: COLOR_X,
            width: 2,
          });
          drawPolyline(ctx, plot, yCurve, {
            color: COLOR_Y,
            width: 2,
          });
          drawPolyline(ctx, plot, sumCurve, {
            color: COLOR_SUM,
            width: 1.5,
            dash: [4, 4],
          });

          // Current t vertical probe line
          const sx = plot.toScreenX(currentT);
          const topY = plot.toScreenY(1.6);
          const bottomY = plot.toScreenY(-1.6);

          ctx.save();
          ctx.strokeStyle = COLOR_SECANT;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(sx, topY);
          ctx.lineTo(sx, bottomY);
          ctx.stroke();
          ctx.restore();

          const curT2 = currentT * currentT;
          const curDenom = 1 + curT2;
          const curX = (1 - curT2) / curDenom;
          const curY = (2 * currentT) / curDenom;

          drawPoint(ctx, plot, currentT, curX, {
            color: COLOR_X,
            radius: 4.5,
            filled: true,
          });
          drawPoint(ctx, plot, currentT, curY, {
            color: COLOR_Y,
            radius: 4.5,
            filled: true,
          });
          drawPoint(ctx, plot, currentT, curX * curX + curY * curY, {
            color: COLOR_SUM,
            radius: 4,
            filled: true,
          });

          // Curve legend
          const legX = plot.toScreenX(1.4);
          const legY = plot.toScreenY(1.4);
          ctx.save();
          ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
          ctx.textAlign = "left";

          ctx.fillStyle = COLOR_X;
          ctx.fillText(`cosθ(t) = ${curX.toFixed(2)}`, legX, legY);
          ctx.fillStyle = COLOR_Y;
          ctx.fillText(`sinθ(t) = ${curY.toFixed(2)}`, legX, legY + 14);
          ctx.fillStyle = COLOR_SUM;
          ctx.fillText("cos²θ+sin²θ ≡ 1", legX, legY + 28);
          ctx.restore();
        }}
      />
    </div>
  );
}

export default function CircleStereographicDemo() {
  const [tParam, setTParam] = useState<number>(Math.SQRT2 - 1);
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>("quarter");

  // Circle point
  const t2 = tParam * tParam;
  const denom = 1 + t2;
  const px = (1 - t2) / denom;
  const py = (2 * tParam) / denom;
  const thetaRad = Math.atan2(py, px);
  const thetaDeg = (thetaRad * 180) / Math.PI;

  const handleSelectPreset = (key: PresetKey) => {
    setSelectedPreset(key);
    setTParam(PRESETS[key].t);
  };

  const handleSliderChange = (val: number) => {
    setTParam(val);
  };

  return (
    <ExpandableDemo id="circle-stereographic">
      <KdeWindowShell
        title="万能公式 · 单位圆的有理三角参数化"
        eyebrow="UNIVERSAL SUBSTITUTION · RATIONAL CIRCLE"
        mark="U"
        modeTag="RATIONAL"
        testId="circle-stereographic-demo"
        className="bezier-spline-workspace"
        display={
          <InteractiveViewportGroup
            columns={1}
            className="circle-stereographic__viewport-group flex-1 h-full"
            items={[
              <div
                key="geom"
                className="circle-stereographic__viewport flex-1"
                data-testid="circle-stereographic-geom-viewport"
              >
                <div className="circle-stereographic__viewport-header">
                  <span>几何空间 · 二倍角与圆周角几何</span>
                  <span className="circle-stereographic__viewport-caption">
                    <AutoMath>
                      {
                        "$P(t) = (\\cos\\theta, \\sin\\theta) = \\left( \\frac{1-t^2}{1+t^2}, \\frac{2t}{1+t^2} \\right)$"
                      }
                    </AutoMath>
                  </span>
                </div>
                <CanvasViewport
                  initialBounds={{
                    xMin: -1.6,
                    xMax: 1.6,
                    yMin: -1.6,
                    yMax: 1.6,
                  }}
                  equalScale
                  className="circle-stereographic__canvas relative flex-1 min-h-[var(--demo-height,18rem)] h-full w-full overflow-hidden"
                  onDraw={(ctx, plot, theme) => {
                    drawAdaptiveAxes(ctx, plot, theme, "x", "y");

                    // 1. Circle perimeter
                    const circleSamples = 120;
                    const circlePts: Point2[] = [];
                    for (let i = 0; i <= circleSamples; i++) {
                      const a = (i / circleSamples) * 2 * Math.PI;
                      circlePts.push([Math.cos(a), Math.sin(a)]);
                    }
                    drawPolyline(ctx, plot, circlePts, {
                      color: COLOR_CIRCLE,
                      width: 2,
                    });

                    // 2. Secant line
                    const secantXStart = -1.4;
                    const secantXEnd = 1.4;
                    const secantPts: Point2[] = [
                      [secantXStart, tParam * (secantXStart + 1)],
                      [secantXEnd, tParam * (secantXEnd + 1)],
                    ];
                    drawPolyline(ctx, plot, secantPts, {
                      color: COLOR_SECANT,
                      width: 1.8,
                      dash: [4, 4],
                    });

                    // 3. Central angle sector
                    const oSx = plot.toScreenX(0);
                    const oSy = plot.toScreenY(0);
                    if (Math.abs(thetaRad) > 1e-4) {
                      const arcR1 = 36;
                      ctx.save();
                      ctx.beginPath();
                      ctx.moveTo(oSx, oSy);
                      ctx.arc(oSx, oSy, arcR1, 0, -thetaRad, thetaRad > 0);
                      ctx.closePath();
                      ctx.fillStyle = "rgba(61, 174, 233, 0.18)";
                      ctx.fill();
                      ctx.strokeStyle = COLOR_CIRCLE;
                      ctx.lineWidth = 1.5;
                      ctx.stroke();

                      const midAngle = -thetaRad / 2;
                      const labelDist = arcR1 + 13;
                      ctx.font =
                        "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
                      ctx.fillStyle = COLOR_CIRCLE;
                      ctx.textAlign = "center";
                      ctx.textBaseline = "middle";
                      ctx.fillText(
                        "θ",
                        oSx + Math.cos(midAngle) * labelDist,
                        oSy + Math.sin(midAngle) * labelDist,
                      );
                      ctx.restore();
                    }

                    // 4. Inscribed angle arc
                    const sSx = plot.toScreenX(-1);
                    const sSy = plot.toScreenY(0);
                    const halfAngleRad = thetaRad / 2;
                    if (Math.abs(halfAngleRad) > 1e-4) {
                      const arcR2 = 42;
                      ctx.save();
                      ctx.beginPath();
                      ctx.moveTo(sSx, sSy);
                      ctx.arc(
                        sSx,
                        sSy,
                        arcR2,
                        0,
                        -halfAngleRad,
                        halfAngleRad > 0,
                      );
                      ctx.closePath();
                      ctx.fillStyle = "rgba(246, 116, 0, 0.18)";
                      ctx.fill();
                      ctx.strokeStyle = COLOR_SECANT;
                      ctx.lineWidth = 1.5;
                      ctx.stroke();

                      const midHalf = -halfAngleRad / 2;
                      const labelHalfDist = arcR2 + 13;
                      ctx.font =
                        "bold 10px ui-monospace, SFMono-Regular, Menlo, monospace";
                      ctx.fillStyle = COLOR_SECANT;
                      ctx.textAlign = "center";
                      ctx.textBaseline = "middle";
                      ctx.fillText(
                        "θ/2",
                        sSx + Math.cos(midHalf) * labelHalfDist,
                        sSy + Math.sin(midHalf) * labelHalfDist,
                      );
                      ctx.restore();
                    }

                    // 5. Pole S(-1, 0)
                    drawPoint(ctx, plot, -1, 0, {
                      color: COLOR_POLE,
                      radius: 5,
                      filled: true,
                    });
                    ctx.fillStyle = COLOR_POLE;
                    ctx.font =
                      "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
                    ctx.textAlign = "right";
                    ctx.fillText("S(-1, 0)", sSx - 8, sSy + 4);

                    // 6. Intercept (0, t)
                    drawPoint(ctx, plot, 0, tParam, {
                      color: COLOR_SECANT,
                      radius: 4.5,
                      filled: true,
                    });
                    ctx.fillStyle = COLOR_SECANT;
                    ctx.font =
                      "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
                    ctx.textAlign = "left";
                    ctx.fillText(
                      `(0, t=${tParam.toFixed(2)})`,
                      plot.toScreenX(0) + 8,
                      plot.toScreenY(tParam) - 4,
                    );

                    // 7. Point P(cosθ, sinθ)
                    drawPoint(ctx, plot, px, py, {
                      color: COLOR_CIRCLE,
                      radius: 6,
                      filled: true,
                    });
                    ctx.fillStyle = COLOR_CIRCLE;
                    ctx.font =
                      "bold 11px ui-monospace, SFMono-Regular, Menlo, monospace";
                    ctx.textAlign = px >= 0 ? "left" : "right";
                    ctx.fillText(
                      `P(${px.toFixed(2)}, ${py.toFixed(2)})`,
                      plot.toScreenX(px) + (px >= 0 ? 8 : -8),
                      plot.toScreenY(py) - 6,
                    );

                    // 8. Vector from origin to P
                    ctx.save();
                    ctx.strokeStyle = theme.border;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(oSx, oSy);
                    ctx.lineTo(plot.toScreenX(px), plot.toScreenY(py));
                    ctx.stroke();
                    ctx.restore();
                  }}
                />
              </div>,
              <FunctionCurvesCanvas key="func" currentT={tParam} />,
            ]}
          />
        }
        controls={
          <div className="nurbs-demo__stack">
            <KdeCard title="典型几何预设" variant="dense">
              <PresetSelector
                label="预设配置:"
                options={PRESET_OPTIONS}
                value={selectedPreset}
                onChange={handleSelectPreset}
                size="xs"
                layout="vertical"
              />
            </KdeCard>

            <KdeCard title="半角正切参数控制" variant="dense">
              <div className="space-y-2">
                <ParamSlider
                  label="$t$"
                  min={-2.5}
                  max={2.5}
                  step={0.01}
                  value={tParam}
                  onChange={handleSliderChange}
                  widthClass="w-full"
                  labelMode="adaptive"
                  digits={3}
                />
                <p className="text-xs text-muted leading-relaxed">
                  拖动半角正切 $t = \tan(\theta/2)$，观察圆周角 $\theta/2$
                  与圆心角 $\theta$ 的二倍角联动及圆周交点。
                </p>
              </div>
            </KdeCard>

            <KdeCard title="数值状态监控" variant="dense">
              <div className="flex flex-col gap-2">
                <KdeReadout
                  label="圆周点 P(t) = (cosθ, sinθ):"
                  value={`(${px.toFixed(4)}, ${py.toFixed(4)})`}
                  variant="accent"
                  dense
                />
                <KdeReadout
                  label="圆心角 θ 与半角 θ/2:"
                  value={`${thetaDeg.toFixed(2)}°`}
                  subValue={`半角 θ/2 = ${(thetaDeg / 2).toFixed(2)}° (t = tan(θ/2) = ${tParam.toFixed(3)})`}
                  variant="default"
                  dense
                />
                <KdeReadout
                  label="代数平方和 cos²θ + sin²θ:"
                  value={(px * px + py * py).toFixed(6)}
                  subValue="恒等于 1.000000 (零误差)"
                  variant="success"
                  dense
                />
              </div>
            </KdeCard>
          </div>
        }
      />
    </ExpandableDemo>
  );
}
