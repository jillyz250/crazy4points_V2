-- Normalize the Hilton Aspire card slug to match its three Amex Hilton siblings
-- (amex-hilton-honors / -surpass / -business). It was the odd one out at
-- "hilton-honors-aspire", which caused a 404 when reached via the family-pattern
-- URL. A permanent redirect in next.config.ts covers the old slug.
update credit_cards
set slug = 'amex-hilton-honors-aspire', updated_at = now()
where slug = 'hilton-honors-aspire';
