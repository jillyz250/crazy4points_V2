-- ============================================================================
-- 356 - Exact spend-window in days for welcome bonuses.
--
-- Issuers state SUB windows in different units: Chase "3 months", Amex
-- "6 months", Barclays "90 days". Storing only spend_window_months forced
-- "90 days" to render as "3 months". Add an optional spend_window_days so the
-- public card page can show the exact window the issuer publishes. When
-- spend_window_days is set, render prefers it; otherwise it falls back to
-- spend_window_months.
-- ============================================================================

ALTER TABLE credit_card_welcome_bonuses
  ADD COLUMN IF NOT EXISTS spend_window_days int;

-- Relax spend_window_months so a days-only bonus (Barclays "90 days", with no
-- months value) can be stored. At least one of days/months should be set, but
-- that's enforced in app code, not a DB constraint.
ALTER TABLE credit_card_welcome_bonuses
  ALTER COLUMN spend_window_months DROP NOT NULL;

COMMENT ON COLUMN credit_card_welcome_bonuses.spend_window_days IS
  'Exact spend window in days, when the issuer states it in days (e.g. Barclays "first 90 days"). Render prefers this over spend_window_months when set. NULL = use spend_window_months.';
