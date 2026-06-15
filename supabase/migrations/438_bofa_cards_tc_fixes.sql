-- Corrections after verifying the BofA cards against the official Atmos + AF-KLM
-- pages (pasted 2026-06-15). ASCII-only.

-- ============================================================
-- AIR FRANCE-KLM: add the new Bilt rent promo; clarify the SUB (100 XP = Silver)
-- ============================================================
update credit_card_welcome_bonuses w set
  notes = '50,000 bonus miles plus 100 Experience Points (XP) after $2,000 in purchases in the first 90 days. The 100 XP equals Flying Blue Silver status.',
  last_verified = current_date, verified_at = now()
from credit_cards c where c.id=w.card_id and c.slug='bank-of-america-air-france-klm';

insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bank-of-america-air-france-klm'), 'other', 'other', '3X Miles on Rent via Bilt', null, null, 'earning', null, 'New Bilt partnership: earn 3 Flying Blue miles per $1 on rent paid through Bilt, up to $50,000/year (then 1.5X). Note Bilt''s standard ~3% rent-payment fee applies.', 4);

-- ============================================================
-- ATMOS ASCENT: add status-point earning + 20% inflight credit
-- ============================================================
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bank-of-america-atmos-ascent'), 'other', 'other', 'Earn Atmos Status Points', null, null, 'status', null, 'Earn 1 Atmos status point for every $3 spent on purchases, helping you reach Atmos elite tiers.', 6),
((select id from credit_cards where slug='bank-of-america-atmos-ascent'), 'other', 'other', '20% Back on Inflight Purchases', null, null, 'airline', null, '20% back on all Alaska Airlines and Hawaiian Airlines inflight purchases paid with the card.', 7);

-- ============================================================
-- ATMOS SUMMIT: enable hotel transfers + status fast-track + point sharing + inflight
-- ============================================================
update credit_cards set
  points_transferable_to_partners = true, transfer_eligibility = 'direct',
  last_verified = current_date, updated_at = now()
where slug = 'bank-of-america-atmos-summit';

insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'transfer_partner_unlock', 'transfer_partner_access', 'Transfer to Hotel Partners', null, null, 'perk', null, 'Transfer Atmos points to select hotel programs: Marriott Bonvoy, I Prefer Hotel Rewards, Wyndham Rewards, Shangri-La Circle, and (limited-time) IHG One Rewards.', 9),
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'other', 'other', 'Fastest Path to Atmos Status', null, null, 'status', null, 'Earn 1 status point per $2 spent, plus 10,000 status points each year starting at your first anniversary. $20,000 in spend reaches Atmos Silver (oneworld Ruby); $60,000 reaches Atmos Gold (oneworld Sapphire).', 10),
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'other', 'other', 'Points Sharing', null, null, 'perk', null, 'Share your accumulated points with up to 10 additional Atmos Rewards members.', 11),
((select id from credit_cards where slug='bank-of-america-atmos-summit'), 'other', 'other', '20% Back on Inflight Purchases', null, null, 'airline', null, '20% back on all Alaska Airlines and Hawaiian Airlines inflight purchases paid with the card.', 12);

-- ============================================================
-- ATMOS BUSINESS: fix SUB spend ($5,000/90d) + status points + inflight
-- ============================================================
update credit_card_welcome_bonuses w set
  spend_required_usd = 5000, spend_window_months = 3,
  notes = 'Limited-time: 80,000 bonus points plus a $99 Companion Fare (plus taxes/fees from $23) after $5,000 in purchases in the first 90 days.',
  last_verified = current_date, verified_at = now()
from credit_cards c where c.id=w.card_id and c.slug='bank-of-america-atmos-business';

insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bank-of-america-atmos-business'), 'other', 'other', 'Earn Atmos Status Points', null, null, 'status', null, 'Earn 1 Atmos status point for every $3 spent on purchases.', 7),
((select id from credit_cards where slug='bank-of-america-atmos-business'), 'other', 'other', '20% Back on Inflight Purchases', null, null, 'airline', null, '20% back on all Alaska Airlines and Hawaiian Airlines inflight purchases paid with the card.', 8);
