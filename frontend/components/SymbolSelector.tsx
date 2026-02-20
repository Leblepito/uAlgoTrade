"use client";

import { useState } from "react";

interface SymbolSelectorProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

const SUPPORTED_ASSETS = [
  { id: "BTCUSDT", name: "Bitcoin", icon: "BTC", exchange: "Binance" },
  { id: "ETHUSDT", name: "Ethereum", icon: "ETH", exchange: "Binance" },
  { id: "SOLUSDT", name: "Solana", icon: "SOL", exchange: "Binance" },
  { id: "BNBUSDT", name: "BNB", icon: "BNB", exchange: "Binance" },
  { id: "XRPUSDT", name: "Ripple", icon: "XRP", exchange: "Binance" },
];

export const SymbolSelector: React.FC<SymbolSelectorProps> = ({ currentSymbol, onSymbolChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeAsset = SUPPORTED_ASSETS.find((a) => a.id === currentSymbol) ?? SUPPORTED_ASSETS[0];

  return (
    <div className="relative z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 pl-4 pr-10 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-md transition-all duration-300 w-full sm:w-auto sm:min-w-[180px] group"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-cyan-500/20">
          {activeAsset.icon}
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-slate-400 font-medium tracking-wider">ASSET</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-100">{activeAsset.name}</span>
            <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-300">
              {activeAsset.exchange}
            </span>
          </div>
        </div>

        <svg
          className={`absolute right-4 w-5 h-5 text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-1">
          {SUPPORTED_ASSETS.map((asset) => (
            <button
              key={asset.id}
              onClick={() => {
                onSymbolChange(asset.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                currentSymbol === asset.id
                  ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[11px] transition-colors ${
                  currentSymbol === asset.id
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
                }`}
              >
                {asset.icon}
              </div>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold ${
                      currentSymbol === asset.id ? "text-white" : "text-slate-300 group-hover:text-white"
                    }`}
                  >
                    {asset.id}
                  </span>
                  <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-slate-400">
                    {asset.exchange}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

