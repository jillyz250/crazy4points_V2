-- US State Department travel advisory level + summary per destination.
--
-- Pulled from https://travel.state.gov/_res/rss/TAsTWs.xml on a daily-ish
-- cadence by /api/admin/refresh-travel-advisories. Surfaced on the public
-- Decision Engine card so readers see at a glance whether a destination
-- carries a "Reconsider Travel" or "Do Not Travel" warning.
--
-- Levels:
--   1 = Exercise Normal Precautions
--   2 = Exercise Increased Caution
--   3 = Reconsider Travel
--   4 = Do Not Travel
--
-- Decision Engine filters Level 4 destinations out of default spins. They
-- still show when the user explicitly picks the continent containing them.

alter table destinations
  add column if not exists advisory_level smallint check (advisory_level is null or advisory_level between 1 and 4);

alter table destinations
  add column if not exists advisory_url text;

alter table destinations
  add column if not exists advisory_summary text;

alter table destinations
  add column if not exists advisory_updated_at timestamptz;

create index if not exists destinations_advisory_level_idx
  on destinations (advisory_level)
  where advisory_level is not null;

comment on column destinations.advisory_level is
  'US State Dept travel advisory level (1-4). Null = no data yet. Refreshed by /api/admin/refresh-travel-advisories.';
comment on column destinations.advisory_url is
  'Deep link to the country-specific advisory page on travel.state.gov.';
