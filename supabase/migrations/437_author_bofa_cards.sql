-- Author the open BofA co-brands (Air France-KLM + Atmos Ascent/Business/Summit)
-- from official bankofamerica.com pages (2026-06-15), and retire the discontinued
-- Virgin Atlantic card. ASCII-only. Co-brand miles/points are the airline's own
-- currency (not transfer-to-partners). FX (none) per the official pages.

-- ============================================================
-- 0) Retire the discontinued Virgin Atlantic BofA card
-- ============================================================
update credit_cards set
  closed_to_new_applicants = true, status = 'defunct',
  notes = trim(coalesce(notes,'') || ' Bank of America discontinued the Virgin Atlantic World Elite Mastercard in October 2024; existing accounts were converted to the BofA Unlimited Cash Rewards card. Go-forward Virgin card is the Synchrony-issued Virgin Red Rewards Mastercard.'),
  updated_at = now()
where slug = 'bank-of-america-virgin-atlantic';

-- ============================================================
-- 1) Air France KLM Visa Signature (BofA)  $89  - now a Visa (was Mastercard)
-- ============================================================
update credit_cards set
  name = 'Air France KLM Visa Signature Card',
  annual_fee_usd = 89, card_type = 'personal', card_tier = 'airline_cobrand', network = 'visa',
  foreign_transaction_fee_pct = 0, credit_score_recommended = 'good',
  points_transferable_to_partners = false, transfer_eligibility = 'none',
  official_url = 'https://www.bankofamerica.com/credit-cards/products/air-france-credit-card/',
  intro = 'The Air France KLM Visa Signature from Bank of America is the U.S. co-brand for Flying Blue, Air France-KLM''s loyalty program. It earns 3X miles on Air France, KLM, and SkyTeam airline purchases, 3X on dining, and 1.5X on everything else - a generous flat rate for a sub-$100 card. The real differentiator is Experience Points (XP): the card hands you status-qualifying XP each anniversary (up to 160 with enough spend), a rare way to climb Flying Blue elite tiers through a credit card. Add 5,000 anniversary miles and no foreign transaction fees, and it''s a solid pick for SkyTeam flyers.',
  last_verified = current_date, is_active = true, closed_to_new_applicants = false, status = 'active', updated_at = now()
where slug = 'bank-of-america-air-france-klm';

delete from credit_card_earn_rates where card_id=(select id from credit_cards where slug='bank-of-america-air-france-klm');
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='bank-of-america-air-france-klm'), 'flights', 3.00, null, null, 'any', '3X miles on eligible Air France, KLM, and SkyTeam member airline purchases.'),
((select id from credit_cards where slug='bank-of-america-air-france-klm'), 'dining', 3.00, null, null, 'any', '3X miles on eligible dining.'),
((select id from credit_cards where slug='bank-of-america-air-france-klm'), 'base', 1.50, null, null, 'any', '1.5X miles on all other purchases.');

delete from credit_card_benefits where card_id=(select id from credit_cards where slug='bank-of-america-air-france-klm');
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bank-of-america-air-france-klm'), 'other', 'other', '5,000 Anniversary Miles', 5000, 'miles', 'earning', 'anniversary', '5,000 bonus miles each account anniversary after you spend $50 or more during the anniversary year.', 1),
((select id from credit_cards where slug='bank-of-america-air-france-klm'), 'status_conferred', 'status_other', 'Flying Blue Experience Points (XP)', null, null, 'status', 'anniversary', 'Earn 20 status-qualifying XP each anniversary; 100 XP total after $15,000 spend, or 160 XP total after $25,000 spend - a rare way to earn Flying Blue elite-qualifying activity from a card.', 2),
((select id from credit_cards where slug='bank-of-america-air-france-klm'), 'other', 'other', 'No Foreign Transaction Fees', null, null, 'perk', null, 'No foreign transaction fees on purchases made outside the U.S.', 3);

delete from credit_card_welcome_bonuses where card_id=(select id from credit_cards where slug='bank-of-america-air-france-klm');
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='bank-of-america-air-france-klm'), 50000, 'Flying Blue Miles', 2000, 3, '[]'::jsonb, true, true,
  'https://www.bankofamerica.com/credit-cards/products/air-france-credit-card/',
  '50,000 bonus miles plus 100 Experience Points (XP) after $2,000 in purchases in the first 90 days.', current_date, now());

