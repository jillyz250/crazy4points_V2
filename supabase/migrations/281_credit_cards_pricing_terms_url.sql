-- Add pricing_terms_url to credit_cards.
--
-- The product marketing page + Guide to Benefits page rarely list the
-- Schumer-box info (FX fee, APR ranges, late fees, returned-payment fee,
-- penalty APR, etc.). That data lives in a separate Pricing & Terms /
-- Cardmember Agreement PDF or page. Adding this third URL to the
-- extraction pipeline so Sonnet can pull those fields from the right
-- document.
--
-- After this column is populated (via Discover or manual edit),
-- runExtractionAndSave includes it in the secondaryUrls list alongside
-- guide_to_benefits_url, sending the combined markdown to Sonnet.

alter table credit_cards
  add column if not exists pricing_terms_url text;

comment on column credit_cards.pricing_terms_url is
  'Third URL scraped during extraction — the issuer''s Pricing & Terms / Cardmember Agreement page (Schumer-box style). Captures FX fee, APR ranges, late fees, penalty APR, etc. that don''t appear on the marketing product page or Guide to Benefits.';
