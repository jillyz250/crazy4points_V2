-- Audit follow-up to migration 411: remove hardcoded transfer-partner counts that
-- conflict with the live count rendered by each card's Transfer-partners section.
-- Verified each against its currency program's transfer_partners_outbound length:
--   Chase Sapphire Preferred prose said "10 airline and 3 hotel" (13); live = 14.
--   Marriott cards said "40+ / over 40 airline programs"; live = 38 (so "40+" is
--     actually an overstatement). Replaced with "dozens" (38 qualifies).
--   Amex Platinum said "20 ... partners"; live = 20 (correct today, but drops the
--     number so it can't drift). See memory: never hardcode partner counts.

-- Chase Sapphire Preferred
update credit_card_benefits b set
  description = replace(description, 'Transfer points to 10 airline and 3 hotel travel partners at 1:1 value.',
                                     'Transfer points to Chase''s airline and hotel travel partners at 1:1 value.'),
  updated_at = now()
from credit_cards c
where c.id = b.card_id and c.slug = 'chase-sapphire-preferred'
  and b.description like '%10 airline and 3 hotel travel partners%';

-- Amex Platinum (correct today, future-proofed)
update credit_card_benefits b set
  description = replace(description, 'to 20 airline and hotel travel partners', 'to airline and hotel travel partners'),
  updated_at = now()
from credit_cards c
where c.id = b.card_id and c.slug = 'amex-platinum'
  and b.description like '%20 airline and hotel travel partners%';

-- Marriott family benefits: "over 40" / "40+" -> "dozens"
update credit_card_benefits b set
  description = replace(replace(description, 'over 40 airline frequent flyer programs', 'dozens of airline frequent flyer programs'),
                                             '40+ airline frequent flyer programs', 'dozens of airline frequent flyer programs'),
  updated_at = now()
from credit_cards c
where c.id = b.card_id
  and c.slug in ('amex-marriott-bonvoy-bevy','amex-marriott-bonvoy-business','marriott-bonvoy-brilliant')
  and (b.description like '%over 40 airline frequent flyer programs%' or b.description like '%40+ airline frequent flyer programs%');

-- Marriott family good_to_know: "40+ airline programs" -> "dozens of airline programs"
update credit_cards set
  good_to_know = replace(good_to_know, '40+ airline programs', 'dozens of airline programs'),
  updated_at = now()
where slug in ('amex-marriott-bonvoy-bevy','amex-marriott-bonvoy-business')
  and good_to_know like '%40+ airline programs%';
