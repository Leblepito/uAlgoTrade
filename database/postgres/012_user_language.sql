-- Migration 012: Add preferred_language to app_user
-- Supports: en, tr, th, ru, zh, es

BEGIN;

ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en'
    CONSTRAINT chk_preferred_language
      CHECK (preferred_language IN ('en', 'tr', 'th', 'ru', 'zh', 'es'));

-- Update the v_user_account view to include language
-- First drop the existing view
DROP VIEW IF EXISTS v_user_account;

-- Recreate with language
CREATE VIEW v_user_account AS
SELECT
  u.id,
  u.email,
  u.display_name,
  u.is_email_verified,
  u.status,
  u.preferred_language,
  u.created_at,
  u.last_login_at,
  COALESCE(
    (SELECT s.plan_code
     FROM user_subscription s
     WHERE s.user_id = u.id
       AND s.status = 'active'
       AND (s.current_period_end IS NULL OR s.current_period_end > now())
     ORDER BY s.created_at DESC
     LIMIT 1),
    'free'
  ) AS plan_code
FROM app_user u
WHERE u.status = 'active';

COMMIT;
