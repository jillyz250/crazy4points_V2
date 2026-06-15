-- Bilt Card 2.0 (launched 2026-02-07, issued via Cardless / Column N.A.) replaced
-- the single Wells Fargo Bilt Mastercard with a 3-tier lineup. Retire the old card
-- and author Bilt Blue / Obsidian / Palladium from official Bilt sources
-- (newsroom.biltrewards.com/meetbiltcard2.0 + Cardless rates & fees, 2026-06-15).
-- ASCII-only. No hardcoded transfer-partner counts in prose.
-- Model note: Bilt 2.0 earns transferable Bilt Points (the multipliers below) PLUS
-- 4% Bilt Cash on everyday spend; rent/mortgage earn via Bilt Cash conversion
-- ($30 Bilt Cash unlocks 1,000 Bilt Points on a housing payment), not direct points.

-- ============================================================
-- 0) Retire the old Wells Fargo-era Bilt Mastercard
-- ============================================================
update credit_cards set
  closed_to_new_applicants = true,
  status = 'defunct',
  notes = trim(coalesce(notes,'') || ' Discontinued: this was the Wells Fargo-issued Bilt Mastercard. Wells Fargo stopped new applications 2025-11-05 and the card went inactive 2026-02-06, replaced by the Cardless-issued Bilt Card 2.0 lineup (Blue/Obsidian/Palladium).'),
  updated_at = now()
where slug = 'bilt-mastercard';

-- ============================================================
-- 1) Create the three Bilt Card 2.0 rows
-- ============================================================
insert into credit_cards (slug, issuer_id, name, card_type, card_tier, network,
  currency_program_id, annual_fee_usd, foreign_transaction_fee_pct, credit_score_recommended,
  points_transferable_to_partners, transfer_eligibility, no_preset_spending_limit,
  is_metal_card, official_url, is_active, closed_to_new_applicants, status, last_verified, intro)
values
('bilt-blue', 'e540194f-fa81-49ee-b298-5d37d5f9face', 'Bilt Blue Card', 'personal', 'starter', 'mastercard',
  '18aa7d04-3c70-418c-8918-01331c95ba22', 0, 0, 'good', true, 'direct', false, false,
  'https://www.bilt.com/', true, false, 'active', current_date,
  'The Bilt Blue is the no-annual-fee entry to Bilt Card 2.0, built around one trick nobody else offers: pay your rent or mortgage with no transaction fee and no preset housing limit. You earn 1X Bilt Points on everyday spend plus 4% back in Bilt Cash - a separate in-ecosystem currency you can convert to points on housing payments ($30 of Bilt Cash unlocks 1,000 points) or spend on monthly credits. Bilt Points are among the most valuable in the market, transferring 1:1 to airline and hotel partners. Add free on-time rent reporting to the credit bureaus and a 10% intro APR for 12 months, and it''s easy to hold if you rent or carry a mortgage.'),
('bilt-obsidian', 'e540194f-fa81-49ee-b298-5d37d5f9face', 'Bilt Obsidian Card', 'personal', 'mid', 'mastercard',
  '18aa7d04-3c70-418c-8918-01331c95ba22', 95, 0, 'good', true, 'direct', false, true,
  'https://www.bilt.com/', true, false, 'active', current_date,
  'The Bilt Obsidian steps up Bilt Card 2.0 for $95 a year: 3X points on dining and groceries (groceries capped at $25,000/year), 2X on travel, and 1X on everything else - plus the same 4% Bilt Cash on everyday spend and fee-free rent and mortgage payments that define the lineup. A $100 annual Bilt Travel hotel credit and $200 in Bilt Cash at signup help offset the fee, and you get trip delay insurance and no foreign transaction fees. Bilt Points transfer 1:1 to airline and hotel partners. The sweet spot for renters and homeowners who spend enough on dining and travel to clear the modest fee.'),
('bilt-palladium', 'e540194f-fa81-49ee-b298-5d37d5f9face', 'Bilt Palladium Card', 'personal', 'premium', 'mastercard',
  '18aa7d04-3c70-418c-8918-01331c95ba22', 495, 0, 'excellent', true, 'direct', false, true,
  'https://www.bilt.com/', true, false, 'active', current_date,
  'The Bilt Palladium is the $495 flagship of Bilt Card 2.0, aimed at heavy spenders who want premium perks layered on Bilt''s signature fee-free rent and mortgage payments. It earns a flat 2X Bilt Points on everyday spend plus 4% Bilt Cash, and leans on $600 in annual credits ($400 in Bilt Travel hotel credits plus $200 Bilt Cash) plus Priority Pass lounge access and purchase protection to justify the fee. New cardholders get a limited-time 50,000-point bonus and Gold elite status after qualifying spend, plus $300 in Bilt Cash at opening. Points transfer 1:1 to airline and hotel partners, and there are no foreign transaction fees. Best for big spenders who will use the travel credits and lounge access.');

