-- Reorganize program-row types so the admin /admin/programs filter and the
-- public /programs?type=airline tab actually surface what readers expect.
--
-- BEFORE this migration:
--   - 57 single-carrier 1:1 programs (Cathay, Korean Air, Emirates, Etihad,
--     KrisFlyer, Aeroplan, etc.) were typed 'loyalty_program' even though
--     the page IS about that one airline. Result: searching for "Cathay"
--     in the airlines tab finds an empty 'cathay-pacific' carrier-reference
--     stub, not the rich page at slug='cathay'.
--   - 13 underscore-slug duplicates (aer_lingus, air_tahiti_nui,
--     fiji_airways, royal_air_maroc, vietnam_airlines, etc.) and a few
--     kebab-case duplicates (cathay-pacific, qatar-airways, singapore-
--     airlines, singapore_airlines, el_al) clutter the airlines tab as
--     empty rows that double up on already-authored content.
--
-- AFTER this migration:
--   - All 57 single-carrier programs have type='airline'. They show in
--     the Airlines tab (where readers expect them) with full content.
--   - 13 duplicate empty rows are folded: their FK refs in
--     partner_redemptions are repointed at the canonical row, then the
--     duplicate is deleted.
--   - type='loyalty_program' is reserved for what it actually means:
--     transferable currencies (chase-ur, amex-mr, etc.) + multi-carrier
--     umbrella programs (atmos, ba-avios, miles-and-more, flying-blue).
--
-- Empty carrier-reference rows that legitimately serve as FK targets for
-- partner-award metal we don't have a content row for (british-airways,
-- china-eastern, gulf-air, kenya-airways, sas, swiss, austrian, lufthansa,
-- starlux, hainan_airlines, oman_air, etc.) STAY as type='airline' empty
-- stubs - they're load-bearing for partner_redemptions even though they
-- have no content.

-- ============================================================
-- STEP 1: Flip 57 single-carrier 1:1 programs to type='airline'
-- ============================================================
update programs
set type = 'airline',
    updated_at = now()
where type = 'loyalty_program'
  and slug in (
    'aegean','aer-lingus','aerolineas-argentinas','aeromexico','aeroplan',
    'air-astana','air-china','air-india','air-india-express',
    'air-new-zealand','air-tahiti-nui','airasia','ana','asiana','avianca',
    'azul','bamboo','bulgaria-air','cathay','cebu-pacific','china-airlines',
    'copa','egyptair','el-al','emirates','ethiopian','etihad','eva-air',
    'fiji-airways','finnair','flydubai','garuda-indonesia','iberia','indigo',
    'jal','jetsmart','korean-air','krisflyer','latam','norwegian','pegasus',
    'philippine-airlines','qantas','qatar','royal-air-maroc',
    'royal-jordanian','saudia','south-african-airways','tap','thai',
    'vietnam-airlines','virgin-atlantic','virgin-australia','vivaaerobus',
    'volaris','vueling','wizz-air'
  );

-- ============================================================
-- STEP 2: Fold duplicate empty rows into the canonical content row
-- ============================================================
-- For each (duplicate -> canonical) pair, repoint partner_redemptions FKs
-- then delete the duplicate row. Each block uses a CTE to capture both
-- IDs at once.

-- aer_lingus (underscore, empty) -> aer-lingus (kebab, full content)
with ids as (
  select
    (select id from programs where slug = 'aer_lingus') as dup_id,
    (select id from programs where slug = 'aer-lingus') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);

with ids as (
  select
    (select id from programs where slug = 'aer_lingus') as dup_id,
    (select id from programs where slug = 'aer-lingus') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);

delete from alert_programs where program_id = (select id from programs where slug = 'aer_lingus');
delete from programs where slug = 'aer_lingus';

-- air_tahiti_nui (underscore) -> air-tahiti-nui (kebab)
with ids as (
  select
    (select id from programs where slug = 'air_tahiti_nui') as dup_id,
    (select id from programs where slug = 'air-tahiti-nui') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'air_tahiti_nui') as dup_id,
    (select id from programs where slug = 'air-tahiti-nui') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'air_tahiti_nui');
delete from programs where slug = 'air_tahiti_nui';

-- china_airlines (underscore) -> china-airlines (kebab)
with ids as (
  select
    (select id from programs where slug = 'china_airlines') as dup_id,
    (select id from programs where slug = 'china-airlines') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'china_airlines') as dup_id,
    (select id from programs where slug = 'china-airlines') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'china_airlines');
