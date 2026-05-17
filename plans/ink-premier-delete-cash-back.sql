-- Delete Chase Ink Business Premier — pure cash-back card, doesn't belong on
-- crazy4points (points/miles only per editorial policy).
--
-- Confirmed via Chase's redemption page + MilesTalk + TPG (2026-05-17):
-- Points earned on this card cannot transfer to airline/hotel partners AND
-- cannot pool with other Chase cards to unlock transfers. Pure cash-back.
--
-- Deletion order respects foreign keys: welcome_bonuses → benefits →
-- earn_rates → extractions → card row.

delete from credit_card_welcome_bonuses
 where card_id = (select id from credit_cards where slug = 'chase-ink-business-premier');

delete from credit_card_benefits
 where card_id = (select id from credit_cards where slug = 'chase-ink-business-premier');

delete from credit_card_earn_rates
 where card_id = (select id from credit_cards where slug = 'chase-ink-business-premier');

delete from credit_card_extractions
 where card_id = (select id from credit_cards where slug = 'chase-ink-business-premier');

delete from credit_card_extraction_verifications
 where extraction_id in (
   select id from credit_card_extractions
    where card_id = (select id from credit_cards where slug = 'chase-ink-business-premier')
 );

delete from credit_cards where slug = 'chase-ink-business-premier';
