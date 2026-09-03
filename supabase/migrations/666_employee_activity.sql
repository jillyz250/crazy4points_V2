-- 666_employee_activity.sql — per-employee activity chain ("what I shipped").
-- Jill wants to see the hand-off chain on each teammate's page: when an alert
-- publishes, it should show as a finished item under the people who did the work
-- (Priya verified, John wrote/published, Kesha posted, ...). This is the feed that
-- powers that. Logged best-effort from the content pipeline; never blocks a publish.

create table if not exists public.employee_activity (
  id            uuid primary key default gen_random_uuid(),
  employee_slug text not null,                     -- who did it (employees.slug)
  action        text not null,                     -- verb: verified | drafted | published | posted | fixed | reviewed | shipped
  summary       text not null,                     -- one line: what it was
  ref_type      text,                              -- alert | page | social | guide | task | other
  ref_id        text,                              -- id/slug of the thing
  link          text,                              -- clickable target (e.g. /alerts/amex-mr)
  created_at    timestamptz not null default now()
);

-- per-person feed (newest first) + a global "today's output" feed
create index if not exists employee_activity_slug_idx
  on public.employee_activity (employee_slug, created_at desc);
create index if not exists employee_activity_recent_idx
  on public.employee_activity (created_at desc);

-- SECURITY: admin-only, same model as the org tables (651/655/664). Service-role
-- bypasses RLS; RLS ON + NO public policies = default-deny to anon + authenticated.
alter table public.employee_activity enable row level security;
