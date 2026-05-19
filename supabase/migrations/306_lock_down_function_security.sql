-- Resolve Supabase Security Advisor WARN findings.
--
-- Three categories of fixes:
--
-- 1. function_search_path_mutable (15 functions)
--    Set explicit search_path so functions can't be fooled by malicious
--    rewriting of the runtime search_path. Standard Supabase recommendation
--    is search_path = pg_catalog, public so common Postgres functions and
--    our own public-schema objects both resolve correctly.
--
-- 2. rls_policy_always_true (1 policy)
--    The "Allow admin insert on alerts" RLS policy uses WITH CHECK (true)
--    which is effectively no check. Admin code uses service_role (which
--    bypasses RLS), so this policy is dead code — drop it.
--
-- 3. anon/authenticated_security_definer_function_executable (rls_auto_enable)
--    Revoke EXECUTE from anon and authenticated so the function can't be
--    called via /rest/v1/rpc/rls_auto_enable by web visitors. Service-role
--    callers (admin migrations) are unaffected.

-- ──────────────────────────────────────────────────────────────────────
-- 1) Pin search_path on every flagged function
-- ──────────────────────────────────────────────────────────────────────

alter function public.newsletters_set_updated_at() set search_path = pg_catalog, public;
alter function public.increment_source_produced() set search_path = pg_catalog, public;
alter function public.increment_source_approved() set search_path = pg_catalog, public;
alter function public.partner_redemptions_set_updated_at() set search_path = pg_catalog, public;
alter function public.hotel_properties_set_updated_at() set search_path = pg_catalog, public;
alter function public.destinations_set_updated_at() set search_path = pg_catalog, public;
alter function public.expire_alerts() set search_path = pg_catalog, public;
alter function public.promo_rewards_set_updated_at() set search_path = pg_catalog, public;
alter function public.issuers_set_updated_at() set search_path = pg_catalog, public;
alter function public.credit_cards_set_updated_at() set search_path = pg_catalog, public;
alter function public.credit_card_earn_rates_set_updated_at() set search_path = pg_catalog, public;
alter function public.credit_card_benefits_set_updated_at() set search_path = pg_catalog, public;
alter function public.credit_card_welcome_bonuses_set_updated_at() set search_path = pg_catalog, public;
alter function public.program_transfers_set_updated_at() set search_path = pg_catalog, public;
alter function public.update_updated_at() set search_path = pg_catalog, public;

-- ──────────────────────────────────────────────────────────────────────
-- 2) Drop the always-true admin-insert RLS policy on alerts
-- ──────────────────────────────────────────────────────────────────────
--
-- Background: this policy was created early on as a placeholder; admin
-- inserts actually run through service_role (createAdminClient) which
-- bypasses RLS entirely. The policy is unused and the linter is right
-- that WITH CHECK (true) defeats the whole point of RLS.

drop policy if exists "Allow admin insert on alerts" on public.alerts;

-- ──────────────────────────────────────────────────────────────────────
-- 3) Revoke EXECUTE on rls_auto_enable from public roles
-- ──────────────────────────────────────────────────────────────────────
--
-- This function is a SECURITY DEFINER helper (likely created via the
-- Supabase dashboard or an old migration); exposing it via /rest/v1/rpc
-- to anon/authenticated lets web visitors invoke it. Lock to service_role
-- only — migrations/admin still call it through the service connection.

revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
