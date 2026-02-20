-- =============================================================================
-- 010: Multi-Tenant Strategies — Strategy Definitions, API Key Vault
-- =============================================================================

-- Strategy definitions (users can have multiple strategies)
CREATE TABLE IF NOT EXISTS ualgo_strategy (
  id              TEXT PRIMARY KEY,
  user_id         UUID REFERENCES app_user(id),
  name            TEXT NOT NULL,
  description     TEXT,
  symbols         TEXT[] NOT NULL DEFAULT '{}',
  timeframes      TEXT[] NOT NULL DEFAULT '{"1h"}',
  agents_enabled  TEXT[] NOT NULL DEFAULT '{"alpha_scout","technical_analyst","risk_sentinel"}',
  config          JSONB DEFAULT '{}',
  is_active       BOOLEAN DEFAULT true,
  is_paper        BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_strategy_user ON ualgo_strategy(user_id);
CREATE INDEX IF NOT EXISTS idx_strategy_active ON ualgo_strategy(is_active) WHERE is_active = true;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trg_strategy_updated_at ON ualgo_strategy;
CREATE TRIGGER trg_strategy_updated_at
BEFORE UPDATE ON ualgo_strategy
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Exchange API key vault (encrypted at application layer)
CREATE TABLE IF NOT EXISTS ualgo_api_key (
  id              SERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  exchange        TEXT NOT NULL,
  encrypted_key   TEXT NOT NULL,
  encrypted_secret TEXT NOT NULL,
  label           TEXT,
  permissions     TEXT[] DEFAULT '{"read"}',
  is_active       BOOLEAN DEFAULT true,
  last_used_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, exchange, label)
);
CREATE INDEX IF NOT EXISTS idx_apikey_user ON ualgo_api_key(user_id);

-- Default strategy for admin user
INSERT INTO ualgo_strategy (id, name, description, symbols, timeframes, agents_enabled, config)
VALUES (
  'default',
  'Default Strategy',
  'Multi-agent consensus trading on major crypto pairs',
  '{"BTCUSDT","ETHUSDT"}',
  '{"1h","4h"}',
  '{"alpha_scout","technical_analyst","risk_sentinel"}',
  '{"min_confidence": 0.7, "max_risk_per_trade": 0.02}'
) ON CONFLICT (id) DO NOTHING;
