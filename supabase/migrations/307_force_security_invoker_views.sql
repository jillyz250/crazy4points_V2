-- Re-apply security_invoker = on to admin views.
--
-- Migration 305 used `ALTER VIEW ... SET (security_invoker = on)` but the
-- Security Advisor is still flagging these views as SECURITY DEFINER. Either
-- the ALTER didn't take effect (transactional rollback?) or the linter cache
-- is stale; either way, this is a definitive belt-and-suspenders pass:
--
--   1. Verify current state for diagnostic visibility (RAISE NOTICE)
--   2. Re-apply security_invoker = true with explicit syntax
--   3. Verify again so the migration log shows the final state

do $$
declare
  v record;
begin
  raise notice '── Before fix ──';
  for v in
    select c.relname,
           c.reloptions
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('admin_extractions_browse', 'admin_refresh_queue')
      and c.relkind = 'v'
  loop
    raise notice 'view %.%  reloptions=%', 'public', v.relname, v.reloptions;
  end loop;
end $$;

-- Apply (both syntaxes — first the SET form, then re-confirm via RESET +
-- SET to defeat any cached planner state).
alter view public.admin_extractions_browse reset (security_invoker);
alter view public.admin_extractions_browse set (security_invoker = true);

alter view public.admin_refresh_queue reset (security_invoker);
alter view public.admin_refresh_queue set (security_invoker = true);

-- Verify after
do $$
declare
  v record;
begin
  raise notice '── After fix ──';
  for v in
    select c.relname,
           c.reloptions
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('admin_extractions_browse', 'admin_refresh_queue')
      and c.relkind = 'v'
  loop
    raise notice 'view %.%  reloptions=%', 'public', v.relname, v.reloptions;
  end loop;
end $$;

-- Re-revoke public/anon/authenticated grants for paranoia
revoke select on public.admin_extractions_browse from anon, authenticated;
revoke select on public.admin_refresh_queue from anon, authenticated;
