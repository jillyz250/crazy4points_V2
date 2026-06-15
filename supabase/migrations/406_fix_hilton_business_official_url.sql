-- The Hilton Honors Business card's official_url used the personal-card path
-- (/credit-cards/card/hilton-honors-business/), which 404s. Amex serves business
-- cards under a different path. Verified live 2026-06-15.
update credit_cards
set official_url = 'https://www.americanexpress.com/us/credit-cards/business/business-credit-cards/hilton-honors/',
    updated_at = now(), last_verified = current_date
where slug = 'amex-hilton-honors-business';
