-- 667_task_source_idea.sql — close the idea loop (Jill, 2026-09-03).
-- Approving an idea creates a task (decideIdea). But a task marked done left the
-- idea stuck at "approved" forever — a half-open loop. This link lets finishing the
-- task auto-mark its source idea 'shipped', so the full circle closes:
--   new -> approved -> task -> done -> shipped.

alter table public.employee_tasks
  add column if not exists source_idea_id uuid;

-- Find the task for an idea (and mark the idea shipped on task completion).
create index if not exists employee_tasks_source_idea_idx
  on public.employee_tasks (source_idea_id)
  where source_idea_id is not null;
