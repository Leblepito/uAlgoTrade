-- =============================================
-- 005_alerts.sql — Price + Indicator Alerts
-- =============================================

-- Alert types: 'price_above', 'price_below', 'indicator_signal'
-- Indicator alert subtypes: 'elliott_wave_5', 'elliott_corrective_end', 'order_block_touch', 'breaker_block_touch', 'sr_bounce', 'sr_breakout', 'msb'

CREATE TABLE IF NOT EXISTS user_alert (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,

  -- Core fields
  symbol text NOT NULL,
  timeframe text NOT NULL DEFAULT '1h',
  alert_type text NOT NULL CHECK (alert_type IN ('price_above', 'price_below', 'indicator_signal')),

  -- Price alert fields
  target_price numeric NULL,

  -- Indicator alert fields
  indicator_type text NULL,   -- 'elliott-wave', 'market-structure', 'support-resistance'
  signal_subtype text NULL,   -- 'wave_5_complete', 'corrective_end', 'order_block_touch', 'sr_bounce', etc.

  -- Status
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'expired', 'canceled')),
  triggered_at timestamptz NULL,
  trigger_message text NULL,

  -- Metadata
  name text NULL,            -- User-friendly name for the alert
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for background service to quickly find active alerts
CREATE INDEX IF NOT EXISTS idx_user_alert_active ON user_alert(status, symbol)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_user_alert_user ON user_alert(user_id, status);

-- User drawings (persisted per user per chart)
CREATE TABLE IF NOT EXISTS user_drawing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  symbol text NOT NULL,
  timeframe text NOT NULL DEFAULT '1h',
  drawing_type text NOT NULL CHECK (drawing_type IN ('horizontal_line', 'trend_line', 'vertical_line', 'rectangle', 'fibonacci')),
  data jsonb NOT NULL DEFAULT '{}',  -- stores coordinates, colors, etc.
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_drawing_user_symbol ON user_drawing(user_id, symbol, timeframe);
