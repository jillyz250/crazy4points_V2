-- 670_sweet_spot_recheck.sql — sweet-spot recheck guardrail.
-- When a program devalues (change_signals devaluation/ratio_change), its sweet
-- spots are the first thing to go sour. These columns let the sweet-spot-recheck
-- guard flag them for re-verification so a devalued sweet spot can't stay live.
alter table public.sweet_spots
  add column if not exists recheck_flagged_at timestamptz,
  add column if not exists recheck_reason text;
create index if not exists sweet_spots_recheck_idx on public.sweet_spots (recheck_flagged_at);
