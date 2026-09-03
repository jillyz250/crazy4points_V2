-- 662_employee_quick_note.sql — a per-employee quick note (Jill, 2026-09-03).
-- Powers the small "Notes" panel in the employee-page hero (redesign A) — a spot
-- for Jill to jot a thought about that person / their current work.
alter table public.employees
  add column if not exists quick_note text;
