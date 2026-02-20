"use client";

import { useState, useEffect } from "react";

interface ExchangeRate {
  exchange: string;
  rate: number;
  rateFormatted: string;
}

interface FundingData {
  current: { count: number; exchanges: ExchangeRate[] };
  predicted: { count: number; exchanges: ExchangeRate[] };
}

const STABLECOIN_EXCHANGES = [
  { key: "Binance-USDT", label: "BINANCE" },
  { key: "BitMEX-XBTUSDT", label: "BITMEX" },
  { key: "Bybit-USDT", label: "BYBIT" },
  { key: "Huobi-USDT", label: "HUOBI" },
  { key: "Hyperliquid", label: "HYPERLIQUID" },
  { key: "Kraken-PF", label: "KRAKEN" },
  { key: "OKX-USDT", label: "OKX" },
  { key: "WooX", label: "WOO X" },
];

const COIN_MARGINED_EXCHANGES = [
  { key: "Binance-USD", label: "BINANCE" },
  { key: "BitMEX-XBTUSD", label: "BITMEX" },
  { key: "Bybit-USD", label: "BYBIT" },
  { key: "Deribit", label: "DERIBIT" },
  { key: "Huobi-USD", label: "HUOBI" },
  { key: "Kraken-PI", label: "KRAKEN" },
  { key: "OKX-USD", label: "OKX" },
];

function formatRate(rate: number | undefined): string {
  if (rate === undefined || rate === null) return "n/a";
  const sign = rate >= 0 ? "+" : "";
  return `${sign}${rate.toFixed(4)}%`;
}

function getRateColor(rate: number | undefined): string {
  if (rate === undefined || rate === null) return "text-gray-500";
  if (rate > 0) return "text-green-500";
  if (rate < 0) return "text-red-500";
  return "text-gray-400";
}

function ValueSkeleton({ className }: { className: string }) {
  return <div className={`mx-auto rounded bg-white/5 animate-pulse ${className}`} />;
}

export default function FundingRatePanel() {
  const [data, setData] = useState<FundingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5033";
      const res = await fetch(`${apiUrl}/api/FundingRate/btc/debug`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError("Failed to load funding rates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getRate = (exchanges: ExchangeRate[] | undefined, key: string): number | undefined => {
    if (!exchanges) return undefined;
    const found = exchanges.find((e) => e.exchange === key);
    return found?.rate;
  };

  if (error) {
    return (
      <div className="bg-[#0d0d1a] rounded-xl p-4 mb-4 border border-red-500/20">
        <div className="text-center py-4 text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d1a] rounded-xl p-4 mb-4 border border-white/5 min-h-[360px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          BTC Funding Rate and <span className="text-cyan-400">Predicted</span> Funding Rate
        </h2>
        {lastUpdate && (
          <span className="text-xs text-gray-500">
            Updated: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="mb-6">
        <div className="bg-[#12121f] rounded-lg p-3 mb-3">
          <h3 className="text-center text-sm text-gray-300 font-medium">STABLECOIN MARGINED</h3>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-20 text-right">
            <span className="text-xs text-gray-500">CURRENT:</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[720px] grid grid-cols-8 gap-2">
              {STABLECOIN_EXCHANGES.map((ex) => (
                <div key={ex.key} className="text-center">
                  <div className="text-xs text-gray-400 font-medium mb-1">{ex.label}</div>
                  {loading ? (
                    <ValueSkeleton className="h-4 w-16" />
                  ) : (
                    <div className={`text-sm font-mono ${getRateColor(getRate(data?.current.exchanges, ex.key))}`}>
                      {formatRate(getRate(data?.current.exchanges, ex.key))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 text-right">
            <span className="text-xs text-gray-500">PREDICTED:</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[720px] grid grid-cols-8 gap-2">
              {STABLECOIN_EXCHANGES.map((ex) => {
                const predicted = getRate(data?.predicted.exchanges, ex.key);
                const isNA = ex.key === "Huobi-USDT" || ex.key === "OKX-USDT";
                return (
                  <div key={ex.key} className="text-center">
                    {loading ? (
                      <ValueSkeleton className="h-4 w-16" />
                    ) : (
                      <div className={`text-sm font-mono ${isNA ? "text-gray-600" : getRateColor(predicted)}`}>
                        {isNA ? "n/a" : formatRate(predicted)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="bg-[#12121f] rounded-lg p-3 mb-3">
          <h3 className="text-center text-sm text-gray-300 font-medium">COIN MARGINED</h3>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-20 text-right">
            <span className="text-xs text-gray-500">CURRENT:</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[620px] grid grid-cols-7 gap-2">
              {COIN_MARGINED_EXCHANGES.map((ex) => (
                <div key={ex.key} className="text-center">
                  <div className="text-xs text-gray-400 font-medium mb-1">{ex.label}</div>
                  {loading ? (
                    <ValueSkeleton className="h-4 w-16" />
                  ) : (
                    <div className={`text-sm font-mono ${getRateColor(getRate(data?.current.exchanges, ex.key))}`}>
                      {formatRate(getRate(data?.current.exchanges, ex.key))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 text-right">
            <span className="text-xs text-gray-500">PREDICTED:</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-[620px] grid grid-cols-7 gap-2">
              {COIN_MARGINED_EXCHANGES.map((ex) => {
                const predicted = getRate(data?.predicted.exchanges, ex.key);
                const isNA = ex.key === "Deribit" || ex.key === "Huobi-USD" || ex.key === "OKX-USD";
                return (
                  <div key={ex.key} className="text-center">
                    {loading ? (
                      <ValueSkeleton className="h-4 w-16" />
                    ) : (
                      <div className={`text-sm font-mono ${isNA ? "text-gray-600" : getRateColor(predicted)}`}>
                        {isNA ? "n/a" : formatRate(predicted)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-600 italic">
        * All funding rates normalized to 8 hours
      </div>
    </div>
  );
}
