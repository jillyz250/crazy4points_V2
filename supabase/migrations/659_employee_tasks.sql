-- 659_employee_tasks.sql — Assigned Tasks per head (Jill, 2026-09-03).
-- Makes "assign it to Bill" actually MEAN something. Distinct from:
--   * responsibilities (standing duties, a flat list on the employee row)
--   * decision_log (proposals awaiting Jill's approve/reject)
--   * jill_tasks (Jill's OWN personal checklist)
-- An assigned task has an OWNER (a head), a PRIORITY (P1/P2/P3), and a STATUS
-- (todo/in_progress/blocked/done). Each head's page shows their open tasks at the
-- top, P1 first; Morgan surfaces each head's top open task in their morning-meeting
-- block. Order of the org = P1s first -> blockers -> oldest.

create table if not exists public.employee_tasks (
  id            uuid primary key default gen_random_uuid(),
  employee_slug text not null,                              -- the head who owns it (employees.slug)
  title         text not null,
  detail        text,                                       -- what "done" looks like / the plan
  priority      text not null default 'P2'
                  check (priority in ('P1','P2','P3')),
  status        text not null default 'todo'
                  check (status in ('todo','in_progress','blocked','done')),
  assigned_by   text default 'jill',                        -- 'jill' | 'morgan'
  link          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  due_at        timestamptz,
  done_at       timestamptz
);

-- per-head board: open tasks, highest priority first
create index if not exists employee_tasks_slug_status_idx
  on public.employee_tasks (employee_slug, status, priority);

-- SECURITY: admin-only, same model as the org tables (651). Service-role bypasses RLS;
-- RLS ON + NO public policies = default-deny to anon/authenticated.
alter table public.employee_tasks enable row level security;
