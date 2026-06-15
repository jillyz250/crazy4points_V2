-- Author two open Barclays airline co-brands from official issuer sources
-- (cards.barclaycardus.com + flybreeze.com card-benefits, scraped 2026-06-15),
-- and close the Barclays Hawaiian card (pulled for new applicants Oct 1 2025;
-- go-forward Hawaiian cards are now Bank of Hawaii + the BofA Atmos cards).
-- ASCII-only per the SQL data policy. No partner counts (co-brands, not transferable).

-- ============================================================
-- 1) Breeze Easy Visa Signature  (barclays-breeze-airways)
--    AF $89, Visa Signature, FTF 0%. BreezePoints never expire.
-- ============================================================
update credit_cards set
  name = 'Breeze Easy Visa Signature Card',
  annual_fee_usd = 89,
  network = 'visa',
  card_type = 'personal',
  card_tier = 'airline_cobrand',
  foreign_transaction_fee_pct = 0,
  credit_score_recommended = 'good',
  points_transferable_to_partners = false,
  transfer_eligibility = 'none',
  official_url = 'https://cards.barclaycardus.com/banking/cards/breeze-airways/',
  intro = 'Breeze Airways'' first-ever co-brand, the Breeze Easy Visa Signature, is built around the airline''s "easy to earn, easy to burn" BreezePoints - which, refreshingly, never expire as long as your card stays open. The headline "up to 10X" comes in two halves: you earn when you buy a Nicer or Nicest Bundle and again when you fly it, so the biggest multipliers only land on Breeze travel. Off Breeze, it''s a flat 2X on groceries and dining (including onboard snacks and drinks) and 1X on everything else. At $89 a year with no foreign transaction fees, priority boarding for your whole booking, and free inflight Wi-Fi, it''s a tidy pick if Breeze is your go-to airline - and close to dead weight if it isn''t, since BreezePoints only redeem for Breeze travel.',
  last_verified = current_date,
  is_active = true,
  closed_to_new_applicants = false,
  updated_at = now()
where slug = 'barclays-breeze-airways';

delete from credit_card_earn_rates where card_id = (select id from credit_cards where slug='barclays-breeze-airways');
insert into credit_card_earn_rates (card_id, category, multiplier, notes) values
((select id from credit_cards where slug='barclays-breeze-airways'), 'flights', 10.00, 'Up to 10X BreezePoints on Nicer and Nicest Bundles and trip add-ons - 5X when you buy plus 5X when you fly.'),
((select id from credit_cards where slug='barclays-breeze-airways'), 'flights', 4.00, 'Up to 4X BreezePoints on Nice Bundles - 2X when you buy plus 2X when you fly.'),
((select id from credit_cards where slug='barclays-breeze-airways'), 'dining', 2.00, '2X BreezePoints on eligible restaurant purchases, including Breeze onboard food and beverages.'),
((select id from credit_cards where slug='barclays-breeze-airways'), 'grocery', 2.00, '2X BreezePoints on eligible grocery store purchases.'),
((select id from credit_cards where slug='barclays-breeze-airways'), 'base', 1.00, '1X BreezePoints on all other purchases, including Other Breeze Bookings.');

