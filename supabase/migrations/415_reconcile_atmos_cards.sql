-- Reconcile the Bank of America co-brand cards with the Atmos Rewards rebrand.
-- Alaska Mileage Plan + Hawaiian HawaiianMiles merged into Atmos Rewards (the
-- programs.slug='atmos' loyalty_program page already exists). BofA rebranded its
-- Alaska Visa cards to Atmos Rewards in 2025 and added a new premium tier; BofA
-- is becoming the single issuer for Atmos cards. These stay UNAUTHORED skeletons
-- (no intro) - this only corrects names/slugs/currency so the backlog is accurate.
-- Verified 2026-06-15 against bankofamerica.com + alaskaair.com/atmosrewards.

-- Ascent (was Alaska Airlines Visa Signature), $95 personal
update credit_cards set
  slug = 'bank-of-america-atmos-ascent',
  name = 'Atmos Rewards Ascent Visa Signature',
  annual_fee_usd = 95, network = 'visa',
  currency_program_id = (select id from programs where slug='atmos'),
  co_brand_program_id = (select id from programs where slug='atmos'),
  official_url = 'https://www.bankofamerica.com/credit-cards/products/alaska-airlines-credit-card/',
  updated_at = now()
where slug = 'bank-of-america-alaska-airlines';

-- Business (was Alaska Airlines Visa Business), $95 business
update credit_cards set
  slug = 'bank-of-america-atmos-business',
  name = 'Atmos Rewards Visa Signature Business',
  annual_fee_usd = 95, network = 'visa',
  currency_program_id = (select id from programs where slug='atmos'),
  co_brand_program_id = (select id from programs where slug='atmos'),
  official_url = 'https://business.bankofamerica.com/en/credit-cards/atmos-rewards',
  updated_at = now()
where slug = 'bank-of-america-alaska-airlines-business';

-- NEW: Atmos Rewards Summit Visa Infinite, $395 premium personal
insert into credit_cards (slug, issuer_id, name, card_type, card_tier, network,
  annual_fee_usd, currency_program_id, co_brand_program_id, transfer_eligibility,
  credit_score_recommended, is_active, status, official_url)
select 'bank-of-america-atmos-summit',
  (select id from issuers where slug='bank-of-america'),
  'Atmos Rewards Summit Visa Infinite', 'personal', 'airline_cobrand', 'visa',
  395,
  (select id from programs where slug='atmos'),
  (select id from programs where slug='atmos'),
  'none', 'excellent', true, 'active',
  'https://www.bankofamerica.com/credit-cards/products/alaska-airlines-infinite-credit-card/'
on conflict (slug) do nothing;
