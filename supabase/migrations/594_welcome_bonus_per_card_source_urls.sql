-- Fix the cross-card misattribution in card_bonus_signals: cards whose welcome-bonus
-- source_url was a multi-card COMPARISON page (the Haiku detector can't tell which
-- card's offer is which, e.g. it read JetBlue Plus's 60k and attributed it to the
-- basic JetBlue Card). Point each card's source_url at its OWN per-card page.
--
-- This pass covers the 10 cards that already have a distinct per-card official_url
-- (JetBlue x4, Hilton x4, Marriott x2). The remaining comparison-page cards (Bilt x3,
-- Delta Business x3, Best Western x2) have only a generic/shared official_url and are
-- handled in a follow-up after their per-card URLs are sourced. Bilt is excluded here
-- because its official_url is the generic bilt.com homepage, not a per-card page.

update credit_card_welcome_bonuses w set
  source_url = c.official_url,
  updated_at = now()
from credit_cards c
where w.card_id = c.id
  and w.is_current
  and w.source_url in (
    'https://www.hilton.com/en/hilton-honors/credit-cards/',
    'https://www.jetblue.com/trueblue/credit-cards/jetblue-card-comparison',
    'https://www.delta.com/us/en/skymiles/airline-credit-cards/american-express-business-cards',
    'https://www.bestwestern.com/en_US/offers/hotel-discounts/best-western-rewards-visa.html',
    'https://www.marriott.com/credit-cards/american-express-credit-cards.mi',
    'https://newsroom.biltrewards.com/meetbiltcard2.0'
  )
  and c.official_url is not null
  and c.official_url <> w.source_url
  and c.official_url <> 'https://www.bilt.com/';
