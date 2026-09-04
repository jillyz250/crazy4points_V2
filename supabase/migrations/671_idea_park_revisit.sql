-- 671_idea_park_revisit.sql — "park an idea for later" (Jill, 2026-09-04).
-- Some ideas are good but not NOW ("revisit in 6 months"). Instead of rejecting
-- (loses it) or approving (spins a task too early), PARK it with a revisit date.
-- Closes the loop: a parked idea can't rot silently — when revisit_on arrives it
-- resurfaces in the owner's brief / the aging monitor for a fresh act/hold/reject.

-- 1) allow the new 'parked' status
alter table public.employee_ideas drop constraint if exists employee_ideas_status_check;
alter table public.employee_ideas
  add constraint employee_ideas_status_check
  check (status in ('new','approved','rejected','shipped','parked'));

-- 2) the revisit date (only meaningful when status='parked')
alter table public.employee_ideas
  add column if not exists revisit_on date;

-- 3) fast lookup for "parked ideas due to resurface"
create index if not exists employee_ideas_revisit_idx
  on public.employee_ideas (revisit_on)
  where status = 'parked';
