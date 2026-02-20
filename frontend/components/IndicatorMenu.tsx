"use client";

import type { EnabledIndicators } from "@/components/FinancialChart";
import { useMemo, useState } from "react";

interface IndicatorMenuProps {
  enabled: EnabledIndicators;
  onChange: (next: EnabledIndicators) => void;
}

type IndicatorDefinition = {
  id: string;
  name: string;
  kind: "overlay" | "pattern" | "structure";
  category: string;
};

type TabId = "all" | "overlay" | "pattern" | "structure";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "all", label: "All" },
  { id: "overlay", label: "Overlays" },
  { id: "pattern", label: "Patterns" },
  { id: "structure", label: "Structure" },
];

const INDICATORS: IndicatorDefinition[] = [
  { id: "support-resistance", name: "Support / Resistance", kind: "overlay", category: "Zones" },
  { id: "market-structure", name: "Market Structure", kind: "structure", category: "Smart Money" },
  { id: "elliott-wave", name: "Elliott Wave", kind: "pattern", category: "Patterns" },
];

export const IndicatorMenu: React.FC<IndicatorMenuProps> = ({ enabled, onChange }) => {
  const [tab, setTab] = useState<TabId>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return INDICATORS
      .filter((ind) => (tab === "all" ? true : ind.kind === tab))
      .filter((ind) => {
        if (!q) return true;
        return (
          ind.name.toLowerCase().includes(q) ||
          ind.id.toLowerCase().includes(q) ||
          ind.category.toLowerCase().includes(q)
        );
      });
  }, [query, tab]);

  const toggle = (id: string) => {
    onChange({ ...enabled, [id]: !enabled[id] });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              tab === t.id
                ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search indicators..."
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/40"
      />

      <div className="rounded-xl border border-white/10 bg-black/30 overflow-hidden">
        {filtered.length === 0 && (
          <div className="px-3 py-4 text-sm text-slate-500 text-center">No indicators found</div>
        )}
        {filtered.map((ind) => {
          const isOn = Boolean(enabled[ind.id]);
          return (
            <button
              key={ind.id}
              type="button"
              onClick={() => toggle(ind.id)}
              className="w-full text-left px-3 py-2.5 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-100">{ind.name}</div>
                  <div className="text-xs text-slate-500">{ind.category}</div>
                </div>
                <div
                  className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                    isOn ? "border-cyan-500/40 bg-cyan-500/10 text-white" : "border-white/10 bg-white/5 text-slate-300"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isOn ? "bg-cyan-400" : "bg-slate-500/70"}`} />
                  {isOn ? "On" : "Off"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