delete from credit_card_benefits where card_id = (select id from credit_cards where slug='barclays-breeze-airways');
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='barclays-breeze-airways'), 'other', 'other', 'Anniversary Bonus Points', 7500, 'points', 'earning', 'anniversary', 'Earn 7,500 Anniversary Bonus BreezePoints after every account anniversary with eligible purchases.', 1),
((select id from credit_cards where slug='barclays-breeze-airways'), 'other', 'priority_boarding', 'Priority Boarding (Group 1)', null, null, 'airline', null, 'Priority boarding with Group 1 on all Breeze-operated flights, companions on your booking included.', 2),
((select id from credit_cards where slug='barclays-breeze-airways'), 'other', 'other', 'Complimentary Inflight Wi-Fi', null, null, 'airline', null, 'Complimentary high-speed inflight Wi-Fi on Breeze''s Airbus fleet for you and everyone on your booking.', 3),
((select id from credit_cards where slug='barclays-breeze-airways'), 'other', 'other', 'BreezePoints Never Expire', null, null, 'perk', null, 'As an active cardmember, your BreezePoints never expire - earn them and burn them on Breeze travel whenever you want.', 4),
((select id from credit_cards where slug='barclays-breeze-airways'), 'other', 'other', 'Visa Luxury Hotel Collection', null, null, 'hotel', null, 'Best-available-rate guarantee plus room upgrade on arrival, daily breakfast, $25 food and beverage credit, complimentary Wi-Fi, VIP status, and late checkout at 900+ hotels worldwide.', 5),
((select id from credit_cards where slug='barclays-breeze-airways'), 'other', 'roadside_assistance', 'Roadside Dispatch', null, null, 'protection', null, 'Pay-per-use roadside assistance at negotiated rates for common needs like towing or a locksmith.', 6),
((select id from credit_cards where slug='barclays-breeze-airways'), 'insurance', 'travel_emergency_assistance', 'Travel and Emergency Assistance Services', null, null, 'insurance', null, '24/7 referral assistance to help resolve a wide variety of travel emergencies (you pay for any third-party services).', 7);

delete from credit_card_welcome_bonuses where card_id = (select id from credit_cards where slug='barclays-breeze-airways');
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, estimated_value_usd, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='barclays-breeze-airways'),
  50000, 'BreezePoints', 1000, 3, 500,
  '[{"amount":30000,"spend_usd":1000,"window_days":90,"note":"plus Breezy 1 benefits"},{"amount":20000,"spend_usd":5000,"window_days":180}]'::jsonb,
  true, true,
  'https://cards.barclaycardus.com/banking/cards/breeze-airways/',
  'Limited-time offer: 30,000 BreezePoints after $1,000 in 90 days (plus Breezy 1 benefits), then 20,000 more after $5,000 total spend in 180 days. The 50,000 bonus does not count toward Breezy Rewards progress.',
  current_date, now());

-- ============================================================
-- 2) Frontier Airlines World Mastercard  (barclays-frontier-airlines)
--    AF $99, World Mastercard, FTF 0%. Miles never expire.
-- ============================================================
update credit_cards set
  name = 'Frontier Airlines World Mastercard',
  annual_fee_usd = 99,
  network = 'mastercard',
  card_type = 'personal',
  card_tier = 'airline_cobrand',
  foreign_transaction_fee_pct = 0,
  credit_score_recommended = 'good',
  points_transferable_to_partners = false,
  transfer_eligibility = 'none',
  official_url = 'https://cards.barclaycardus.com/banking/cards/frontier-airlines-world-mastercard/',
  intro = 'The Frontier Airlines World Mastercard is the ultra-low-cost carrier''s loyalty play: $99 a year, 5X miles on Frontier purchases (up to 15X once you stack Frontier Miles elite earning), 3X at restaurants, and 1X everywhere else. The real draw isn''t the miles - it''s the perks that blunt Frontier''s a-la-carte fees: two free checked bags, priority boarding, and a $100 flight voucher every year you spend at least $2,500. New cardholders unlock Instant Elite Gold for making a single purchase (keep it a full year by spending $3,000 in the first 90 days), and every dollar you charge earns an Elite Status Point toward Platinum, where free companion travel kicks in. Miles never expire while the card is open, and there are no foreign transaction fees. Worth it if you fly Frontier enough to use the bags and the voucher; skippable if you don''t.',
  last_verified = current_date,
  is_active = true,
  closed_to_new_applicants = false,
  updated_at = now()
where slug = 'barclays-frontier-airlines';

delete from credit_card_earn_rates where card_id = (select id from credit_cards where slug='barclays-frontier-airlines');
insert into credit_card_earn_rates (card_id, category, multiplier, notes) values
((select id from credit_cards where slug='barclays-frontier-airlines'), 'flights', 5.00, '5X miles on eligible Frontier purchases at flyfrontier.com - up to 15X combined with Frontier Miles status (10X member earning plus 5X from the card).'),
((select id from credit_cards where slug='barclays-frontier-airlines'), 'dining', 3.00, '3X miles on eligible restaurant purchases.'),
((select id from credit_cards where slug='barclays-frontier-airlines'), 'base', 1.00, '1X miles on all other purchases.');

