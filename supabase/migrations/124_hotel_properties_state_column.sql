-- Add state_or_province column to hotel_properties.
--
-- The existing region column is restricted by a CHECK to 4 continent
-- buckets ('americas', 'europe', 'asia_pacific', 'middle_east_africa').
-- That's a useful broad filter for Decision Engine grouping, but it
-- means we have nowhere to store the US state / Canadian province /
-- non-continent geographic subdivision when scraping state-level
-- destination pages on hotel chain sites.
--
-- Adding a separate column so the destination scraper can capture both
-- the broad region (americas) AND the specific state (California) in
-- their proper places.

alter table hotel_properties
  add column if not exists state_or_province text;

create index if not exists hotel_properties_program_state_idx
  on hotel_properties (program_id, state_or_province)
  where state_or_province is not null;

comment on column hotel_properties.state_or_province is
  'US state, Canadian province, or other sub-country subdivision. Distinct from region (which is the 4-bucket continent grouping for Decision Engine).';
