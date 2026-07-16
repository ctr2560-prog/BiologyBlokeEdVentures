"use client";
/*
 * Elegant CSS-driven chart components, no heavy chart dependency needed for
 * the MVP. Each wraps in an AnalyticsChartCard for consistent framing.
 */
import type { ReactNode } from "react";

export function AnalyticsChartCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-black/5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="display text-base font-semibold text-forest-900">{title}</h3>
          {subtitle && <p className="text-xs text-charcoal-soft">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

interface Datum {
  label: string;
  value: number;
}

const PALETTE = ["#3d7a5e", "#4f9776", "#72b493", "#9bd0b2", "#d4a373", "#5c8aa8", "#a47148"];

export function BarChart({
  data,
  unit = "",
  tone,
}: {
  data: Datum[];
  unit?: string;
  tone?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs font-medium text-charcoal-soft" title={d.label}>
            {d.label}
          </span>
          <div className="h-6 flex-1 overflow-hidden rounded-full bg-charcoal/5">
            <div
              className="grow-bar flex h-full items-center justify-end rounded-full px-2 text-[0.65rem] font-bold text-white"
              style={{
                width: `${Math.max((d.value / max) * 100, 8)}%`,
                background: tone ?? PALETTE[i % PALETTE.length],
              }}
            >
              {d.value > 0 ? `${d.value}${unit}` : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ data }: { data: Datum[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), 0);
  const range = max - min || 1;
  const w = 100;
  const h = 40;
  const points = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * w : w / 2;
    const y = h - ((d.value - min) / range) * h;
    return { x, y, ...d };
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-32 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#72b493" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#72b493" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#lc)" />
        <path d={path} fill="none" stroke="#3d7a5e" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r="1.6" fill="#3d7a5e" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[0.65rem] font-medium text-charcoal-soft">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({
  value,
  label,
  color = "#3d7a5e",
}: {
  value: number;
  label: string;
  color?: string;
}) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#dce4da" strokeWidth="10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s ease" }}
        />
      </svg>
      <div className="-mt-[4.6rem] flex flex-col items-center">
        <span className="display text-2xl font-bold text-charcoal">{value}%</span>
      </div>
      <span className="mt-8 text-xs font-medium text-charcoal-soft">{label}</span>
    </div>
  );
}
