-- Pure cash-back card audit — run AFTER migration 287 is applied.
--
-- Purpose: find cards on the site that earn cash back ONLY (no transferable
-- points currency at all — Quicksilver, Cash Magnet, Blue Cash, etc.).
-- These don't fit the site's points/miles focus and should be deleted.
--
-- A "pure cash-back" card is identified by:
--   - currency_program_id IS NULL (no points currency linked), OR
--   - currency_program slug starts with 'cash-' / contains 'cash-back', OR
--   - card name contains "Cash" but no Chase UR / Amex MR / Citi TYP / etc. earning
--
-- Step 1 — review candidates (run this first):

select c.slug,
       c.name,
       i.name              as issuer,
       p.slug              as currency_slug,
       p.name              as currency_name,
       c.points_transferable_to_partners,
       c.is_active
  from credit_cards c
  join issuers i on i.id = c.issuer_id
  left join programs p on p.id = c.currency_program_id
 where c.is_active = true
   and (
     c.currency_program_id is null
     or p.slug ilike '%cash%back%'
     or p.slug = 'capital-one-cash-rewards'
     or p.slug = 'amex-cash-back'
     or p.slug = 'citi-cash-back'
   )
 order by i.name, c.name;

-- Step 2 — once reviewed and approved, delete in dependency order.
-- Replace the slugs list with what you want to remove.
--
-- delete from credit_card_welcome_bonuses where card_id in (select id from credit_cards where slug in ('<slug1>','<slug2>'));
-- delete from credit_card_benefits         where card_id in (select id from credit_cards where slug in ('<slug1>','<slug2>'));
-- delete from credit_card_earn_rates       where card_id in (select id from credit_cards where slug in ('<slug1>','<slug2>'));
-- delete from credit_card_extractions      where card_id in (select id from credit_cards where slug in ('<slug1>','<slug2>'));
-- delete from credit_cards                 where slug in ('<slug1>','<slug2>');
