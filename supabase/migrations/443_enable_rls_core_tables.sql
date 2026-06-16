-- 443_enable_rls_core_tables.sql
--
-- Audit 2026-06-15 (RLS finding, confirmed by anon-key probe): the public
-- anon key (embedded in the client bundle) could UPDATE rows in `programs`
-- and `alert_programs`, and reached `alerts` (blocked only by the G6 trigger).
-- Root cause: these tables had SELECT policies defined ad-hoc in prod, but
-- ROW LEVEL SECURITY was never enabled — so the policies were inert and the
-- tables were governed by table GRANTs, which allowed anon writes.
--
-- Fix: enable RLS and define PUBLIC READ-ONLY policies (idempotent, since the
-- prod policies were never captured in a migration). With no INSERT/UPDATE/
-- DELETE policies, anon writes are denied. The app's server code uses the
-- service-role client (createAdminClient), which BYPASSES RLS, so server-side
-- reads/writes are unaffected. Anon reads stay open for the sitemap,
-- /api/programs, and public program/alert pages.
--
-- Note: alerts is restricted to published rows for anon (matches the existing
-- prod policy intent) — anon must not see drafts/unpublished alerts.
--
-- Idempotent: safe to re-run.

alter table public.programs        enable row level security;
alter table public.alerts          enable row level security;
alter table public.alert_programs  enable row level security;

drop policy if exists "programs anon read" on public.programs;
create policy "programs anon read"
  on public.programs for select
  to anon, authenticated
  using (true);

drop policy if exists "alert_programs anon read" on public.alert_programs;
create policy "alert_programs anon read"
  on public.alert_programs for select
  to anon, authenticated
  using (true);

-- Published-only: anon/authenticated must not read draft/unpublished alerts.
drop policy if exists "alerts anon read published" on public.alerts;
create policy "alerts anon read published"
  on public.alerts for select
  to anon, authenticated
  using (status = 'published'::alert_status);
