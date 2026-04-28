-- Hotel program directory cleanup + 7 new additions.
-- Verified against Copilot 2026-04-29.
--
-- Slug convention for programs.* uses underscores (matches existing rows
-- like best_western, leading_hotels, shangri_la).
--
-- Minimum-viable rows: slug + name + type + is_active. Editorial content
-- (intro, transfer_partners, sweet_spots, etc.) gets filled later via the
-- 11-step add-program workflow. last_verified intentionally NULL so each
-- new row shows up in /admin/refresh-queue as "needs first verification".

-- ── 1. Add 7 missing hotel loyalty programs ──────────────────────────────

insert into programs (slug, name, type, is_active) values
  ('radisson_americas',    'Radisson Rewards Americas',  'hotel', true),
  ('mgm',                  'MGM Rewards',                'hotel', true),
  ('caesars',              'Caesars Rewards',            'hotel', true),
  ('gha_discovery',        'GHA Discovery',              'hotel', true),
  ('langham',              'Langham Club 1865',          'hotel', true),
  ('stash',                'Stash Hotel Rewards',        'hotel', true),
  ('disney_vacation_club', 'Disney Vacation Club',       'hotel', true)
on conflict (slug) do nothing;

-- ── 2. Rename Shangri-La (program rebrand 2024) ──────────────────────────
-- Was "Shangri-La Golden Circle". The program was officially renamed to
-- "Shangri-La Circle" in 2024 alongside a major program restructure.

update programs
set name = 'Shangri-La Circle'
where slug = 'shangri_la';

-- ── 3. Deactivate bahia_principe + slh (consolidated under Hyatt) ────────
-- Both are part of World of Hyatt's loyalty footprint:
--   - Bahia Principe → Hyatt's Inclusive Collection (post-ALG acquisition)
--   - Small Luxury Hotels (SLH) → Hyatt partnership (2024); SLH stays now
--     redeemable with World of Hyatt points
-- Setting is_active=false preserves historical references (any alerts
-- already tagged to these slugs keep working) while hiding them from
-- admin lists, the refresh queue, and the public directory. If we ever
-- want to fully consolidate, that's a separate migration that re-tags
-- referenced alerts and deletes the rows.

update programs
set is_active = false,
    notes = coalesce(notes || E'\n\n', '') ||
            'Deactivated 2026-04-29: this brand''s loyalty currency lives under World of Hyatt now. Bahia Principe → Hyatt Inclusive Collection (post-ALG); SLH → Hyatt partnership (2024). Alerts about these properties should tag the hyatt program slug.'
where slug in ('bahia_principe', 'slh');

-- ── 4. Recategorize Expedia One Key as OTA ───────────────────────────────
-- Expedia One Key spans hotels, flights, car rentals, and packages — it's
-- an OTA loyalty program, not a hotel program.

update programs
set type = 'ota'
where slug = 'expedia_one_key';
