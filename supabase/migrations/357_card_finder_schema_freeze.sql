-- ============================================================================
-- 357 - Card Finder schema freeze (build step 1).
--
-- Implements the LOCKED schema from plans/card-finder-filter-design.md (v3).
-- ADDITIVE + non-destructive: adds new columns, keeps all existing ones. The
-- data migration (mapping benefit_type -> family/type/provider, backfilling
-- benefit_source, dedup, normalization) is a SEPARATE audited step. Nothing is
-- dropped here.
--
-- Powers a faceted finder where benefits are filterable by a stable
-- family/type/provider hierarchy (no enum churn for new merchants), with
-- structured attributes/conditions and source/confidence for trustworthy
-- "has X" filters.
-- ============================================================================

-- 1. credit_card_benefits -- the family/type/provider hierarchy + source ------
ALTER TABLE credit_card_benefits
  ADD COLUMN IF NOT EXISTS benefit_family  text,
  ADD COLUMN IF NOT EXISTS provider        text,
  ADD COLUMN IF NOT EXISTS attributes      jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS conditions      jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS benefit_source  text,
  ADD COLUMN IF NOT EXISTS confidence      text;

ALTER TABLE credit_card_benefits DROP CONSTRAINT IF EXISTS ccb_benefit_family_check;
ALTER TABLE credit_card_benefits ADD CONSTRAINT ccb_benefit_family_check
  CHECK (benefit_family IS NULL OR benefit_family IN
    ('lounge','insurance','credit','hotel','airline','status','protection','earning','perk'));

ALTER TABLE credit_card_benefits DROP CONSTRAINT IF EXISTS ccb_benefit_source_check;
ALTER TABLE credit_card_benefits ADD CONSTRAINT ccb_benefit_source_check
  CHECK (benefit_source IS NULL OR benefit_source IN
    ('issuer_primary','issuer_subpage','network','co_brand','inferred'));

ALTER TABLE credit_card_benefits DROP CONSTRAINT IF EXISTS ccb_confidence_check;
ALTER TABLE credit_card_benefits ADD CONSTRAINT ccb_confidence_check
  CHECK (confidence IS NULL OR confidence IN ('high','medium','low'));

COMMENT ON COLUMN credit_card_benefits.benefit_family IS 'Top-level filter group (lounge/insurance/credit/hotel/airline/status/protection/earning/perk). Stable.';
COMMENT ON COLUMN credit_card_benefits.provider IS 'Free-text provider (Uber, Lyft, Priority Pass, Centurion...) - DATA not enum, so new partners need no schema change.';
COMMENT ON COLUMN credit_card_benefits.attributes IS 'Structured attrs: value_amount, frequency, coverage_amount, deductible, per_claim_limit, per_year_limit, count, companions_covered, spend_threshold_usd, category_ceiling, cap_amount_usd, cap_group_id, point_value.';
COMMENT ON COLUMN credit_card_benefits.conditions IS 'Structured fine print: enrollment_required, booking_channel, pay_with_card_vs_hold, au_eligible, primary_only, taxes_fees_only, expires_at, promo_only.';
COMMENT ON COLUMN credit_card_benefits.benefit_source IS 'Where the benefit was found: issuer_primary | issuer_subpage | network | co_brand | inferred. Surfaces verification + fixes sub-page false-negatives.';

-- 2. credit_cards -- scalar filter fields + governed value estimates ----------
ALTER TABLE credit_cards
  ADD COLUMN IF NOT EXISTS network                            text,
  ADD COLUMN IF NOT EXISTS network_level                      text,
  ADD COLUMN IF NOT EXISTS issuer_family                      text,
  ADD COLUMN IF NOT EXISTS transfer_eligibility               text,
  ADD COLUMN IF NOT EXISTS estimated_bonus_value_usd          numeric,
  ADD COLUMN IF NOT EXISTS estimated_first_year_net_value_usd numeric,
  ADD COLUMN IF NOT EXISTS value_estimated_at                 timestamptz;

ALTER TABLE credit_cards DROP CONSTRAINT IF EXISTS cc_network_check;
ALTER TABLE credit_cards ADD CONSTRAINT cc_network_check
  CHECK (network IS NULL OR network IN ('visa','mastercard','amex','discover'));

ALTER TABLE credit_cards DROP CONSTRAINT IF EXISTS cc_transfer_eligibility_check;
ALTER TABLE credit_cards ADD CONSTRAINT cc_transfer_eligibility_check
  CHECK (transfer_eligibility IS NULL OR transfer_eligibility IN ('direct','pool_to_unlock','none'));

COMMENT ON COLUMN credit_cards.transfer_eligibility IS 'Can points earned on THIS card transfer to partners? direct | pool_to_unlock (needs a premium sibling, e.g. Freedom/Ink Cash) | none.';
COMMENT ON COLUMN credit_cards.estimated_bonus_value_usd IS 'Editorially-maintained ESTIMATE. Label "estimated" in UI; refresh quarterly (see value_estimated_at).';

-- 3. credit_card_earn_rates -- shared-cap grouping ---------------------------
ALTER TABLE credit_card_earn_rates
  ADD COLUMN IF NOT EXISTS cap_group_id text;
COMMENT ON COLUMN credit_card_earn_rates.cap_group_id IS 'Earn rows sharing one cap carry the same cap_group_id (e.g. "combined $25k across office+internet"). NULL = its own cap. Fixes cap_amount_usd ambiguity.';

-- 4. programs -- program-level policies (hotel/airline) -----------------------
ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS point_expiration_policy text,
  ADD COLUMN IF NOT EXISTS award_change_fee_policy text,
  ADD COLUMN IF NOT EXISTS pooling_rules           text;
COMMENT ON COLUMN programs.point_expiration_policy IS 'Hotel/airline currency expiration (e.g. "No expiration with activity"; "24 months"). Program-level, not card.';
COMMENT ON COLUMN programs.award_change_fee_policy IS 'Award change/cancel fee policy (e.g. "No change or cancel fees"). Program-level.';
COMMENT ON COLUMN programs.pooling_rules IS 'Points pooling rules for transferable currencies (Amex household, Bilt none, etc.).';