-- ============================================================
-- 2) Earn rates
-- ============================================================
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, notes) values
((select id from credit_cards where slug='bilt-blue'), 'base', 1.00, null, null, '1X Bilt Points on everyday spend. (Rent and mortgage earn via Bilt Cash conversion, not direct points.)'),
((select id from credit_cards where slug='bilt-obsidian'), 'dining', 3.00, null, null, '3X Bilt Points on dining.'),
((select id from credit_cards where slug='bilt-obsidian'), 'grocery', 3.00, 25000, 'annual', '3X Bilt Points on groceries, up to $25,000 per year (then 1X).'),
((select id from credit_cards where slug='bilt-obsidian'), 'travel', 2.00, null, null, '2X Bilt Points on travel.'),
((select id from credit_cards where slug='bilt-obsidian'), 'base', 1.00, null, null, '1X Bilt Points on all other everyday spend.'),
((select id from credit_cards where slug='bilt-palladium'), 'base', 2.00, null, null, '2X Bilt Points on everyday spend.');

-- ============================================================
-- 3) Benefits
-- ============================================================
-- Blue
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bilt-blue'), 'other', 'other', '4% Bilt Cash on Everyday Spend', null, null, 'earning', null, 'Earn 4% back in Bilt Cash on everyday spend - convert it to Bilt Points on rent/mortgage ($30 = 1,000 points) or spend it on monthly credits.', 1),
((select id from credit_cards where slug='bilt-blue'), 'other', 'other', 'Fee-Free Rent and Mortgage Payments', null, null, 'perk', null, 'Pay rent or mortgage with no transaction fee, no preset housing spending limit, and no annual housing cap, across multiple homes.', 2),
((select id from credit_cards where slug='bilt-blue'), 'other', 'other', 'Free Rent Reporting', null, null, 'perk', null, 'Opt in to free reporting of on-time rent payments to the major credit bureaus to help build credit.', 3),
((select id from credit_cards where slug='bilt-blue'), 'other', 'other', '10% Intro APR for 12 Months', null, null, 'perk', null, '10% introductory APR on new eligible purchases for the first 12 months, then a variable 26.74%-34.74% APR applies.', 4),
((select id from credit_cards where slug='bilt-blue'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to Travel Partners', null, null, 'perk', null, 'Transfer Bilt Points 1:1 to airline and hotel partners.', 5);
-- Obsidian
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bilt-obsidian'), 'travel_credit', 'hotel_credit', '$100 Bilt Travel Hotel Credit', 100, 'USD', 'hotel', 'annual', 'Up to $100 per year in credits toward hotel bookings through Bilt Travel.', 1),
((select id from credit_cards where slug='bilt-obsidian'), 'insurance', 'trip_delay_insurance', 'Trip Delay Insurance', null, null, 'insurance', null, 'Reimbursement for certain expenses when a covered trip is delayed (see Guide to Benefits for limits).', 2),
((select id from credit_cards where slug='bilt-obsidian'), 'other', 'other', '4% Bilt Cash on Everyday Spend', null, null, 'earning', null, 'Earn 4% back in Bilt Cash on everyday spend - convert it to Bilt Points on rent/mortgage ($30 = 1,000 points) or spend it on monthly credits.', 3),
((select id from credit_cards where slug='bilt-obsidian'), 'other', 'other', 'Fee-Free Rent and Mortgage Payments', null, null, 'perk', null, 'Pay rent or mortgage with no transaction fee, no preset housing spending limit, and no annual housing cap, across multiple homes.', 4),
((select id from credit_cards where slug='bilt-obsidian'), 'other', 'other', 'Free Rent Reporting', null, null, 'perk', null, 'Opt in to free reporting of on-time rent payments to the major credit bureaus to help build credit.', 5),
((select id from credit_cards where slug='bilt-obsidian'), 'other', 'other', '10% Intro APR for 12 Months', null, null, 'perk', null, '10% introductory APR on new eligible purchases for the first 12 months, then a variable 26.74%-34.74% APR applies.', 6),
((select id from credit_cards where slug='bilt-obsidian'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to Travel Partners', null, null, 'perk', null, 'Transfer Bilt Points 1:1 to airline and hotel partners.', 7);
-- Palladium
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bilt-palladium'), 'travel_credit', 'hotel_credit', '$400 Bilt Travel Hotel Credit', 400, 'USD', 'hotel', 'annual', 'Up to $400 per year in credits toward hotel bookings through Bilt Travel.', 1),
((select id from credit_cards where slug='bilt-palladium'), 'statement_credit', 'other', '$200 Bilt Cash Annual Credit', 200, 'USD', 'credit', 'annual', '$200 in Bilt Cash each year (part of $600 in total annual credits).', 2),
((select id from credit_cards where slug='bilt-palladium'), 'lounge_access', 'lounge_priority_pass', 'Priority Pass Lounge Access', null, null, 'lounge', null, 'Priority Pass airport lounge access (enrollment required).', 3),
((select id from credit_cards where slug='bilt-palladium'), 'protection', 'purchase_protection', 'Purchase Protection', null, null, 'protection', null, 'Covers eligible purchases against damage or theft for a limited period (see Guide to Benefits).', 4),
((select id from credit_cards where slug='bilt-palladium'), 'status_conferred', 'status_other', 'Bilt Gold Status', null, null, 'status', null, 'Complimentary Bilt Gold elite status (after qualifying spend) with elevated rewards and benefits in the Bilt ecosystem.', 5),
((select id from credit_cards where slug='bilt-palladium'), 'other', 'other', '4% Bilt Cash on Everyday Spend', null, null, 'earning', null, 'Earn 4% back in Bilt Cash on everyday spend - convert it to Bilt Points on rent/mortgage ($30 = 1,000 points) or spend it on monthly credits.', 6),
((select id from credit_cards where slug='bilt-palladium'), 'other', 'other', 'Fee-Free Rent and Mortgage Payments', null, null, 'perk', null, 'Pay rent or mortgage with no transaction fee, no preset housing spending limit, and no annual housing cap, across multiple homes.', 7),
((select id from credit_cards where slug='bilt-palladium'), 'other', 'other', 'Free Rent Reporting', null, null, 'perk', null, 'Opt in to free reporting of on-time rent payments to the major credit bureaus to help build credit.', 8),
((select id from credit_cards where slug='bilt-palladium'), 'other', 'other', '10% Intro APR for 12 Months', null, null, 'perk', null, '10% introductory APR on new eligible purchases for the first 12 months, then a variable 26.74%-34.74% APR applies.', 9),
((select id from credit_cards where slug='bilt-palladium'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to Travel Partners', null, null, 'perk', null, 'Transfer Bilt Points 1:1 to airline and hotel partners.', 10);

-- ============================================================
-- 4) Welcome bonuses (account-opening Bilt Cash; Palladium also 50k points)
-- ============================================================
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at) values
((select id from credit_cards where slug='bilt-blue'), 100, 'Bilt Cash', 0, null, '[]'::jsonb, false, true, 'https://newsroom.biltrewards.com/meetbiltcard2.0', '$100 in Bilt Cash on account opening (no spend requirement).', current_date, now()),
((select id from credit_cards where slug='bilt-obsidian'), 200, 'Bilt Cash', 0, null, '[]'::jsonb, false, true, 'https://newsroom.biltrewards.com/meetbiltcard2.0', '$200 in Bilt Cash on account opening (no spend requirement).', current_date, now()),
((select id from credit_cards where slug='bilt-palladium'), 50000, 'Bilt Points', null, null, '[]'::jsonb, true, true, 'https://newsroom.biltrewards.com/meetbiltcard2.0', 'Limited-time: 50,000 Bilt Points plus Bilt Gold status after qualifying spend, PLUS $300 in Bilt Cash on account opening. Exact qualifying-spend threshold to be confirmed against the offer terms.', current_date, now());

-- ============================================================
-- 5) Classification: mark the three new cards as manually saved
-- ============================================================
insert into credit_card_extractions (card_id, source_url, extraction, model, status, used_interactive, verifications, saved_at)
select c.id, c.official_url, '{}'::jsonb, 'manual', 'saved', false, '[]'::jsonb, now()
from credit_cards c where c.slug in ('bilt-blue','bilt-obsidian','bilt-palladium');
