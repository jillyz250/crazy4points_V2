-- Persist Sonnet's URL discovery suggestions on the credit_cards row.
--
-- Mirror of programs.suggested_field_urls (migration 277). Editor clicks
-- "🔍 Discover URLs" on the card extract page → Firecrawl /map + Sonnet
-- classify → result lands here for review + apply.
--
-- Shape:
--   {
--     "source_url": { "url": "...", "reason": "...", "confidence": "high" } | null,
--     "guide_to_benefits_url": { ... } | null,
--     "promo_source": { ... } | null,
--     "newsroom_source": { ... } | null,
--     "generated_at": "...",
--     "starting_url": "...",
--     "total_urls_seen": N,
--     "candidates_sent": N
--   }

alter table credit_cards
  add column if not exists suggested_field_urls jsonb not null default '{}'::jsonb;

comment on column credit_cards.suggested_field_urls is
  'Sonnet-recommended URLs for the card extraction pipeline: source_url, guide_to_benefits_url, plus Scout-source candidates (promo_source, newsroom_source). Editor reviews and applies in admin.';
