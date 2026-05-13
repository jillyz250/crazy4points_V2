-- Alaska program-page audit fixes (2026-05-04).
--
-- BACKGROUND
-- ----------
-- Alaska was authored 2026-04-30, before the Atmos rebrand from "miles" to
-- "points" was fully reflected in our content, and before recent banned-words
-- + comparative-claim memory rules were tightened. Audit on 2026-05-04 found:
--
--   1. Stale "Atmos Rewards miles" / "Atmos miles" text (Atmos uses points)
--   2. Banned-phrase: "isn't always the best program" (per
--      feedback_confidence_tag_drafts.md banned absolute words rule)
--   3. Comparative claim: "the first U.S. carrier to switch alliances in
--      decades" (banned superlative)
--   4. Currency_term column not set to 'points' for alaska/hawaiian/atmos
--      (migration 084 only backfilled southwest + jetblue)
--
-- 787-9 fleet/route claims verified accurate via news.alaskaair.com + Simple
-- Flying + Travel and Tour World 2026-dated press releases. Not in scope here.

-- Fix 1: currency_term for Alaska + Hawaiian + Atmos (Atmos uses points since rebrand)
update programs set currency_term = 'points' where slug in ('alaska', 'hawaiian', 'atmos');

-- Fix 2: Replace stale "Atmos Rewards miles" / "Atmos miles" across Alaska's text fields
update programs set
  intro         = replace(replace(coalesce(intro, ''),         'Atmos Rewards miles', 'Atmos Rewards points'), 'Atmos miles', 'Atmos points'),
  how_to_spend  = replace(replace(coalesce(how_to_spend, ''),  'Atmos Rewards miles', 'Atmos Rewards points'), 'Atmos miles', 'Atmos points'),
  sweet_spots   = replace(replace(coalesce(sweet_spots, ''),   'Atmos Rewards miles', 'Atmos Rewards points'), 'Atmos miles', 'Atmos points'),
  quirks        = replace(replace(coalesce(quirks, ''),        'Atmos Rewards miles', 'Atmos Rewards points'), 'Atmos miles', 'Atmos points'),
  lounge_access = replace(replace(coalesce(lounge_access, ''), 'Atmos Rewards miles', 'Atmos Rewards points'), 'Atmos miles', 'Atmos points'),
  award_chart   = replace(replace(coalesce(award_chart, ''),   'Atmos Rewards miles', 'Atmos Rewards points'), 'Atmos miles', 'Atmos points')
where slug = 'alaska';

-- Fix 3: Banned phrase "isn't always the best program"
update programs set
  how_to_spend = replace(coalesce(how_to_spend, ''), 'isn''t always the best program', 'isn''t necessarily the right program'),
  sweet_spots  = replace(coalesce(sweet_spots, ''),  'isn''t always the best program', 'isn''t necessarily the right program'),
  quirks       = replace(coalesce(quirks, ''),       'isn''t always the best program', 'isn''t necessarily the right program')
where slug = 'alaska';

-- Fix 4: Comparative claim "the first U.S. carrier to switch alliances in decades"
update programs set
  intro  = replace(coalesce(intro, ''),  'the first U.S. carrier to switch alliances in decades', 'a rare US carrier alliance switch'),
  quirks = replace(coalesce(quirks, ''), 'the first U.S. carrier to switch alliances in decades', 'a rare US carrier alliance switch')
where slug = 'alaska';

-- Mark content as freshly updated so the admin freshness pill resets
update programs set content_updated_at = now() where slug = 'alaska';
