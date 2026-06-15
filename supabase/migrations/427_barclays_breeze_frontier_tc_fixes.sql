-- Corrections after verifying Breeze + Frontier against the full official
-- Reward Rules (pasted 2026-06-15).

-- BREEZE: anniversary bonus is gated on $10,000 annual spend (Reward Rules,
-- "Additional Benefits of Your Card Account" -> Anniversary Bonus).
update credit_card_benefits b set
  description = 'Earn 7,500 Anniversary Bonus BreezePoints after each card anniversary, but only if you spent $10,000 or more in net purchases during that cardmembership year.',
  updated_at = now()
from credit_cards c
where c.id=b.card_id and c.slug='barclays-breeze-airways' and b.name='Anniversary Bonus Points';

-- FRONTIER: priority boarding is Group 4 specifically.
update credit_card_benefits b set
  name = 'Priority Boarding (Group 4)',
  description = 'Group 4 boarding on Frontier-operated flights (Primary Cardmember only), as long as your Frontier Miles number is on the reservation.',
  updated_at = now()
from credit_cards c
where c.id=b.card_id and c.slug='barclays-frontier-airlines' and b.name='Priority Boarding';

-- FRONTIER: Elite Gold also confers free seat upgrades.
update credit_card_benefits b set
  description = 'Instant Frontier Elite Gold status after your first purchase in the first 90 days - includes free seat upgrades and Group 1 priority boarding. Keep it for 12 months by spending $3,000 in net purchases within those 90 days; otherwise it expires at 90 days.',
  updated_at = now()
from credit_cards c
where c.id=b.card_id and c.slug='barclays-frontier-airlines' and b.name='Instant Elite Gold Status';

-- FRONTIER: add Account Pooling + FICO Score access.
insert into credit_card_benefits (card_id, category, benefit_type, name, value_amount, value_unit, benefit_family, frequency, description, sort_order) values
((select id from credit_cards where slug='barclays-frontier-airlines'), 'other', 'other', 'Miles Account Pooling', null, null, 'perk', null, 'Pool Frontier Miles with up to 8 friends and family members to reach award redemptions faster.', 9),
((select id from credit_cards where slug='barclays-frontier-airlines'), 'other', 'other', 'Complimentary FICO Score Access', null, null, 'perk', null, 'Free online access to your FICO Credit Score, with alerts when your score changes (account must be open and active).', 10);
