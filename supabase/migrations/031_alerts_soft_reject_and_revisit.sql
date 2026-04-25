-- Phase 2 — decision memory.
-- Adds 'soft_rejected' as an alert status (status is plain text, no enum to
-- alter) plus a `revisit_after` timestamp. A soft-rejected alert acts like
-- "not now, but check again later." Scout's dedup logic respects this so
-- a similar finding doesn't re-stage until revisit_after has passed.
--
-- `decided_at` records when the most recent decision (reject / soft_reject
-- / approve) happened, so the dedup TTL can be measured from the decision
-- moment rather than created_at.

alter table alerts
  add column if not exists revisit_after timestamptz,
  add column if not exists decided_at timestamptz,
  add column if not exists rejected_reason text;

-- Backfill decided_at for existing rejected/published rows so the dedup TTL
-- has something to measure against. published_at when present, else updated_at.
update alerts
   set decided_at = coalesce(published_at, updated_at)
 where decided_at is null
   and status in ('published', 'rejected', 'expired');

create index if not exists alerts_decided_at_idx on alerts(decided_at desc) where decided_at is not null;
create index if not exists alerts_revisit_after_idx on alerts(revisit_after) where revisit_after is not null;
