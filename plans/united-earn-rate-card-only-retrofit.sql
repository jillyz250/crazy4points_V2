-- Retrofit United card flight earn rates from COMBINED (card + MileagePlus
-- base) to CARD-ONLY, with the combined math in notes. Aligns with the
-- normalized convention going forward: multiplier = what the CARD adds,
-- notes = "+Xx via MileagePlus base earn" / "+Xx Silver Elite bonus" etc.
--
-- Existing values:
--   Explorer    flights 9x  → card-only 3x  (+6x MileagePlus member base)
--   Quest       flights 10x → card-only 4x  (+6x MileagePlus member base)
--   Club Inf.   flights 11x → card-only 5x  (+6x MileagePlus member base)
--
-- Run after lib/admin/refresh-cadences.ts updates are deployed.

-- Explorer: 9x → 3x
update credit_card_earn_rates
   set multiplier = 3,
       notes = '3x miles per dollar on the United Explorer Card itself. MileagePlus members earn an additional 6x on the fare as the base loyalty earn — combined 9x total for MileagePlus members.'
 where card_id = (select id from credit_cards where slug = 'chase-united-explorer')
   and category = 'flights'
   and multiplier = 9;

-- Quest: 10x → 4x
update credit_card_earn_rates
   set multiplier = 4,
       notes = '4x miles per dollar on the United Quest Card itself. MileagePlus members earn an additional 6x on the fare as the base loyalty earn — combined 10x total for MileagePlus members.'
 where card_id = (select id from credit_cards where slug = 'united-quest')
   and category = 'flights'
   and multiplier = 10;

-- Club Infinite: 11x → 5x
update credit_card_earn_rates
   set multiplier = 5,
       notes = '5x miles per dollar on the United Club Infinite Card itself. MileagePlus members earn an additional 6x on the fare as the base loyalty earn — combined 11x total for MileagePlus members.'
 where card_id = (select id from credit_cards where slug = 'united-club-infinite')
   and category = 'flights'
   and multiplier = 11;

-- United Business: 8x → 2x
update credit_card_earn_rates
   set multiplier = 2,
       notes = '2x miles per dollar on the United Business Card itself. MileagePlus members earn an additional 6x on the fare as the base loyalty earn — combined 8x total for MileagePlus members.'
 where card_id = (select id from credit_cards where slug = 'chase-united-business')
   and category = 'flights'
   and multiplier = 8;

-- United Gateway: 5x → 2x
update credit_card_earn_rates
   set multiplier = 2,
       notes = '2x miles per dollar on the United Gateway Card itself. MileagePlus members earn an additional 3x on the fare as the base loyalty earn — combined 5x total for MileagePlus members.'
 where card_id = (select id from credit_cards where slug = 'chase-united-gateway')
   and category = 'flights'
   and multiplier = 5;
