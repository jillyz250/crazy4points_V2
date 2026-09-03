-- 658_jill_tasks.sql — Jill's personal task list ("My Tasks", 2026-09-03).
-- Distinct from reminders (dated + auto-swept) and dashboard_notes (freeform notepad):
-- these are HER checkable to-dos that PERSIST until she checks them off — nothing
-- clears them but her. Surfaces as "My Tasks" on the dashboard (the "what needs me"
-- next to her avatar). Items can be seeded by the morning meeting (e.g. an overdue
-- reminder that's really Jill's action).

create table if not exists public.jill_tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  done        boolean not null default false,
  source      text,                                        -- 'manual' | 'morning-meeting' | 'reminder:<id>' ...
  link        text,                                        -- optional URL to act on it
  created_at  timestamptz not null default now(),
  done_at     timestamptz
);

create index if not exists jill_tasks_done_created_idx
  on public.jill_tasks (done, created_at desc);

-- SECURITY: admin-only, same model as the org tables (651). Service-role bypasses RLS;
-- RLS ON + NO public policies = default-deny to anon/authenticated.
alter table public.jill_tasks enable row level security;
