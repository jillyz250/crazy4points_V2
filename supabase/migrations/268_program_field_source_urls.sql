-- Per-field source URL mapping.
--
-- Replaces the "scrape everything together, hope Sonnet routes correctly"
-- approach with explicit per-field URL designation. Each editable field on
-- a program gets its own source URL (or NULL to skip extraction entirely).
--
-- Editor controls authoritatively which page is canonical for which field:
--   { "tier_benefits": "https://www.oneworld.com/travel-benefits",
--     "lounge_access": "https://www.oneworld.com/airport-lounges",
--     "intro": null }   -- explicit skip; manual content stays
--
-- Pipeline groups fields by URL, scrapes each unique URL ONCE, runs a
-- focused Sonnet call per URL that extracts ONLY the mapped fields. No
-- cross-contamination (sweet_spots can't get polluted with lounge content).
--
-- NULL semantics: field's URL is null OR missing from the jsonb = skip
-- extraction for that field, keep current value. The current value stays
-- on programs.<field> untouched.

alter table programs
  add column if not exists field_source_urls jsonb not null default '{}'::jsonb;

comment on column programs.field_source_urls is
  'Per-field source URL mapping. Keys are program field names (intro, sweet_spots, lounge_access, tier_benefits, quirks, award_chart, alliance, hubs, parent_program_slug). Values are the URL to scrape for that field, or null to skip extraction. Empty object {} means no per-field config — extraction uses extraction_source_url for everything (legacy behavior).';

-- additional_source_urls (added in migration 267) is now legacy. The per-field
-- system supersedes it. Keep the column for backward compatibility; future
-- migrations may retire it once all programs are configured with field_source_urls.
