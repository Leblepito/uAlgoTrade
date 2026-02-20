CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

ALTER TABLE subscription_plan
  ADD COLUMN IF NOT EXISTS max_backtests_per_day integer NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_subscription_plan_max_backtests_per_day'
  ) THEN
    ALTER TABLE subscription_plan
      ADD CONSTRAINT ck_subscription_plan_max_backtests_per_day
      CHECK (max_backtests_per_day >= 0);
  END IF;
END;
$$;

INSERT INTO subscription_plan (code, name, max_indicators, max_backtests_per_day)
VALUES
  ('free', 'Free', 1, 0),
  ('pro', 'Pro', 3, 20),
  ('premium', 'Premium', 10, 50)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    max_indicators = EXCLUDED.max_indicators,
    max_backtests_per_day = EXCLUDED.max_backtests_per_day;

CREATE TABLE IF NOT EXISTS user_backtest_run (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_user_backtest_run_user_id_created_at
ON user_backtest_run(user_id, created_at DESC);

CREATE OR REPLACE VIEW v_user_entitlement AS
SELECT
  u.id AS user_id,
  u.email AS email,
  COALESCE(p.code, 'free') AS plan_code,
  COALESCE(p.max_indicators, 1) AS max_indicators,
  COALESCE(p.max_backtests_per_day, 0) AS max_backtests_per_day
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
