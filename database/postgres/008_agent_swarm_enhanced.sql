-- =============================================================================
-- 008: Agent Swarm Enhanced — Heartbeat, Consensus Voting, Signal Extensions
-- =============================================================================

-- Enhance ualgo_signal with multi-tenant and strategy support
ALTER TABLE ualgo_signal
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES app_user(id),
  ADD COLUMN IF NOT EXISTS strategy_id TEXT DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS timeframe TEXT DEFAULT '1h',
  ADD COLUMN IF NOT EXISTS entry_price NUMERIC(20,8),
  ADD COLUMN IF NOT EXISTS stop_loss NUMERIC(20,8),
  ADD COLUMN IF NOT EXISTS take_profit NUMERIC(20,8),
  ADD COLUMN IF NOT EXISTS risk_reward NUMERIC(5,2);

-- Agent heartbeat monitoring
CREATE TABLE IF NOT EXISTS ualgo_agent_heartbeat (
  agent_name    TEXT PRIMARY KEY,
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT NOT NULL DEFAULT 'alive' CHECK (status IN ('alive', 'degraded', 'dead')),
  cpu_usage     NUMERIC(5,2),
  memory_mb     INTEGER,
  active_tasks  INTEGER DEFAULT 0,
  version       TEXT,
  uptime_seconds BIGINT DEFAULT 0
);

-- Consensus voting record for each signal
CREATE TABLE IF NOT EXISTS ualgo_consensus_vote (
  id          BIGSERIAL PRIMARY KEY,
  signal_id   BIGINT REFERENCES ualgo_signal(id) ON DELETE CASCADE,
  agent_name  TEXT NOT NULL,
  vote        TEXT NOT NULL CHECK (vote IN ('approve', 'reject', 'abstain')),
  confidence  NUMERIC(5,4),
  reasoning   JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_consensus_signal ON ualgo_consensus_vote(signal_id);
CREATE INDEX IF NOT EXISTS idx_consensus_agent ON ualgo_consensus_vote(agent_name);

-- Indexes for enhanced signal queries
CREATE INDEX IF NOT EXISTS idx_signal_user ON ualgo_signal(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signal_strategy ON ualgo_signal(strategy_id);