-- ============================================================
-- 2) Atmos Rewards Ascent Visa Signature  $95
-- ============================================================
update credit_cards set
  name = 'Atmos Rewards Ascent Visa Signature',
  annual_fee_usd = 95, card_type = 'personal', card_tier = 'airline_cobrand', network = 'visa',
  foreign_transaction_fee_pct = 0, credit_score_recommended = 'good',
  points_transferable_to_partners = false, transfer_eligibility = 'none',
  official_url = 'https://www.bankofamerica.com/credit-cards/products/alaska-airlines-credit-card/',
  intro = 'The Atmos Rewards Ascent is the everyday Alaska/Hawaiian co-brand (the rebranded Alaska Visa Signature) at $95 a year. It earns 3X on Alaska and Hawaiian purchases, 2X on gas, EV charging, cable, streaming, and transit, and 1X elsewhere - all earning Atmos points, the combined Alaska-Hawaiian currency. The signature perk is the famous companion fare: a $99 Companion Fare every anniversary after $6,000 of spend. You also get a free checked bag and preferred boarding for up to six companions, $100 off an Alaska Lounge+ membership, no foreign transaction fees, and a 10% rewards bonus if you bank with Bank of America. A no-brainer hold for Alaska and Hawaiian regulars.',
  last_verified = current_date, is_active = true, closed_to_new_applicants = false, status = 'active', updated_at = now()
where slug = 'bank-of-america-atmos-ascent';

delete from credit_card_earn_rates where card_id=(select id from credit_cards where slug='bank-of-america-atmos-ascent');
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='bank-of-america-atmos-ascent'), 'flights', 3.00, null, null, 'any', '3X points on eligible Alaska Airlines and Hawaiian Airlines purchases.'),
((select id from credit_cards where slug='bank-of-america-atmos-ascent'), 'transit', 2.00, null, null, 'any', '2X on gas, EV charging, cable, streaming services, and local transit (including rideshare).'),
((select id from credit_cards where slug='bank-of-america-atmos-ascent'), 'base', 1.00, null, null, 'any', '1X on all other purchases.');

delete from credit_card_benefits where card_id=(select id from credit_cards where slug='bank-of-america-atmos-ascent');
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bank-of-america-atmos-ascent'), 'other', 'companion_pass', '$99 Companion Fare', null, null, 'airline', 'anniversary', 'A $99 Companion Fare (plus taxes and fees from $23) each account anniversary after you spend $6,000 or more in the prior year.', 1),
((select id from credit_cards where slug='bank-of-america-atmos-ascent'), 'other', 'free_checked_bag', 'Free Checked Bag + Preferred Boarding', null, null, 'airline', null, 'Free checked bag and preferred boarding for you and up to 6 guests on the same reservation when you pay with the card.', 2),
((select id from credit_cards where slug='bank-of-america-atmos-ascent'), 'statement_credit', 'other', '$100 Alaska Lounge+ Credit', 100, 'USD', 'credit', 'annual', '$100 off an annual Alaska Lounge+ membership purchased with your card.', 3),
((select id from credit_cards where slug='bank-of-america-atmos-ascent'), 'other', 'other', '10% Rewards Bonus (BofA customers)', null, null, 'earning', null, 'Earn a 10% rewards bonus on all points from card purchases if you have an eligible Bank of America account (Preferred Rewards).', 4),
((select id from credit_cards where slug='bank-of-america-atmos-ascent'), 'other', 'other', 'No Foreign Transaction Fees', null, null, 'perk', null, 'No foreign transaction fees, and no blackout dates on Alaska/Hawaiian award or companion travel.', 5);

delete from credit_card_welcome_bonuses where card_id=(select id from credit_cards where slug='bank-of-america-atmos-ascent');
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='bank-of-america-atmos-ascent'), 50000, 'Atmos points', 2000, 3, '[]'::jsonb, true, true,
  'https://www.bankofamerica.com/credit-cards/products/alaska-airlines-credit-card/',
  'Limited-time: 50,000 bonus points plus a Buy One Get One companion fare ($0 fare plus taxes/fees from $23) after $2,000 in purchases in the first 90 days.', current_date, now());

