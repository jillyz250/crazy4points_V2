-- Seed the two current Best Western Rewards co-brand VISA cards (relaunched program,
-- issued via Mercury Financial; old FNBO Mastercards are closed/never in our DB).
-- Authored 2026-06-15 from BW + blog sources as a DRAFT - held is_active=false until
-- Jill's official issuer/BW T&C verification pass (per card-data-source policy, no
-- blog-sourced facts go LIVE). Linked to the best-western hotel program so both cards
-- auto-appear in "Cards that earn into Best Western Rewards" once activated. ASCII-only.
--
-- FLAGGED FOR OFFICIAL T&C VERIFICATION before activation:
--  (1) ISSUER: exact legal issuing bank. Sources conflict - "First Bank & Trust"
--      (NerdWallet) vs "First Bankcard" = FNBO (Frequent Miler). Placeholder issuer
--      'first-bank-trust' created; repoint to 'fnbo' if the T&C says First Bankcard.
--  (2) FX FEE: foreign_transaction_fee_pct unknown - left null, must confirm.
--  (3) WELCOME BONUS: variable by creditworthiness (Signature 10k-40k, Premium 20k-80k);
--      exact spend requirement + window to confirm.
--  (4) FREE NIGHT CERT (Premium): full terms required per policy - cap/room type/
--      exclusions/expiry. Drafted as placeholder; MUST get official terms before live.
--  (5) Premium automatic status: confirm Platinum (vs Diamond); Signature = Gold.

-- 1) Placeholder issuer (flagged - confirm vs existing 'fnbo')
insert into issuers (slug, name, website_url)
values ('first-bank-trust', 'First Bank & Trust', 'https://www.bankeasy.com')
on conflict (slug) do nothing;

-- 2) Best Western Rewards Visa Signature ($0 AF)
insert into credit_cards (slug, issuer_id, name, card_type, card_tier, network,
  currency_program_id, co_brand_program_id, annual_fee_usd, foreign_transaction_fee_pct,
  credit_score_recommended, points_transferable_to_partners, transfer_eligibility,
  official_url, is_active, closed_to_new_applicants, status, last_verified, intro)
values
('best-western-rewards-visa', (select id from issuers where slug='first-bank-trust'),
  'Best Western Rewards Visa Signature Card', 'personal', 'hotel_cobrand', 'visa',
  '3a87e8ec-7185-420c-b99c-0941ec0063af', '3a87e8ec-7185-420c-b99c-0941ec0063af',
  0, null, 'good', true, 'none',
  'https://www.bestwestern.com/en_US/offers/hotel-discounts/best-western-rewards-visa.html',
  false, false, 'active', current_date,
  'The no-annual-fee Best Western Rewards Visa Signature is the entry co-brand for the relaunched Best Western card program. It earns 4X points on Best Western stays and 2X on everything else, hands you automatic Best Western Gold elite status just for carrying it, and pays a 10,000-point anniversary bonus once you spend $5,000 in a cardmember year. With no annual fee and Best Western points that never expire, it is a low-stakes hold for anyone whose travel runs through Best Western country. (DRAFT - pending official T&C verification.)');

insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='best-western-rewards-visa'), 'hotel', 4.00, null, null, 'any', '4X points per USD on eligible Best Western purchases.'),
((select id from credit_cards where slug='best-western-rewards-visa'), 'base', 2.00, null, null, 'any', '2X points per USD on all other purchases.');

insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='best-western-rewards-visa'), 'status_conferred', 'status_other', 'Automatic Best Western Gold Elite Status', null, null, 'hotel', null, 'Complimentary Best Western Rewards Gold elite status while you hold the card - 10% bonus points on stays, early check-in / late check-out (subject to availability), complimentary water, and points upon arrival.', 1),
((select id from credit_cards where slug='best-western-rewards-visa'), 'other', 'other', '10,000-Point Anniversary Bonus', 10000, 'points', 'earning', 'anniversary', 'Earn a 10,000-point bonus each cardmember year after making $5,000 in net purchases.', 2),
((select id from credit_cards where slug='best-western-rewards-visa'), 'other', 'other', '10% Best Western Rewards Rate Discount', null, null, 'hotel', null, 'Save 10% when booking the Best Western Rewards Rate (verify exact discount vs the standard 7%+ member rate).', 3);

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='best-western-rewards-visa'), 40000, 'Best Western Rewards points', null, null, '[]'::jsonb, false, true,
  'https://www.bestwestern.com/en_US/offers/hotel-discounts/best-western-rewards-visa.html',
  'DRAFT: variable welcome bonus of 10,000-40,000 points depending on creditworthiness/offer. Exact spend requirement + window to confirm from official T&C.', current_date, now());

-- 3) Best Western Rewards Premium Visa Signature ($89 AF)
insert into credit_cards (slug, issuer_id, name, card_type, card_tier, network,
  currency_program_id, co_brand_program_id, annual_fee_usd, foreign_transaction_fee_pct,
  credit_score_recommended, points_transferable_to_partners, transfer_eligibility,
  official_url, is_active, closed_to_new_applicants, status, last_verified, intro)
values
('best-western-rewards-premium-visa', (select id from issuers where slug='first-bank-trust'),
  'Best Western Rewards Premium Visa Signature Card', 'personal', 'hotel_cobrand', 'visa',
  '3a87e8ec-7185-420c-b99c-0941ec0063af', '3a87e8ec-7185-420c-b99c-0941ec0063af',
  89, null, 'good', true, 'none',
  'https://www.bestwestern.com/en_US/offers/hotel-discounts/best-western-rewards-visa.html',
  false, false, 'active', current_date,
  'The $89-a-year Best Western Rewards Premium Visa Signature is the upgraded co-brand for the relaunched program. It earns a strong 10X points on Best Western stays, 4X at gas stations and grocery stores, and 2X everywhere else, plus automatic Best Western Platinum elite status and up to two free night awards each anniversary. For regular Best Western guests the anniversary free nights alone can outrun the fee. (DRAFT - pending official T&C verification, especially the free-night-award terms.)');

insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='best-western-rewards-premium-visa'), 'hotel', 10.00, null, null, 'any', '10X points per USD on eligible Best Western purchases.'),
((select id from credit_cards where slug='best-western-rewards-premium-visa'), 'gas', 4.00, null, null, 'any', '4X points per USD at gas stations.'),
((select id from credit_cards where slug='best-western-rewards-premium-visa'), 'grocery', 4.00, null, null, 'any', '4X points per USD at grocery stores.'),
((select id from credit_cards where slug='best-western-rewards-premium-visa'), 'base', 2.00, null, null, 'any', '2X points per USD on all other purchases.');

insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='best-western-rewards-premium-visa'), 'status_conferred', 'status_other', 'Automatic Best Western Platinum Elite Status', null, null, 'hotel', null, 'Complimentary Best Western Rewards Platinum elite status while you hold the card - 15% bonus points on stays plus early check-in / late check-out and the Gold benefits below it.', 1),
((select id from credit_cards where slug='best-western-rewards-premium-visa'), 'free_night', 'free_night_award', 'Up to Two Anniversary Free Night Awards', null, null, 'hotel', 'anniversary', 'DRAFT - up to two complimentary night awards each cardmember anniversary. FULL TERMS REQUIRED before publish: point/category cap, eligible room type, blackout/exclusions, and expiry.', 2),
((select id from credit_cards where slug='best-western-rewards-premium-visa'), 'other', 'other', '10% Best Western Rewards Rate Discount', null, null, 'hotel', null, 'Save 10% when booking the Best Western Rewards Rate (verify exact discount).', 3);

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='best-western-rewards-premium-visa'), 80000, 'Best Western Rewards points', null, null, '[]'::jsonb, false, true,
  'https://www.bestwestern.com/en_US/offers/hotel-discounts/best-western-rewards-visa.html',
  'DRAFT: variable welcome bonus of 20,000-80,000 points depending on creditworthiness/offer. Exact spend requirement + window to confirm from official T&C.', current_date, now());
