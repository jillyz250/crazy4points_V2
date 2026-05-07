-- Finalize refresh-queue cleanup after migration 212.
--
-- Two remaining classes:
--   1. Four more underscore/kebab duplicates that escaped 212's net
--      (china_eastern + china-eastern, malaysia + malaysia_airlines,
--      srilankan + srilankan_airlines, fiji + fiji-airways)
--   2. ~24 legit empty carrier-reference stubs (Lufthansa Group carriers,
--      small US regionals, partner-only references like SAS / Air Canada
--      pre-Aeroplan / Iceland air / etc.) that exist solely as
--      partner_redemptions FK targets. These are load-bearing - we don't
--      intend to author full pages for them. Setting last_verified =
--      current_date signals "intentionally not authored; don't surface in
--      refresh queue."

-- ============================================================
-- STEP 1: Fold the remaining 4 underscore/kebab duplicates
-- ============================================================

-- malaysia_airlines -> malaysia (more FK refs on malaysia, keep that slug)
with ids as (
  select
    (select id from programs where slug = 'malaysia_airlines') as dup_id,
    (select id from programs where slug = 'malaysia') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'malaysia_airlines') as dup_id,
    (select id from programs where slug = 'malaysia') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'malaysia_airlines');
delete from programs where slug = 'malaysia_airlines';

-- srilankan_airlines -> srilankan
with ids as (
  select
    (select id from programs where slug = 'srilankan_airlines') as dup_id,
    (select id from programs where slug = 'srilankan') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'srilankan_airlines') as dup_id,
    (select id from programs where slug = 'srilankan') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'srilankan_airlines');
delete from programs where slug = 'srilankan_airlines';

-- china_eastern (underscore) -> china-eastern (kebab)
with ids as (
  select
    (select id from programs where slug = 'china_eastern') as dup_id,
    (select id from programs where slug = 'china-eastern') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'china_eastern') as dup_id,
    (select id from programs where slug = 'china-eastern') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'china_eastern');
delete from programs where slug = 'china_eastern';

-- fiji (empty stub) -> fiji-airways (the authored kebab carrier)
with ids as (
  select
    (select id from programs where slug = 'fiji') as dup_id,
    (select id from programs where slug = 'fiji-airways') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'fiji') as dup_id,
    (select id from programs where slug = 'fiji-airways') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'fiji');
delete from programs where slug = 'fiji';

-- ============================================================
-- STEP 2: Mark legit empty FK-target stubs as "intentionally not authored"
-- ============================================================
-- Setting last_verified = current_date pushes them out of the refresh
-- queue (which surfaces only programs >180 days stale). They remain
-- active as FK targets in partner_redemptions. If we ever want to author
-- one as a full carrier page, just edit the row - last_verified will
-- naturally start counting again on next save.

update programs
set last_verified = current_date,
    updated_at = now()
where is_active = true
  and length(coalesce(intro, '')) < 100
  and last_verified is null
  and id in (
    -- Anything still showing in admin_refresh_queue at this point
    select entity_id from admin_refresh_queue where entity_type like 'program_%'
  );
