-- Phase-1-adjacent cleanup: bot defense + signup_source tracking.
--
-- Triggered by a Gmail dot-trick bot signing up as
-- sid.uf.a.lip.e79@gmail.com on 2026-05-20 — the second such bot in 30 days
-- (u.ti.hune.w.as.0.2 was caught manually on 2026-04-26).
--
-- The existing honeypot field on the signup forms didn't catch them because
-- they bypassed the forms entirely and POSTed directly to /api/subscribe.
-- Rate-limiting (10/IP/hr) doesn't catch a one-shot bot either.
--
-- Two changes:
--   1. Deactivate the new bot row so the active subscriber count stays honest.
--   2. Add signup_source column so future signups carry where they came from.
--
-- Code-side defense (3+ dot heuristic + signup_source plumbing) ships in the
-- same PR. Idempotent + non-destructive.

-- ============================================================================
-- 1. Deactivate the bot row (preserve for audit; don't delete)
-- ============================================================================

UPDATE subscribers
   SET active = false
 WHERE email = 'sid.uf.a.lip.e79@gmail.com'
   AND active = true;

-- ============================================================================
-- 2. Add signup_source column for future tracking
-- ============================================================================

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS signup_source text;

COMMENT ON COLUMN subscribers.signup_source IS
  'Where the subscriber signed up. Values: homepage_hero | footer | hub_hero | inline_alert | newsletter_link | manual | api_direct. NULL for legacy rows that pre-date the tracking.';

CREATE INDEX IF NOT EXISTS subscribers_signup_source_idx
  ON subscribers (signup_source)
  WHERE signup_source IS NOT NULL;
