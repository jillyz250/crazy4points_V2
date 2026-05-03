-- 079_scrub_emdashes_unicode_safe.sql
-- Migration 078 tried to scrub the mangled em-dash sequence (the visual bytes
-- "auni" / "‚Äî") from partner_redemptions, but the search pattern itself was
-- mangled by the Supabase SQL editor when the migration was pasted, so the
-- LIKE clauses matched zero rows.
--
-- Fix: use PostgreSQL Unicode-escape literals (U&'\xxxx') for the search +
-- replace pattern. Those are pure ASCII in the SQL source so the editor can't
-- mangle them. The codepoints below describe what the mangled em-dash
-- actually looks like in the rows:
--   U+201A = single low-9 quotation mark (the "comma below" character)
--   U+00C4 = capital A with diaeresis (Ä)
--   U+00EE = small i with circumflex (î)
-- Together they spell "‚Äî" — the visible mangled em-dash.

update partner_redemptions
   set teach_caption = replace(teach_caption, U&'\201A\00C4\00EE', ' - ')
 where teach_caption like '%' || U&'\201A\00C4\00EE' || '%';

update partner_redemptions
   set routing_rules = replace(routing_rules, U&'\201A\00C4\00EE', ' - ')
 where routing_rules like '%' || U&'\201A\00C4\00EE' || '%';

update partner_redemptions
   set region_or_route = replace(region_or_route, U&'\201A\00C4\00EE', ' - ')
 where region_or_route like '%' || U&'\201A\00C4\00EE' || '%';

update partner_redemptions
   set notes = replace(notes, U&'\201A\00C4\00EE', ' - ')
 where notes like '%' || U&'\201A\00C4\00EE' || '%';

update partner_redemptions
   set non_saver_fallback = replace(non_saver_fallback, U&'\201A\00C4\00EE', ' - ')
 where non_saver_fallback like '%' || U&'\201A\00C4\00EE' || '%';

-- Also scrub the mangled "smart quotes" if any leaked in.
-- Right single (’) mangled = U+00C3 + U+00A2 + U+00C2 + U+0099 — too varied.
-- Apostrophes mostly came through fine because we used '' in SQL strings.
-- Skip unless we see specific issues.
