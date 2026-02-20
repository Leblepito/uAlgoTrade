CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS payment_method (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('card', 'crypto', 'bank_transfer', 'manual', 'other')),
  is_default boolean NOT NULL DEFAULT false,
  label text NULL,
  provider text NULL,
  provider_payment_method_id text NULL,
  card_brand text NULL,
  card_last4 text NULL,
  card_exp_month smallint NULL CHECK (card_exp_month BETWEEN 1 AND 12),
  card_exp_year smallint NULL CHECK (card_exp_year BETWEEN 2000 AND 2100),
  crypto_network text NULL,
  crypto_address text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_payment_method_updated_at ON payment_method;
CREATE TRIGGER trg_payment_method_updated_at
BEFORE UPDATE ON payment_method
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS ix_payment_method_user_id ON payment_method(user_id);

DROP INDEX IF EXISTS ux_payment_method_default;
CREATE UNIQUE INDEX ux_payment_method_default
ON payment_method(user_id)
WHERE is_default;

ALTER TABLE user_subscription
  ADD COLUMN IF NOT EXISTS payment_method_id uuid NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_user_subscription_payment_method'
  ) THEN
    ALTER TABLE user_subscription
      ADD CONSTRAINT fk_user_subscription_payment_method
      FOREIGN KEY (payment_method_id)
      REFERENCES payment_method(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS payment_transaction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  subscription_id uuid NULL REFERENCES user_subscription(id) ON DELETE SET NULL,
  payment_method_id uuid NULL REFERENCES payment_method(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('created', 'pending', 'succeeded', 'failed', 'refunded', 'canceled', 'expired')),
  amount numeric(30, 12) NOT NULL CHECK (amount >= 0),
  currency text NOT NULL,
  provider text NULL,
  provider_payment_id text NULL,
  provider_customer_id text NULL,
  provider_reference text NULL,
  paid_at timestamptz NULL,
  confirmed_at timestamptz NULL,
  expires_at timestamptz NULL,
  crypto_network text NULL,
  crypto_address text NULL,
  crypto_tx_hash text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_payment_transaction_updated_at ON payment_transaction;
CREATE TRIGGER trg_payment_transaction_updated_at
BEFORE UPDATE ON payment_transaction
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS ix_payment_transaction_user_id ON payment_transaction(user_id);
CREATE INDEX IF NOT EXISTS ix_payment_transaction_subscription_id ON payment_transaction(subscription_id);
CREATE INDEX IF NOT EXISTS ix_payment_transaction_status ON payment_transaction(status);
CREATE INDEX IF NOT EXISTS ix_payment_transaction_created_at ON payment_transaction(created_at);

DROP INDEX IF EXISTS ux_payment_transaction_crypto_tx_hash;
CREATE UNIQUE INDEX ux_payment_transaction_crypto_tx_hash
ON payment_transaction(crypto_tx_hash)
WHERE crypto_tx_hash IS NOT NULL;

DROP VIEW IF EXISTS v_user_account;
CREATE OR REPLACE VIEW v_user_account AS
SELECT
  u.id AS user_id,
  u.email AS email,
  u.display_name AS display_name,
  u.created_at AS user_created_at,
  u.is_email_verified AS is_email_verified,
  u.email_verified_at AS email_verified_at,
  u.status AS user_status,
  ur.role_codes AS role_codes,
  COALESCE(active.plan_code, 'free') AS plan_code,
  COALESCE(p.name, 'Free') AS plan_name,
  COALESCE(p.max_indicators, 1) AS max_indicators,
  active.id AS active_subscription_id,
  active.status AS active_subscription_status,
  active.created_at AS active_subscription_purchased_at,
  active.current_period_start AS active_current_period_start,
  active.current_period_end AS active_current_period_end,
  active.cancel_at AS active_cancel_at,
  active.provider AS active_provider,
  active.provider_customer_id AS active_provider_customer_id,
  active.provider_subscription_id AS active_provider_subscription_id,
  apm.type AS active_payment_method_type,
  apm.label AS active_payment_method_label,
  apm.provider AS active_payment_method_provider,
  apm.provider_payment_method_id AS active_payment_method_provider_id,
  apm.card_brand AS active_payment_method_card_brand,
  apm.card_last4 AS active_payment_method_card_last4,
  apm.card_exp_month AS active_payment_method_card_exp_month,
  apm.card_exp_year AS active_payment_method_card_exp_year,
  apm.crypto_network AS active_payment_method_crypto_network,
  apm.crypto_address AS active_payment_method_crypto_address,
  CASE
    WHEN active.current_period_end IS NULL THEN NULL
    WHEN active.current_period_end <= now() THEN interval '0 seconds'
    ELSE active.current_period_end - now()
  END AS active_time_remaining,
  CASE
    WHEN active.current_period_end IS NULL THEN NULL
    WHEN active.current_period_end <= now() THEN 0
    ELSE floor(extract(epoch from (active.current_period_end - now())))::bigint
  END AS active_time_remaining_seconds,
  last_sub.id AS last_subscription_id,
  last_sub.plan_code AS last_subscription_plan_code,
  last_sub.status AS last_subscription_status,
  last_sub.created_at AS last_subscription_purchased_at,
  last_sub.current_period_start AS last_current_period_start,
  last_sub.current_period_end AS last_current_period_end,
  last_sub.cancel_at AS last_cancel_at,
  last_sub.provider AS last_provider,
  last_sub.provider_customer_id AS last_provider_customer_id,
  last_sub.provider_subscription_id AS last_provider_subscription_id
FROM app_user u
LEFT JOIN LATERAL (
  SELECT us.*
  FROM user_subscription us
  WHERE us.user_id = u.id
    AND us.status IN ('active', 'trialing', 'past_due')
    AND (us.current_period_end IS NULL OR us.current_period_end > now())
  ORDER BY us.current_period_start DESC
  LIMIT 1
) active ON true
LEFT JOIN v_user_roles ur ON ur.user_id = u.id
LEFT JOIN subscription_plan p ON p.code = COALESCE(active.plan_code, 'free')
LEFT JOIN payment_method apm ON apm.id = active.payment_method_id
LEFT JOIN LATERAL (
  SELECT us.*
  FROM user_subscription us
  WHERE us.user_id = u.id
  ORDER BY us.created_at DESC
  LIMIT 1
) last_sub ON true;
