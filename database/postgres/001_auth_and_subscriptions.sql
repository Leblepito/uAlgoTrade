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

CREATE OR REPLACE FUNCTION normalize_app_user()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_email_verified AND NEW.email_verified_at IS NULL THEN
    NEW.email_verified_at = now();
  END IF;

  IF NOT NEW.is_email_verified AND NEW.email_verified_at IS NOT NULL THEN
    NEW.email_verified_at = NULL;
  END IF;

  IF NEW.status = 'deleted' AND NEW.deleted_at IS NULL THEN
    NEW.deleted_at = now();
  END IF;

  IF NEW.status <> 'deleted' AND NEW.deleted_at IS NOT NULL THEN
    NEW.deleted_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS app_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NULL,
  is_email_verified boolean NOT NULL DEFAULT false,
  email_verified_at timestamptz NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'deleted')),
  last_login_at timestamptz NULL,
  last_seen_at timestamptz NULL,
  failed_login_attempts integer NOT NULL DEFAULT 0 CHECK (failed_login_attempts >= 0),
  locked_until timestamptz NULL,
  password_changed_at timestamptz NULL,
  deleted_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz NULL;
ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';
ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz NULL;
ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NULL;
ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS failed_login_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS locked_until timestamptz NULL;
ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz NULL;
ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_app_user_status'
  ) THEN
    ALTER TABLE app_user
      ADD CONSTRAINT ck_app_user_status
      CHECK (status IN ('active', 'disabled', 'deleted'));
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_app_user_updated_at ON app_user;
CREATE TRIGGER trg_app_user_updated_at
BEFORE UPDATE ON app_user
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_app_user_normalize ON app_user;
CREATE TRIGGER trg_app_user_normalize
BEFORE INSERT OR UPDATE ON app_user
FOR EACH ROW
EXECUTE FUNCTION normalize_app_user();

