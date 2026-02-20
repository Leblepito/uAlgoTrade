-- =============================================================================
-- 007: uAlgoTrade Tables - AI Trading Swarm Intelligence
-- =============================================================================

-- Signals from AI agents
CREATE TABLE IF NOT EXISTS ualgo_signal (
    id              BIGSERIAL PRIMARY KEY,
    agent_name      TEXT        NOT NULL,           -- alpha_scout, technical_analyst, risk_sentinel
    symbol          TEXT        NOT NULL,           -- BTCUSDT, ETHUSDT, etc.
    direction       TEXT        NOT NULL,           -- BUY, SELL, HOLD, PANIC_SELL
    confidence      NUMERIC(5,4) NOT NULL DEFAULT 0, -- 0.0000 to 1.0000
    strategy_ver    TEXT        NOT NULL DEFAULT 'v1.0',
    priority        TEXT        NOT NULL DEFAULT 'NORMAL', -- NORMAL, HIGH, URGENT
    reasoning       JSONB       DEFAULT '{}',       -- { "sentiment": 0.8, "rsi": 72, ... }
    status          TEXT        NOT NULL DEFAULT 'pending', -- pending, approved, rejected, executed
    approved_by     TEXT,                           -- risk_sentinel, orchestrator
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ualgo_signal_created   ON ualgo_signal (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ualgo_signal_symbol    ON ualgo_signal (symbol);
CREATE INDEX IF NOT EXISTS idx_ualgo_signal_status    ON ualgo_signal (status);
CREATE INDEX IF NOT EXISTS idx_ualgo_signal_agent     ON ualgo_signal (agent_name);
CREATE INDEX IF NOT EXISTS idx_ualgo_signal_priority  ON ualgo_signal (priority) WHERE priority = 'URGENT';

-- Executed trades
CREATE TABLE IF NOT EXISTS ualgo_trade (
    id              BIGSERIAL PRIMARY KEY,
    signal_id       BIGINT      REFERENCES ualgo_signal(id),
    user_id         UUID        REFERENCES app_user(id),
    symbol          TEXT        NOT NULL,
    side            TEXT        NOT NULL,           -- BUY, SELL
    entry_price     NUMERIC(20,8) NOT NULL,
    exit_price      NUMERIC(20,8),
    quantity        NUMERIC(20,8) NOT NULL,
    slippage        NUMERIC(10,8) DEFAULT 0,
    fee             NUMERIC(20,8) DEFAULT 0,
    pnl             NUMERIC(20,8),
    pnl_pct         NUMERIC(10,4),
    strategy_ver    TEXT        NOT NULL DEFAULT 'v1.0',
    status          TEXT        NOT NULL DEFAULT 'open', -- open, closed, canceled
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_ualgo_trade_created  ON ualgo_trade (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ualgo_trade_symbol   ON ualgo_trade (symbol);
CREATE INDEX IF NOT EXISTS idx_ualgo_trade_user     ON ualgo_trade (user_id);
CREATE INDEX IF NOT EXISTS idx_ualgo_trade_status   ON ualgo_trade (status);

-- Agent activity logs
CREATE TABLE IF NOT EXISTS ualgo_agent_log (
    id              BIGSERIAL PRIMARY KEY,
    agent_name      TEXT        NOT NULL,
    action          TEXT        NOT NULL,           -- scan, analyze, approve, reject, execute, panic
    details         JSONB       DEFAULT '{}',
    confidence      NUMERIC(5,4),
    duration_ms     INTEGER,                        -- execution time in milliseconds
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ualgo_log_created    ON ualgo_agent_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ualgo_log_agent      ON ualgo_agent_log (agent_name);

-- Agent configuration (runtime-updateable by Quant Lab)
CREATE TABLE IF NOT EXISTS ualgo_agent_config (
    id              SERIAL PRIMARY KEY,
    agent_name      TEXT        NOT NULL UNIQUE,
    config          JSONB       NOT NULL DEFAULT '{}',
    updated_by      TEXT        NOT NULL DEFAULT 'system', -- system, quant_lab, manual
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default agent configs
INSERT INTO ualgo_agent_config (agent_name, config) VALUES
    ('alpha_scout', '{
        "rss_feeds": ["https://cointelegraph.com/rss", "https://www.coindesk.com/arc/outboundfeeds/rss/"],
        "scan_interval_sec": 60,
        "panic_words": ["hack", "sec", "ban", "arrest", "crash", "exploit", "lawsuit", "breach", "fraud", "investigation"],
        "sentiment_bias": 0.0,
        "min_confidence": 0.6
    }'),
    ('technical_analyst', '{
        "indicators": ["rsi", "macd", "bollinger", "fvg", "order_block", "elliott_wave", "market_structure"],
        "analysis_interval_sec": 30,
        "rsi_period": 14,
        "rsi_overbought": 70,
        "rsi_oversold": 30,
        "bb_period": 20,
        "bb_std": 2.0
    }'),
    ('risk_sentinel', '{
        "max_daily_loss_pct": 5.0,
        "max_position_pct": 10.0,
        "max_open_positions": 5,
        "volatility_threshold": 3.0,
        "learning_rate": 0.01,
        "panic_override": true
    }'),
    ('quant_lab', '{
        "run_interval_hours": 24,
        "lookback_days": 7,
        "min_trades_for_optimization": 10,
        "optimization_targets": ["win_rate", "sharpe_ratio", "max_drawdown"]
    }')
ON CONFLICT (agent_name) DO NOTHING;

-- Daily performance metrics
CREATE TABLE IF NOT EXISTS ualgo_performance (
    id              SERIAL PRIMARY KEY,
    report_date     DATE        NOT NULL,
    symbol          TEXT        NOT NULL DEFAULT 'ALL',
    strategy_ver    TEXT        NOT NULL DEFAULT 'v1.0',
    total_trades    INTEGER     NOT NULL DEFAULT 0,
    winning_trades  INTEGER     NOT NULL DEFAULT 0,
    losing_trades   INTEGER     NOT NULL DEFAULT 0,
    win_rate        NUMERIC(5,2),
    total_pnl       NUMERIC(20,8) DEFAULT 0,
    total_pnl_pct   NUMERIC(10,4) DEFAULT 0,
    max_drawdown    NUMERIC(10,4) DEFAULT 0,
    sharpe_ratio    NUMERIC(10,4),
    avg_trade_pnl   NUMERIC(20,8),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (report_date, symbol, strategy_ver)
);

CREATE INDEX IF NOT EXISTS idx_ualgo_perf_date ON ualgo_performance (report_date DESC);

-- Live price cache (written by Go engine from WebSocket)
CREATE TABLE IF NOT EXISTS ualgo_price_cache (
    symbol          TEXT        PRIMARY KEY,
    price           NUMERIC(20,8) NOT NULL,
    volume_24h      NUMERIC(20,8),
    change_24h_pct  NUMERIC(10,4),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
