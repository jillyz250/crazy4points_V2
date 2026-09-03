-- 655_decision_log.sql — the Decision Log (Jill, 2026-09-02).
-- The visibility + safety net for the Morning Meeting reboot: every action a head
-- takes ON JILL'S BEHALF is recorded here — what, why, at what stakes, and whether
-- it was proposed-for-approval or auto-executed. Jill reviews + can UNDO. This is
-- the PRECONDITION for exception-first delegation: heads absorb the volume, but
-- nothing they do is invisible or irreversible.
--
-- Model (see plans/morning-meeting-reboot.md):
--  * PROPOSE MODE (default, "probation"): head writes mode='proposed', status='pending';
--    nothing executes until Jill approves. She sees everything, like today.
--  * AUTO MODE (per head + stakes, once trusted): mode='auto', status='executed',
--    still logged + reversible. Graduate LOW stakes only; HIGH stakes stay manual forever.
--  * A rejected/undone decision feeds an employee_logs 'shortcoming' → the head learns.

create table if not exists public.decision_log (
  id             uuid primary key default gen_random_uuid(),
  employee_slug  text not null,                              -- which head made/proposed the call (employees.slug)
  action         text not null,                              -- dismiss | skip | bulk_skip | resolve | snooze | publish | edit | feature | send | feedback | other
  stakes         text not null default 'low'
                   check (stakes in ('low','high')),         -- low = graduatable to auto; high = always manual
  mode           text not null default 'proposed'
                   check (mode in ('proposed','auto')),      -- proposed = needs Jill; auto = head executed (still logged)
  status         text not null default 'pending'
                   check (status in ('pending','approved','rejected','executed','undone')),
  target_type    text,                                       -- experience_listing | sweepstakes | intel_item | reminder | drift | change_signal | draft | ...
  target_id      text,                                       -- id of the affected row (null for bulk)
  target_label   text,                                       -- human label ("212 directory-noise experiences")
  reason         text,                                       -- WHY the head did it (required in practice)
  item_count     integer not null default 1,                 -- >1 for bulk actions
  correlation_id text,                                        -- the morning's date (YYYY-MM-DD) so a day groups together
  reviewed_by_jill boolean not null default false,           -- has Jill looked at / cleared this
  actor          text not null default 'agent',              -- 'agent' | 'jill' | 'morgan' | 'system'
  created_at     timestamptz not null default now(),
  reviewed_at    timestamptz,                                -- when Jill approved/rejected/undid
  executed_at    timestamptz,                                -- when the action actually took effect
  undone_at      timestamptz
);

-- "this head, newest first" (per-head Recent decisions section)
create index if not exists decision_log_employee_created_idx
  on public.decision_log (employee_slug, created_at desc);
-- the pending-approval queue + the day's feed
create index if not exists decision_log_status_created_idx
  on public.decision_log (status, created_at desc);
create index if not exists decision_log_correlation_idx
  on public.decision_log (correlation_id);

-- SECURITY: internal admin-only, same model as the org tables (651). Admin pages use
-- the service-role client (bypasses RLS). RLS ON + NO public policies = default-deny to
-- anon + authenticated, so the decision log is never publicly readable.
alter table public.decision_log enable row level security;
