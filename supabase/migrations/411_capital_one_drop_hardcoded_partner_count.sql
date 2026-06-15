-- Remove the hardcoded "15+" partner counts from Capital One card text. Capital
-- One markets "15+ travel loyalty programs," but our currency program's
-- transfer_partners_outbound list holds 22 real partners and the card page's
-- Transfer-partners section renders that live count - so "15+" in the prose
-- clashed with a 22-row table. Card intros/benefits are NOT run through the
-- {slug_partner_count} token expander (only program pages are), so the durable
-- fix is to drop the fixed number and let the live section carry the count.
-- See memory: never hardcode partner counts.

-- Benefit name + description (all 6 cards)
update credit_card_benefits b
set name = 'Transfer to Airline & Hotel Partners',
    description = 'Move your miles to Capital One''s airline and hotel transfer partners, most at 1:1.',
    updated_at = now()
from credit_cards c
where c.id = b.card_id and c.slug like 'capital-one-%' and b.name = 'Transfer to 15+ Travel Partners';

-- Intros + good_to_know (targeted, natural-reading replacements)
update credit_cards set
  intro = replace(intro, '15+ airline and hotel partners', 'a deep roster of airline and hotel partners'),
  good_to_know = replace(good_to_know, '15+ airline and hotel partners', 'a deep roster of airline and hotel partners'),
  updated_at = now()
where slug like 'capital-one-%' and (intro ilike '%15+ airline and hotel partners%' or good_to_know ilike '%15+ airline and hotel partners%');

update credit_cards set intro = replace(intro, 'same 15+ transfer partners', 'same airline and hotel transfer partners'), updated_at = now()
where slug = 'capital-one-ventureone';

update credit_cards set intro = replace(intro, 'transferable to 15+ partners', 'transferable to airline and hotel partners'), updated_at = now()
where slug = 'capital-one-venture-x-business';

update credit_cards set intro = replace(intro, 'same 15+ partners', 'same airline and hotel partners'), updated_at = now()
where slug = 'capital-one-venture-business';

update credit_cards set intro = replace(intro, 'Capital One''s 15+ transfer partners', 'Capital One''s airline and hotel transfer partners'), updated_at = now()
where slug = 'capital-one-ventureone-business';
