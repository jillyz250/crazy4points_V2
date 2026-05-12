-- 244_dedup_partner_redemptions.sql
-- Deduplicate partner_redemptions rows surfacing in the Best Way to Book
-- audit (Etihad×2, Avianca×2, United×2, Finnair×2, etc.).
--
-- Algorithm:
--   1. Group active rows by (currency_program_id, operating_carrier_id,
--      cabin, sorted route_buckets) — i.e., the same partner combo with
--      identical bucket coverage.
--   2. Within each group, rank by "richness" = length of narrative text
--      (notes + teach_caption + what_breaks_this + fees_note) plus a bonus
--      for having hub-column data (complexity_score, availability_reality).
--   3. Keep the richest row (rank 1). Mark the rest is_active = false.
--
-- Conservative: only collapses rows with IDENTICAL route_bucket arrays.
-- A row tagged ['us-short'] won't be considered a dup of one tagged
-- ['us-short','us-medium'] even if the carrier/currency/cabin match.
--
-- Marks rows inactive rather than deleting — preserves history.
--
-- Authored: 2026-05-12

begin;

-- Quick diagnostic: count rows that would be deactivated
do $$
declare
  candidates int;
begin
  with ranked as (
    select id,
           row_number() over (
             partition by
               currency_program_id,
               operating_carrier_id,
               cabin,
               (select array_agg(b order by b) from unnest(coalesce(route_buckets, array[]::text[])) b)
             order by
               (coalesce(length(notes), 0)
                  + coalesce(length(teach_caption), 0)
                  + coalesce(length(what_breaks_this), 0)
                  + coalesce(length(fees_note), 0)) desc,
               case when complexity_score is not null then 1 else 0 end desc,
               case when availability_reality is not null then 1 else 0 end desc,
               id asc
           ) as rn
    from partner_redemptions
    where is_active = true
  )
  select count(*) into candidates from ranked where rn > 1;
  raise notice 'Dedup will deactivate % rows', candidates;
end $$;

-- Perform the dedup
with ranked as (
  select id,
         row_number() over (
           partition by
             currency_program_id,
             operating_carrier_id,
             cabin,
             (select array_agg(b order by b) from unnest(coalesce(route_buckets, array[]::text[])) b)
           order by
             (coalesce(length(notes), 0)
                + coalesce(length(teach_caption), 0)
                + coalesce(length(what_breaks_this), 0)
                + coalesce(length(fees_note), 0)) desc,
             case when complexity_score is not null then 1 else 0 end desc,
             case when availability_reality is not null then 1 else 0 end desc,
             id asc
         ) as rn
  from partner_redemptions
  where is_active = true
)
update partner_redemptions
set is_active = false
where id in (select id from ranked where rn > 1);

-- Visibility: show what survived per program (top 10)
select
  cp.slug as currency,
  op.slug as carrier,
  count(*) filter (where pr.is_active = true) as active_rows,
  count(*) filter (where pr.is_active = false) as inactive_rows
from partner_redemptions pr
join programs cp on cp.id = pr.currency_program_id
join programs op on op.id = pr.operating_carrier_id
group by cp.slug, op.slug
having count(*) > 1
order by inactive_rows desc, active_rows desc
limit 20;

commit;
