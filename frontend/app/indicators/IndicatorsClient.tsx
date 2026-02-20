"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FinancialChart, type EnabledIndicators } from "@/components/FinancialChart";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SymbolSelector } from "@/components/SymbolSelector";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { IndicatorPopup } from "@/components/IndicatorPopup";
import { getDefaultParameters, type IndicatorParameters } from "@/types/indicators";
import FundingRatePanel from "@/components/FundingRatePanel";
import { getMe } from "@/lib/auth";
import { UpgradeModal } from "@/components/UpgradeModal";
import { DrawingToolbar, type DrawingTool } from "@/components/DrawingToolbar";
import { AlertPanel } from "@/components/AlertPanel";
import { type Drawing, type DrawingState, createDrawingState } from "@/lib/drawings";

export default function IndicatorsClient({ children }: { children?: React.ReactNode }) {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1d");
  const [latestPrice, setLatestPrice] = useState<number | null>(null);

  const [enabledIndicators, setEnabledIndicators] = useState<EnabledIndicators>({
    "support-resistance": true,
    "elliott-wave": false,
    "market-structure": false,
  });

  const [indicatorParams, setIndicatorParams] = useState<IndicatorParameters>(() => getDefaultParameters());
  const [popupOpen, setPopupOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [lockedName, setLockedName] = useState<string>("this indicator");

  const [activeTool, setActiveTool] = useState<DrawingTool>("cursor");
  const [drawingState, setDrawingState] = useState<DrawingState>(() => createDrawingState());

  const handleDrawingComplete = useCallback((drawing: Drawing) => {
    setDrawingState(prev => ({
      ...prev,
      drawings: [...prev.drawings, drawing],
      activeDrawing: null,
      isDrawing: false,
    }));
    setActiveTool("cursor"); // auto-switch back to cursor after drawing
  }, []);

  const clearAllDrawings = useCallback(() => {
    setDrawingState(createDrawingState());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        const paid = me.planCode === "pro" || me.planCode === "premium";
        if (!cancelled) setIsPaid(paid);
      } catch {
        if (!cancelled) setIsPaid(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5033";

    const fetchPrice = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/MarketData/price/${symbol}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { price: number };
        if (!cancelled) setLatestPrice(Number.isFinite(data.price) ? data.price : null);
      } catch {
        if (!cancelled) setLatestPrice(null);
      }
    };

    fetchPrice();
    const intervalId = window.setInterval(fetchPrice, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [symbol]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const site = "U2Algo";
    const formattedPrice = latestPrice === null ? null : formatPrice(latestPrice);
    document.title = formattedPrice ? `${symbol} ${formattedPrice} | ${site}` : `${symbol} | ${site}`;
  }, [symbol, latestPrice]);

  useEffect(() => {
    if (isPaid) return;
    setEnabledIndicators((prev) => ({
      ...prev,
      "market-structure": false,
      "elliott-wave": false,
      "support-resistance": prev["support-resistance"] ?? true,
    }));
  }, [isPaid]);

  const activeCount = useMemo(
    () => Object.values(enabledIndicators).filter(Boolean).length,
    [enabledIndicators]
  );

  const toggleIndicator = useCallback((id: string) => {
    setEnabledIndicators((prev) => {
      const isOn = Boolean(prev[id]);
      const tryingToEnable = !isOn;

      const isLocked = !isPaid && id !== "support-resistance";
      if (isLocked && tryingToEnable) {
        setLockedName(id === "market-structure" ? "Order Block / Breaker Block" : "Elliott Wave");
        setPopupOpen(false);
        setUpgradeOpen(true);
        return prev;
      }

      return { ...prev, [id]: !isOn };
    });
  }, [isPaid]);

  const updateIndicatorParam = useCallback((indicatorId: string, paramKey: string, value: number | boolean | string) => {
    setIndicatorParams((prev) => ({
      ...prev,
      [indicatorId]: {
        ...prev[indicatorId],
        [paramKey]: value,
      },
    }));
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow flex flex-col items-center px-2 py-3 sm:px-4 sm:py-4 md:px-6">
        <div className="w-full max-w-6xl space-y-2 sm:space-y-3">
          <FundingRatePanel />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setPopupOpen(!popupOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="hidden xs:inline">Indicators</span>
                  <span className="xs:hidden">Ind.</span>
                  {activeCount > 0 && (
                    <span className="bg-cyan-500/20 text-cyan-400 text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
                      {activeCount}
                    </span>
                  )}
                </button>
                <IndicatorPopup
                  open={popupOpen}
                  enabled={enabledIndicators}
                  onToggle={toggleIndicator}
                  onClose={() => setPopupOpen(false)}
                  lockedIds={!isPaid ? new Set(["market-structure", "elliott-wave"]) : undefined}
                  indicatorParams={indicatorParams}
                  onParamChange={updateIndicatorParam}
                />
              </div>

              <TimeframeSelector currentInterval={interval} onIntervalChange={setInterval} />

              <DrawingToolbar
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onClearAll={clearAllDrawings}
                drawingCount={drawingState.drawings.length}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <AlertPanel
                  symbol={symbol}
                  timeframe={interval}
                  currentPrice={latestPrice}
                  isPaid={isPaid}
                  onRequireUpgrade={() => {
                    setLockedName("Alerts");
                    setUpgradeOpen(true);
                  }}
                />
              </div>
              <SymbolSelector currentSymbol={symbol} onSymbolChange={setSymbol} />
            </div>
          </div>

          <div className="rounded-lg sm:rounded-xl overflow-hidden border border-white/5 shadow-2xl shadow-black/50 bg-black">
            <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[650px]">
              <FinancialChart
                symbol={symbol}
                interval={interval}
                enabledIndicators={enabledIndicators}
                indicatorParams={indicatorParams}
                activeTool={activeTool}
                drawingState={drawingState}
                onDrawingComplete={handleDrawingComplete}
              />
            </div>
            {children}
          </div>
        </div>
      </main>

      <Footer />

      <UpgradeModal
        open={upgradeOpen}
        title={`Unlock ${lockedName}`}
        description="This is a Pro/Premium indicator. Upgrade to access smart-money tools and keep your workspace clean."
        onClose={() => setUpgradeOpen(false)}
      />
    </div>
  );
}

function formatPrice(price: number): string {
  const abs = Math.abs(price);
  const maxFractionDigits = abs >= 1000 ? 2 : abs >= 1 ? 4 : 6;
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: abs >= 1000 ? 2 : 0,
  }).format(price);
}
