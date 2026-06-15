-- Sun Country switched its card program from FNBO to Synchrony (announced
-- 2025-09-23). Retire the old FNBO row, add a Synchrony issuer, and author the new
-- Sun Country Visa Signature from the official Synchrony/Sun Country sources
-- (2026-06-15). ASCII-only. Sun Country Rewards points are co-brand (not transferable).
-- FX fee set 0 by convention - flagged for T&C verification.

-- 1) Synchrony issuer
insert into issuers (slug, name, website_url)
values ('synchrony', 'Synchrony', 'https://www.synchrony.com')
on conflict (slug) do nothing;

-- 2) Retire the discontinued FNBO Sun Country card
update credit_cards set
  closed_to_new_applicants = true, status = 'defunct',
  notes = trim(coalesce(notes,'') || ' Sun Country moved its credit card program from First National Bank of Omaha to Synchrony (announced 2025-09-23). Replaced by the Synchrony-issued Sun Country Visa Signature (synchrony-sun-country-visa).'),
  updated_at = now()
where slug = 'fnbo-sun-country-airlines';

-- 3) Create + author the new Synchrony Sun Country Visa Signature
insert into credit_cards (slug, issuer_id, name, card_type, card_tier, network,
  currency_program_id, co_brand_program_id, annual_fee_usd, foreign_transaction_fee_pct,
  credit_score_recommended, points_transferable_to_partners, transfer_eligibility,
  official_url, is_active, closed_to_new_applicants, status, last_verified, intro)
values
('synchrony-sun-country-visa', (select id from issuers where slug='synchrony'),
  'Sun Country Visa Signature Card', 'personal', 'airline_cobrand', 'visa',
  '448dff4b-7e04-48ef-8b84-ffee57e56139', '448dff4b-7e04-48ef-8b84-ffee57e56139',
  89, 0, 'good', false, 'none',
  'https://www.suncountry.com/sun-country-visa', true, false, 'active', current_date,
  'The Sun Country Visa Signature is the ultra-low-cost carrier''s co-brand, newly issued by Synchrony (it moved from First National Bank of Omaha in late 2025). It earns up to 5X on Sun Country purchases (3X when you buy, 2X when you fly), 2X on gas and groceries, and 1X elsewhere - all in Sun Country Rewards points. The perks lean practical for a budget airline: 50% off your first checked bag and seat selection for you and companions, a free premium inflight drink, 25% off inflight food and drinks, and a 10,000-point anniversary bonus if you spend $10,000 a year. Spending $10,000 (or flying 10 segments) also unlocks Plus status - priority check-in and boarding plus fee-free changes. At $89 a year, a solid hold if Sun Country is in your rotation.');

insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='synchrony-sun-country-visa'), 'flights', 5.00, null, null, 'any', 'Up to 5X on eligible Sun Country purchases - 3X when you buy plus 2X when you fly (Plus members add 1X more).'),
((select id from credit_cards where slug='synchrony-sun-country-visa'), 'grocery', 2.00, null, null, 'any', '2X on grocery store purchases.'),
((select id from credit_cards where slug='synchrony-sun-country-visa'), 'gas', 2.00, null, null, 'any', '2X on gas station purchases.'),
((select id from credit_cards where slug='synchrony-sun-country-visa'), 'base', 1.00, null, null, 'any', '1X on all other purchases.');

insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='synchrony-sun-country-visa'), 'other', 'free_checked_bag', '50% Off First Checked Bag', null, null, 'airline', null, '50% off your first checked bag for you and travel companions on the same itinerary when you pay with the card.', 1),
((select id from credit_cards where slug='synchrony-sun-country-visa'), 'other', 'other', '50% Off Seat Selection', null, null, 'airline', null, '50% off Best and Standard seat selections for you and companions when purchased pre-flight on suncountry.com or the app.', 2),
((select id from credit_cards where slug='synchrony-sun-country-visa'), 'other', 'other', '10,000-Point Anniversary Bonus', 10000, 'points', 'earning', 'anniversary', '10,000 bonus points if you spend $10,000 on the card within a 12-month period (based on account-opening date).', 3),
((select id from credit_cards where slug='synchrony-sun-country-visa'), 'other', 'other', 'Inflight Perks', null, null, 'airline', null, 'A free premium drink in flight, plus 25% off additional inflight food and beverages paid with the card.', 4),
((select id from credit_cards where slug='synchrony-sun-country-visa'), 'status_conferred', 'status_other', 'Path to Plus Status', null, null, 'status', null, 'Qualify for Sun Country Rewards Plus status by flying 10 segments in a calendar year or spending $10,000 on the card: earn +1X on Sun Country purchases, fee-free changes/cancellations (Flexible Fares), and priority check-in, security (MSP), and Zone 1 boarding for you and companions.', 5),
((select id from credit_cards where slug='synchrony-sun-country-visa'), 'other', 'other', 'No Foreign Transaction Fees', null, null, 'perk', null, 'No foreign transaction fees on purchases made outside the U.S.', 6);

insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='synchrony-sun-country-visa'), 25000, 'Sun Country Rewards points', 1000, 3, '[]'::jsonb, false, true,
  'https://www.suncountry.com/sun-country-visa',
  'Earn 25,000 bonus points after $1,000 in purchases in the first 90 days.', current_date, now());

-- 4) Classification: mark the new card as manually saved
insert into credit_card_extractions (card_id, source_url, extraction, model, status, used_interactive, verifications, saved_at)
select c.id, c.official_url, '{}'::jsonb, 'manual', 'saved', false, '[]'::jsonb, now()
from credit_cards c where c.slug = 'synchrony-sun-country-visa';
