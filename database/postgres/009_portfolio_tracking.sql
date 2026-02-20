-- =============================================================================
-- 009: Portfolio Tracking — Live Positions, Portfolio Snapshots
-- =============================================================================

-- Live portfolio positions
CREATE TABLE IF NOT EXISTS ualgo_position (
  id                BIGSERIAL PRIMARY KEY,
  user_id           UUID REFERENCES app_user(id),
  symbol            TEXT NOT NULL,
  side              TEXT NOT NULL CHECK (side IN ('LONG', 'SHORT')),
  entry_price       NUMERIC(20,8) NOT NULL,
  current_price     NUMERIC(20,8),
  quantity          NUMERIC(20,8) NOT NULL,
  leverage          NUMERIC(5,2) DEFAULT 1.0,
  unrealized_pnl    NUMERIC(20,8) DEFAULT 0,
  unrealized_pnl_pct NUMERIC(10,4) DEFAULT 0,
  stop_loss         NUMERIC(20,8),
  take_profit       NUMERIC(20,8),
  strategy_id       TEXT DEFAULT 'default',
  signal_id         BIGINT REFERENCES ualgo_signal(id),
  status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closing', 'closed')),
  opened_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_position_user ON ualgo_position(user_id);
CREATE INDEX IF NOT EXISTS idx_position_status ON ualgo_position(status);
CREATE INDEX IF NOT EXISTS idx_position_symbol ON ualgo_position(symbol);

-- Daily portfolio snapshot for equity curve
CREATE TABLE IF NOT EXISTS ualgo_portfolio_snapshot (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES app_user(id),
  snapshot_date   DATE NOT NULL,
  total_value     NUMERIC(20,8) NOT NULL,
  total_pnl       NUMERIC(20,8) DEFAULT 0,
  total_pnl_pct   NUMERIC(10,4) DEFAULT 0,
  open_positions  INTEGER DEFAULT 0,
  exposure_pct    NUMERIC(5,2) DEFAULT 0,
  win_rate        NUMERIC(5,4),
  sharpe_ratio    NUMERIC(8,4),
  max_drawdown    NUMERIC(10,4),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, snapshot_date)
);
CREATE INDEX IF NOT EXISTS idx_snapshot_user_date ON ualgo_portfolio_snapshot(user_id, snapshot_date DESC);
