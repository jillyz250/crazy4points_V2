-- Batch delete of all pure cash-back / cruise-credit-only / store-credit cards.
--
-- Per editorial policy (crazy4points = points/miles only), the following 15
-- cards do not belong on the site. Each was individually verified via 2026
-- WebSearch against the issuer's own published redemption rules.
--
-- Verified 2026-05-17. Sources cited in the PR commit notes.

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
