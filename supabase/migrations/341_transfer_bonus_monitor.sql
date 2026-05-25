-- Transfer Bonus Monitor: scraper + human-in-the-loop dashboard.
--
-- WHY: transfer_partners_outbound.bonus_active + promo_ratio are manually
-- maintained — there's no detection when an issuer bonus ends (issuers rarely
-- publish end dates; they just remove the banner). Stale BONUS badges
-- linger on /programs/[slug] pages until someone notices.
--
-- This migration adds the data layer for a scraper-backed monitor:
--   • programs.transfer_bonuses_source_url — where to scrape per program
--   • programs.transfer_bonuses_scraped_at — when we last checked
--   • transfer_bonus_observations          — diff queue requiring review
--
-- Flow:
--   1. scripts/scrape-transfer-bonuses.mjs hits each source URL
--   2. Parses for bonus indicators, diffs against transfer_partners_outbound
--   3. Writes one row per mismatch with status='new'
--   4. Editor reviews /admin/transfer-bonuses, clicks Apply/Dismiss
--   5. Apply writes to transfer_partners_outbound JSONB (with card-tier
--      scoping prompts for premium-vs-base differences)

-- ── 1. Per-program scrape config ─────────────────────────────────────────

alter table programs
  add column if not exists transfer_bonuses_source_url text,
  add column if not exists transfer_bonuses_scraped_at timestamptz;

comment on column programs.transfer_bonuses_source_url is
  'Public URL that lists current transfer bonuses for this program (e.g. Citi ThankYou transfer-partners FAQ). Null if not monitored. Scraped weekly by scripts/scrape-transfer-bonuses.mjs.';

comment on column programs.transfer_bonuses_scraped_at is
  'When the scraper last successfully fetched + diffed transfer_bonuses_source_url. Null = never scraped. Surface in admin dashboard as freshness indicator.';

-- Seed the 9 known sources (6 bank flexible currencies + 3 hotel currencies
-- that transfer to airlines). URLs chosen for public accessibility — some
-- issuers gate bonus details behind login, in which case the marketing page
-- is the next-best public signal.

update programs set transfer_bonuses_source_url = 'https://www.chase.com/personal/credit-cards/education/basics/chase-transfer-partners-everything-you-need-to-know'
  where slug = 'chase';

update programs set transfer_bonuses_source_url = 'https://www.americanexpress.com/en-us/benefits/rewards/membership-rewards/'
  where slug = 'amex';

update programs set transfer_bonuses_source_url = 'https://www.citi.com/credit-cards/money-management/citi-thankyou-rewards-faqs'
  where slug = 'citi';

update programs set transfer_bonuses_source_url = 'https://www.capitalone.com/learn-grow/money-management/venture-miles-transfer-partnerships/'
  where slug = 'capital_one';

update programs set transfer_bonuses_source_url = 'https://www.bilt.com/rewards/partner'
  where slug = 'bilt';

update programs set transfer_bonuses_source_url = 'https://www.wellsfargo.com/credit-cards/features/rewards/'
  where slug = 'wells-fargo-rewards';

update programs set transfer_bonuses_source_url = 'https://www.marriott.com/loyalty/redeem/travel-partners.mi'
  where slug = 'marriott-bonvoy';

update programs set transfer_bonuses_source_url = 'https://www.hilton.com/en/hilton-honors/member/redeem/airline-miles/'
  where slug = 'hilton-honors';

update programs set transfer_bonuses_source_url = 'https://www.ihg.com/onerewards/content/us/en/redeem/airline-partners'
  where slug = 'ihg-one-rewards';

-- ── 2. Observation queue ──────────────────────────────────────────────────

create table if not exists transfer_bonus_observations (
  id                 uuid primary key default gen_random_uuid(),

  -- The program whose transfer_partners_outbound is being checked.
  -- Stored by slug (not FK) so scraper runs even if program rows shift.
  program_slug       text not null,

  -- The partner inside transfer_partners_outbound (e.g. 'choice', 'emirates').
  -- Matches the from_slug key in the JSONB array.
  partner_slug       text not null,

  -- What the scraper SAW on the source page.
  observed_state     text not null check (observed_state in ('has_bonus', 'no_bonus')),
  observed_ratio     text,    -- the bonus ratio e.g. "1:1.5" (null if no_bonus)
  observed_context   text,    -- raw markdown snippet that triggered the match

  source_url         text not null,
  observed_at        timestamptz not null default now(),

  -- Current state at observation time (for diff display)
  current_bonus_active  boolean,
  current_promo_ratio   text,
  current_base_ratio    text,

  -- Editor workflow
  status             text not null default 'new'
    check (status in ('new', 'applied', 'dismissed')),
  dismissed_reason   text,
  applied_at         timestamptz,
  reviewed_by        text,    -- email or user id of editor who acted

  created_at         timestamptz not null default now()
);

create index if not exists transfer_bonus_observations_status_idx
  on transfer_bonus_observations (status, observed_at desc);

create index if not exists transfer_bonus_observations_program_idx
  on transfer_bonus_observations (program_slug, status);

alter table transfer_bonus_observations enable row level security;
drop policy if exists "transfer_bonus_observations are admin only" on transfer_bonus_observations;
create policy "transfer_bonus_observations are admin only"
  on transfer_bonus_observations for select to authenticated using (true);

comment on table transfer_bonus_observations is
  'Diff queue for transfer_partners_outbound bonus changes. One row per (program, partner) mismatch between scraper output and current DB state. Editor reviews + applies via /admin/transfer-bonuses. Never auto-applied — human-in-the-loop because issuer pages drift and per-card-tier ratios need judgment.';
