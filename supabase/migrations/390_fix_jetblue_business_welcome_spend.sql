-- Correct the JetBlue Business welcome-bonus spend requirement.
-- Migration 388 sourced $2,000 from JetBlue's comparison page, but Barclays'
-- own application page (authoritative for the live offer) states $4,000.
-- Verified 2026-06-15 at cards.barclaycardus.com/banking/cards/jetblue-business-card/.
update credit_card_welcome_bonuses
set spend_required_usd = 4000, last_verified = '2026-06-15', verified_at = now(), updated_at = now()
where card_id = (select id from credit_cards where slug = 'barclays-jetblue-business');

update credit_cards
set good_to_know = replace(good_to_know, '$2,000 spend', '$4,000 spend'),
    last_verified = '2026-06-15', updated_at = now()
where slug = 'barclays-jetblue-business';
