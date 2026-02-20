"use client";

import { useState } from "react";
import type { EnabledIndicators } from "@/components/FinancialChart";
import { INDICATOR_CONFIGS, type IndicatorParameters, type ParameterDefinition } from "@/types/indicators";

interface ActiveIndicatorsProps {
  enabled: EnabledIndicators;
  parameters: IndicatorParameters;
  onToggle: (id: string) => void;
  onParameterChange: (indicatorId: string, paramKey: string, value: number | boolean | string) => void;
}

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
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative h-6 w-10 rounded-full border transition-colors ${
          value ? "border-cyan-500/40 bg-cyan-500/20" : "border-white/10 bg-white/5"
        }`}
      >
        <span
          className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 rounded-full transition-all ${
            value ? "left-5 bg-cyan-400" : "left-1 bg-slate-400/70"
          }`}
        />
      </button>
    );
  }

  if (param.type === "select" && param.options) {
    return (
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-24 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-slate-200 outline-none focus:border-cyan-500/40"
      >
        {param.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="number"
      value={Number(value)}
      onChange={(e) => onChange(parseFloat(e.target.value) || param.default)}
      min={param.min}
      max={param.max}
      step={param.step}
      className="w-20 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-slate-200 text-right outline-none focus:border-cyan-500/40"
    />
  );
}

function IndicatorSettings({
  indicatorId,
  parameters,
  onParameterChange,
  onClose,
}: {
  indicatorId: string;
  parameters: Record<string, number | boolean | string>;
  onParameterChange: (paramKey: string, value: number | boolean | string) => void;
  onClose: () => void;
}) {
  const config = INDICATOR_CONFIGS[indicatorId];
  if (!config) return null;

  return (
    <div className="mt-2 p-3 rounded-lg bg-black/40 border border-white/5 space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-widest text-slate-500">Parameters</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
      {config.parameters.map((param) => (
        <div key={param.key} className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-300">{param.label}</div>
            {param.description && (
              <div className="text-[10px] text-slate-500 truncate">{param.description}</div>
            )}
          </div>
          <ParameterInput
            param={param}
            value={parameters[param.key] ?? param.default}
            onChange={(value) => onParameterChange(param.key, value)}
          />
        </div>
      ))}
    </div>
  );
}

export const ActiveIndicators: React.FC<ActiveIndicatorsProps> = ({
  enabled,
  parameters,
  onToggle,
  onParameterChange,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeIndicators = Object.entries(enabled)
    .filter(([, isEnabled]) => isEnabled)
    .map(([id]) => id);

  if (activeIndicators.length === 0) {
    return (
      <div className="text-xs text-slate-500 italic py-2">
        No active indicators. Select from the library.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activeIndicators.map((id) => {
        const config = INDICATOR_CONFIGS[id];
        const name = config?.name ?? id;
        const hasSettings = config && config.parameters.length > 0;
        const isExpanded = expandedId === id;

        return (
          <div key={id} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-sm font-medium text-slate-200 truncate">{name}</span>
              </div>

              <div className="flex items-center gap-1">
                {hasSettings && (
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      isExpanded
                        ? "bg-cyan-500/20 text-cyan-400"
                        : "hover:bg-white/10 text-slate-400 hover:text-slate-200"
                    }`}
                    title="Settings"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onToggle(id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {isExpanded && hasSettings && (
              <IndicatorSettings
                indicatorId={id}
                parameters={parameters[id] ?? {}}
                onParameterChange={(paramKey, value) => onParameterChange(id, paramKey, value)}
                onClose={() => setExpandedId(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
