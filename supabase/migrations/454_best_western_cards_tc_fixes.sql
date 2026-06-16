-- Best Western Visa cards reconciliation against the OFFICIAL BW Visa card page +
-- Mercury Financial Guide to Benefits (pasted 2026-06-15) and the official Rewards T&C
-- (pasted earlier for the free-night-award terms). Activates both cards. ASCII-only.
--
-- CONFIRMED / CORRECTED from official sources:
--  * Issuer CONFIRMED: First Bank & Trust, Brookings SD (placeholder was correct).
--  * NO foreign transaction fee on either card (was null -> 0).
--  * Earn rates confirmed: Signature 4X BW / 2X all; Premium 10X BW / 4X gas+grocery /
--    2X all.
--  * Welcome: Signature up to 40,000 (10k-40k variable); Premium up to 80,000
--    (20k-80k variable). "Qualifying spend" amount not published on the marketing page.
--  * Status: Signature = automatic Gold; Premium = automatic Platinum.
--  * Anniversary: Signature = 10,000 bonus points (DROPPED the unconfirmed $5k-spend
--    trigger - official lists no condition). Premium = up to 2 free night awards.
--  * Shared benefits (both cards, per Mercury Guide to Benefits): Cell Phone Protection,
--    Trip Delay up to $300 (>12h), Trip Cancellation/Interruption up to $2,000.
--  * REMOVED the "10% Best Western Rewards Rate discount" benefit - not on the official
--    card page (blog-sourced; the program member rate is 7%+, not a card perk).
--  * Free-night-award full terms sourced from the official Rewards T&C (standard room,
--    any Licensed Hotel, no published cap, room+tax only, expires per award date).
--  * Signature/Gold description corrected to drop early/late check-out (a Platinum+
--    benefit, not Gold).

-- FX fee + activation
update credit_cards set foreign_transaction_fee_pct = 0, is_active = true, last_verified = current_date, updated_at = now()
where slug in ('best-western-rewards-visa','best-western-rewards-premium-visa');

-- Confirm issuer website (First Bank & Trust, Brookings SD)
update issuers set website_url = 'https://www.bankeasy.com' where slug = 'first-bank-trust';

-- Rebuild benefits cleanly for both cards
delete from credit_card_benefits where card_id in (
  select id from credit_cards where slug in ('best-western-rewards-visa','best-western-rewards-premium-visa'));

-- Signature ($0) benefits
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='best-western-rewards-visa'), 'status_conferred', 'status_other', 'Automatic Best Western Gold Elite Status', null, null, 'hotel', null, 'Complimentary Best Western Rewards Gold status while you hold the card - 10% bonus points on stays, complimentary water at check-in, and 500 bonus points upon arrival.', 1),
((select id from credit_cards where slug='best-western-rewards-visa'), 'other', 'other', '10,000 Anniversary Bonus Points', 10000, 'points', 'earning', 'anniversary', 'Receive 10,000 bonus points each cardmember anniversary.', 2),
((select id from credit_cards where slug='best-western-rewards-visa'), 'other', 'cellphone_protection', 'Cell Phone Protection', null, null, 'protection', null, 'Pay your monthly wireless bill with the card and your phone is protected the following calendar month (see the Mercury Financial Guide to Benefits for limits).', 3),
((select id from credit_cards where slug='best-western-rewards-visa'), 'other', 'trip_delay_insurance', 'Trip Delay Reimbursement', 300, 'USD', 'insurance', null, 'Up to $300 when travel booked with the card is delayed more than 12 hours.', 4),
((select id from credit_cards where slug='best-western-rewards-visa'), 'other', 'trip_cancellation_insurance', 'Trip Cancellation / Interruption Reimbursement', 2000, 'USD', 'insurance', null, 'Up to $2,000 for non-refundable fare if a trip booked with the card is cancelled or interrupted.', 5);

-- Premium ($89) benefits
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='best-western-rewards-premium-visa'), 'status_conferred', 'status_other', 'Automatic Best Western Platinum Elite Status', null, null, 'hotel', null, 'Complimentary Best Western Rewards Platinum status while you hold the card - 15% bonus points on stays, early check-in and late check-out (subject to availability), plus the Gold benefits (complimentary water and 500 points on arrival).', 1),
((select id from credit_cards where slug='best-western-rewards-premium-visa'), 'free_night', 'free_night_award', 'Up to Two Anniversary Free Night Awards', 2, 'nights', 'hotel', 'anniversary', 'Up to two free night awards each cardmember anniversary. Valid for a standard room at any Best Western Licensed Hotel worldwide, subject to capacity controls and room availability - no published category or point cap. Covers room and room tax; excludes incidentals, resort fees, and parking. Each award expires on the date printed on it; not redeemable through travel agents and not exchangeable for cash.', 2),
((select id from credit_cards where slug='best-western-rewards-premium-visa'), 'other', 'cellphone_protection', 'Cell Phone Protection', null, null, 'protection', null, 'Pay your monthly wireless bill with the card and your phone is protected the following calendar month (see the Mercury Financial Guide to Benefits for limits).', 3),
((select id from credit_cards where slug='best-western-rewards-premium-visa'), 'other', 'trip_delay_insurance', 'Trip Delay Reimbursement', 300, 'USD', 'insurance', null, 'Up to $300 when travel booked with the card is delayed more than 12 hours.', 4),
((select id from credit_cards where slug='best-western-rewards-premium-visa'), 'other', 'trip_cancellation_insurance', 'Trip Cancellation / Interruption Reimbursement', 2000, 'USD', 'insurance', null, 'Up to $2,000 for non-refundable fare if a trip booked with the card is cancelled or interrupted.', 5);

-- Welcome-bonus notes: confirmed variable ranges (spend amount not published on marketing page)
update credit_card_welcome_bonuses set
  notes = 'Up to 40,000 points (variable 10,000-40,000 by creditworthiness/offer); shown before you apply. Qualifying-spend amount not published on the marketing page. Pay-with-Points value ~$5 per 1,000 points (up to 20,000/booking).',
  last_verified = current_date, verified_at = now()
where card_id = (select id from credit_cards where slug='best-western-rewards-visa');
update credit_card_welcome_bonuses set
  notes = 'Up to 80,000 points (variable 20,000-80,000 by creditworthiness/offer); shown before you apply. Qualifying-spend amount not published on the marketing page. Pay-with-Points value ~$5 per 1,000 points (up to 20,000/booking).',
  last_verified = current_date, verified_at = now()
where card_id = (select id from credit_cards where slug='best-western-rewards-premium-visa');

-- Update intros to drop the DRAFT marker now that both are verified
update credit_cards set intro = replace(intro, ' (DRAFT - pending official T&C verification.)', '')
where slug = 'best-western-rewards-visa';
update credit_cards set intro = replace(intro, ' (DRAFT - pending official T&C verification, especially the free-night-award terms.)', '')
where slug = 'best-western-rewards-premium-visa';

-- Mark both as manually saved (so admin does not show them as "never extracted")
insert into credit_card_extractions (card_id, source_url, extraction, model, status, used_interactive, verifications, saved_at)
select c.id, c.official_url, '{}'::jsonb, 'manual', 'saved', false, '[]'::jsonb, now()
from credit_cards c where c.slug in ('best-western-rewards-visa','best-western-rewards-premium-visa');
