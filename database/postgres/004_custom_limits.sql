-- Add override columns to app_user (e.g. max_indicators_override, max_backtests_per_day_override)
ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS max_indicators_override integer NULL,
  ADD COLUMN IF NOT EXISTS max_backtests_per_day_override integer NULL;

-- Create constraint to ensure non-negative if set
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_app_user_max_indicators_override') THEN
    ALTER TABLE app_user ADD CONSTRAINT ck_app_user_max_indicators_override CHECK (max_indicators_override >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_app_user_max_backtests_per_day_override') THEN
    ALTER TABLE app_user ADD CONSTRAINT ck_app_user_max_backtests_per_day_override CHECK (max_backtests_per_day_override >= 0);
  END IF;
END $$;

-- Update the entitlement view to prioritize overrides
CREATE OR REPLACE VIEW v_user_entitlement AS
SELECT
  u.id AS user_id,
  u.email AS email,
  COALESCE(p.code, 'free') AS plan_code,
  -- Use override if present, else plan limit, else default
  COALESCE(u.max_indicators_override, p.max_indicators, 1) AS max_indicators,
  COALESCE(u.max_backtests_per_day_override, p.max_backtests_per_day, 0) AS max_backtests_per_day
FROM app_user u
LEFT JOIN LATERAL (
  SELECT us.plan_code
  FROM user_subscription us
  WHERE us.user_id = u.id
    AND us.status IN ('active', 'trialing', 'past_due')
    AND (us.current_period_end IS NULL OR us.current_period_end > now())
  ORDER BY us.current_period_start DESC
  LIMIT 1
) cur ON true
LEFT JOIN subscription_plan p ON p.code = cur.plan_code;
