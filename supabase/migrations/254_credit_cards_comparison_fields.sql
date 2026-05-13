-- Credit cards: comparison-tool readiness pass.
--
-- Adds the missing structured fields needed for:
--   1. Card-vs-card benefits comparison
--   2. Weekly Firecrawl welcome-bonus re-scrape + auto-alerts when a new
--      offer beats the historical max
--   3. Verified-math source citations on every benefit / welcome bonus
--   4. Legacy cards (Prestige, Ritz-Carlton, Aviator Silver, Free Spirit)
--      that stay queryable but are filtered out of "apply now" flows
--   5. Tiered welcome bonuses ("60K after $5K + 25K more after $12K")
--   6. Referral bonuses + authorized-user economics
--
-- All changes additive; existing data untouched. Safe to re-run.

-- ── 1. credit_cards: status + referral + authorized user ─────────────────

alter table credit_cards
  add column if not exists status text not null default 'active'
    check (status in ('active', 'closed_to_new_apps', 'defunct'));

comment on column credit_cards.status is
  'active = open to new applications; closed_to_new_apps = still in wallets / product-changeable but no new apps (Ritz-Carlton, Citi Prestige, AAdvantage Aviator Silver); defunct = card AND issuer relationship terminated (Free Spirit after Spirit shutdown).';

alter table credit_cards
  add column if not exists referral_bonus_amount integer
    check (referral_bonus_amount is null or referral_bonus_amount >= 0);

alter table credit_cards
  add column if not exists referral_bonus_currency text;

alter table credit_cards
  add column if not exists referral_cap_per_year integer
    check (referral_cap_per_year is null or referral_cap_per_year > 0);

comment on column credit_cards.referral_bonus_amount is
  'Points/miles awarded to the referrer when a new applicant is approved through their link. Amex Gold = 20K MR; Sapphire Preferred = 15K UR; etc.';

comment on column credit_cards.referral_cap_per_year is
  'Annual cap on referral bonus earnings (e.g., Amex caps most personal cards at 55K-100K MR per calendar year).';

alter table credit_cards
  add column if not exists authorized_user_fee_usd integer
    check (authorized_user_fee_usd is null or authorized_user_fee_usd >= 0);

alter table credit_cards
  add column if not exists authorized_user_fee_structure text;

alter table credit_cards
  add column if not exists authorized_user_bonus_points integer
    check (authorized_user_bonus_points is null or authorized_user_bonus_points >= 0);

comment on column credit_cards.authorized_user_fee_structure is
  'Free-text describing AU economics when not a flat per-user fee. Examples: "$75 per AU after first 3 free" (Sapphire Reserve historical); "free for unlimited AUs"; "$175 for up to 3 AUs, then $175 each".';

comment on column credit_cards.authorized_user_bonus_points is
  'Bonus points awarded for adding an AU and meeting spend threshold (e.g., Amex Plat: 20K MR after $2K AU spend in 3 months when current offer includes it).';

-- ── 2. credit_card_welcome_bonuses: tiered + historical + verified ───────

alter table credit_card_welcome_bonuses
  add column if not exists tiered_bonuses jsonb not null default '[]'::jsonb;

comment on column credit_card_welcome_bonuses.tiered_bonuses is
  'Additional spend-threshold bonus tiers BEYOND the main offer. JSONB array shape:
   [{"spend_usd": 12000, "bonus_amount": 25000, "timeline_months": 6, "note": "..."}, ...]
   Empty array = single-tier offer (just the main bonus_amount + spend_required_usd).
   Used for Sapphire Reserve 60K@$5K + 25K@$12K and similar layered offers.';

alter table credit_card_welcome_bonuses
  add column if not exists is_historical_high boolean not null default false;

comment on column credit_card_welcome_bonuses.is_historical_high is
  'TRUE when this offer''s bonus_amount >= max bonus_amount ever recorded for this card. Computed by the weekly Firecrawl re-scrape job; drives the welcome_bonus_record_high alert type. Used in /alerts surfacing and /programs/[slug] card pages.';

alter table credit_card_welcome_bonuses
  add column if not exists verified_at timestamptz;

comment on column credit_card_welcome_bonuses.verified_at is
  'Last time this offer was confirmed against the source_url. Weekly Firecrawl cron stamps this on each pass. NULL = never verified post-creation.';

-- One-shot index to support "max bonus ever for this card" queries used by
-- the historical-high detector. Partial — only on offers that actually have
-- a numeric bonus (excludes promo-only or anomalous rows).
create index if not exists credit_card_welcome_bonuses_card_amount_idx
  on credit_card_welcome_bonuses (card_id, bonus_amount desc)
  where bonus_amount > 0;

-- ── 3. credit_card_benefits: source + verified_at ────────────────────────

alter table credit_card_benefits
  add column if not exists source_url text;

alter table credit_card_benefits
  add column if not exists verified_at timestamptz;

comment on column credit_card_benefits.source_url is
  'Authoritative URL backing this benefit value. Issuer product page preferred; terms-and-conditions PDF acceptable for fine-print fields. Required per the verified-math rule for any user-facing dollar amount or coverage limit.';

comment on column credit_card_benefits.verified_at is
  'Last time this benefit was confirmed against source_url. Weekly Firecrawl re-scrape stamps this; admin "Verify now" action stamps this manually.';

-- ── 4. Backfill convenience: mark legacy cards ───────────────────────────
-- No-op if these card slugs do not exist yet (the cards are seeded in 255).
-- Safe to re-run.

update credit_cards
  set status = 'closed_to_new_apps'
  where slug in (
    'chase-ritz-carlton',
    'chase-marriott-bonvoy-premier',
    'citi-prestige',
    'barclays-aadvantage-aviator-silver',
    'barclays-free-spirit'
  );

-- ── 5. Notes on the welcome_bonus_record_high alert type ─────────────────
-- alerts.type is a free-text column (no enum CHECK), so adding the new value
-- 'welcome_bonus_record_high' requires no schema change. The weekly Firecrawl
-- job in app/api/run-promo-scraper (or a sibling cron) will:
--   1. Scrape current welcome bonus from issuer product page.
--   2. Upsert credit_card_welcome_bonuses row with is_current=true.
--   3. Flip is_historical_high if bonus_amount >= MAX(historical bonus_amount).
--   4. If just flipped to TRUE, insert an alerts row of type
--      'welcome_bonus_record_high' linking back to the card via
--      alert_programs (with the card's currency_program_id as the primary).
-- App code reads alerts.type as string; no DB change needed here.
