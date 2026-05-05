-- Add property_code column to hotel_properties.
--
-- Marriott assigns each property a 5-letter internal code (e.g. TYOAR for
-- AC Hotel Tokyo Ginza, SACSW for Sacramento Sheraton) that's embedded in
-- every property URL slug: marriott.com/en-us/hotels/tyoar-ac-hotel-tokyo-ginza/
--
-- We need this code as a stable identifier for two reasons:
--   1. Dedup when re-running the destination scraper (the same property
--      shows up in multiple destination pages).
--   2. Joining against Frequent Miler's category tracker - FM keys their
--      master list on Marriott property codes, so this is the cleanest
--      link from "I scraped a property" to "what category is it".
--
-- Hilton + IHG + Hyatt also have similar internal property codes; this
-- column is generic across hotel programs.

alter table hotel_properties
  add column if not exists property_code text;

create unique index if not exists hotel_properties_program_code_uniq
  on hotel_properties (program_id, property_code)
  where property_code is not null;

comment on column hotel_properties.property_code is
  'Hotel chain''s internal property code (Marriott uses 5-letter codes like TYOAR; Hilton uses GHC-style codes; etc.). Embedded in the chain''s URL slugs. Stable identifier for dedup + cross-source joins (e.g. Frequent Miler category tracker).';
