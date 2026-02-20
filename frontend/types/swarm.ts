export type AgentStatus = "alive" | "degraded" | "dead";
export type SignalDirection = "LONG" | "SHORT" | "NEUTRAL";
export type SignalStatus = "pending" | "approved" | "rejected" | "executed" | "expired";
export type VoteType = "approve" | "reject" | "abstain";

export interface AgentInfo {
  name: string;
  role: string;
  status: AgentStatus;
  last_heartbeat: string | null;
  scan_interval: number;
  signals_generated: number;
  active_tasks?: number;
}

export interface SwarmStatus {
  agents: AgentInfo[];
  total_signals_today: number;
  active_positions: number;
  kill_switch_active: boolean;
  last_scan: string | null;
}

export interface TradingSignal {
  id: number;
  symbol: string;
  direction: SignalDirection;
  confidence: number;
  source_agent: string;
  status: SignalStatus;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  risk_reward: number | null;
  timeframe: string;
  created_at: string;
}

export interface ConsensusVote {
  agent_name: string;
  vote: VoteType;
  confidence: number;
  reasoning: Record<string, unknown>;
  created_at: string;
}

export interface PortfolioSnapshot {
  date: string;
  total_value: number;
  total_pnl: number;
  total_pnl_pct: number;
  win_rate: number | null;
  sharpe_ratio: number | null;
  max_drawdown: number | null;
}

export interface Position {
  id: number;
  symbol: string;
  side: "LONG" | "SHORT";
  entry_price: number;
  current_price: number | null;
  quantity: number;
  leverage: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  stop_loss: number | null;
  take_profit: number | null;
  strategy_id: string;
  status: string;
  opened_at: string;
}

export interface PerformanceData {
  strategy_id: string;
  days: number;
  data: PortfolioSnapshot[];
}
