"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type Time,
  LineSeries,
  AreaSeries,
} from "lightweight-charts";
import type { EquityPoint } from "@/types/backtest";
import { formatCurrency } from "@/types/backtest";

interface EquityChartProps {
  equityCurve: EquityPoint[];
}

export function EquityChart({ equityCurve }: EquityChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const equitySeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const drawdownSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || equityCurve.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
      },
      width: chartContainerRef.current.clientWidth,
      height: 350,
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.03)" },
        horzLines: { color: "rgba(255, 255, 255, 0.03)" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.1)",
      },
      crosshair: {
        vertLine: {
          color: "rgba(6, 182, 212, 0.3)",
          labelBackgroundColor: "#0891b2",
        },
        horzLine: {
          color: "rgba(6, 182, 212, 0.3)",
          labelBackgroundColor: "#0891b2",
        },
      },
    });

    chartRef.current = chart;

    const equitySeries = chart.addSeries(AreaSeries, {
      lineColor: "#06b6d4",
      topColor: "rgba(6, 182, 212, 0.3)",
      bottomColor: "rgba(6, 182, 212, 0.02)",
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => formatCurrency(price, 0),
      },
    });

    equitySeriesRef.current = equitySeries;

    const equityData = equityCurve.map((point) => ({
      time: Math.floor(point.timestamp / 1000) as Time,
      value: point.balance,
    }));

    equitySeries.setData(equityData);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      equitySeriesRef.current = null;
      drawdownSeriesRef.current = null;
    };
  }, [equityCurve]);

  const startBalance = equityCurve[0]?.balance || 0;
  const endBalance = equityCurve[equityCurve.length - 1]?.balance || 0;
  const peakBalance = Math.max(...equityCurve.map((p) => p.balance));
  const maxDrawdown = Math.max(...equityCurve.map((p) => p.drawdown));
  const maxDrawdownPercent = Math.max(...equityCurve.map((p) => p.drawdownPercent));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
          <div className="text-xs text-slate-500">Start Balance</div>
          <div className="text-sm font-semibold text-white mt-0.5">{formatCurrency(startBalance)}</div>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
          <div className="text-xs text-slate-500">End Balance</div>
          <div className={`text-sm font-semibold mt-0.5 ${endBalance >= startBalance ? "text-green-400" : "text-red-400"}`}>
            {formatCurrency(endBalance)}
          </div>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
          <div className="text-xs text-slate-500">Peak Balance</div>
          <div className="text-sm font-semibold text-cyan-400 mt-0.5">{formatCurrency(peakBalance)}</div>
        </div>
        <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3">
          <div className="text-xs text-slate-500">Max Drawdown</div>
          <div className="text-sm font-semibold text-red-400 mt-0.5">
            {formatCurrency(maxDrawdown)} ({maxDrawdownPercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/5 bg-black/20 overflow-hidden">
        <div ref={chartContainerRef} className="w-full" style={{ height: 350 }} />
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-cyan-400 rounded" />
          <span>Equity Curve</span>
        </div>
      </div>
    </div>
  );
}
