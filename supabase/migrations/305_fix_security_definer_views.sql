-- Flip admin views from SECURITY DEFINER to SECURITY INVOKER.
--
-- Supabase Security Advisor flagged these as ERROR-level findings:
--   - public.admin_extractions_browse
--   - public.admin_refresh_queue
--
-- Default Postgres behavior on CREATE VIEW (before PG15) was SECURITY DEFINER,
-- which means the view runs with the CREATOR's permissions (typically the
-- superuser/postgres role via migrations). This bypasses RLS for whoever
-- queries the view — if anon/authenticated ever gain SELECT on the view,
-- they get elevated read access.
--
-- security_invoker=true makes views execute as the QUERYING user, respecting
-- their permissions and RLS. This is the modern Supabase-recommended default.
--
-- We hit these views only from /admin pages (which use service_role and have
-- full access anyway), so this is a hardening pass — no functional change.

alter view public.admin_extractions_browse set (security_invoker = on);
alter view public.admin_refresh_queue set (security_invoker = on);

-- Also revoke anon/authenticated SELECT on both. The admin client uses
-- service_role which is unaffected by these revokes. Belt-and-braces in case
-- a future change accidentally re-grants SELECT to the public role.
revoke select on public.admin_extractions_browse from anon, authenticated;
revoke select on public.admin_refresh_queue from anon, authenticated;
