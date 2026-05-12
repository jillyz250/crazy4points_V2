-- 243_fix_mojibake_teach_captions.sql
-- Fix Unicode mojibake in teach_captions from migration 242.
-- Per memory feedback_ascii_only_in_sql_data.md: never paste × or — into
-- Supabase SQL editor — they get mangled to "√ó" and "‚Äî". Replace with
-- ASCII alternatives.
--
-- Also tighten the Cathay row label that said "East Coast" — was over-
-- specific for a partner row that serves any us-japan origin.
--
-- Authored: 2026-05-12

begin;

-- Replace mojibake sequences in teach_caption + region_or_route + notes
update partner_redemptions
set teach_caption = replace(replace(coalesce(teach_caption, ''),
      '√ó', 'x'),
      '‚Äî', ' - ')
where teach_caption is not null
  and (teach_caption like '%√ó%' or teach_caption like '%‚Äî%');

update partner_redemptions
set notes = replace(replace(coalesce(notes, ''),
      '√ó', 'x'),
      '‚Äî', ' - ')
where notes is not null
  and (notes like '%√ó%' or notes like '%‚Äî%');

-- Rename the Atmos × Cathay row label — was over-specific to East Coast,
-- but the row applies to any us-japan origin (we test LAX → NRT and it
-- surfaces). Generic phrasing.
update partner_redemptions
set region_or_route = 'US to Asia via Cathay (Japan / Korea routes)'
where region_or_route = 'US East Coast to Asia via Cathay (Japan / Korea)'
  and currency_program_id = (select id from programs where slug = 'atmos')
  and operating_carrier_id = (select id from programs where slug = 'cathay');

commit;
