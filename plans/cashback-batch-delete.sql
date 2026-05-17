-- Batch delete of all pure cash-back / cruise-credit-only / store-credit cards.
--
-- Per editorial policy (crazy4points = points/miles only), the following 15
-- cards do not belong on the site. Each was individually verified via 2026
-- WebSearch against the issuer's own published redemption rules. None earn
-- points transferable to airline/hotel partners, and none have a pool-to-
-- unlock path through a sibling card.
--
-- Verified 2026-05-17. Sources cited in the migration commit notes.
--
-- Card list:
--   chase-ink-business-premier            — Chase calls it UR but no transfer + no pool
--   bank-of-america-premium-rewards       — BoA has zero transfer partners
--   bank-of-america-premium-rewards-elite — Same
--   chase-disney-premier-visa             — Disney Rewards Dollars = store credit only
--   chase-disney-visa                     — Same
--   us-bank-altitude-connect              — US Bank has no transfer partners
--   us-bank-altitude-reserve              — "Coming soon" banner removed May 2026; never launched
--   us-bank-business-altitude-connect     — Same
--   barclays-carnival                     — Cruise-line redemptions only
--   bank-of-america-celebrity-cruises     — Cruise-line only
--   barclays-holland-america              — Cruise-line only
--   bank-of-america-norwegian-cruise      — Cruise-line + minor statement credits
--   barclays-princess-cruises             — Cruise-line only
--   bank-of-america-royal-caribbean       — Cruise-line; being replaced by Royal ONE
--   chase-prime-visa                      — Amazon cash-back only

with target_card_ids as (
  select id from credit_cards where slug in (
    'chase-ink-business-premier',
    'bank-of-america-premium-rewards',
    'bank-of-america-premium-rewards-elite',
    'chase-disney-premier-visa',
    'chase-disney-visa',
    'us-bank-altitude-connect',
    'us-bank-altitude-reserve',
    'us-bank-business-altitude-connect',
    'barclays-carnival',
    'bank-of-america-celebrity-cruises',
    'barclays-holland-america',
    'bank-of-america-norwegian-cruise',
    'barclays-princess-cruises',
    'bank-of-america-royal-caribbean',
    'chase-prime-visa'
  )
)
-- Delete child rows first to satisfy FKs (Supabase often rejects without this)
delete from credit_card_extraction_verifications
 where extraction_id in (
   select id from credit_card_extractions
    where card_id in (select id from target_card_ids)
 );

with target_card_ids as (
  select id from credit_cards where slug in (
    'chase-ink-business-premier',
    'bank-of-america-premium-rewards',
    'bank-of-america-premium-rewards-elite',
    'chase-disney-premier-visa',
    'chase-disney-visa',
    'us-bank-altitude-connect',
    'us-bank-altitude-reserve',
    'us-bank-business-altitude-connect',
    'barclays-carnival',
    'bank-of-america-celebrity-cruises',
    'barclays-holland-america',
    'bank-of-america-norwegian-cruise',
    'barclays-princess-cruises',
    'bank-of-america-royal-caribbean',
    'chase-prime-visa'
  )
)
delete from credit_card_extractions where card_id in (select id from target_card_ids);

with target_card_ids as (
  select id from credit_cards where slug in (
    'chase-ink-business-premier',
    'bank-of-america-premium-rewards',
    'bank-of-america-premium-rewards-elite',
    'chase-disney-premier-visa',
    'chase-disney-visa',
    'us-bank-altitude-connect',
    'us-bank-altitude-reserve',
    'us-bank-business-altitude-connect',
    'barclays-carnival',
    'bank-of-america-celebrity-cruises',
    'barclays-holland-america',
    'bank-of-america-norwegian-cruise',
    'barclays-princess-cruises',
    'bank-of-america-royal-caribbean',
    'chase-prime-visa'
  )
)
delete from credit_card_welcome_bonuses where card_id in (select id from target_card_ids);

with target_card_ids as (
  select id from credit_cards where slug in (
    'chase-ink-business-premier',
    'bank-of-america-premium-rewards',
    'bank-of-america-premium-rewards-elite',
    'chase-disney-premier-visa',
    'chase-disney-visa',
    'us-bank-altitude-connect',
    'us-bank-altitude-reserve',
    'us-bank-business-altitude-connect',
    'barclays-carnival',
    'bank-of-america-celebrity-cruises',
    'barclays-holland-america',
    'bank-of-america-norwegian-cruise',
    'barclays-princess-cruises',
    'bank-of-america-royal-caribbean',
    'chase-prime-visa'
  )
)
delete from credit_card_benefits where card_id in (select id from target_card_ids);

with target_card_ids as (
  select id from credit_cards where slug in (
    'chase-ink-business-premier',
    'bank-of-america-premium-rewards',
    'bank-of-america-premium-rewards-elite',
    'chase-disney-premier-visa',
    'chase-disney-visa',
    'us-bank-altitude-connect',
    'us-bank-altitude-reserve',
    'us-bank-business-altitude-connect',
    'barclays-carnival',
    'bank-of-america-celebrity-cruises',
    'barclays-holland-america',
    'bank-of-america-norwegian-cruise',
    'barclays-princess-cruises',
    'bank-of-america-royal-caribbean',
    'chase-prime-visa'
  )
)
delete from credit_card_earn_rates where card_id in (select id from target_card_ids);

delete from credit_cards where slug in (
  'chase-ink-business-premier',
  'bank-of-america-premium-rewards',
  'bank-of-america-premium-rewards-elite',
  'chase-disney-premier-visa',
  'chase-disney-visa',
  'us-bank-altitude-connect',
  'us-bank-altitude-reserve',
  'us-bank-business-altitude-connect',
  'barclays-carnival',
  'bank-of-america-celebrity-cruises',
  'barclays-holland-america',
  'bank-of-america-norwegian-cruise',
  'barclays-princess-cruises',
  'bank-of-america-royal-caribbean',
  'chase-prime-visa'
);
