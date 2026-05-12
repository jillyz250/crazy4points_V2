-- 240_backfill_partner_redemption_iata.sql
-- Backfill partner_redemptions.origin_iata / dest_iata from region_or_route
-- text. Conservative regex: only matches rows where two 3-letter IATA
-- patterns appear with a clear separator (↔ / → / - / – / — / to / /).
--
-- Bucket-level rows like "US East ↔ Europe" or "Within US — long-haul"
-- intentionally stay NULL — they're not anchored to a specific route.
-- Per audit decision #5: anchored rows enable per-route chart compute
-- on Don't Sleep / Should I Transfer / Where Can I Go surfaces.
--
-- Idempotent — re-running won't reapply (skips rows that already have
-- origin_iata set).
--
-- Authored: 2026-05-12

begin;

-- Extract patterns like "JFK-LHR", "JFK ↔ LHR", "JFK → LHR", "JFK to LHR".
-- The (?<![A-Z]) and (?![A-Z]) lookarounds prevent matching inside words.
-- We use the PostgreSQL POSIX regex via substring(... from '...').

with extracted as (
  select
    id,
    substring(region_or_route from '\m([A-Z]{3})\M\s*(?:↔|→|-|–|—|/|\bto\b)\s*\m[A-Z]{3}\M') as iata1,
    substring(region_or_route from '\m[A-Z]{3}\M\s*(?:↔|→|-|–|—|/|\bto\b)\s*\m([A-Z]{3})\M') as iata2
  from partner_redemptions
  where origin_iata is null
    and dest_iata is null
    and region_or_route ~ '\m[A-Z]{3}\M\s*(↔|→|-|–|—|/|\bto\b)\s*\m[A-Z]{3}\M'
)
update partner_redemptions pr
set origin_iata = e.iata1,
    dest_iata   = e.iata2
from extracted e
where pr.id = e.id
  and e.iata1 is not null
  and e.iata2 is not null
  and e.iata1 != e.iata2; -- guard: don't anchor rows where regex matched the same code twice

-- Quick stats for visibility (will show in Supabase result panel):
select
  count(*) filter (where origin_iata is not null) as anchored_rows,
  count(*) filter (where origin_iata is null)     as bucket_rows,
  count(*)                                         as total_rows
from partner_redemptions
where is_active = true;

commit;
