-- good_to_know prose-review flag.
-- Recurring problem: updating a card's welcome-bonus DATA (via the Apply button
-- on /admin/card-bonus-signals, a re-extract, or the Firecrawl monitor) leaves
-- the good_to_know PROSE quoting the OLD number. The weekly Sonnet audit catches
-- it eventually, but up to 7 days late. These columns let the apply flow flag the
-- card the moment the bonus changes, so the editor can re-check the prose now.
--   good_to_know_review_at     - set when a bonus change may have staled the prose;
--                                cleared when the editor next saves good_to_know.
--   good_to_know_review_reason - human-readable note (what changed) for the editor.
alter table credit_cards
  add column if not exists good_to_know_review_at timestamptz,
  add column if not exists good_to_know_review_reason text;

comment on column credit_cards.good_to_know_review_at is
  'Set when a welcome-bonus change may have left good_to_know prose stale; cleared on next good_to_know save. Surfaced on /admin/data-integrity + /admin/card-bonus-signals.';
