-- Make the two Bilt 2.0 nuances explicit on all three card pages:
-- (1) Housing-only vs Flexible Bilt Cash are mutually exclusive (pick one per cycle).
-- (2) The "up to 1.25X" housing rate is conditional on your Everyday Spend Ratio.
-- ASCII-only.

-- (1) Reframe the 4% Bilt Cash benefit as one side of an either/or, on all three.
update credit_card_benefits b set
  name = '4% Bilt Cash on Everyday Spend (Flexible option)',
  description = 'Earn 4% back in Bilt Cash on everyday spend under the Flexible Bilt Cash Rewards Option. Important: this option is mutually exclusive with the Housing-only option - you pick ONE per billing cycle. Under Flexible Bilt Cash, housing earns up to 1X (by redeeming Bilt Cash: $3 of Bilt Cash unlocks 100 points). You do not also get the 0X-1.25X housing multiplier that cycle.',
  updated_at = now()
from credit_cards c
where c.id=b.card_id and c.slug in ('bilt-blue','bilt-obsidian','bilt-palladium')
  and b.name = '4% Bilt Cash on Everyday Spend';

-- (2) Make the housing earn rate's conditional tiers explicit on all three.
update credit_card_earn_rates e set
  notes = 'Rent and mortgage earn a VARIABLE 0X-1.25X, not a flat rate, based on your Everyday Spend Ratio (everyday spend vs. your housing payment that billing cycle): under 25% = a 250-point flat floor; 25%+ = 0.5X; 50%+ = 0.75X; 75%+ = 1X; 100%+ = 1.25X. No annual cap. This applies under the Housing-only Rewards Option (which forgoes the 4% Bilt Cash on everyday spend).',
  updated_at = now()
from credit_cards c
where c.id=e.card_id and c.slug in ('bilt-blue','bilt-obsidian','bilt-palladium')
  and e.category = 'housing';

-- Add an explicit "pick one each cycle" benefit to all three, surfaced first.
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='bilt-blue'), 'other', 'other', 'Two Rewards Options - Pick One Each Cycle', null, null, 'perk', null, 'Each billing cycle you choose ONE rewards mode (they never stack): (1) Housing-only - up to 1.25X Bilt Points on rent/mortgage, scaled by how much you spend everyday relative to housing, and NO Bilt Cash; or (2) Flexible Bilt Cash - 4% Bilt Cash on everyday spend, with housing capped at 1X via Bilt Cash redemption. You can switch between cycles.', 0),
((select id from credit_cards where slug='bilt-obsidian'), 'other', 'other', 'Two Rewards Options - Pick One Each Cycle', null, null, 'perk', null, 'Each billing cycle you choose ONE rewards mode (they never stack): (1) Housing-only - up to 1.25X Bilt Points on rent/mortgage, scaled by how much you spend everyday relative to housing, and NO Bilt Cash; or (2) Flexible Bilt Cash - 4% Bilt Cash on everyday spend, with housing capped at 1X via Bilt Cash redemption. You can switch between cycles.', 0),
((select id from credit_cards where slug='bilt-palladium'), 'other', 'other', 'Two Rewards Options - Pick One Each Cycle', null, null, 'perk', null, 'Each billing cycle you choose ONE rewards mode (they never stack): (1) Housing-only - up to 1.25X Bilt Points on rent/mortgage, scaled by how much you spend everyday relative to housing, and NO Bilt Cash; or (2) Flexible Bilt Cash - 4% Bilt Cash on everyday spend, with housing capped at 1X via Bilt Cash redemption. You can switch between cycles.', 0);
