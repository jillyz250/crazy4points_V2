-- 072a_fix_atmos_currency_slug.sql
-- Bugfix: migration 071 inserted 4 partner_redemptions rows for "Mileage Plan
-- booking AA flights" using currency_program_id = alaska (the CARRIER row).
-- Per the carrier-vs-loyalty-program split convention, the miles live on the
-- atmos row (type=loyalty_program), not the alaska row (type=airline).
--
-- Effect: those rows currently render on /programs/alaska under "Where to
-- spend your Alaska miles" (conceptually wrong — Alaska is the carrier, not
-- the miles). After this fix they render on /programs/atmos under "Where to
-- spend your Atmos miles" instead.
--
-- Targeted fix: only repoints rows where currency=alaska AND operator=aa
-- (the 4 we just authored). Other alaska-as-currency rows, if any exist for
-- different operators, are left for a separate sweep.

do $$
declare
  alaska_id uuid;
  atmos_id  uuid;
  aa_id     uuid;
  rows_updated int;
begin
  select id into alaska_id from programs where slug = 'alaska';
  select id into atmos_id  from programs where slug = 'atmos';
  select id into aa_id     from programs where slug = 'aa';

  if atmos_id is null then
    raise exception 'atmos program row not found';
  end if;

  update partner_redemptions
     set currency_program_id = atmos_id,
         verified_by = coalesce(verified_by, '') || ' | atmos-slug-fix-2026-05-03'
   where currency_program_id = alaska_id
     and operating_carrier_id = aa_id;

  get diagnostics rows_updated = row_count;
  raise notice 'Re-pointed % rows from alaska to atmos as currency.', rows_updated;
end $$;
