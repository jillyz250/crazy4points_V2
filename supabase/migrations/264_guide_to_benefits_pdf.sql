-- Guide to Benefits PDF ingestion.
--
-- Issuers publish detailed coverage amounts (trip cancellation limits,
-- baggage delay caps, rental insurance specifics) in a "Guide to Benefits"
-- PDF separate from the product landing page. Our main extraction misses
-- these because the values aren't on the marketing page.
--
-- Approach:
--   1. credit_cards.guide_to_benefits_url — stores the PDF URL per card
--   2. When this URL is set, the extraction pipeline scrapes the PDF
--      via Firecrawl (which auto-detects PDFs and returns clean markdown)
--   3. Sonnet receives BOTH markdowns in one prompt — main page is primary,
--      GoB PDF is fallback for coverage amounts and fine print
--   4. credit_card_extractions.gob_markdown stores the raw scraped PDF
--      content for audit (same pattern as raw_markdown for the main page)
--
-- The GoB PDF is the SECONDARY source — primary remains the issuer product
-- page. The verified-math rule still applies: every dollar amount must be
-- backed by a source quote (which can now be from either source).

alter table credit_cards
  add column if not exists guide_to_benefits_url text;

comment on column credit_cards.guide_to_benefits_url is
  'URL to the issuer''s Guide to Benefits PDF for this card. When set, the extraction pipeline scrapes this PDF in addition to the product landing page (credit_cards.official_url), giving Sonnet access to coverage amounts and fine print not shown on the marketing page. Chase: static.chasecdn.com/.../BGC*.pdf; Amex: americanexpress.com/content/dam/.../*.pdf; etc.';

alter table credit_card_extractions
  add column if not exists gob_markdown text;

alter table credit_card_extractions
  add column if not exists gob_chars integer;

comment on column credit_card_extractions.gob_markdown is
  'Raw scraped markdown from the Guide to Benefits PDF (when card.guide_to_benefits_url is set). Stored alongside raw_markdown for audit. Empty/null when no GoB URL configured or scrape failed.';
