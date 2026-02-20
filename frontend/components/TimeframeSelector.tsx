"use client";

import { useState } from "react";

interface TimeframeSelectorProps {
  currentInterval: string;
  onIntervalChange: (interval: string) => void;
}

const SUPPORTED_INTERVALS = [
  { id: "1m", label: "1M" },
  { id: "5m", label: "5M" },
  { id: "15m", label: "15M" },
  { id: "30m", label: "30M" },
  { id: "1h", label: "1H" },
  { id: "2h", label: "2H" },
  { id: "4h", label: "4H" },
  { id: "1d", label: "1D" },
  { id: "1w", label: "1W" },
];

export const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  currentInterval,
  onIntervalChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const active = SUPPORTED_INTERVALS.find((t) => t.id === currentInterval) ?? SUPPORTED_INTERVALS.find((t) => t.id === "1h") ?? SUPPORTED_INTERVALS[0];

  return (
    <div className="relative z-[100]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 pl-4 pr-10 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl backdrop-blur-md transition-all duration-300 w-full sm:w-auto sm:min-w-[140px] group"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-slate-500/10">
          TF
        </div>
        <div className="flex flex-col items-start">
          <span className="text-xs text-slate-400 font-medium tracking-wider">TIMEFRAME</span>
          <span className="text-sm font-bold text-slate-100">{active.label}</span>
        </div>

        <svg
          className={`absolute right-4 w-5 h-5 text-slate-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-1">
          {SUPPORTED_INTERVALS.map((tf) => (
            <button
              key={tf.id}
              onClick={() => {
                onIntervalChange(tf.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                currentInterval === tf.id
                  ? "bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20"
                  : "hover:bg-white/5 border border-transparent"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                  currentInterval === tf.id
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/30"
                    : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
                }`}
              >
                {tf.label}
              </div>
              <div className="flex flex-col items-start">
                <span
                  className={`text-sm font-bold ${
                    currentInterval === tf.id ? "text-white" : "text-slate-300 group-hover:text-white"
                  }`}
                >
                  {tf.id}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
