"use client";

import { useEffect, useState } from "react";
import { AgentStatusCard } from "@/components/AgentStatusCard";
import { RiskGauge } from "@/components/RiskGauge";
import { SignalFeed } from "@/components/SignalFeed";
import { SwarmTopology } from "@/components/SwarmTopology";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { getSwarmStatus, getRecentSignals, triggerScan } from "@/lib/swarm";
import type { SwarmStatus, TradingSignal } from "@/types/swarm";

export default function SwarmDashboard() {
  const [swarm, setSwarm] = useState<SwarmStatus | null>(null);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  const fetchData = async () => {
    try {
      const [status, signalData] = await Promise.all([
        getSwarmStatus(),
        getRecentSignals(10),
      ]);
      setSwarm(status);
      setSignals(signalData.signals);
    } catch (err) {
      console.error("Failed to fetch swarm data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      await triggerScan();
      await fetchData();
    } catch (err) {
      console.error("Scan failed:", err);
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse text-lg">Loading Swarm...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">AI Agent Swarm</h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time multi-agent trading intelligence
            </p>
          </div>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {scanning ? "Scanning..." : "Run Scan"}
          </button>
        </div>

        {/* Portfolio Summary */}
        <div className="mb-6">
          <PortfolioSummary
            latest={null}
            totalSignalsToday={swarm?.total_signals_today || 0}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Agents + Risk */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Agents
            </h2>
            {swarm?.agents.map((agent) => (
              <AgentStatusCard key={agent.name} agent={agent} />
            ))}
            <RiskGauge
              killSwitchActive={swarm?.kill_switch_active || false}
              activePositions={swarm?.active_positions || 0}
            />
          </div>

          {/* Center: Topology + Signals */}
          <div className="lg:col-span-2 space-y-6">
            <SwarmTopology agents={swarm?.agents || []} />

            <div>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Recent Signals
              </h2>
              <SignalFeed signals={signals} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
