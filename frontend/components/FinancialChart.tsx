"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import React, { useCallback, useEffect, useRef, useState } from "react";

import type { IndicatorParameters } from "@/types/indicators";
import type { DrawingTool } from "@/components/DrawingToolbar";
import { type Drawing, type DrawingState, renderDrawings, generateDrawingId, nextDrawingColor, createDrawingState } from "@/lib/drawings";

export type IndicatorId = string;
export type EnabledIndicators = Record<IndicatorId, boolean>;

interface FinancialChartProps {
  symbol: string;
  interval: string;
  enabledIndicators: EnabledIndicators;
  indicatorParams?: IndicatorParameters;
  activeTool?: DrawingTool;
  drawingState?: DrawingState;
  onDrawingComplete?: (drawing: Drawing) => void;
}

type SrLevel = {
  y: number;
  area: number;
  date: string;
  isSupport: boolean;
};

type SupportResistanceResponse = {
  symbol: string;
  timeframe: string;
  levels: SrLevel[];
};

type SwingPointDto = {
  price: number;
  date: string;
  index: number;
  type: string;
};

type MarketStructureResponse = {
  orderBlocks: Array<{
    orderBlockType: string;
    high: number;
    low: number;
    candleDate: string;
    isMitigated: boolean;
  }>;
  breakerBlocks: Array<{
    breakerBlockType: string;
    high: number;
    low: number;
    candleDate: string;
    isMitigated: boolean;
  }>;
  marketStructureBreaks: Array<{
    type: string;
    date: string;
    breakCandleDate: string;
    brokenSwingPoint: SwingPointDto;
    precedingSwingPoint: SwingPointDto;
    h0_at_break: SwingPointDto;
    l0_at_break: SwingPointDto;
    h1_at_break: SwingPointDto;
    l1_at_break: SwingPointDto;
  }>;
};

type ElliottWaveResponse = {
  zigZagPoints: Array<{
    price: number;
    date: string;
  }>;
  wavePatterns: Array<{
    type: string;
    direction: string;
    points: Array<{
      label: string;
      price: number;
      date: string;
    }>;
  }>;
};

type CandleDto = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5033";
}

function parseApiDateToUnixSeconds(dateString: string): number | null {
  const trimmed = dateString.trim();
  const hasTimezone = /Z$|[+-]\d\d:\d\d$/.test(trimmed);
  const iso = hasTimezone ? trimmed : `${trimmed}Z`;
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;
  return Math.floor(ms / 1000);
}

function snapToSeriesTime(unixSeconds: number, sortedTimes: number[]): number | null {
  if (!sortedTimes.length) return null;
  if (unixSeconds <= sortedTimes[0]) return sortedTimes[0];
  const last = sortedTimes[sortedTimes.length - 1];
  if (unixSeconds >= last) return last;

  let lo = 0;
  let hi = sortedTimes.length - 1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const v = sortedTimes[mid];
    if (v === unixSeconds) return v;
    if (v < unixSeconds) lo = mid + 1;
    else hi = mid - 1;
  }

  const left = sortedTimes[Math.max(0, hi)];
  const right = sortedTimes[Math.min(sortedTimes.length - 1, lo)];
  return Math.abs(unixSeconds - left) <= Math.abs(right - unixSeconds) ? left : right;
}

type OHLCData = {
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
} | null;

