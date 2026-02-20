"use client";

import { useEffect, useMemo, useState } from "react";
import type { EnabledIndicators } from "@/components/FinancialChart";
import { ActiveIndicators } from "@/components/ActiveIndicators";
import type { IndicatorParameters } from "@/types/indicators";

type IndicatorDefinition = {
  id: string;
  name: string;
  kind?: "overlay" | "oscillator" | "pattern" | "structure" | string;
  category?: string;
};

type TabId = "all" | "overlay" | "pattern" | "structure";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "all", label: "All" },
  { id: "overlay", label: "Overlays" },
  { id: "pattern", label: "Patterns" },
  { id: "structure", label: "Structure" },
];

const INDICATORS: IndicatorDefinition[] = [
  { id: "support-resistance", name: "Support / Resistance", kind: "overlay" },
  { id: "market-structure", name: "Market Structure", kind: "structure" },
  { id: "elliott-wave", name: "Elliott Wave", kind: "pattern" },
];

export function IndicatorDrawer({
  open,
  enabled,
  parameters,
  onToggle,
  onParameterChange,
  onClose,
}: {
  open: boolean;
  enabled: EnabledIndicators;
  parameters: IndicatorParameters;
  onToggle: (id: string) => void;
  onParameterChange: (indicatorId: string, paramKey: string, value: number | boolean | string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<TabId>("all");
  const [query, setQuery] = useState("");
  const [available] = useState<IndicatorDefinition[]>(INDICATORS);
  const [mobileView, setMobileView] = useState<"library" | "active">("library");

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const enabledCount = useMemo(() => Object.values(enabled).filter(Boolean).length, [enabled]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return available
      .filter((ind) => (tab === "all" ? true : ind.kind === tab))
      .filter((ind) => {
        if (!q) return true;
        return (
          ind.name.toLowerCase().includes(q) ||
          ind.id.toLowerCase().includes(q) ||
          (ind.category ?? "").toLowerCase().includes(q)
        );
      });
  }, [available, query, tab]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close indicators"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        className="absolute inset-y-0 right-0 w-full sm:w-[680px] bg-black border-l border-white/10 shadow-2xl shadow-black/50 flex flex-col"
      >
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-white">Indicators</div>
            <div className="text-xs text-slate-500 truncate">{enabledCount} active</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="px-4 pt-3 sm:hidden">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMobileView("library")}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                mobileView === "library"
                  ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                  : "border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              Library
            </button>
            <button
              type="button"
              onClick={() => setMobileView("active")}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                mobileView === "active"
                  ? "border-cyan-500/40 bg-cyan-500/10 text-white"
                  : "border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              Active
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden sm:flex">
          <div className={`flex-1 min-h-0 overflow-y-auto ${mobileView === "library" ? "block" : "hidden"} sm:block`}>
            <div className="p-4 space-y-3">
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

              <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden max-h-[400px] overflow-y-auto">
                {filtered.length === 0 && (
                  <div className="px-3 py-4 text-sm text-slate-500 text-center">No indicators found</div>
                )}
                {filtered.map((ind) => {
                  const isOn = Boolean(enabled[ind.id]);
                  return (
                    <button
                      key={ind.id}
                      type="button"
                      onClick={() => onToggle(ind.id)}
                      className="w-full text-left px-3 py-2.5 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-slate-100">{ind.name}</div>
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
          </div>

          <div className={`w-full sm:w-64 shrink-0 border-t sm:border-t-0 sm:border-l border-white/10 bg-black/50 ${mobileView === "active" ? "block" : "hidden"} sm:block`}>
            <div className="p-4">
              <div className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">Active indicators</div>
              <ActiveIndicators
                enabled={enabled}
                parameters={parameters}
                onToggle={onToggle}
                onParameterChange={onParameterChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
