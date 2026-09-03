-- 663_employee_ideas.sql — per-employee "Ideas box" (Jill, 2026-09-03).
-- Each employee proactively suggests improvements to THEIR area — easier, faster,
-- more efficient, visually better. Decentralizes the daily "improvement" phases:
-- the people closest to the work flag what to sharpen; Morgan surfaces the ideas
-- in the morning meeting; Jill approves; approved ideas get shipped.

create table if not exists public.employee_ideas (
  id            uuid primary key default gen_random_uuid(),
  employee_slug text not null,                              -- whose area the idea is for (employees.slug)
  idea          text not null,
  area          text not null default 'other'
                  check (area in ('efficiency','visual','data','process','accuracy','growth','other')),
  status        text not null default 'new'
                  check (status in ('new','approved','rejected','shipped')),
  created_by    text not null default 'agent',              -- 'agent' (the employee) | 'jill' | 'morgan'
  decided_note  text,                                       -- Jill's note on approve/reject
  created_at    timestamptz not null default now(),
  decided_at    timestamptz,
  shipped_at    timestamptz
);

-- per-employee box: newest ideas first, filter by status
create index if not exists employee_ideas_slug_status_idx
  on public.employee_ideas (employee_slug, status, created_at desc);

-- SECURITY: admin-only, same model as the org tables (651). Service-role bypasses RLS;
-- RLS ON + NO public policies = default-deny to anon/authenticated.
alter table public.employee_ideas enable row level security;
