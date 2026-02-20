-- Add new columns for TradingView-style alerts
ALTER TABLE user_alert
ADD COLUMN IF NOT EXISTS condition TEXT DEFAULT 'Crossing', -- Crossing, CrossingUp, CrossingDown, GreaterThan, LessThan, EnteringChannel, ExitingChannel, InsideChannel, OutsideChannel
ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'OnlyOnce', -- OnlyOnce, OncePerBar, OncePerBarClose, OncePerMinute
ADD COLUMN IF NOT EXISTS expiration_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_triggered_bar_time BIGINT, -- Unix timestamp of the bar where it last triggered
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'; -- Webhook URL, email, etc.
