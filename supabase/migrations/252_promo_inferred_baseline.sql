-- 252_promo_inferred_baseline.sql
-- Adds intel_inferred_baseline to promo_rewards.
--
-- When a scraped promo includes its discount % (e.g. Flying Blue's
-- "-25%" label), we can BACK-CALCULATE the baseline cost:
--
--   intel_inferred_baseline = points_required / (1 - discount_pct / 100)
--
-- Example: Flying Blue Business promo at 63,500 miles with -25%
--   → 63,500 / 0.75 = 84,667 miles inferred baseline
--
-- Aggregated across many promos for the same origin/dest/cabin
-- combination, these inferences converge to the actual unpublished
-- chart. This is the foundation for Phase 7 (Chart Derivation) in
-- plans/promo-scraper.md.
--
-- Distinct from points_baseline (which is explicitly scraped when
-- the page literally states "Normal: X miles"). Both can coexist;
-- when an explicit baseline is available, it wins.
--
-- Authored: 2026-05-13

begin;

alter table promo_rewards
  add column if not exists intel_inferred_baseline integer
    check (intel_inferred_baseline is null or intel_inferred_baseline >= 0);

comment on column promo_rewards.intel_inferred_baseline is
  'Baseline points cost back-calculated from the displayed discount %. '
  'Set when the scraper extracts discount_percent_displayed but no '
  'explicit baseline. Distinct from points_baseline (explicit scrape).';

commit;
