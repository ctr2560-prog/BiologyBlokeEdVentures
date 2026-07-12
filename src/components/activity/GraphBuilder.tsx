"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { GraphBlock } from "@/types";

type DataPoint = { x: string; y: number };

type ChartType = "bar" | "line" | "scatter";

const CHART_W = 500;
const CHART_H = 280;
const PAD = { top: 24, right: 20, bottom: 56, left: 52 };
const INNER_W = CHART_W - PAD.left - PAD.right;
const INNER_H = CHART_H - PAD.top - PAD.bottom;

const FOREST = "#2d6a4f";
const GRID = "#e4ddd1";

function Chart({
  points,
  chartType,
  xLabel,
  yLabel,
}: {
  points: DataPoint[];
  chartType: ChartType;
  xLabel: string;
  yLabel: string;
}) {
  if (points.length === 0) {
    return (
      <svg width={CHART_W} height={CHART_H} className="w-full rounded-2xl bg-cream">
        <text x={CHART_W / 2} y={CHART_H / 2} textAnchor="middle" fill="#9c9585" fontSize={13}>
          Add data points to see your chart
        </text>
      </svg>
    );
  }

  const yValues = points.map((p) => p.y);
  const yMin = 0;
  const yMax = Math.max(...yValues, 1);
  const yRange = yMax - yMin || 1;

  const toY = (v: number) => PAD.top + INNER_H - ((v - yMin) / yRange) * INNER_H;

  // Y gridlines & ticks (5 steps)
  const yTicks = Array.from({ length: 6 }, (_, i) => yMin + (yRange / 5) * i);

  const slotW = INNER_W / Math.max(points.length, 1);
  const barW = Math.min(slotW * 0.55, 40);

  // X positions
  const xPos = (i: number) =>
    chartType === "scatter"
      ? PAD.left + (i / Math.max(points.length - 1, 1)) * INNER_W
      : PAD.left + slotW * i + slotW / 2;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${toY(p.y)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="w-full rounded-2xl bg-cream"
      style={{ fontFamily: "inherit" }}
    >
      {/* Y gridlines */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left} y1={toY(v)}
            x2={PAD.left + INNER_W} y2={toY(v)}
            stroke={GRID} strokeWidth={1}
          />
          <text
            x={PAD.left - 6} y={toY(v) + 4}
            textAnchor="end" fill="#9c9585" fontSize={10}
          >
            {Number.isInteger(v) ? v : v.toFixed(1)}
          </text>
        </g>
      ))}

      {/* Axes */}
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + INNER_H} stroke="#6b6456" strokeWidth={1.5} />
      <line x1={PAD.left} y1={PAD.top + INNER_H} x2={PAD.left + INNER_W} y2={PAD.top + INNER_H} stroke="#6b6456" strokeWidth={1.5} />

      {/* Bars */}
      {chartType === "bar" && points.map((p, i) => (
        <rect
          key={i}
          x={xPos(i) - barW / 2}
          y={toY(p.y)}
          width={barW}
          height={toY(0) - toY(p.y)}
          rx={4}
          fill={FOREST}
          fillOpacity={0.8}
        />
      ))}

      {/* Line */}
      {chartType === "line" && (
        <path d={linePath} stroke={FOREST} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      )}

      {/* Scatter / line dots */}
      {(chartType === "scatter" || chartType === "line") && points.map((p, i) => (
        <circle key={i} cx={xPos(i)} cy={toY(p.y)} r={5} fill={FOREST} />
      ))}

      {/* X labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={xPos(i)}
          y={PAD.top + INNER_H + 16}
          textAnchor="middle"
          fill="#6b6456"
          fontSize={10}
        >
          {p.x.length > 8 ? `${p.x.slice(0, 7)}…` : p.x}
        </text>
      ))}

      {/* Axis labels */}
      <text
        x={PAD.left + INNER_W / 2}
        y={CHART_H - 6}
        textAnchor="middle"
        fill="#6b6456"
        fontSize={11}
        fontWeight={600}
      >
        {xLabel}
      </text>
      <text
        x={14}
        y={PAD.top + INNER_H / 2}
        textAnchor="middle"
        fill="#6b6456"
        fontSize={11}
        fontWeight={600}
        transform={`rotate(-90,14,${PAD.top + INNER_H / 2})`}
      >
        {yLabel}
      </text>
    </svg>
  );
}

