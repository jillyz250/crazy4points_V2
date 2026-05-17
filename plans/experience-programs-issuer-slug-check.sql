-- Run this BEFORE migrations 292/293/294 to verify the issuer slugs the seed
-- expects actually exist. If any of these come back null/empty, the seed needs
-- updates OR your issuers table is using different slugs.
--
-- Expected slugs in seed:
--   chase            (Chase Experiences, United Card Events, Southwest Access, Sapphire Reserved)
--   american-express (Amex Experiences, By Invitation Only, Resy)
--   citi             (Citi Entertainment)
--   capital-one      (Capital One Entertainment, Dining, Lounges)
--   bank-of-america  (BoA Preferred Seating)
--   us-bank          (U.S. Bank PGA Access)

select slug, name
  from issuers
 where slug in (
   'chase',
   'american-express',
   'citi',
   'capital-one',
   'bank-of-america',
   'us-bank'
 )
 order by slug;

-- If any expected issuer is missing from the result, run this to see the
-- actual slug for that issuer name:
--
-- select slug, name from issuers
--  where name ilike '%american express%'
--     or name ilike '%bank of america%'
--     or name ilike '%us bank%' or name ilike '%u.s. bank%'
--  order by name;
