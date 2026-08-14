-- 626 — snooze for change_signals.
-- Speculative signals ("AA Cash & Miles coming soon", "unclear if good value")
-- aren't dismissible noise and aren't actionable yet — they're "check back
-- later". Snooze hides them from the queue until snoozed_until passes, then they
-- auto-resurface (no cron: the queue queries filter on the date). status stays
-- 'new' so a snoozed signal is still an open item, just deferred.

ALTER TABLE change_signals
  ADD COLUMN IF NOT EXISTS snoozed_until timestamptz;

CREATE INDEX IF NOT EXISTS change_signals_snoozed_idx
  ON change_signals (snoozed_until) WHERE snoozed_until IS NOT NULL;

COMMENT ON COLUMN change_signals.snoozed_until IS
  'When set and in the future, the signal is hidden from the new-queue until this passes (then auto-resurfaces). status stays new.';
