"use client";

import type { PortfolioSnapshot } from "@/types/swarm";

interface EquityCurveLargeProps {
  data: PortfolioSnapshot[];
}

export function EquityCurveLarge({ data }: EquityCurveLargeProps) {
  if (!data.length) {
    return (
      <div className="bg-slate-800/50 border border-white/5 rounded-xl p-6 text-center text-slate-500">
        No performance data available yet.
      </div>
    );
  }

  const values = data.map((d) => d.total_value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // SVG dimensions
  const width = 800;
  const height = 200;
  const padding = 20;

  const points = data
    .map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.total_value - minVal) / range) * (height - 2 * padding);
      return `${x},${y}`;
    })
    .join(" ");

  const isPositive = data[data.length - 1].total_pnl >= 0;
  const strokeColor = isPositive ? "#34d399" : "#f87171";
  const fillColor = isPositive ? "rgba(52, 211, 153, 0.1)" : "rgba(248, 113, 113, 0.1)";

  // Area path
  const firstX = padding;
  const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding);
  const areaPath = `M ${firstX},${height - padding} L ${points} L ${lastX},${height - padding} Z`;

  return (
    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Equity Curve</h3>
        <div className="flex gap-4 text-xs text-slate-400">
          <span>Min: ${minVal.toLocaleString()}</span>
          <span>Max: ${maxVal.toLocaleString()}</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="none">
        <path d={areaPath} fill={fillColor} />
        <polyline
          points={points}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="flex justify-between text-xs text-slate-600 mt-2">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