CREATE TABLE IF NOT EXISTS app_role (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NULL,
  is_system boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_app_role_updated_at ON app_role;
CREATE TRIGGER trg_app_role_updated_at
BEFORE UPDATE ON app_role
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

INSERT INTO app_role (code, name, description, is_system)
VALUES
  ('user', 'User', 'Default user role', true),
  ('admin', 'Admin', 'Full administrative access', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_system = EXCLUDED.is_system;

CREATE TABLE IF NOT EXISTS app_permission (
  code text PRIMARY KEY,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_permission (code, description)
VALUES
  ('admin:all', 'Full administrative access'),
  ('users:read', 'Read users'),
  ('users:write', 'Manage users'),
  ('billing:read', 'Read billing/subscription data'),
  ('billing:write', 'Manage billing/subscriptions'),
  ('indicators:read', 'Read indicators/workbench'),
  ('indicators:write', 'Manage indicators/workbench')
ON CONFLICT (code) DO UPDATE
SET description = EXCLUDED.description;

CREATE TABLE IF NOT EXISTS role_permission (
  role_id uuid NOT NULL REFERENCES app_role(id) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES app_permission(code) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_code)
);

CREATE INDEX IF NOT EXISTS ix_role_permission_permission_code ON role_permission(permission_code);

DO $$
DECLARE
  admin_role_id uuid;
  user_role_id uuid;
BEGIN
  SELECT id INTO admin_role_id FROM app_role WHERE code = 'admin';
  SELECT id INTO user_role_id FROM app_role WHERE code = 'user';

  IF admin_role_id IS NOT NULL THEN
    INSERT INTO role_permission (role_id, permission_code)
    SELECT admin_role_id, p.code
    FROM app_permission p
    ON CONFLICT DO NOTHING;
  END IF;

  IF user_role_id IS NOT NULL THEN
    INSERT INTO role_permission (role_id, permission_code)
    VALUES
      (user_role_id, 'indicators:read'),
      (user_role_id, 'indicators:write'),
      (user_role_id, 'billing:read')
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS user_role (
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES app_role(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS ix_user_role_role_id ON user_role(role_id);

CREATE OR REPLACE FUNCTION assign_default_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  default_role_id uuid;
BEGIN
  SELECT id INTO default_role_id FROM app_role WHERE code = 'user';
  IF default_role_id IS NOT NULL THEN
    INSERT INTO user_role (user_id, role_id)
    VALUES (NEW.id, default_role_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_app_user_assign_default_role ON app_user;
CREATE TRIGGER trg_app_user_assign_default_role
AFTER INSERT ON app_user
FOR EACH ROW
EXECUTE FUNCTION assign_default_user_role();

CREATE OR REPLACE VIEW v_user_roles AS
SELECT
  ur.user_id,
  array_agg(r.code ORDER BY r.code) AS role_codes,
  array_agg(r.name ORDER BY r.code) AS role_names
FROM user_role ur
JOIN app_role r ON r.id = ur.role_id
GROUP BY ur.user_id;

CREATE TABLE IF NOT EXISTS user_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  user_agent text NULL,
  ip inet NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS ix_user_session_user_id ON user_session(user_id);
CREATE INDEX IF NOT EXISTS ix_user_session_expires_at ON user_session(expires_at);

DROP INDEX IF EXISTS ux_user_session_refresh_token_hash;
CREATE UNIQUE INDEX ux_user_session_refresh_token_hash
ON user_session(refresh_token_hash);

CREATE TABLE IF NOT EXISTS user_email_verification_token (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS ix_user_email_verification_token_user_id ON user_email_verification_token(user_id);
CREATE INDEX IF NOT EXISTS ix_user_email_verification_token_expires_at ON user_email_verification_token(expires_at);

DROP INDEX IF EXISTS ux_user_email_verification_token_token_hash;
CREATE UNIQUE INDEX ux_user_email_verification_token_token_hash
ON user_email_verification_token(token_hash);

CREATE TABLE IF NOT EXISTS user_password_reset_token (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz NULL
);

CREATE INDEX IF NOT EXISTS ix_user_password_reset_token_user_id ON user_password_reset_token(user_id);
CREATE INDEX IF NOT EXISTS ix_user_password_reset_token_expires_at ON user_password_reset_token(expires_at);

DROP INDEX IF EXISTS ux_user_password_reset_token_token_hash;
CREATE UNIQUE INDEX ux_user_password_reset_token_token_hash
ON user_password_reset_token(token_hash);

CREATE TABLE IF NOT EXISTS user_audit_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid NULL REFERENCES app_user(id) ON DELETE SET NULL,
  target_user_id uuid NULL REFERENCES app_user(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_user_audit_event_actor_user_id ON user_audit_event(actor_user_id);
CREATE INDEX IF NOT EXISTS ix_user_audit_event_target_user_id ON user_audit_event(target_user_id);
CREATE INDEX IF NOT EXISTS ix_user_audit_event_created_at ON user_audit_event(created_at);

CREATE TABLE IF NOT EXISTS subscription_plan (
  code text PRIMARY KEY,
  name text NOT NULL,
  max_indicators integer NOT NULL CHECK (max_indicators >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_subscription_plan_updated_at ON subscription_plan;
CREATE TRIGGER trg_subscription_plan_updated_at
BEFORE UPDATE ON subscription_plan
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

INSERT INTO subscription_plan (code, name, max_indicators)
VALUES
  ('free', 'Free', 1),
  ('pro', 'Pro', 3),
  ('premium', 'Premium', 10)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    max_indicators = EXCLUDED.max_indicators;

CREATE TABLE IF NOT EXISTS user_subscription (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  plan_code text NOT NULL REFERENCES subscription_plan(code),
  status text NOT NULL CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'expired')),
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NULL,
  cancel_at timestamptz NULL,
  provider text NULL,
  provider_customer_id text NULL,
  provider_subscription_id text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_user_subscription_updated_at ON user_subscription;
CREATE TRIGGER trg_user_subscription_updated_at
BEFORE UPDATE ON user_subscription
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS ix_user_subscription_user_id ON user_subscription(user_id);
CREATE INDEX IF NOT EXISTS ix_user_subscription_plan_code ON user_subscription(plan_code);

DROP INDEX IF EXISTS ux_user_subscription_active;
CREATE UNIQUE INDEX ux_user_subscription_active
ON user_subscription(user_id)
WHERE status IN ('active', 'trialing', 'past_due');

CREATE OR REPLACE VIEW v_user_entitlement AS
SELECT
  u.id AS user_id,
  u.email AS email,
  COALESCE(p.code, 'free') AS plan_code,
  COALESCE(p.max_indicators, 1) AS max_indicators
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
LEFT JOIN LATERAL (
  SELECT us.*
  FROM user_subscription us
  WHERE us.user_id = u.id
  ORDER BY us.created_at DESC
  LIMIT 1
) last_sub ON true;
