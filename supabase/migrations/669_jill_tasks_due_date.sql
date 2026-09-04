-- 669_jill_tasks_due_date.sql — optional due date on Jill's personal tasks.
-- She can set a date when adding a task; the dashboard shows it and flags overdue.
alter table public.jill_tasks add column if not exists due_date date;
create index if not exists jill_tasks_due_date_idx on public.jill_tasks (due_date);
