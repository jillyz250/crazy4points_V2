-- 664_employee_briefs.sql — stored copy of each employee's morning brief (Jill, 2026-09-03).
-- Every day a head narrates a brief; we keep a copy on their page — a dated history,
-- each clickable to a simple readable version. One brief per employee per day.

create table if not exists public.employee_briefs (
  id            uuid primary key default gen_random_uuid(),
  employee_slug text not null,
  brief_date    date not null,
  body          text,                                       -- the narrated brief (markdown / plain text) — the "simple version"
  data          jsonb,                                      -- optional: the raw structured brief (from employee-brief.mjs)
  created_at    timestamptz not null default now(),
  unique (employee_slug, brief_date)
);

create index if not exists employee_briefs_slug_date_idx
  on public.employee_briefs (employee_slug, brief_date desc);

-- SECURITY: admin-only, same model as the org tables (651). Service-role bypasses RLS;
-- RLS ON + NO public policies = default-deny to anon/authenticated.
alter table public.employee_briefs enable row level security;