delete from credit_card_benefits where card_id = (select id from credit_cards where slug='barclays-frontier-airlines');
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='barclays-frontier-airlines'), 'other', 'free_checked_bag', 'Two Free Checked Bags', null, null, 'airline', null, 'Two free checked bags on eligible Frontier flights when you buy direct at flyfrontier.com or the Frontier app.', 1),
((select id from credit_cards where slug='barclays-frontier-airlines'), 'travel_credit', 'flight_credit', '$100 Annual Flight Voucher', 100, 'USD', 'credit', 'anniversary', 'A $100 Frontier flight voucher every account anniversary, after spending $2,500 or more on the card during your cardmembership year.', 2),
((select id from credit_cards where slug='barclays-frontier-airlines'), 'status_conferred', 'status_other', 'Instant Elite Gold Status', null, null, 'status', null, 'Instant Frontier Elite Gold status after your first purchase in the first 90 days. Keep it for 12 months by spending $3,000 in Net Purchases within those 90 days; otherwise it expires at 90 days.', 3),
((select id from credit_cards where slug='barclays-frontier-airlines'), 'spend_unlock', 'spend_unlock_perk', 'Elite Status Acceleration', null, null, 'earning', null, 'Earn 1 Elite Status Point for every $1 spent on the card, helping you reach Frontier Elite tiers faster.', 4),
((select id from credit_cards where slug='barclays-frontier-airlines'), 'other', 'companion_pass', 'Companion Travel at Elite Platinum', null, null, 'airline', null, 'Once you reach Elite Platinum (or Diamond), bring a companion on unlimited eligible bookings for just government taxes and fees (from $5.60 each way).', 5),
((select id from credit_cards where slug='barclays-frontier-airlines'), 'other', 'priority_boarding', 'Priority Boarding', null, null, 'airline', null, 'Priority boarding on Frontier-operated flights.', 6),
((select id from credit_cards where slug='barclays-frontier-airlines'), 'other', 'other', 'Award Redemption Fee Waiver', null, null, 'perk', null, 'The award redemption fee is waived when you pay the related taxes and fees (from $5.60 one-way) with your card.', 7),
((select id from credit_cards where slug='barclays-frontier-airlines'), 'other', 'other', 'Miles Never Expire, No Blackouts', null, null, 'perk', null, 'Miles never expire while your card account is open and in good standing, and award travel has no blackout dates.', 8);

delete from credit_card_welcome_bonuses where card_id = (select id from credit_cards where slug='barclays-frontier-airlines');
insert into credit_card_welcome_bonuses (card_id, bonus_amount, bonus_currency, spend_required_usd, spend_window_months, tiered_bonuses, is_elevated, is_current, source_url, notes, last_verified, verified_at)
values ((select id from credit_cards where slug='barclays-frontier-airlines'),
  60000, 'Frontier Miles', 1000, 3,
  '[]'::jsonb, false, true,
  'https://cards.barclaycardus.com/banking/cards/frontier-airlines-world-mastercard/',
  'Earn 60,000 Travel Miles after spending $1,000 on purchases and paying the annual fee in full, both within the first 90 days. Plus Instant Elite Gold status after your first purchase.',
  current_date, now());

-- ============================================================
-- 3) Close the Barclays Hawaiian card (pulled for new apps Oct 1 2025)
-- ============================================================
update credit_cards set
  closed_to_new_applicants = true,
  notes = trim(coalesce(notes,'') || ' Barclays closed this card to new applicants on 2025-10-01 (Alaska/Hawaiian merger to Atmos Rewards). Existing cardholders keep their cards; go-forward Hawaiian cards are the Bank of Hawaii World Elite Mastercard and the BofA Atmos cards.'),
  updated_at = now()
where slug = 'barclays-hawaiian-airlines';

-- ============================================================
-- 4) Classification: mark both authored cards as manually saved
-- ============================================================
insert into credit_card_extractions (card_id, source_url, extraction, model, status, used_interactive, verifications, saved_at)
select c.id, c.official_url, '{}'::jsonb, 'manual', 'saved', false, '[]'::jsonb, now()
from credit_cards c where c.slug in ('barclays-breeze-airways','barclays-frontier-airlines');