export const FinancialChart: React.FC<FinancialChartProps> = ({ symbol, interval, enabledIndicators, indicatorParams = {}, activeTool = "cursor", drawingState, onDrawingComplete }) => {
  const drawingStateRef = useRef<DrawingState>(drawingState ?? createDrawingState());
  const activeToolRef = useRef(activeTool);
  activeToolRef.current = activeTool;
  if (drawingState) drawingStateRef.current = drawingState;
  const tempDrawingRef = useRef<Drawing | null>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartHostRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const candleTimesRef = useRef<number[]>([]);
  const currentCandleRef = useRef<{ time: Time; open: number; high: number; low: number; close: number } | null>(null);
  const isHoveringRef = useRef(false);

  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastCandleTimeRef = useRef<Time | null>(null);

  const [ohlcData, setOhlcData] = useState<OHLCData>(null);

  const allCandlesRef = useRef<Array<{ time: Time; open: number; high: number; low: number; close: number }>>([]);
  const isLoadingHistoryRef = useRef(false);
  const earliestTimestampRef = useRef<number | null>(null);
  const hasMoreHistoryRef = useRef(true);
  const lastFetchedKeyRef = useRef<string>("");


  const srRef = useRef<SupportResistanceResponse | null>(null);
  const msRef = useRef<MarketStructureResponse | null>(null);
  const ewRef = useRef<ElliottWaveResponse | null>(null);

  const indicatorFetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enabledIndicatorsRef = useRef(enabledIndicators);
  enabledIndicatorsRef.current = enabledIndicators;

  const indicatorParamsRef = useRef(indicatorParams);
  indicatorParamsRef.current = indicatorParams;

  const symbolRef = useRef(symbol);
  symbolRef.current = symbol;
  const intervalRef = useRef(interval);
  intervalRef.current = interval;

  const fetchIndicatorsShared = useCallback(async (
    signal: AbortSignal,
    limit: number,
    clearFirst: boolean,
    onCancelled: () => boolean
  ) => {
    const currentEnabled = enabledIndicatorsRef.current;
    const currentParams = indicatorParamsRef.current;
    const sym = symbolRef.current;
    const int = intervalRef.current;
    const base = apiBaseUrl();

    if (clearFirst) {
      srRef.current = null;
      msRef.current = null;
      ewRef.current = null;
    }

    const tasks: Array<Promise<void>> = [];

    if (currentEnabled["support-resistance"]) {
      const srParams = currentParams["support-resistance"] ?? {};
      const atrLength = srParams.atrLength ?? 50;
      const multiplicativeFactor = srParams.multiplicativeFactor ?? 8;
      const extendLast = srParams.extendLast ?? 6;
      tasks.push(
        fetchJson<SupportResistanceResponse>(
          `${base}/api/Indicators/support-resistance/${sym}?interval=${encodeURIComponent(int)}&extendLast=${extendLast}&atrLength=${atrLength}&multiplicativeFactor=${multiplicativeFactor}&limit=${limit}`,
          signal
        ).then((data) => {
          if (!onCancelled()) srRef.current = data;
        }).catch(() => { })
      );
    }

    if (currentEnabled["market-structure"]) {
      const msParams = currentParams["market-structure"] ?? {};
      const zigZagLength = msParams.zigZagLength ?? 7;
      const fibFactor = msParams.fibFactor ?? 0.33;
      tasks.push(
        fetchJson<MarketStructureResponse>(
          `${base}/api/Indicators/market-structure/${sym}?timeframe=${encodeURIComponent(int)}&limit=${limit}&zigZagLength=${zigZagLength}&fibFactor=${fibFactor}`,
          signal
        ).then((data) => {
          if (!onCancelled()) msRef.current = data;
        }).catch(() => { })
      );
    }

    if (currentEnabled["elliott-wave"]) {
      const ewParams = currentParams["elliott-wave"] ?? {};
      const length1 = ewParams.length1 ?? 4;
      const length2 = ewParams.length2 ?? 8;
      const length3 = ewParams.length3 ?? 16;
      const useLength1 = ewParams.useLength1 ?? true;
      const useLength2 = ewParams.useLength2 ?? true;
      const useLength3 = ewParams.useLength3 ?? false;
      tasks.push(
        fetchJson<ElliottWaveResponse>(
          `${base}/api/Indicators/elliott-wave/${sym}?timeframe=${encodeURIComponent(int)}&limit=${Math.max(limit, 1000)}&length1=${length1}&length2=${length2}&length3=${length3}&useLength1=${useLength1}&useLength2=${useLength2}&useLength3=${useLength3}`,
          signal
        ).then((data) => {
          if (!onCancelled()) ewRef.current = data;
        }).catch(() => { })
      );
    }

    await Promise.allSettled(tasks);
  }, []);

  const toOhlcData = (candle: { open: number; high: number; low: number; close: number } | null): OHLCData => {
    if (!candle) return null;
    const change = candle.close - candle.open;
    const changePercent = candle.open !== 0 ? (change / candle.open) * 100 : 0;
    return {
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      change,
      changePercent: Number.isFinite(changePercent) ? changePercent : 0,
    };
  };

  const drawOverlay = useCallback(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    const canvas = overlayCanvasRef.current;
    const host = chartHostRef.current;
    const lastTime = lastCandleTimeRef.current;
    const candleTimes = candleTimesRef.current;

    if (!chart || !candleSeries || !canvas || !host || !lastTime) return;
    if (!candleTimes.length) return;

    const { clientWidth: width, clientHeight: height } = host;
    if (width <= 0 || height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const timeScale = chart.timeScale();
    const paneWidth = timeScale.width() || width;
    const paneHeight = height;

    const xEnd = paneWidth - 1;

    const isCompact = paneWidth < 420;
    const px = (n: number) => Math.round(n) + 0.5;

    const formatPrice = (value: number) => {
      if (!Number.isFinite(value)) return "";
      if (value >= 1000) return value.toFixed(2);
      if (value >= 1) return value.toFixed(4);
      return value.toFixed(6);
    };

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      const radius = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + w, y, x + w, y + h, radius);
      ctx.arcTo(x + w, y + h, x, y + h, radius);
      ctx.arcTo(x, y + h, x, y, radius);
      ctx.arcTo(x, y, x + w, y, radius);
      ctx.closePath();
    };

    const drawBox = (x1: number, x2: number, topPrice: number, bottomPrice: number, fill: string, stroke: string) => {
      const yTop = candleSeries.priceToCoordinate(topPrice);
      const yBottom = candleSeries.priceToCoordinate(bottomPrice);
      if (yTop === null || yBottom === null) return;

      const left = Math.min(x1, x2);
      const right = Math.max(x1, x2);
      const top = Math.min(yTop, yBottom);
      const bottom = Math.max(yTop, yBottom);
      const w = right - left;
      const h = bottom - top;
      if (w <= 1 || h <= 1) return;

      ctx.fillStyle = fill;
      ctx.fillRect(left, top, w, h);
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.strokeRect(px(left), px(top), Math.max(0, w - 1), Math.max(0, h - 1));
    };

    const drawHLine = (y: number, x1: number, x2: number, stroke: string, widthPx = 1) => {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = widthPx;
      ctx.beginPath();
      ctx.moveTo(px(x1), px(y));
      ctx.lineTo(px(x2), px(y));
      ctx.stroke();
    };

    const drawText = (x: number, y: number, text: string, color: string, font = "12px ui-sans-serif, system-ui, -apple-system") => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.fillText(text, x, y);
    };

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, paneWidth, paneHeight);
    ctx.clip();

    const xForDate = (dateString: string): number | null => {
      const t = parseApiDateToUnixSeconds(dateString);
      if (t === null) return null;
      const snapped = snapToSeriesTime(t, candleTimes);
      if (snapped === null) return null;
      return timeScale.timeToCoordinate(snapped as unknown as Time);
    };

    const xForUnixSeconds = (t: number): number | null => {
      const snapped = snapToSeriesTime(t, candleTimes);
      if (snapped === null) return null;
      return timeScale.timeToCoordinate(snapped as unknown as Time);
    };

    const xRightForBlocks = (() => {
      const lastUnix = candleTimes[candleTimes.length - 1];
      const prevUnix = candleTimes.length > 1 ? candleTimes[candleTimes.length - 2] : null;
      const xLast = timeScale.timeToCoordinate(lastUnix as unknown as Time);
      const xPrev = prevUnix !== null ? timeScale.timeToCoordinate(prevUnix as unknown as Time) : null;
      const barStep = xLast !== null && xPrev !== null ? Math.max(1, Math.abs(xLast - xPrev)) : 8;
      const xFuture = xLast !== null ? xLast + barStep * 10 : xEnd;
      return Math.min(xEnd, xFuture);
    })();

    if (enabledIndicatorsRef.current["support-resistance"] && srRef.current?.levels?.length) {
      for (const level of srRef.current.levels) {
        const xStart = xForDate(level.date);
        if (xStart === null) continue;

        const top = Math.max(level.y, level.area);
        const bottom = Math.min(level.y, level.area);
        const isSupport = level.isSupport;

        const fill = isSupport ? "rgba(34, 197, 94, 0.06)" : "rgba(239, 68, 68, 0.06)";
        const stroke = isSupport ? "rgba(34, 197, 94, 0.45)" : "rgba(239, 68, 68, 0.45)";
        const strokeBright = isSupport ? "rgba(34, 197, 94, 0.75)" : "rgba(239, 68, 68, 0.75)";

        drawBox(xStart, xEnd, top, bottom, fill, stroke);

        const yTop = candleSeries.priceToCoordinate(top);
        const yBottom = candleSeries.priceToCoordinate(bottom);

        if (yTop !== null && yBottom !== null) {
          ctx.save();
          ctx.setLineDash([4, 4]);
          drawHLine(yTop, xStart, xEnd, stroke, 1);
          drawHLine(yBottom, xStart, xEnd, stroke, 1);
          ctx.restore();

          const labelX = Math.max(8, xStart + 6);
          const labelY = (yTop + yBottom) / 2;
          const label = isSupport ? "SUP" : "RES";

          ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
          const metrics = ctx.measureText(label);
          const pillW = metrics.width + 8;
          const pillH = 14;
          const pillX = labelX - 4;
          const pillY = labelY - 7;

          ctx.fillStyle = isSupport ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)";
          roundRect(pillX, pillY, pillW, pillH, 3);
          ctx.fill();
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1;
          roundRect(pillX, pillY, pillW, pillH, 3);
          ctx.stroke();

          ctx.fillStyle = strokeBright;
          ctx.fillText(label, labelX, labelY + 3);

          if (!isCompact) {
            const priceFont = "9px ui-sans-serif, system-ui, -apple-system";
            ctx.font = priceFont;

            const topPriceText = formatPrice(top);
            const topMetrics = ctx.measureText(topPriceText);
            const priceX = paneWidth - topMetrics.width - 8;

            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            roundRect(priceX - 4, yTop - 8, topMetrics.width + 8, 13, 3);
            ctx.fill();
            ctx.fillStyle = stroke;
            ctx.fillText(topPriceText, priceX, yTop + 2);

            const bottomPriceText = formatPrice(bottom);
            const bottomMetrics = ctx.measureText(bottomPriceText);
            const bottomPriceX = paneWidth - bottomMetrics.width - 8;

            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            roundRect(bottomPriceX - 4, yBottom - 8, bottomMetrics.width + 8, 13, 3);
            ctx.fill();
            ctx.fillStyle = stroke;
            ctx.fillText(bottomPriceText, bottomPriceX, yBottom + 2);
          }
        }
      }
    }

    if (enabledIndicatorsRef.current["market-structure"] && msRef.current) {
      for (const ob of (msRef.current.orderBlocks ?? []).filter((x) => !x.isMitigated)) {
        const xStart = xForDate(ob.candleDate);
        if (xStart === null) continue;

        const isBullish = ob.orderBlockType.startsWith("Bu");
        const fill = isBullish ? "rgba(34, 197, 94, 0.18)" : "rgba(239, 68, 68, 0.18)";
        const stroke = isBullish ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)";
        drawBox(xStart, xRightForBlocks, ob.high, ob.low, fill, stroke);

        if (!isCompact && xStart > 0 && xStart < paneWidth) {
          const yTop = candleSeries.priceToCoordinate(ob.high);
          if (yTop !== null) {
            ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
            const metrics = ctx.measureText(ob.orderBlockType);
            const xText = Math.max(6, Math.min(xRightForBlocks - metrics.width - 6, paneWidth - metrics.width - 6));
            drawText(Math.max(xStart + 6, xText), Math.max(14, yTop + 14), ob.orderBlockType, stroke, ctx.font);
          }
        }
      }

      for (const bb of (msRef.current.breakerBlocks ?? []).filter((x) => !x.isMitigated)) {
        const xStart = xForDate(bb.candleDate);
        if (xStart === null) continue;

        const isBullish = bb.breakerBlockType.startsWith("Bu");
        const fill = isBullish ? "rgba(34, 197, 94, 0.18)" : "rgba(239, 68, 68, 0.18)";
        const stroke = isBullish ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)";
        drawBox(xStart, xRightForBlocks, bb.high, bb.low, fill, stroke);

        if (!isCompact && xStart > 0 && xStart < paneWidth) {
          const yTop = candleSeries.priceToCoordinate(bb.high);
          if (yTop !== null) {
            ctx.font = "bold 9px ui-sans-serif, system-ui, -apple-system";
            const metrics = ctx.measureText(bb.breakerBlockType);
            const xText = Math.max(6, Math.min(xRightForBlocks - metrics.width - 6, paneWidth - metrics.width - 6));
            drawText(Math.max(xStart + 6, xText), Math.max(14, yTop + 14), bb.breakerBlockType, stroke, ctx.font);
          }
        }
      }

      for (const msb of msRef.current.marketStructureBreaks ?? []) {
        const isBullish = msb.type === "Bullish";
        const stroke = isBullish ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)";

        const h0 = msb.h0_at_break;
        const h1 = msb.h1_at_break;
        const l0 = msb.l0_at_break;
        const l1 = msb.l1_at_break;

        const x1 = xForDate(isBullish ? h1.date : l1.date);
        const x2 = xForDate(isBullish ? h0.date : l0.date);
        const yLevel = candleSeries.priceToCoordinate(isBullish ? h1.price : l1.price);
        if (x1 === null || x2 === null || yLevel === null) continue;

        ctx.save();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(px(Math.min(x1, x2)), px(yLevel));
        ctx.lineTo(px(Math.max(x1, x2)), px(yLevel));
        ctx.stroke();

        if (!isCompact) {
          const xLabelA = xForDate(isBullish ? h1.date : l1.date);
          const xLabelB = xForDate(isBullish ? l0.date : h0.date);
          if (xLabelA !== null && xLabelB !== null) {
            const label = "MSB";
            const xLabel = (xLabelA + xLabelB) / 2;
            const labelY = isBullish ? yLevel - 10 : yLevel + 16;

            ctx.font = "bold 10px ui-sans-serif, system-ui, -apple-system";
            const w = ctx.measureText(label).width;
            const xText = xLabel - w / 2;

            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(0, 0, 0, 0.85)";
            ctx.strokeText(label, xText, labelY);
            ctx.fillStyle = stroke;
            ctx.fillText(label, xText, labelY);
          }
        }

        ctx.restore();
      }
    }

    if (enabledIndicatorsRef.current["elliott-wave"] && ewRef.current) {
      for (const pattern of ewRef.current.wavePatterns ?? []) {
        const pts = [...(pattern.points ?? [])]
          .map((p) => ({ t: parseApiDateToUnixSeconds(p.date), price: p.price, label: p.label }))
          .filter((p): p is { t: number; price: number; label: string } => p.t !== null)
          .sort((a, b) => a.t - b.t);

        if (pts.length < 2) continue;

        const color = pattern.direction === "Bullish" ? "rgba(34, 211, 238, 0.65)" : "rgba(251, 113, 133, 0.65)";

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < pts.length; i++) {
          const x = xForUnixSeconds(pts[i].t);
          const y = candleSeries.priceToCoordinate(pts[i].price);
          if (x === null || y === null) continue;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        if (!isCompact) {
          const first = pts[0];
          const x0 = xForUnixSeconds(first.t);
          const y0 = candleSeries.priceToCoordinate(first.price);
          if (x0 !== null && y0 !== null) {
            drawText(
              x0 + 6,
              y0 - 10,
              `${pattern.type} (${pattern.direction})`,
              "rgba(226, 232, 240, 0.85)",
              "11px ui-sans-serif, system-ui, -apple-system"
            );
          }
        }

        for (const p of pts) {
          const x = xForUnixSeconds(p.t);
          const y = candleSeries.priceToCoordinate(p.price);
          if (x === null || y === null) continue;
          if (!isCompact) drawText(x + 4, y - 6, p.label, color);
        }
      }
    }

    const priceToYFn = (price: number) => candleSeries.priceToCoordinate(price) as number | null;
    const timeToXFn = (time: number) => {
      const coord = timeScale.timeToCoordinate(time as Time);
      return coord as number | null;
    };
    const ds = drawingStateRef.current;
    const stateForRender: DrawingState = tempDrawingRef.current
      ? { ...ds, activeDrawing: tempDrawingRef.current, isDrawing: true }
      : ds;
    renderDrawings(ctx, stateForRender, priceToYFn, timeToXFn, paneWidth, paneHeight);

    ctx.restore();
  }, []);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      drawOverlay();
    });
  }, [drawOverlay]);

  useEffect(() => {
    if (!chartHostRef.current) return;

    let disposed = false;

    const chart = createChart(chartHostRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#000000" },
        textColor: "#e2e8f0",
      },
      width: chartHostRef.current.clientWidth,
      height: chartHostRef.current.clientHeight,
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.25)",
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      priceLineVisible: true,
      lastValueVisible: true,
    });

    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (disposed || !chartHostRef.current) return;
      const width = chartHostRef.current.clientWidth;
      const height = chartHostRef.current.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      try {
        chart.applyOptions({ width, height });

        if (overlayCanvasRef.current) {
          overlayCanvasRef.current.width = width * dpr;
          overlayCanvasRef.current.height = height * dpr;
          overlayCanvasRef.current.style.width = `${width}px`;
          overlayCanvasRef.current.style.height = `${height}px`;
        }
        if (drawingCanvasRef.current) {
          drawingCanvasRef.current.width = width * dpr;
          drawingCanvasRef.current.height = height * dpr;
          drawingCanvasRef.current.style.width = `${width}px`;
          drawingCanvasRef.current.style.height = `${height}px`;
        }

        scheduleDraw();
      } catch {
      }
    };

    const onVisibleRange = () => {
      if (disposed) return;
      scheduleDraw();
    };
    chart.timeScale().subscribeVisibleTimeRangeChange(onVisibleRange);

    const onCrosshairMove = (param: any) => {
      if (disposed) return;

      if (!param.time || !param.seriesData || param.seriesData.size === 0) {
        isHoveringRef.current = false;
        const lastCandle = allCandlesRef.current.at(-1);
        setOhlcData(toOhlcData(lastCandle ?? null));
        return;
      }

      const data = param.seriesData.get(candleSeries);
      if (data && 'open' in data && 'high' in data && 'low' in data && 'close' in data) {
        isHoveringRef.current = true;
        const candleData = data as { time: Time; open: number; high: number; low: number; close: number };
        setOhlcData(toOhlcData(candleData));
      } else {
        isHoveringRef.current = false;
      }
    };
    chart.subscribeCrosshairMove(onCrosshairMove);

    const observer = new ResizeObserver(handleResize);
    observer.observe(chartHostRef.current);

    return () => {
      disposed = true;
      observer.disconnect();
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      try {
        chart.unsubscribeCrosshairMove(onCrosshairMove);
        chart.timeScale().unsubscribeVisibleTimeRangeChange(onVisibleRange);
        chart.remove();
      } catch {
      }
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [scheduleDraw]);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    let cancelled = false;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let pricePollId: ReturnType<typeof setInterval> | null = null;
    const abortController = new AbortController();

    const currentDataKey = `${symbol}-${interval}`;

    const CANDLE_POLL_MS = 15000;
    const PRICE_POLL_MS = 3000;
    const INDICATOR_REFRESH_ON_NEW_CANDLE = true;

    if (lastFetchedKeyRef.current !== currentDataKey) {
      allCandlesRef.current = [];
      candleTimesRef.current = [];
      earliestTimestampRef.current = null;
      hasMoreHistoryRef.current = true;
      isLoadingHistoryRef.current = false;
      currentCandleRef.current = null;
      srRef.current = null;
      msRef.current = null;
      ewRef.current = null;
      isHoveringRef.current = false;
      setOhlcData(null);

      candleSeries.setData([]);
    }

    const mapCandles = (candles: CandleDto[]) =>
      candles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

    const fetchIndicators = async (limit = 500, clearFirst = true) => {
      await fetchIndicatorsShared(abortController.signal, limit, clearFirst, () => cancelled);
    };

    const loadMoreHistory = async () => {
      if (isLoadingHistoryRef.current || !hasMoreHistoryRef.current || !earliestTimestampRef.current) return;
      if (lastFetchedKeyRef.current !== currentDataKey) return;

      isLoadingHistoryRef.current = true;

      try {
        const base = apiBaseUrl();
        const endTimeMs = earliestTimestampRef.current * 1000 - 1;
        const olderCandles = await fetchJson<CandleDto[]>(
          `${base}/api/MarketData/${symbol}?interval=${encodeURIComponent(interval)}&limit=500&endTimeMs=${endTimeMs}`,
          abortController.signal
        );

        if (cancelled || lastFetchedKeyRef.current !== currentDataKey) {
          return;
        }

        if (!olderCandles.length) {
          hasMoreHistoryRef.current = false;
          return;
        }

        const mappedOlder = mapCandles(olderCandles);

        const existingTimes = new Set(allCandlesRef.current.map(c => c.time as unknown as number));
        const newCandles = mappedOlder.filter(c => !existingTimes.has(c.time as unknown as number));

        const allCandles = [...newCandles, ...allCandlesRef.current]
          .sort((a, b) => (a.time as unknown as number) - (b.time as unknown as number));

        allCandlesRef.current = allCandles;
        candleTimesRef.current = allCandles.map((c) => c.time as unknown as number);
        earliestTimestampRef.current = candleTimesRef.current[0] ?? null;

        candleSeries.setData(allCandlesRef.current);

        scheduleDraw();

        const indicatorLimit = Math.max(800, allCandlesRef.current.length);
        fetchIndicators(indicatorLimit, false)
          .then(() => {
            if (!cancelled && lastFetchedKeyRef.current === currentDataKey) scheduleDraw();
          })
          .catch(() => { });
      } catch { } finally {
        isLoadingHistoryRef.current = false;
      }
    };

    const onVisibleLogicalRangeChange = () => {
      const logicalRange = chart.timeScale().getVisibleLogicalRange();
      if (!logicalRange) return;

      const barsFromStart = logicalRange.from;

      if (barsFromStart < 50 && hasMoreHistoryRef.current && !isLoadingHistoryRef.current) {
        loadMoreHistory();
      }
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange);

    const fetchAll = async () => {
      try {
        const base = apiBaseUrl();

        const candles = await fetchJson<CandleDto[]>(
          `${base}/api/MarketData/${symbol}?interval=${encodeURIComponent(interval)}&limit=500`,
          abortController.signal
        );

        if (cancelled) return;

        const mappedCandles = mapCandles(candles);

        allCandlesRef.current = mappedCandles;
        candleSeries.setData(mappedCandles);
        candleTimesRef.current = mappedCandles
          .map((c) => c.time as unknown as number)
          .sort((a, b) => a - b);
        lastCandleTimeRef.current = (candleTimesRef.current.at(-1) ?? null) as unknown as Time | null;
        earliestTimestampRef.current = candleTimesRef.current[0] ?? null;
        hasMoreHistoryRef.current = true;
        currentCandleRef.current = mappedCandles.at(-1) ?? null;
        isHoveringRef.current = false;
        setOhlcData(toOhlcData(currentCandleRef.current));
        lastFetchedKeyRef.current = currentDataKey;
        chart.timeScale().fitContent();

        scheduleDraw();

        const indicatorLimit = Math.max(800, allCandlesRef.current.length);
        fetchIndicators(indicatorLimit, true)
          .then(() => {
            if (!cancelled && lastFetchedKeyRef.current === currentDataKey) scheduleDraw();
          })
          .catch(() => { });

        pricePollId = setInterval(async () => {
          try {
            if (cancelled || lastFetchedKeyRef.current !== currentDataKey) return;

            const base = apiBaseUrl();
            const latest = await fetchJson<{ symbol: string; price: number; time: number }>(
              `${base}/api/MarketData/price/${symbol}`,
              abortController.signal
            );

            if (cancelled || lastFetchedKeyRef.current !== currentDataKey) return;

            const current = currentCandleRef.current;
            if (!current) return;

            const next = {
              ...current,
              close: latest.price,
              high: Math.max(current.high, latest.price),
              low: Math.min(current.low, latest.price),
            };

            currentCandleRef.current = next;
            candleSeries.update(next);
            if (!isHoveringRef.current) setOhlcData(toOhlcData(next));
            scheduleDraw();
          } catch { }
        }, PRICE_POLL_MS);

        pollId = setInterval(async () => {
          try {
            if (cancelled || lastFetchedKeyRef.current !== currentDataKey) return;

            const base = apiBaseUrl();
            const latest = await fetchJson<CandleDto[]>(
              `${base}/api/MarketData/${symbol}?interval=${encodeURIComponent(interval)}&limit=2`,
              abortController.signal
            );

            if (cancelled || lastFetchedKeyRef.current !== currentDataKey) return;

            const mapped = mapCandles(latest).sort((a, b) => (a.time as unknown as number) - (b.time as unknown as number));
            if (!mapped.length) return;

            const prevLast = candleTimesRef.current.at(-1) ?? null;
            let sawNewCandle = false;

            for (const item of mapped) {
              const t = item.time as unknown as number;
              if (prevLast === null || t > prevLast) {
                candleTimesRef.current.push(t);
                allCandlesRef.current.push(item);
                sawNewCandle = true;
              } else {
                const idx = allCandlesRef.current.findIndex((c) => (c.time as unknown as number) === t);
                if (idx !== -1) allCandlesRef.current[idx] = item;
              }
              candleSeries.update(item);
            }

            if (candleTimesRef.current.length) {
              lastCandleTimeRef.current = candleTimesRef.current.at(-1) as unknown as Time;
              currentCandleRef.current = mapped.at(-1) ?? currentCandleRef.current;
              if (!isHoveringRef.current) setOhlcData(toOhlcData(currentCandleRef.current));
            }

            if (INDICATOR_REFRESH_ON_NEW_CANDLE && sawNewCandle) {
              const indicatorLimit = Math.max(800, allCandlesRef.current.length);
              fetchIndicators(indicatorLimit, false)
                .then(() => {
                  if (!cancelled && lastFetchedKeyRef.current === currentDataKey) scheduleDraw();
                })
                .catch(() => { });
            }

            scheduleDraw();
          } catch { }
        }, CANDLE_POLL_MS);
      } catch {
      }
    };

    fetchAll();

    return () => {
      cancelled = true;
      abortController.abort("Component unmounted");
      if (pollId) clearInterval(pollId);
      if (pricePollId) clearInterval(pricePollId);
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChange);
    };
  }, [symbol, interval, scheduleDraw, fetchIndicatorsShared]);

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    let cancelled = false;
    const abortController = new AbortController();

    if (indicatorFetchTimeoutRef.current) {
      clearTimeout(indicatorFetchTimeoutRef.current);
    }

    indicatorFetchTimeoutRef.current = setTimeout(async () => {
      if (cancelled) return;

      if (allCandlesRef.current.length === 0) return;

      const indicatorLimit = Math.max(800, allCandlesRef.current.length);

      await fetchIndicatorsShared(abortController.signal, indicatorLimit, true, () => cancelled);

      if (!cancelled) {
        scheduleDraw();
      }
    }, 100);

    return () => {
      cancelled = true;
      abortController.abort("Indicator settings changed");
      if (indicatorFetchTimeoutRef.current) {
        clearTimeout(indicatorFetchTimeoutRef.current);
      }
    };
  }, [enabledIndicators, indicatorParams, symbol, interval, scheduleDraw, fetchIndicatorsShared]);

  const formatPrice = (value: number) => {
    if (!Number.isFinite(value)) return "0";
    if (value >= 1000) return value.toFixed(2);
    if (value >= 1) return value.toFixed(4);
    return value.toFixed(6);
  };

  const handleDrawingMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const tool = activeToolRef.current;
    if (tool === "cursor" || !tool) return;

    console.log("Drawing MouseDown:", tool, e.clientX, e.clientY);

    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const timeScale = chart.timeScale();
    const time = timeScale.coordinateToTime(x);
    const price = candleSeries.coordinateToPrice(y);
    if (time == null || price == null) return;

    const color = nextDrawingColor();
    const point = { price: Number(price), time: Number(time) };

    if (tool === "horizontal_line") {
      const drawing: Drawing = {
        id: generateDrawingId(),
        type: "horizontal_line",
        color,
        points: [point],
        price: Number(price),
      };
      onDrawingComplete?.(drawing);
      scheduleDraw();
      return;
    }

    tempDrawingRef.current = {
      id: generateDrawingId(),
      type: tool as Drawing["type"],
      color,
      points: [point, point],
    };
    scheduleDraw();
  }, [onDrawingComplete, scheduleDraw]);

  const handleDrawingMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!tempDrawingRef.current) return;
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries) return;

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const timeScale = chart.timeScale();
    const time = timeScale.coordinateToTime(x);
    const price = candleSeries.coordinateToPrice(y);
    if (time == null || price == null) return;

    tempDrawingRef.current.points[1] = { price: Number(price), time: Number(time) };
    scheduleDraw();
  }, [scheduleDraw]);

  const handleDrawingMouseUp = useCallback(() => {
    if (!tempDrawingRef.current) return;
    const drawing = tempDrawingRef.current;
    tempDrawingRef.current = null;
    onDrawingComplete?.(drawing);
    scheduleDraw();
  }, [onDrawingComplete, scheduleDraw]);

  return (
    <div className="w-full h-full relative">
      <div ref={chartHostRef} className="w-full h-full" />
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
      ></canvas>
      <canvas
        ref={drawingCanvasRef}
        className={`absolute inset-0 ${activeTool !== "cursor" ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"}`}
        style={{ zIndex: 50 }}
        onMouseDown={handleDrawingMouseDown}
        onMouseMove={handleDrawingMouseMove}
        onMouseUp={handleDrawingMouseUp}
        onMouseLeave={handleDrawingMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      ></canvas>

      {ohlcData && (
        <div
          className="absolute top-2 left-2 pointer-events-none z-20"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace' }}
        >
          <div className="flex flex-wrap items-center gap-x-2 text-xs">
            <span className="text-slate-400 font-medium">{symbol}</span>
            <span className="text-slate-600">{"\u2022"}</span>
            <span className="text-slate-500">{interval}</span>
            <span className="text-slate-600 ml-1">O</span>
            <span className={ohlcData.close >= ohlcData.open ? "text-emerald-400" : "text-red-400"}>
              {formatPrice(ohlcData.open)}
            </span>
            <span className="text-slate-600">H</span>
            <span className={ohlcData.close >= ohlcData.open ? "text-emerald-400" : "text-red-400"}>
              {formatPrice(ohlcData.high)}
            </span>
            <span className="text-slate-600">L</span>
            <span className={ohlcData.close >= ohlcData.open ? "text-emerald-400" : "text-red-400"}>
              {formatPrice(ohlcData.low)}
            </span>
            <span className="text-slate-600">C</span>
            <span className={ohlcData.close >= ohlcData.open ? "text-emerald-400" : "text-red-400"}>
              {formatPrice(ohlcData.close)}
            </span>
            <span className={ohlcData.change >= 0 ? "text-emerald-400" : "text-red-400"}>
              {ohlcData.change >= 0 ? "+" : ""}{formatPrice(ohlcData.change)} ({ohlcData.changePercent >= 0 ? "+" : ""}{ohlcData.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
