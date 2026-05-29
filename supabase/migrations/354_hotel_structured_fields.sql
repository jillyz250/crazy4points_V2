-- Hotel-specific structured extraction fields on programs.
--
-- Hotels carry two high-value facts that don't fit the airline-shaped text
-- fields (award_chart prose / quirks blob): the category award chart with
-- off-peak/standard/peak point bands, and the Free Night Certificate rules
-- per co-brand card. Both are arrays of rows; each row carries its own
-- source_quote + confidence so every fact is individually verifiable
-- (matching the per-benefit provenance the card extractor produces).
--
-- These are populated by the program extractor only when the field has a
-- source URL assigned (hotels only in practice). Airlines leave them null.

alter table programs
  add column if not exists award_category_chart jsonb,
  add column if not exists free_night_certs jsonb;

comment on column programs.award_category_chart is
  'Hotel award category chart. Array of rows: { category, off_peak, standard, peak, notes?, source_quote, confidence }. Null for airlines.';

comment on column programs.free_night_certs is
  'Hotel Free Night Certificate rules per co-brand card. Array of rows: { card, category_ceiling, blackouts, expiry, notes?, source_quote, confidence }. Null for airlines.';
