-- Resolve Supabase Security Advisor WARN findings.
--
-- Three categories of fixes:
--
-- 1. function_search_path_mutable (15 functions)
--    Set explicit search_path so functions can't be fooled by malicious
--    rewriting of the runtime search_path. Standard Supabase recommendation
--    is search_path = pg_catalog, public.
--    Uses a DO block + pg_get_function_identity_arguments() to handle each
--    function's actual signature (some have args, some don't, some were
--    created via the dashboard so we don't know upfront).
--
-- 2. rls_policy_always_true (1 policy)
--    "Allow admin insert on alerts" RLS policy uses WITH CHECK (true) which
--    is effectively no check. Admin code uses service_role (bypasses RLS),
--    so this policy is dead — drop it.
--
-- 3. anon/authenticated_security_definer_function_executable (rls_auto_enable)
--    Revoke EXECUTE from anon and authenticated so the function can't be
--    called via /rest/v1/rpc by web visitors.

-- ──────────────────────────────────────────────────────────────────────
-- 1) Pin search_path on every flagged function (handles any signature)
-- ──────────────────────────────────────────────────────────────────────

do $$
declare
  fn record;
  flagged_names constant text[] := array[
    'newsletters_set_updated_at',
    'increment_source_produced',
    'increment_source_approved',
    'partner_redemptions_set_updated_at',
    'hotel_properties_set_updated_at',
    'destinations_set_updated_at',
    'expire_alerts',
    'promo_rewards_set_updated_at',
    'issuers_set_updated_at',
    'credit_cards_set_updated_at',
    'credit_card_earn_rates_set_updated_at',
    'credit_card_benefits_set_updated_at',
    'credit_card_welcome_bonuses_set_updated_at',
    'program_transfers_set_updated_at',
    'update_updated_at'
  ];
begin
  for fn in
    select
      n.nspname as schema_name,
      p.proname as func_name,
      pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any (flagged_names)
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = pg_catalog, public',
      fn.schema_name,
      fn.func_name,
      fn.args
    );
    raise notice 'Pinned search_path on %.%(%)', fn.schema_name, fn.func_name, fn.args;
  end loop;
end $$;

-- ──────────────────────────────────────────────────────────────────────
-- 2) Drop the always-true admin-insert RLS policy on alerts
-- ──────────────────────────────────────────────────────────────────────

drop policy if exists "Allow admin insert on alerts" on public.alerts;

-- ──────────────────────────────────────────────────────────────────────
-- 3) Revoke EXECUTE on rls_auto_enable (same dynamic-signature approach)
-- ──────────────────────────────────────────────────────────────────────

do $$
declare
  fn record;
begin
  for fn in
    select
      n.nspname as schema_name,
      p.proname as func_name,
      pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'rls_auto_enable'
  loop
    execute format(
      'revoke execute on function %I.%I(%s) from anon, authenticated, public',
      fn.schema_name,
      fn.func_name,
      fn.args
    );
    raise notice 'Revoked execute on %.%(%)', fn.schema_name, fn.func_name, fn.args;
  end loop;
end $$;