-- ============================================================
-- 3) Atmos Rewards Summit Visa Infinite  $395
-- ============================================================
update credit_cards set
  name = 'Atmos Rewards Summit Visa Infinite',
  annual_fee_usd = 395, card_type = 'personal', card_tier = 'airline_cobrand', network = 'visa',
  foreign_transaction_fee_pct = 0, credit_score_recommended = 'excellent',
  points_transferable_to_partners = false, transfer_eligibility = 'none',
  official_url = 'https://www.bankofamerica.com/credit-cards/products/alaska-airlines-infinite-credit-card/',
  intro = 'The Atmos Rewards Summit is the $395 premium Alaska/Hawaiian flagship, built for frequent Alaska and Hawaiian flyers who want lounge access and outsized companion value. It earns 3X on dining, foreign purchases, and Alaska/Hawaiian spend, 1X elsewhere, with a 10% Bank of America rewards bonus. The headline benefits are Global Companion Awards - a 25,000-point companion award every year (and a 100,000-point one if you spend $60,000) good across Alaska''s partner network - plus 8 Alaska Lounge passes a year, a $120 TSA PreCheck/Global Entry credit, a $50 travel-delay credit, free checked bags, and waived partner award booking fees. No foreign transaction fees. Worth it if you''ll use the lounge passes and companion awards.',
  last_verified = current_date, is_active = true, closed_to_new_applicants = false, status = 'active', updated_at = now()
where slug = 'bank-of-america-atmos-summit';

delete from credit_card_earn_rates where card_id=(select id from credit_cards where slug='bank-of-america-atmos-summit');
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'flights', 3.00, null, null, 'any', '3X points on eligible Alaska Airlines and Hawaiian Airlines purchases.'),
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'dining', 3.00, null, null, 'any', '3X points on dining and on foreign-transaction purchases.'),
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'base', 1.00, null, null, 'any', '1X on all other purchases.');

delete from credit_card_benefits where card_id=(select id from credit_cards where slug='bank-of-america-atmos-summit');
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'other', 'companion_pass', 'Annual Global Companion Award', 25000, 'points', 'airline', 'anniversary', '25,000-point Global Companion Award every account anniversary (usable across Alaska''s partner network, no blackout dates); plus a 100,000-point Global Companion Award if you spend $60,000 in a year.', 1),
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'lounge_access', 'lounge_other', '8 Alaska Lounge Passes', null, null, 'lounge', 'annual', '8 Alaska Lounge day passes every calendar year (2 per quarter).', 2),
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'statement_credit', 'global_entry_credit', 'TSA PreCheck / Global Entry Credit', 120, 'USD', 'credit', null, 'Up to $120 Airport Security statement credit toward TSA PreCheck or Global Entry every 4 years.', 3),
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'insurance', 'trip_delay_insurance', '$50 Instant Travel Delay Credit', 50, 'USD', 'insurance', null, 'A $50 instant credit for flight cancellations or departure delays of 2+ hours.', 4),
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'other', 'free_checked_bag', 'Free Checked Bag + Preferred Boarding', null, null, 'airline', null, 'Free checked bag and preferred boarding for you and up to 6 guests on the same reservation.', 5),
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'other', 'other', 'Waived Same-Day Change + Partner Award Fees', null, null, 'airline', null, 'Waived fees for same-day confirmed Alaska flight changes (up to $75 savings) and waived award redemption fees when booking Alaska partner awards.', 6),
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'other', 'other', '10% Rewards Bonus (BofA customers)', null, null, 'earning', null, 'Earn a 10% rewards bonus on all points from card purchases with an eligible Bank of America account.', 7),
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'other', 'other', 'No Foreign Transaction Fees', null, null, 'perk', null, 'No foreign transaction fees (and 3X on foreign purchases).', 8);

delete from credit_card_welcome_bonuses where card_id=(select id from credit_cards where slug='bank-of-america-atmos-summit');
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='bank-of-america-atmos-summit'), 100000, 'Atmos points', 6500, 3, '[]'::jsonb, true, true,
  'https://www.bankofamerica.com/credit-cards/products/alaska-airlines-infinite-credit-card/',
  'Limited-time: 100,000 bonus points plus a 25,000-point Global Companion Award and a 50% flight discount code after $6,500 in purchases in the first 90 days.', current_date, now());

