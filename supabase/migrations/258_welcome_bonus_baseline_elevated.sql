-- Welcome bonus: baseline + elevated flag.
--
-- The Sapphire Reserve pilot surfaced the pattern: issuer product pages
-- show "125,000 strike-through 150,000 points" — the struck value is the
-- card's STANDARD/baseline welcome offer, and the current value is the
-- elevated limited-time offer.
--
-- Capturing baseline separately enables:
--   1. Stable cross-card comparisons of normal welcome offers
--   2. "Show me cards with elevated offers right now" filter
--   3. Welcome_bonus_elevated alerts on FIRST extraction (current > baseline),
--      independent of the welcome_bonus_record_high alert which needs history
--   4. Editorial auto-surfacing of "Sapphire Reserve is 20% above baseline"
--      without manual flagging
--
-- Difference from is_historical_high:
--   - is_elevated         = current > THIS CARD'S baseline (first-pass detectable)
--   - is_historical_high  = current >= max EVER recorded across all extractions

alter table credit_card_welcome_bonuses
  add column if not exists baseline_bonus_amount integer
    check (baseline_bonus_amount is null or baseline_bonus_amount >= 0);

alter table credit_card_welcome_bonuses
  add column if not exists is_elevated boolean not null default false;

comment on column credit_card_welcome_bonuses.baseline_bonus_amount is
  'The card''s STANDARD welcome bonus when no limited-time elevation is active. Detected from strike-through patterns on issuer pages (e.g., Chase showing "125,000 [strike] 150,000"). When only one offer is visible, baseline equals bonus_amount. Used as the stable comparable for cross-card welcome-bonus rankings.';

comment on column credit_card_welcome_bonuses.is_elevated is
  'TRUE when bonus_amount > baseline_bonus_amount — i.e., the current offer is above the card''s usual floor. Detectable on first extraction (does not require historical comparison). Fires the welcome_bonus_elevated alert when flipped TRUE.';
