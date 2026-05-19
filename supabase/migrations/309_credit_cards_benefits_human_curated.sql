-- Mark cards whose benefits were hand-curated (Claude/Copilot editorial work)
-- vs auto-extracted via Firecrawl+Sonnet. Auto-extraction risks downgrading
-- hand-curated content when re-extracting because the save path is
-- delete-then-insert.
--
-- Triggered by 2026-05-19 Hyatt Business regression: 16 hand-curated benefits
-- were overwritten by 7 stub benefits when re-extracting against the same
-- Chase URL three weeks later. Chase's JS accordions for travel/purchase
-- coverage weren't expanded by Firecrawl this time, dropping insurance and
-- protection benefits. The hand-curated content was richer than even a
-- perfect re-extraction would produce.
--
-- Policy (enforced via this column + admin UI banner in a follow-up PR):
--   - benefits_human_curated = true  → admin extract page shows warning,
--     re-extraction discouraged. Per-field manual edits preferred.
--   - benefits_human_curated = false → auto-extraction safe; re-runs OK.
--
-- For semi-annual deep refreshes (~every 6 months) on curated cards, the
-- right pattern is:
--   1. Manual paste of accordion-expanded markdown into the Manual Markdown
--      box on the extract page, OR
--   2. Per-field updates against the issuer URL.
-- Never plain Re-extract on a curated card.

alter table credit_cards
  add column if not exists benefits_human_curated boolean not null default false;

comment on column credit_cards.benefits_human_curated is
  'When true, this card''s benefit rows were hand-authored by an editor (Claude/Copilot assist) rather than auto-extracted via Firecrawl+Sonnet. The admin extract page shows a warning before re-extraction; per-field edits are preferred to preserve editorial polish. Set true once an editor has curated the benefits; flip back to false only if intentionally moving the card to auto-managed.';

-- Backfill: assume any card with benefits whose verified_at is older than
-- today's session (May 19) is hand-curated. New extractions from today
-- onward will leave the flag false unless explicitly set. Conservative — if
-- in doubt, mark curated.
update credit_cards c
   set benefits_human_curated = true
 where exists (
   select 1 from credit_card_benefits b
   where b.card_id = c.id
     and b.verified_at < '2026-05-19'
 );

-- Note: per-card overrides go via /admin/cards/<slug>/edit
-- (toggle pending — UI banner ships in a follow-up PR).
