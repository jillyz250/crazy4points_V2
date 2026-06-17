-- Chase Sapphire Preferred 2026 refresh (effective 2026-06-15), verified against the
-- official Chase newsroom (media.chase.com/news/Meet-the-New-Chase-Sapphire-Preferred)
-- + NerdWallet + TPG. ASCII-only. NOTE: the Hyatt 4:3 transfer change is handled
-- SEPARATELY (it is card-specific and currency-level; see follow-up) - this migration
-- covers only the CSP-specific earning + benefit changes.
--
-- Changes: +3X gas & EV charging, +3X vacation rentals; $50 -> $100 hotel credit;
-- add 1-year Apple TV (activate by 2026-12-31); add Global Entry/TSA/NEXUS up to $120
-- /4yrs; add emergency evacuation & transportation protection; REMOVE the 10%
-- anniversary points bonus (gone for new applicants 2026-06-15; existing discontinued
-- 2026-10-01). Annual fee unchanged at $95.

-- 1) New earn rates
insert into credit_card_earn_rates (card_id, category, multiplier, cap_amount_usd, cap_period, booking_channel, notes) values
((select id from credit_cards where slug='chase-sapphire-preferred'), 'gas', 3.00, null, null, 'any', 'Added in the 2026 refresh. Includes EV charging stations.'),
((select id from credit_cards where slug='chase-sapphire-preferred'), 'vacation_rentals', 3.00, null, null, 'any', 'Added in the 2026 refresh. Vacation homes at top brands including Airbnb and Vrbo.');

-- 2) Hotel credit $50 -> $100
update credit_card_benefits set
  name = '$100 Annual Chase Travel Hotel Credit', value_amount = 100, value_unit = 'USD',
  description = 'Up to $100 in statement credits each account anniversary year toward hotel stays booked through Chase Travel (doubled from $50 in the 2026 refresh).',
  updated_at = now()
where card_id=(select id from credit_cards where slug='chase-sapphire-preferred')
  and name = '$50 Annual Chase Travel Hotel Credit';

-- keep the portal earn-rate note consistent with the new $100 credit
update credit_card_earn_rates set notes = replace(notes, '$50 Annual Cha', '$100 Annual Cha')
where card_id=(select id from credit_cards where slug='chase-sapphire-preferred') and category='travel_through_portal';

-- 3) New benefits: Apple TV, Global Entry/TSA/NEXUS, emergency evacuation
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='chase-sapphire-preferred'), 'other', 'streaming_credit', 'Complimentary Apple TV (1 Year)', null, null, 'perk', null, 'A complimentary one-year Apple TV subscription when activated by December 31, 2026 (2026 refresh).', 21),
((select id from credit_cards where slug='chase-sapphire-preferred'), 'other', 'global_entry_credit', 'Global Entry / TSA PreCheck / NEXUS Credit', 120, 'USD', 'credit', null, 'Up to $120 in statement credits toward Global Entry, TSA PreCheck, or NEXUS every four years (2026 refresh).', 22),
((select id from credit_cards where slug='chase-sapphire-preferred'), 'other', 'emergency_evacuation_insurance', 'Emergency Evacuation and Transportation', null, null, 'insurance', null, 'Emergency evacuation and transportation protections added in the 2026 refresh (see the Guide to Benefits for limits and conditions).', 23);

-- 4) Remove the eliminated 10% anniversary points bonus
delete from credit_card_benefits
where card_id=(select id from credit_cards where slug='chase-sapphire-preferred')
  and name = '10% Anniversary Points Bonus';

-- 5) Card-level Hyatt caveat on the generic transfer benefit (true regardless of how we
--    model the currency-level ratio): from CSP, Hyatt transfers are now 4:3.
update credit_card_benefits set
  name = 'Point Transfer to Travel Partners (Hyatt now 4:3)',
  description = 'Transfer Ultimate Rewards 1:1 to most airline and hotel partners. EXCEPTION (2026): World of Hyatt transfers from the Sapphire Preferred drop to 4:3 (1,000 points = 750 Hyatt points) - effective immediately for new applicants (2026-06-15) and 2026-10-01 for existing cardholders. Only Sapphire Reserve keeps 1:1 to Hyatt.',
  updated_at = now()
where card_id=(select id from credit_cards where slug='chase-sapphire-preferred')
  and name = '1:1 Point Transfer to Travel Partners';

update credit_cards set last_verified = current_date, updated_at = now()
where slug = 'chase-sapphire-preferred';