delete from programs where slug = 'china_airlines';

-- fiji_airways (underscore) -> fiji-airways (kebab)
with ids as (
  select
    (select id from programs where slug = 'fiji_airways') as dup_id,
    (select id from programs where slug = 'fiji-airways') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'fiji_airways') as dup_id,
    (select id from programs where slug = 'fiji-airways') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'fiji_airways');
delete from programs where slug = 'fiji_airways';

-- japan_airlines (carrier name) -> jal (the canonical authored slug)
with ids as (
  select
    (select id from programs where slug = 'japan_airlines') as dup_id,
    (select id from programs where slug = 'jal') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'japan_airlines') as dup_id,
    (select id from programs where slug = 'jal') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'japan_airlines');
delete from programs where slug = 'japan_airlines';

-- philippine_airlines (underscore) -> philippine-airlines (kebab)
with ids as (
  select
    (select id from programs where slug = 'philippine_airlines') as dup_id,
    (select id from programs where slug = 'philippine-airlines') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'philippine_airlines') as dup_id,
    (select id from programs where slug = 'philippine-airlines') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'philippine_airlines');
delete from programs where slug = 'philippine_airlines';

-- royal_air_maroc (underscore) -> royal-air-maroc (kebab)
with ids as (
  select
    (select id from programs where slug = 'royal_air_maroc') as dup_id,
    (select id from programs where slug = 'royal-air-maroc') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'royal_air_maroc') as dup_id,
    (select id from programs where slug = 'royal-air-maroc') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'royal_air_maroc');
delete from programs where slug = 'royal_air_maroc';

-- royal_jordanian (underscore) -> royal-jordanian (kebab)
with ids as (
  select
    (select id from programs where slug = 'royal_jordanian') as dup_id,
    (select id from programs where slug = 'royal-jordanian') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'royal_jordanian') as dup_id,
    (select id from programs where slug = 'royal-jordanian') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'royal_jordanian');
delete from programs where slug = 'royal_jordanian';

-- vietnam_airlines (underscore) -> vietnam-airlines (kebab)
delete from alert_programs where program_id = (select id from programs where slug = 'vietnam_airlines');
delete from programs where slug = 'vietnam_airlines';

-- cathay-pacific (kebab carrier) -> cathay (the authored slug)
with ids as (
  select
    (select id from programs where slug = 'cathay-pacific') as dup_id,
    (select id from programs where slug = 'cathay') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'cathay-pacific') as dup_id,
    (select id from programs where slug = 'cathay') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'cathay-pacific');
delete from programs where slug = 'cathay-pacific';

-- qatar-airways (kebab carrier) -> qatar (the authored slug)
with ids as (
  select
    (select id from programs where slug = 'qatar-airways') as dup_id,
    (select id from programs where slug = 'qatar') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'qatar-airways') as dup_id,
    (select id from programs where slug = 'qatar') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'qatar-airways');
delete from programs where slug = 'qatar-airways';

-- singapore-airlines + singapore_airlines (both empty) -> krisflyer
with ids as (
  select
    (select id from programs where slug = 'singapore-airlines') as dup_id,
    (select id from programs where slug = 'krisflyer') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'singapore-airlines') as dup_id,
    (select id from programs where slug = 'krisflyer') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'singapore-airlines');
delete from programs where slug = 'singapore-airlines';

with ids as (
  select
    (select id from programs where slug = 'singapore_airlines') as dup_id,
    (select id from programs where slug = 'krisflyer') as canon_id
)
update partner_redemptions pr
set operating_carrier_id = (select canon_id from ids)
from ids
where pr.operating_carrier_id = (select dup_id from ids);
with ids as (
  select
    (select id from programs where slug = 'singapore_airlines') as dup_id,
    (select id from programs where slug = 'krisflyer') as canon_id
)
update partner_redemptions pr
set currency_program_id = (select canon_id from ids)
from ids
where pr.currency_program_id = (select dup_id from ids);
delete from alert_programs where program_id = (select id from programs where slug = 'singapore_airlines');
delete from programs where slug = 'singapore_airlines';

-- el_al (underscore, no FK refs) -> el-al
delete from alert_programs where program_id = (select id from programs where slug = 'el_al');
delete from programs where slug = 'el_al';
