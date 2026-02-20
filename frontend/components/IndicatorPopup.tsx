"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { EnabledIndicators } from "@/components/FinancialChart";
import { INDICATOR_CONFIGS, type IndicatorParameters, type ParameterDefinition } from "@/types/indicators";

type IndicatorDefinition = {
  id: string;
  name: string;
  kind?: "overlay" | "oscillator" | "pattern" | string;
};

const INDICATORS: IndicatorDefinition[] = [
  { id: "support-resistance", name: "Support / Resistance", kind: "overlay" },
  { id: "market-structure", name: "Order Block / Breaker Block", kind: "pattern" },
  { id: "elliott-wave", name: "Elliott Wave", kind: "pattern" },
];

function ParameterInput({
  param,
  value,
  onChange,
}: {
  param: ParameterDefinition;
  value: number | boolean | string;
  onChange: (value: number | boolean | string) => void;
}) {
  if (param.type === "boolean") {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={value as boolean}
          onChange={(e) => onChange(e.target.checked)}
          className="w-3.5 h-3.5 rounded border-white/20 bg-black/50 text-cyan-500 focus:ring-cyan-500/30"
        />
        <span className="text-xs text-slate-400">{param.label}</span>
      </label>
    );
  }

  if (param.type === "number") {
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      if (rawValue === "" || rawValue === "-") return;
      
      const parsed = parseFloat(rawValue);
      if (!Number.isNaN(parsed)) {
        onChange(parsed);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const parsed = parseFloat(e.target.value);
      if (Number.isNaN(parsed)) {
        onChange(param.default as number);
      }
    };

    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 min-w-[80px]">{param.label}</span>
        <input
          type="number"
          defaultValue={value as number}
          key={`${param.key}-${value}`}
          min={param.min}
          max={param.max}
          step={param.step}
          onChange={handleNumberChange}
          onBlur={handleBlur}
          className="flex-1 w-16 rounded border border-white/10 bg-black/50 px-2 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500/40"
        />
      </div>
    );
  }

  return null;
}

export function IndicatorPopup({
  open,
  enabled,
  onToggle,
  onClose,
  lockedIds,
  indicatorParams,
  onParamChange,
}: {
  open: boolean;
  enabled: EnabledIndicators;
  onToggle: (id: string) => void;
  onClose: () => void;
  lockedIds?: Set<string>;
  indicatorParams?: IndicatorParameters;
  onParamChange?: (indicatorId: string, paramKey: string, value: number | boolean | string) => void;
}) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, onClose]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) setExpandedId(null);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return INDICATORS;
    return INDICATORS.filter(
      (ind) =>
        ind.name.toLowerCase().includes(q) ||
        ind.id.toLowerCase().includes(q)
    );
  }, [query]);

  const activeCount = useMemo(
    () => Object.values(enabled).filter(Boolean).length,
    [enabled]
  );

  if (!open) return null;

  return (
    <div
      ref={popupRef}
      className="absolute top-full left-0 mt-1 z-50 w-72 sm:w-80 max-w-[calc(100vw-0.75rem)] bg-[#0a0a0a] border border-white/10 rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">
          Indicators {activeCount > 0 && <span className="text-cyan-400">({activeCount})</span>}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-white text-lg leading-none"
          aria-label="Close"
        >
          {"\u00D7"}
        </button>
      </div>

      <div className="p-2 border-b border-white/10">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          className="w-full rounded-md border border-white/10 bg-black/50 px-2.5 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/40"
        />
      </div>

      <div className="max-h-80 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-3 py-4 text-sm text-slate-500 text-center">
            No indicators found
          </div>
        ) : (
          filtered.map((ind) => {
            const isOn = Boolean(enabled[ind.id]);
            const isExpanded = expandedId === ind.id;
            const isLocked = lockedIds?.has(ind.id) ?? false;
            const config = INDICATOR_CONFIGS[ind.id];
            const params = indicatorParams?.[ind.id] ?? {};

            return (
              <div key={ind.id} className={`border-b border-white/5 last:border-0 ${isOn ? "bg-cyan-500/5" : ""}`}>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => onToggle(ind.id)}
                    className={`flex-1 text-left px-3 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors ${isLocked && !isOn ? "opacity-80" : ""}`}
                  >
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0 ${
                        isOn
                          ? "bg-cyan-500 border-cyan-500 text-white"
                          : isLocked
                            ? "border-white/15 text-transparent"
                            : "border-white/20 text-transparent"
                      }`}
                    >
                      {"\u2713"}
                    </span>
                    <span className={`text-sm ${isOn ? "text-white font-medium" : "text-slate-300"}`}>
                      {ind.name}
                    </span>
                    {isLocked && !isOn && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11V7a4 4 0 00-8 0v4m0 0h8m-8 0v8a2 2 0 002 2h4a2 2 0 002-2v-8" />
                        </svg>
                        PRO
                      </span>
                    )}
                  </button>
                   
                  {config && config.parameters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : ind.id)}
                      className={`px-3 py-2 text-slate-500 hover:text-white transition-colors ${isExpanded ? "text-cyan-400" : ""} ${isLocked && !isOn ? "opacity-50 pointer-events-none" : ""}`}
                      title="Settings"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                </div>

                {isExpanded && config && (
                  <div className="px-3 pb-3 pt-1 bg-black/30 border-t border-white/5">
                    <div className="space-y-2">
                      {config.parameters.map((param) => (
                        <ParameterInput
                          key={param.key}
                          param={param}
                          value={params[param.key] ?? param.default}
                          onChange={(val) => onParamChange?.(ind.id, param.key, val)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
