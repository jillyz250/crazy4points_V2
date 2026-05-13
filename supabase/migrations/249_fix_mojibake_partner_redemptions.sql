-- 249_fix_mojibake_partner_redemptions.sql
-- Clean remaining mojibake in partner_redemptions text fields.
--
-- Migration 243 fixed teach_caption but missed rows and did not cover
-- what_breaks_this or notes. Don't Sleep was rendering these as
-- ",Äî" / "√ó" / ",ö†" instead of em-dash / × / ⚠.
--
-- Patterns:
--   ,Äî  → em-dash mojibake      → " - " (ASCII-safe per project rule)
--   ,Äì  → en-dash mojibake      → "-"
--   ,Äú  → opening curly quote   → '"'
--   ,Äù  → closing curly quote   → '"'
--   ,Äô  → curly apostrophe      → "'"
--   ,Ä¶  → ellipsis              → "..."
--   √ó   → multiplication sign   → "x"
--   ,ö†  → warning sign          → "WARNING:"
--
-- Per project rule (feedback_ascii_only_in_sql_data): no em-dashes,
-- smart quotes, or other non-ASCII glyphs in user-facing string data —
-- they get re-mangled by the Supabase paste pipeline. Replace with
-- ASCII equivalents rather than restore the original glyphs.
--
-- Authored: 2026-05-13

begin;

update partner_redemptions
set
  teach_caption     = replace(replace(replace(replace(replace(replace(replace(replace(coalesce(teach_caption,     ''), ',Äî', ' - '), ',Äì', '-'), ',Äú', '"'), ',Äù', '"'), ',Äô', ''''), ',Ä¶', '...'), '√ó', 'x'), ',ö†', 'WARNING:'),
  what_breaks_this  = replace(replace(replace(replace(replace(replace(replace(replace(coalesce(what_breaks_this,  ''), ',Äî', ' - '), ',Äì', '-'), ',Äú', '"'), ',Äù', '"'), ',Äô', ''''), ',Ä¶', '...'), '√ó', 'x'), ',ö†', 'WARNING:'),
  notes             = replace(replace(replace(replace(replace(replace(replace(replace(coalesce(notes,             ''), ',Äî', ' - '), ',Äì', '-'), ',Äú', '"'), ',Äù', '"'), ',Äô', ''''), ',Ä¶', '...'), '√ó', 'x'), ',ö†', 'WARNING:')
where
  teach_caption    like '%,Ä%' or what_breaks_this like '%,Ä%' or notes like '%,Ä%'
  or teach_caption like '%√ó%' or what_breaks_this like '%√ó%' or notes like '%√ó%';

-- Restore nulls where the coalesce above wrote empty strings
update partner_redemptions set teach_caption = null where teach_caption = '';
update partner_redemptions set what_breaks_this = null where what_breaks_this = '';
update partner_redemptions set notes = null where notes = '';

commit;
