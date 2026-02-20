"use client";

interface RiskGaugeProps {
  killSwitchActive: boolean;
  activePositions: number;
  maxPositions?: number;
}

export function RiskGauge({ killSwitchActive, activePositions, maxPositions = 5 }: RiskGaugeProps) {
  const exposurePct = (activePositions / maxPositions) * 100;

  let riskLevel: string;
  let riskColor: string;
  if (killSwitchActive) {
    riskLevel = "KILL SWITCH";
    riskColor = "text-red-500";
  } else if (exposurePct >= 80) {
    riskLevel = "HIGH";
    riskColor = "text-red-400";
  } else if (exposurePct >= 50) {
    riskLevel = "MODERATE";
    riskColor = "text-amber-400";
  } else {
    riskLevel = "LOW";
    riskColor = "text-emerald-400";
  }

  return (
    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Risk Level</h3>
        <span className={`text-sm font-bold ${riskColor}`}>{riskLevel}</span>
      </div>

      {/* Gauge bar */}
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            killSwitchActive
              ? "bg-red-500 w-full"
              : exposurePct >= 80
              ? "bg-red-400"
              : exposurePct >= 50
              ? "bg-amber-400"
              : "bg-emerald-400"
          }`}
          style={{ width: killSwitchActive ? "100%" : `${Math.min(exposurePct, 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400">
        <span>Positions: {activePositions}/{maxPositions}</span>
        <span>Exposure: {exposurePct.toFixed(0)}%</span>
      </div>

      {killSwitchActive && (
        <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400 font-medium">
            Kill switch is active. All new trades are halted.
          </p>
        </div>
      )}
    </div>
  );
}
