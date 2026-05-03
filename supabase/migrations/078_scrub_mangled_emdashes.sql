-- 078_scrub_mangled_emdashes.sql
-- Migrations 076 + 077 used em-dashes (—) in teach_captions and routing_rules.
-- The Supabase SQL-editor paste pipeline mangled them to the literal three
-- bytes ‚Äî (UTF-8 em-dash interpreted as Latin-1 then re-encoded). This
-- shows up as funny letters on the public page.
--
-- Per the project ASCII-only-in-SQL-data convention: replace every mangled
-- sequence with a plain space-hyphen-space (" - ") in any text column the
-- public render touches.

update partner_redemptions
   set teach_caption = replace(teach_caption, '‚Äî', ' - ')
 where teach_caption ilike '%‚Äî%';

update partner_redemptions
   set routing_rules = replace(routing_rules, '‚Äî', ' - ')
 where routing_rules ilike '%‚Äî%';

update partner_redemptions
   set region_or_route = replace(region_or_route, '‚Äî', ' - ')
 where region_or_route ilike '%‚Äî%';

update partner_redemptions
   set notes = replace(notes, '‚Äî', ' - ')
 where notes ilike '%‚Äî%';

update partner_redemptions
   set non_saver_fallback = replace(non_saver_fallback, '‚Äî', ' - ')
 where non_saver_fallback ilike '%‚Äî%';

-- Plain-language fixes for industry jargon ("chaining") that doesn't read for
-- non-pros. Cathay multi-carrier rows authored in 071 used "chaining."
update partner_redemptions
   set teach_caption = 'Most useful when you''re combining multiple airlines on one award ticket. For a simple AA flight, Atmos or BA Avios usually beats it.'
 where teach_caption ilike '%chaining multiple carriers%';

update partner_redemptions
   set teach_caption = 'Rarely the right call for a simple AA domestic. Best when your trip stitches multiple oneworld carriers together.'
 where teach_caption ilike '%simple AA domestic. Shines on multi-carrier routings%';

update partner_redemptions
   set routing_rules = 'Multi-carrier itineraries (e.g., AA + Cathay + Qatar on one ticket) are supported, including stopovers.'
 where routing_rules ilike '%Multi-carrier itineraries supported with stopovers%';

update partner_redemptions
   set routing_rules = 'Multi-carrier itineraries are supported.'
 where routing_rules ilike '%Multi-carrier itineraries supported.%';

update partner_redemptions
   set routing_rules = 'Multi-carrier oneworld itineraries are supported, including stopovers.'
 where routing_rules ilike '%Multi-carrier oneworld redemptions allowed; stopovers permitted%';
