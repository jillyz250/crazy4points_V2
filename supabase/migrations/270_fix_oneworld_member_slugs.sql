-- Fix oneworld member_programs slugs to use canonical program slugs.
--
-- Migration 063 seeded oneworld member program rows with slugs:
--   british_airways, cathay_pacific, japan_airlines, qatar_airways
-- Those rows were later renamed/replaced with canonical slugs:
--   ba-avios (Avios), cathay (Cathay Pacific Asia Miles),
--   jal (Japan Airlines Mileage Bank), qatar (Qatar Privilege Club)
-- Plus a few other slug-convention mismatches:
--   fiji → fiji-airways, royal_air_maroc → royal-air-maroc,
--   royal_jordanian → royal-jordanian, cathay-pacific → cathay
--
-- The oneworld.member_programs jsonb still references the old slugs, so
-- the public /programs/oneworld page renders raw slugs ("british_airways",
-- "cathay-pacific", "fiji", "japan_airlines", "qatar-airways", etc.) when
-- the name lookup fails for those slug variants.
--
-- This migration string-replaces the quoted slugs inside the jsonb text,
-- catching both:
--   "program_slug": "british_airways"   (in key/value position)
--   "carrier_slugs": ["british_airways"] (in array position)
-- Both get fixed by replacing the quoted string.

update programs set
  member_programs = (
    replace(
      replace(
        replace(
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      replace(
                        member_programs::text,
                        '"british_airways"', '"ba-avios"'
                      ),
                      '"cathay_pacific"', '"cathay"'
                    ),
                    '"cathay-pacific"', '"cathay"'
                  ),
                  '"fiji"', '"fiji-airways"'
                ),
                '"japan_airlines"', '"jal"'
              ),
              '"qatar_airways"', '"qatar"'
            ),
            '"qatar-airways"', '"qatar"'
          ),
          '"royal_air_maroc"', '"royal-air-maroc"'
        ),
        '"royal_jordanian"', '"royal-jordanian"'
      ),
      '"cathay"', '"cathay"'  -- no-op safety
    )
  )::jsonb,
  last_verified = current_date
where slug = 'oneworld';

-- Verification queries to run after this migration:
--
-- 1. Confirm the new slugs are present (counts should be > 0):
--      select count(*) from programs
--      where slug = 'oneworld'
--        and member_programs::text like '%"ba-avios"%';
--
-- 2. Confirm the old slugs are gone (should return 0):
--      select count(*) from programs
--      where slug = 'oneworld'
--        and (member_programs::text like '%"british_airways"%'
--          or member_programs::text like '%"japan_airlines"%'
--          or member_programs::text like '%"qatar-airways"%');
