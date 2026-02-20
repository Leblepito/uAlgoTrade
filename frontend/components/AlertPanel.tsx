"use client";

import React, { useCallback, useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";

interface Alert {
    id: string;
    symbol: string;
    timeframe: string;
    alertType: string;
    targetPrice: number | null;
    indicatorType: string | null;
    signalSubtype: string | null;
    status: string;
    triggeredAt: string | null;
    triggerMessage: string | null;
    name: string | null;
    createdAt: string;
    condition?: string;
    frequency?: string;
    expirationTime?: string | null;
}

interface AlertPanelProps {
    symbol: string;
    timeframe: string;
    currentPrice: number | null;
    isPaid: boolean;
    onRequireUpgrade: () => void;
}

const API_BASE = typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5033"
    : "";
const TELEGRAM_JOIN_URL =
    process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL || "https://t.me/ukeytr";

const INDICATOR_ALERTS = [
    { indicatorType: "elliott-wave", signalSubtype: "wave_5_complete", label: "Elliott Wave - Wave 5 Completed" },
    { indicatorType: "elliott-wave", signalSubtype: "corrective_end", label: "Elliott Wave - Correction End" },
    { indicatorType: "market-structure", signalSubtype: "order_block_touch", label: "Order Block - Price Entered Zone" },
    { indicatorType: "market-structure", signalSubtype: "msb", label: "Market Structure Break (MSB)" },
    { indicatorType: "support-resistance", signalSubtype: "sr_bounce", label: "Support/Resistance Bounce" },
    { indicatorType: "support-resistance", signalSubtype: "sr_breakout", label: "Support/Resistance Breakout" },
];

async function fetchAuthed<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = getAccessToken();
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
        credentials: "include",
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
    }
    return res.json();
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
    symbol,
    timeframe,
    currentPrice: _currentPrice,
    isPaid,
    onRequireUpgrade,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [tab, setTab] = useState<"price" | "indicator">("price");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [priceTarget, setPriceTarget] = useState("");
    const [priceDirection, setPriceDirection] = useState<"above" | "below">("above");
    const [alertName, setAlertName] = useState("");

    const [selectedIndicatorAlert, setSelectedIndicatorAlert] = useState(0);

    const [frequency, setFrequency] = useState("OnlyOnce");
    const [useExpiration, setUseExpiration] = useState(false);
    const [expirationTime, setExpirationTime] = useState("");
    const [telegramJoinOpen, setTelegramJoinOpen] = useState(false);
    const [telegramReady, setTelegramReady] = useState(false);

    const [triggeredAlerts, setTriggeredAlerts] = useState<Alert[]>([]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const joined = window.localStorage.getItem("ukeytr_telegram_joined");
        setTelegramReady(joined === "1");
    }, []);

    const loadAlerts = useCallback(async () => {
        try {
            const data = await fetchAuthed<Alert[]>(`${API_BASE}/api/alert`);
            setAlerts(data);
        } catch {
        }
    }, []);

    const checkTriggered = useCallback(async () => {
        try {
            const data = await fetchAuthed<Alert[]>(`${API_BASE}/api/alert/triggered`);
            if (data.length > 0) {
                setTriggeredAlerts(data.filter((a) => {
                    const triggeredTime = new Date(a.triggeredAt || "").getTime();
                    return Date.now() - triggeredTime < 60_000;
                }));
            }
        } catch {
        }
    }, []);

    useEffect(() => {
        loadAlerts();
        const interval = setInterval(() => {
            loadAlerts();
            checkTriggered();
        }, 15_000);
        return () => clearInterval(interval);
    }, [loadAlerts, checkTriggered]);

    const createPriceAlert = async () => {
        const target = parseFloat(priceTarget);
        if (isNaN(target) || target <= 0) {
            setError("Enter a valid price.");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await fetchAuthed(`${API_BASE}/api/alert`, {
                method: "POST",
                body: JSON.stringify({
                    symbol,
                    timeframe,
                    alertType: priceDirection === "above" ? "price_above" : "price_below",
                    targetPrice: target,
                    name: alertName || `${symbol} ${priceDirection === "above" ? "UP" : "DOWN"} ${target}`,
                    condition: "Crossing",
                    frequency,
                    expirationTime: useExpiration && expirationTime ? new Date(expirationTime).toISOString() : null,
                }),
            });
            setPriceTarget("");
            setAlertName("");
            await loadAlerts();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const createIndicatorAlert = async () => {
        const selected = INDICATOR_ALERTS[selectedIndicatorAlert];
        if (!selected) return;

        setLoading(true);
        setError(null);
        try {
            await fetchAuthed(`${API_BASE}/api/alert`, {
                method: "POST",
                body: JSON.stringify({
                    symbol,
                    timeframe,
                    alertType: "indicator_signal",
                    indicatorType: selected.indicatorType,
                    signalSubtype: selected.signalSubtype,
                    name: `${symbol} - ${selected.label}`,
                    frequency,
                    expirationTime: useExpiration && expirationTime ? new Date(expirationTime).toISOString() : null,
                }),
            });
            await loadAlerts();
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const deleteAlert = async (id: string) => {
        try {
            await fetchAuthed(`${API_BASE}/api/alert/${id}`, { method: "DELETE" });
            await loadAlerts();
        } catch {
        }
    };

    const dismissAlert = async (id: string) => {
        try {
            await fetchAuthed(`${API_BASE}/api/alert/${id}/dismiss`, { method: "POST" });
            setTriggeredAlerts((prev) => prev.filter((a) => a.id !== id));
            await loadAlerts();
        } catch {
        }
    };

    const activeAlerts = alerts.filter((a) => a.status === "active");
    const triggeredList = alerts.filter((a) => a.status === "triggered");

    const handleAlertButtonClick = () => {
        if (!isPaid) {
            onRequireUpgrade();
            return;
        }

        if (!telegramReady) {
            setTelegramJoinOpen(true);
            return;
        }

        setIsOpen((prev) => !prev);
    };

    const confirmTelegramJoined = () => {
        if (typeof window !== "undefined") {
            window.localStorage.setItem("ukeytr_telegram_joined", "1");
        }
        setTelegramReady(true);
        setTelegramJoinOpen(false);
        setIsOpen(true);
    };

    return (
        <>
            {telegramJoinOpen && (
                <div className="fixed inset-0 z-[10000]">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/70"
                        onClick={() => setTelegramJoinOpen(false)}
                        aria-label="Close"
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl shadow-black/60">
                            <h3 className="text-lg font-bold text-white">Join Telegram Channel</h3>
                            <p className="mt-2 text-sm text-slate-400">
                                Alerts are available for Pro/Premium members after joining our Telegram channel.
                            </p>
                            <div className="mt-4 flex flex-col gap-2">
                                <a
                                    href={TELEGRAM_JOIN_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-500"
                                >
                                    Open Telegram
                                </a>
                                <button
                                    type="button"
                                    onClick={confirmTelegramJoined}
                                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10"
                                >
                                    I Joined, Continue
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {triggeredAlerts.length > 0 && (
                <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
                    {triggeredAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-xl border border-amber-500/30 rounded-2xl p-4 shadow-2xl shadow-amber-500/10 animate-in slide-in-from-right duration-300"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
                                        <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-amber-200">{alert.name || "Alert"}</p>
                                        <p className="text-xs text-amber-300/70 mt-0.5">{alert.triggerMessage}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => dismissAlert(alert.id)}
                                    className="text-amber-400/50 hover:text-amber-300 transition-colors"
                                    aria-label="Dismiss Alert"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={handleAlertButtonClick}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors relative"
            >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="hidden xs:inline">Alerts</span>
                {activeAlerts.length > 0 && (
                    <span className="bg-cyan-500/20 text-cyan-400 text-[10px] px-1 py-0.5 rounded-full">
                        {activeAlerts.length}
                    </span>
                )}
                {triggeredList.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                )}
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-[380px] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-[200] overflow-hidden">
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setTab("price")}
                            className={`flex-1 px-4 py-3 text-xs font-semibold tracking-wider transition-colors ${tab === "price" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400 hover:text-white"
                                }`}
                        >
                            Price Alert
                        </button>
                        <button
                            onClick={() => setTab("indicator")}
                            className={`flex-1 px-4 py-3 text-xs font-semibold tracking-wider transition-colors ${tab === "indicator" ? "text-cyan-400 border-b-2 border-cyan-400" : "text-slate-400 hover:text-white"
                                }`}
                        >
                            Indicator Alert
                        </button>
                    </div>

                    <div className="p-4 space-y-3">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-xs text-red-400">
                                {error}
                            </div>
                        )}

                        {tab === "price" && (
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Condition</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select
                                            value={priceDirection}
                                            onChange={(e) => setPriceDirection(e.target.value as "above" | "below")}
                                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:border-cyan-500/50 outline-none"
                                            aria-label="Condition Type"
                                        >
                                            <option value="above">Cross Above Target</option>
                                            <option value="below">Cross Below Target</option>
                                        </select>
                                        <input
                                            type="number"
                                            value={priceTarget}
                                            onChange={(e) => setPriceTarget(e.target.value)}
                                            placeholder="Price..."
                                            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 outline-none"
                                            aria-label="Price Target"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Options</label>
                                    <select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500/50 outline-none"
                                        aria-label="Frequency"
                                    >
                                        <option value="OnlyOnce">Only Once</option>
                                        <option value="OncePerBar">Once Per Bar</option>
                                        <option value="OncePerBarClose">Once Per Bar Close</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Expiration Time</label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useExpiration}
                                                onChange={(e) => setUseExpiration(e.target.checked)}
                                                className="w-3 h-3 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-0"
                                                aria-label="Enable Expiration"
                                            />
                                            <span className="text-[10px] text-slate-400">Enable</span>
                                        </label>
                                    </div>
                                    {useExpiration && (
                                        <input
                                            type="datetime-local"
                                            value={expirationTime}
                                            onChange={(e) => setExpirationTime(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500/50 outline-none"
                                            aria-label="Expiration Time"
                                        />
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Alert Name</label>
                                    <input
                                        type="text"
                                        value={alertName}
                                        onChange={(e) => setAlertName(e.target.value)}
                                        placeholder="Example: BTC Breakout"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500/50 outline-none"
                                        aria-label="Alert Name"
                                    />
                                </div>

                                <button
                                    onClick={createPriceAlert}
                                    disabled={loading}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 mt-2"
                                >
                                    {loading ? "Creating..." : "Create"}
                                </button>
                            </div>
                        )}

                        {tab === "indicator" && (
                            <div className="space-y-3">
                                <div className="space-y-1.5 max-h-32 overflow-y-auto border border-white/5 rounded-lg p-1">
                                    {INDICATOR_ALERTS.map((ia, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedIndicatorAlert(idx)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${selectedIndicatorAlert === idx
                                                ? "bg-cyan-500/15 text-cyan-300"
                                                : "text-slate-400 hover:bg-white/5 hover:text-white"
                                                }`}
                                        >
                                            {ia.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Options</label>
                                    <select
                                        value={frequency}
                                        onChange={(e) => setFrequency(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500/50 outline-none"
                                        aria-label="Frequency"
                                    >
                                        <option value="OnlyOnce">Only Once</option>
                                        <option value="OncePerBar">Once Per Bar</option>
                                        <option value="OncePerBarClose">Once Per Bar Close</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Expiration Time</label>
                                        <label className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useExpiration}
                                                onChange={(e) => setUseExpiration(e.target.checked)}
                                                className="w-3 h-3 rounded border-white/10 bg-white/5 text-cyan-500 focus:ring-0"
                                                aria-label="Enable Expiration"
                                            />
                                            <span className="text-[10px] text-slate-400">Enable</span>
                                        </label>
                                    </div>
                                    {useExpiration && (
                                        <input
                                            type="datetime-local"
                                            value={expirationTime}
                                            onChange={(e) => setExpirationTime(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500/50 outline-none"
                                            aria-label="Expiration Time"
                                        />
                                    )}
                                </div>

                                <button
                                    onClick={createIndicatorAlert}
                                    disabled={loading}
                                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-semibold hover:from-violet-400 hover:to-purple-500 transition-all disabled:opacity-50 mt-2"
                                >
                                    {loading ? "Creating..." : "Create"}
                                </button>
                            </div>
                        )}
                    </div>

                    {activeAlerts.length > 0 && (
                        <div className="border-t border-white/10 p-3">
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 px-1">Active Alerts</p>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                {activeAlerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 group"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${alert.alertType === "indicator_signal" ? "bg-violet-400" :
                                                alert.alertType === "price_above" ? "bg-emerald-400" : "bg-red-400"
                                                }`} />
                                            <div className="min-w-0">
                                                <p className="text-xs text-white font-medium truncate">{alert.name || alert.symbol}</p>
                                                <p className="text-[10px] text-slate-500">
                                                    {alert.alertType === "price_above" && `UP ${alert.targetPrice}`}
                                                    {alert.alertType === "price_below" && `DOWN ${alert.targetPrice}`}
                                                    {alert.alertType === "indicator_signal" && (alert.signalSubtype || alert.indicatorType)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteAlert(alert.id)}
                                            className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            aria-label="Delete Alert"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {triggeredList.length > 0 && (
                        <div className="border-t border-white/10 p-3">
                            <p className="text-[10px] text-amber-400/70 uppercase tracking-widest mb-2 px-1">Triggered Alerts</p>
                            <div className="space-y-1.5 max-h-24 overflow-y-auto">
                                {triggeredList.map((alert) => (
                                    <div key={alert.id} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/10 rounded-xl px-3 py-2">
                                        <div className="min-w-0">
                                            <p className="text-xs text-amber-300 font-medium truncate">{alert.name}</p>
                                            <p className="text-[10px] text-amber-400/60 truncate">{alert.triggerMessage}</p>
                                        </div>
                                        <button onClick={() => dismissAlert(alert.id)} className="text-xs text-amber-400/50 hover:text-amber-300 ml-2">
                                            Dismiss
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};