-- ============================================================
-- 4) Atmos Rewards Visa Signature Business  $95 ($70/company + $25/card)
-- ============================================================
update credit_cards set
  name = 'Atmos Rewards Visa Signature Business',
  annual_fee_usd = 95, card_type = 'business', card_tier = 'airline_cobrand', network = 'visa',
  foreign_transaction_fee_pct = 0, credit_score_recommended = 'good',
  points_transferable_to_partners = false, transfer_eligibility = 'none',
  authorized_user_fee_usd = 25, authorized_user_fee_structure = '$70 annual fee per company plus $25 per card.',
  official_url = 'https://business.bankofamerica.com/en/credit-cards/atmos-rewards',
  intro = 'The Atmos Rewards Business card is the small-business Alaska/Hawaiian co-brand at $70 per company plus $25 per card. It earns 3X on Alaska and Hawaiian purchases, 2X on gas, EV charging, shipping, and transit, and 1X elsewhere - in Atmos points. Like its consumer sibling it carries the $99 Companion Fare each anniversary (after $6,000 spend), free checked bag and preferred boarding, $100 off an Alaska Lounge+ membership, and a suite of travel protections (auto rental and $1M travel-accident insurance, emergency ticket replacement, lost-luggage assistance). No foreign transaction fees. A strong pick for businesses that fly Alaska or Hawaiian.',
  last_verified = current_date, is_active = true, closed_to_new_applicants = false, status = 'active', updated_at = now()
where slug = 'bank-of-america-atmos-business';

delete from credit_card_earn_rates where card_id=(select id from credit_cards where slug='bank-of-america-atmos-business');
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='bank-of-america-atmos-business'), 'flights', 3.00, null, null, 'any', '3X points on eligible Alaska Airlines and Hawaiian Airlines purchases.'),
((select id from credit_cards where slug='bank-of-america-atmos-business'), 'transit', 2.00, null, null, 'any', '2X on gas, EV charging, shipping, and local transit (including rideshare).'),
((select id from credit_cards where slug='bank-of-america-atmos-business'), 'base', 1.00, null, null, 'any', '1X on all other purchases.');

delete from credit_card_benefits where card_id=(select id from credit_cards where slug='bank-of-america-atmos-business');
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bank-of-america-atmos-business'), 'other', 'companion_pass', '$99 Companion Fare', null, null, 'airline', 'anniversary', 'A $99 Companion Fare (plus taxes and fees from $23) each account anniversary after you spend $6,000 or more in the prior year.', 1),
((select id from credit_cards where slug='bank-of-america-atmos-business'), 'other', 'free_checked_bag', 'Free Checked Bag + Preferred Boarding', null, null, 'airline', null, 'Free checked bag and preferred boarding for any cardholder when the card is used to buy Alaska or Hawaiian tickets.', 2),
((select id from credit_cards where slug='bank-of-america-atmos-business'), 'statement_credit', 'other', '$100 Alaska Lounge+ Credit', 100, 'USD', 'credit', 'annual', '$100 off an annual Alaska Lounge+ membership purchased with your card.', 3),
((select id from credit_cards where slug='bank-of-america-atmos-business'), 'insurance', 'travel_accident_insurance', '$1M Travel Accident Insurance', 1000000, 'USD', 'insurance', null, 'Up to $1 million in travel accident insurance, plus emergency ticket replacement, lost-luggage assistance, and legal/medical referrals.', 4),
((select id from credit_cards where slug='bank-of-america-atmos-business'), 'insurance', 'rental_car_cdw_secondary', 'Auto Rental Insurance', null, null, 'insurance', null, 'Auto rental collision coverage when you pay for the rental with the card.', 5),
((select id from credit_cards where slug='bank-of-america-atmos-business'), 'other', 'other', 'No Foreign Transaction Fees', null, null, 'perk', null, 'No foreign transaction fees, and no blackout dates on Alaska/Hawaiian award or companion travel.', 6);

delete from credit_card_welcome_bonuses where card_id=(select id from credit_cards where slug='bank-of-america-atmos-business');
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='bank-of-america-atmos-business'), 80000, 'Atmos points', null, null, '[]'::jsonb, true, true,
  'https://business.bankofamerica.com/en/credit-cards/atmos-rewards',
  'Limited-time: 80,000 bonus points plus a $99 Companion Fare (plus taxes/fees from $23) after qualifying spend. Exact spend requirement to be confirmed against the offer terms.', current_date, now());

-- Classification: mark the four authored cards as manually saved
insert into credit_card_extractions (card_id, source_url, extraction, model, status, used_interactive, verifications, saved_at)
select c.id, c.official_url, '{}'::jsonb, 'manual', 'saved', false, '[]'::jsonb, now()
from credit_cards c where c.slug in ('bank-of-america-air-france-klm','bank-of-america-atmos-ascent','bank-of-america-atmos-summit','bank-of-america-atmos-business');
