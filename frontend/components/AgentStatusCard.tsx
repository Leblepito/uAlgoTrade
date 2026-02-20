"use client";

import type { AgentInfo } from "@/types/swarm";

const statusColors = {
  alive: "bg-emerald-500",
  degraded: "bg-amber-500",
  dead: "bg-red-500",
};

const agentIcons: Record<string, string> = {
  alpha_scout: "🔍",
  technical_analyst: "📊",
  risk_sentinel: "🛡️",
  orchestrator: "🧠",
  quant_lab: "⚗️",
};

export function AgentStatusCard({ agent }: { agent: AgentInfo }) {
  const icon = agentIcons[agent.name] || "🤖";
  const dotColor = statusColors[agent.status] || "bg-gray-500";
  const timeSince = agent.last_heartbeat
    ? formatTimeSince(new Date(agent.last_heartbeat))
    : "Never";

  return (
    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 hover:border-cyan-500/20 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="text-sm font-semibold text-white capitalize">
            {agent.name.replace("_", " ")}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${dotColor} animate-pulse`} />
          <span className="text-xs text-slate-400 capitalize">{agent.status}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-2 line-clamp-1">{agent.role}</p>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Last: {timeSince}</span>
        <span>Tasks: {agent.active_tasks || 0}</span>
      </div>
    </div>
  );
}

function formatTimeSince(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
