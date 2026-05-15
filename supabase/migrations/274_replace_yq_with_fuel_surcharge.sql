-- Replace IATA jargon "YQ" with plain English "fuel surcharge(s)" across
-- all user-facing content fields.
--
-- Background: YQ is the IATA fare-code prefix for carrier-imposed fuel
-- surcharges. Industry-standard but opaque to civilians — a reader
-- without points-and-miles background sees "high YQ on Lufthansa awards"
-- and has no idea what's being warned about. Plain "fuel surcharges"
-- conveys the same thing instantly.
--
-- 223 occurrences identified across program content + partner_redemptions
-- notes + a handful of alert/lib mentions. This migration replaces the
-- DB content; lib/awardCharts/*.ts code-side references are handled by
-- a separate PR.
--
-- Strategy: run targeted replacements first (drop redundant glosses like
-- "fuel surcharges (YQ)" → "fuel surcharges"), then word-boundary
-- replace remaining standalone YQ → "fuel surcharges". Word-boundary
-- regex (\mYQ\M) prevents accidental damage to airport codes like YYQ
-- (Churchill) or other YQ-prefixed codes.

-- ── Helper: replace pattern across a text column on a table ─────────────
-- Postgres doesn't support stored procs cleanly across migrations, so we
-- inline each table/column. Tables touched:
--   programs.intro / sweet_spots / lounge_access / quirks / award_chart /
--   marquee_pitch (text fields where editors would write narrative)
--   partner_redemptions.notes / routing_rules / availability_reality
--   alerts.summary / ai_summary

-- ── Phase 1: drop redundant parenthetical glosses ──────────────────────
-- Patterns like "fuel surcharges (YQ)" become just "fuel surcharges".

update programs set
  intro = replace(replace(coalesce(intro, ''), 'fuel surcharges (YQ)', 'fuel surcharges'), 'fuel surcharge (YQ)', 'fuel surcharge'),
  sweet_spots = replace(replace(coalesce(sweet_spots, ''), 'fuel surcharges (YQ)', 'fuel surcharges'), 'fuel surcharge (YQ)', 'fuel surcharge'),
  lounge_access = replace(replace(coalesce(lounge_access, ''), 'fuel surcharges (YQ)', 'fuel surcharges'), 'fuel surcharge (YQ)', 'fuel surcharge'),
  quirks = replace(replace(coalesce(quirks, ''), 'fuel surcharges (YQ)', 'fuel surcharges'), 'fuel surcharge (YQ)', 'fuel surcharge'),
  award_chart = replace(replace(coalesce(award_chart, ''), 'fuel surcharges (YQ)', 'fuel surcharges'), 'fuel surcharge (YQ)', 'fuel surcharge'),
  marquee_pitch = replace(replace(coalesce(marquee_pitch, ''), 'fuel surcharges (YQ)', 'fuel surcharges'), 'fuel surcharge (YQ)', 'fuel surcharge')
where intro like '%(YQ)%' or sweet_spots like '%(YQ)%' or lounge_access like '%(YQ)%'
   or quirks like '%(YQ)%' or award_chart like '%(YQ)%' or marquee_pitch like '%(YQ)%';

update partner_redemptions set
  notes = replace(replace(coalesce(notes, ''), 'fuel surcharges (YQ)', 'fuel surcharges'), 'fuel surcharge (YQ)', 'fuel surcharge'),
  routing_rules = replace(replace(coalesce(routing_rules, ''), 'fuel surcharges (YQ)', 'fuel surcharges'), 'fuel surcharge (YQ)', 'fuel surcharge'),
  availability_reality = replace(replace(coalesce(availability_reality, ''), 'fuel surcharges (YQ)', 'fuel surcharges'), 'fuel surcharge (YQ)', 'fuel surcharge')
where notes like '%(YQ)%' or routing_rules like '%(YQ)%' or availability_reality like '%(YQ)%';

update alerts set
  summary = replace(replace(coalesce(summary, ''), 'fuel surcharges (YQ)', 'fuel surcharges'), 'fuel surcharge (YQ)', 'fuel surcharge'),
  ai_summary = replace(replace(coalesce(ai_summary, ''), 'fuel surcharges (YQ)', 'fuel surcharges'), 'fuel surcharge (YQ)', 'fuel surcharge')
where summary like '%(YQ)%' or ai_summary like '%(YQ)%';

-- ── Phase 2: standalone YQ → fuel surcharges (word-boundary safe) ─────
-- regexp_replace with \mYQ\M only matches YQ as its own word. Safe vs
-- airport codes like YYQ. Default to plural "fuel surcharges" — reads
-- naturally in nearly every context ("high fuel surcharges", "zero
-- fuel surcharges", "pay fuel surcharges").

update programs set
  intro = regexp_replace(coalesce(intro, ''), '\mYQ\M', 'fuel surcharges', 'g'),
  sweet_spots = regexp_replace(coalesce(sweet_spots, ''), '\mYQ\M', 'fuel surcharges', 'g'),
  lounge_access = regexp_replace(coalesce(lounge_access, ''), '\mYQ\M', 'fuel surcharges', 'g'),
  quirks = regexp_replace(coalesce(quirks, ''), '\mYQ\M', 'fuel surcharges', 'g'),
  award_chart = regexp_replace(coalesce(award_chart, ''), '\mYQ\M', 'fuel surcharges', 'g'),
  marquee_pitch = regexp_replace(coalesce(marquee_pitch, ''), '\mYQ\M', 'fuel surcharges', 'g')
where intro ~ '\mYQ\M' or sweet_spots ~ '\mYQ\M' or lounge_access ~ '\mYQ\M'
   or quirks ~ '\mYQ\M' or award_chart ~ '\mYQ\M' or marquee_pitch ~ '\mYQ\M';

update partner_redemptions set
  notes = regexp_replace(coalesce(notes, ''), '\mYQ\M', 'fuel surcharges', 'g'),
  routing_rules = regexp_replace(coalesce(routing_rules, ''), '\mYQ\M', 'fuel surcharges', 'g'),
  availability_reality = regexp_replace(coalesce(availability_reality, ''), '\mYQ\M', 'fuel surcharges', 'g')
where notes ~ '\mYQ\M' or routing_rules ~ '\mYQ\M' or availability_reality ~ '\mYQ\M';

update alerts set
  summary = regexp_replace(coalesce(summary, ''), '\mYQ\M', 'fuel surcharges', 'g'),
  ai_summary = regexp_replace(coalesce(ai_summary, ''), '\mYQ\M', 'fuel surcharges', 'g')
where summary ~ '\mYQ\M' or ai_summary ~ '\mYQ\M';

-- ── Verification queries (run after migration) ─────────────────────────
-- 1. Should return 0 — confirms no standalone YQ remains in content:
--      select count(*) from programs
--      where intro ~ '\mYQ\M' or sweet_spots ~ '\mYQ\M'
--         or lounge_access ~ '\mYQ\M' or quirks ~ '\mYQ\M'
--         or award_chart ~ '\mYQ\M' or marquee_pitch ~ '\mYQ\M';
--
-- 2. Should return 0 — confirms no parenthetical "(YQ)" residue:
--      select count(*) from programs
--      where intro like '%(YQ)%' or quirks like '%(YQ)%'
--         or sweet_spots like '%(YQ)%';
--
-- 3. Sample updated content — should see "fuel surcharges" in context:
--      select slug, quirks from programs
--      where quirks ilike '%fuel surcharge%' limit 5;
