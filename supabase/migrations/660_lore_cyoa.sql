-- 660_lore_cyoa.sql — choose-your-own-adventure office lore (Jill, 2026-09-03).
-- Extends org_lore so each character has a daily beat + a 2-choice decision that
-- Jill picks; the pick drives the next day's beat. One decision per character/day.
-- The full arc + every choice lives on the character's page.
--
-- TONE: PG-17, spicy but tasteful — a real office (love, breakups, marriage, kids,
-- sports, gossip, happy + sad). Fade-to-black on anything explicit.
-- ⛔ FIREWALL: lore + morale NEVER affect the WORK (quality/priority/accuracy) and
-- NEVER appear in customer-facing content. Flavor only.

alter table public.org_lore
  add column if not exists character_slug text,   -- whose storyline this beat belongs to (employees.slug); null = shared/company-wide beat
  add column if not exists choice_a       text,   -- option A for where the story goes next
  add column if not exists choice_b       text,   -- option B
  add column if not exists chosen         text     -- 'a' | 'b' | null (Jill's pick that sets tomorrow's beat)
    check (chosen in ('a','b'));

-- a character's arc, newest first
create index if not exists org_lore_character_date_idx
  on public.org_lore (character_slug, lore_date desc);
