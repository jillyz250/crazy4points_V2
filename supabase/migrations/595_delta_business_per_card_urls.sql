-- URL fix pass 2: Delta SkyMiles Business cards have distinct per-card Amex pages.
-- Point each welcome-bonus source_url at its own page (was the shared Delta business
-- comparison page). Bilt (x3) and Best Western (x2) have NO per-card pages (Bilt is
-- selected in-app; Best Western lists both cards on one page) -- those are handled by
-- the scanCardBonuses comparison-page guard instead.

update credit_card_welcome_bonuses set source_url = 'https://www.americanexpress.com/en-us/business/credit-cards/delta-skymiles-gold/', updated_at = now()
  where is_current and card_id in (select id from credit_cards where name = 'Delta SkyMiles Gold Business American Express Card');
update credit_card_welcome_bonuses set source_url = 'https://www.americanexpress.com/en-us/business/credit-cards/delta-skymiles-platinum/', updated_at = now()
  where is_current and card_id in (select id from credit_cards where name = 'Delta SkyMiles Platinum Business American Express Card');
update credit_card_welcome_bonuses set source_url = 'https://www.americanexpress.com/en-us/business/credit-cards/delta-skymiles-reserve/', updated_at = now()
  where is_current and card_id in (select id from credit_cards where name = 'Delta SkyMiles Reserve Business American Express Card');
