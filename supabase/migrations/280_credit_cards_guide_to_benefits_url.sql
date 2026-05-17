-- Add guide_to_benefits_url to credit_cards.
--
-- Many card benefits (insurance, trip delay, baggage protection, rental car
-- CDW, etc.) live in a separate "Guide to Benefits" page or PDF — not the
-- main product marketing page. The extraction pipeline scrapes ONLY
-- credit_cards.official_url today, missing all the insurance details.
--
-- Adding this column + updating extractCardBenefits to scrape both URLs
-- (combined markdown sent to Sonnet as one source) brings card extractions
-- to feature parity with the issuer's actual benefit documentation.

alter table credit_cards
  add column if not exists guide_to_benefits_url text;

comment on column credit_cards.guide_to_benefits_url is
  'Optional secondary URL — the issuer''s detailed Guide to Benefits page. When set, the extraction pipeline scrapes BOTH official_url AND this URL, combining the markdown so Sonnet sees insurance/protection details that only appear in the benefits guide.';
