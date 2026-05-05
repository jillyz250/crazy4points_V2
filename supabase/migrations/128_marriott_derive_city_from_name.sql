-- Derive city from property name for Marriott rows with null city.
--
-- BACKGROUND
-- Decision Engine /api/decision-engine filters sample hotels by city
-- substring match against destination.title. When city is null (as it
-- was on all 1,889 Block 1 rows because state-level destination pages
-- don't expose per-property city), no Marriott hotel surfaces in
-- Decision Engine results - even though we have rich US coverage.
--
-- This migration uses the destinations table as a city dictionary:
-- for each Marriott property whose name contains a US destination
-- title as a substring, set city = destination.title.
--
-- Ambiguous cases (e.g. "Charleston" exists as both SC and WV
-- destinations) are resolved by the destinations table query order -
-- first match wins. Acceptable for MVP; refine in Phase 2 with a
-- city + state disambiguator if needed.
--
-- Skipped: properties whose name doesn't include any known
-- destination title get city=null (mostly tiny towns / airport hotels
-- whose name format is "<Brand> Airport <City>").

with marriott as (
  select id from programs where slug = 'marriott-bonvoy'
),
matched as (
  select distinct on (hp.id)
    hp.id,
    d.title as derived_city
  from hotel_properties hp
  join destinations d on hp.country = d.country
    and hp.name ilike '%' || d.title || '%'
  where hp.program_id = (select id from marriott)
    and hp.city is null
  order by hp.id, length(d.title) desc  -- prefer longer/more specific titles ("New York City" > "York")
)
update hotel_properties hp
set city = m.derived_city,
    updated_at = now()
from matched m
where hp.id = m.id;