export function GraphBuilder({
  block,
  value,
  onChange,
  disabled,
}: {
  block: GraphBlock;
  value?: { dataPoints: DataPoint[]; dataUrl?: string };
  onChange: (data: { dataPoints: DataPoint[]; dataUrl: string }) => void;
  disabled?: boolean;
}) {
  const [points, setPoints] = useState<DataPoint[]>(value?.dataPoints ?? [{ x: "", y: 0 }]);
  const [chartType, setChartType] = useState<ChartType>(block.chartType);

  const update = (next: DataPoint[]) => {
    setPoints(next);
    const filled = next.filter((p) => p.x.trim());
    if (!filled.length) return;
    onChange({ dataPoints: next, dataUrl: "" });
  };

  const addRow = () => update([...points, { x: "", y: 0 }]);

  const removeRow = (i: number) => update(points.filter((_, idx) => idx !== i));

  const setX = (i: number, val: string) => {
    const next = points.map((p, idx) => (idx === i ? { ...p, x: val } : p));
    update(next);
  };

  const setY = (i: number, val: string) => {
    const n = parseFloat(val);
    const next = points.map((p, idx) => (idx === i ? { ...p, y: isNaN(n) ? 0 : n } : p));
    update(next);
  };

  const validPoints = points.filter((p) => p.x.trim());
  const types: ChartType[] = ["bar", "line", "scatter"];

  return (
    <div className="space-y-4">
      <p className="font-semibold text-forest-900">{block.prompt}</p>

      {/* Chart type selector */}
      {!disabled && (
        <div className="flex items-center gap-2">
          {types.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setChartType(t)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold capitalize transition ${
                chartType === t
                  ? "bg-forest-700 text-cream"
                  : "bg-cream text-charcoal-soft ring-1 ring-sand-dark hover:bg-forest-50 hover:text-forest-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Live chart */}
      <Chart
        points={validPoints}
        chartType={chartType}
        xLabel={block.xLabel}
        yLabel={block.yLabel}
      />

      {/* Data entry table */}
      {!disabled && (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-xs font-bold uppercase tracking-wide text-charcoal-soft">
            <span>{block.xLabel}</span>
            <span>{block.yLabel}</span>
            <span />
          </div>
          {points.map((p, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
              <input
                type="text"
                value={p.x}
                placeholder={`${block.xLabel} ${i + 1}`}
                onChange={(e) => setX(i, e.target.value)}
                className="rounded-xl border border-sand-dark px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
              />
              <input
                type="number"
                value={p.y}
                onChange={(e) => setY(i, e.target.value)}
                className="rounded-xl border border-sand-dark px-3 py-2 text-sm focus:border-forest-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                disabled={points.length === 1}
                className="rounded-lg p-1.5 text-charcoal-soft transition hover:bg-clay-50 hover:text-clay-600 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 rounded-full bg-forest-50 px-4 py-2 text-xs font-semibold text-forest-700 transition hover:bg-forest-100"
          >
            <Plus className="h-3.5 w-3.5" /> Add row
          </button>
        </div>
      )}

      {/* Read-only view for submitted */}
      {disabled && validPoints.length > 0 && (
        <div className="rounded-2xl bg-cream p-3 ring-1 ring-sand-dark">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-bold text-charcoal-soft">
                <th className="pb-1 text-left">{block.xLabel}</th>
                <th className="pb-1 text-left">{block.yLabel}</th>
              </tr>
            </thead>
            <tbody>
              {validPoints.map((p, i) => (
                <tr key={i} className={i % 2 ? "bg-sand/20" : ""}>
                  <td className="py-0.5">{p.x}</td>
                  <td className="py-0.5">{p.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
