import { useState } from "react";
import {
  FIELDS2D,
  type Field2DId,
} from "../../visualizations/scenes/calculus/scalar-field-2d";
import {
  drawAdaptiveAxes,
  drawPolyline,
} from "../../visualizations/core/2d/plot2d";
import CanvasToolbar from "../framework/CanvasToolbar";
import CanvasResizer from "../framework/CanvasResizer";
import ExpandableDemo from "../framework/ExpandableDemo";
import { AutoMath } from "../framework/AutoMath";
import KdeWindowShell from "../framework/KdeWindowShell";
import KdeCard from "../framework/KdeCard";
import KdeTabs from "../framework/KdeTabs";
import KdeReadout from "../framework/KdeReadout";
import ParamSlider from "../framework/ParamSlider";
import { useCanvas2D } from "../framework/useCanvas2D";

const MARGIN = 24;
const REF_COUNT = 5;

type LevelFieldId = Extract<Field2DId, "circle" | "parabola">;

const FIELD_OPTIONS: { id: LevelFieldId; label: string }[] = [
  { id: "circle", label: "圆族" },
  { id: "parabola", label: "抛物线族" },
];

/** 2D level-set explorer: sweep the level curve F(x, y) = c with a slider. */
export default function LevelSetDemo({ height }: { height?: string }) {
  const [fieldId, setFieldId] = useState<LevelFieldId>("circle");
  const [c, setC] = useState(1.5);

  const field = FIELDS2D[fieldId];

  const { containerRef, canvasRef, setBounds, resetBounds } = useCanvas2D(
    {
      initialBounds: FIELDS2D.circle.bounds,
      margin: MARGIN,
      draw(ctx, plot, theme) {
        const f = FIELDS2D[fieldId];
        drawAdaptiveAxes(ctx, plot, theme);

        // A few reference level curves of the family (dashed).
        for (let k = 1; k <= REF_COUNT; k++) {
          const ck = f.cMin + ((f.cMax - f.cMin) * k) / (REF_COUNT + 1);
          drawPolyline(ctx, plot, f.levelCurve?.(ck, 160) ?? [], {
            color: theme.border,
            width: 1.2,
            dash: [4, 4],
            alpha: 0.9,
          });
        }

        // The current level curve F = c (solid accent).
        drawPolyline(ctx, plot, f.levelCurve?.(c, 240) ?? [], {
          color: theme.accent,
          width: 2.2,
        });
      },
    },
    [fieldId, c],
  );

  const handleFieldChange = (id: LevelFieldId): void => {
    setFieldId(id);
    const f = FIELDS2D[id];
    setC(f.defaultC);
    setBounds(f.bounds);
  };

  return (
    <AutoMath>
      <ExpandableDemo id="level-set" height={height}>
        <KdeWindowShell
          title="等值线族与隐函数几何"
          eyebrow="CALCULUS 2D LAB"
          mark="2D"
          modeTag={fieldId === "circle" ? "同心圆族" : "同轴抛物线族"}
          display={
            <div
              ref={containerRef}
              className="relative h-[var(--demo-height,20rem)] w-full overflow-hidden"
            >
              <CanvasToolbar onReset={resetBounds} />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full cursor-crosshair"
              />
              <CanvasResizer className="absolute inset-x-0 bottom-0 z-20" />
            </div>
          }
          controls={
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <KdeTabs
                  options={FIELD_OPTIONS}
                  value={fieldId}
                  onChange={handleFieldChange}
                />
                <ParamSlider
                  label="$c$"
                  min={field.cMin}
                  max={field.cMax}
                  step={0.01}
                  value={c}
                  onChange={setC}
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <KdeCard title="场函数定义" variant="dense">
                  <KdeReadout
                    label="场方程 F(x, y)"
                    value={`$${field.tex}$`}
                    variant="formula"
                    dense
                  />
                </KdeCard>
                <KdeCard title="当前等值线方程" variant="dense">
                  <KdeReadout
                    label={`c = ${c.toFixed(2)}`}
                    value={`$${field.levelTex(c)}$`}
                    variant="accent"
                    dense
                  />
                </KdeCard>
              </div>

              <p className="text-xs text-muted">
                拖动 $c$ 滑块扫描一族等值线：实线为当前
                $F(x,y)=c$，虚线为参考等值线；滚轮缩放，拖拽平移。
              </p>
            </div>
          }
        />
      </ExpandableDemo>
    </AutoMath>
  );
}
