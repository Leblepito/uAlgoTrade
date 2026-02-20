"use client";

import type { AgentInfo } from "@/types/swarm";

const statusColors = {
  alive: "border-emerald-500 shadow-emerald-500/20",
  degraded: "border-amber-500 shadow-amber-500/20",
  dead: "border-red-500 shadow-red-500/20",
};

export function SwarmTopology({ agents }: { agents: AgentInfo[] }) {
  const orchestrator = agents.find((a) => a.name === "orchestrator");
  const workers = agents.filter((a) => a.name !== "orchestrator" && a.name !== "quant_lab");
  const quantLab = agents.find((a) => a.name === "quant_lab");

  return (
    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-white mb-6 text-center">Swarm Topology</h3>

      {/* Orchestrator at top */}
      <div className="flex justify-center mb-6">
        {orchestrator && <AgentNode agent={orchestrator} size="lg" />}
      </div>

      {/* Connection lines */}
      <div className="flex justify-center mb-2">
        <div className="w-px h-6 bg-cyan-500/30" />
      </div>
      <div className="flex justify-center mb-2">
        <div className="w-48 h-px bg-cyan-500/30" />
      </div>

      {/* Worker agents */}
      <div className="flex justify-center gap-6 mb-6">
        {workers.map((agent) => (
          <div key={agent.name} className="flex flex-col items-center gap-1">
            <div className="w-px h-4 bg-cyan-500/30" />
            <AgentNode agent={agent} size="sm" />
          </div>
        ))}
      </div>

      {/* Quant Lab at bottom */}
      {quantLab && (
        <>
          <div className="flex justify-center mb-2">
            <div className="w-px h-4 bg-slate-600/30" />
          </div>
          <div className="flex justify-center">
            <AgentNode agent={quantLab} size="sm" />
          </div>
          <p className="text-center text-xs text-slate-600 mt-1">Nightly optimization</p>
        </>
      )}
    </div>
  );
}

function AgentNode({ agent, size }: { agent: AgentInfo; size: "sm" | "lg" }) {
  const borderClass = statusColors[agent.status] || "border-gray-500";
  const isLg = size === "lg";

  return (
    <div
      className={`
        ${isLg ? "px-5 py-3" : "px-3 py-2"}
        rounded-xl border-2 ${borderClass}
        bg-slate-900/80 text-center shadow-lg
      `}
    >
      <p className={`${isLg ? "text-sm" : "text-xs"} font-bold text-white capitalize`}>
        {agent.name.replace("_", " ")}
      </p>
      <p className={`${isLg ? "text-xs" : "text-[10px]"} text-slate-500 capitalize`}>
        {agent.status}
      </p>
    </div>
  );
}
