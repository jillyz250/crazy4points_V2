-- Adds two static facts to programs that surface in the public page hero:
--
--   alliance — text enum: 'skyteam' | 'star_alliance' | 'oneworld' | 'none'
--              Renders as a gold-tinted badge in the page header.
--   hubs     — text array of airport codes (e.g. ['CDG', 'AMS'] for Flying Blue,
--              ['ATL', 'DTW', 'MSP'] for Delta).
--              Surfaces near the title — useful for points readers who care
--              about positioning out of hubs for cheaper award availability.
--
-- Both nullable. Set on existing programs via the page editor; future
-- new programs can be created with them.

alter table programs
  add column if not exists alliance text,
  add column if not exists hubs     text[];

-- Soft enum constraint — allows future expansion without a migration.
alter table programs
  drop constraint if exists programs_alliance_check;
alter table programs
  add constraint programs_alliance_check
  check (alliance is null or alliance in ('skyteam', 'star_alliance', 'oneworld', 'none', 'other'));

comment on column programs.alliance is
  'Airline alliance membership. One of: skyteam, star_alliance, oneworld, none, other. Surfaces as a badge on the public page header.';
comment on column programs.hubs is
  'Array of airport codes the carrier operates as hubs. Surfaces in the public page header. Useful for award-positioning content.';
