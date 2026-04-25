-- Adds two more public-page editorial fields to programs:
--
--   how_to_spend  — short markdown bullet list: redemption types
--                   (award flights, upgrades, hotels, etc.) Cheap content,
--                   high reader value.
--
--   tier_benefits — JSONB array of {name, qualification, benefits[]}.
--                   Renders as a structured table on the public page.
--                   Also unlocks the future "Tier Benefits Comparison"
--                   cross-program tool — design data once, ship UI later
--                   when 5+ programs have tier data.
--
-- Both are public-facing — same brand-voice rules and freshness pill apply.
-- Setting either bumps content_updated_at via the existing app-side logic.

alter table programs
  add column if not exists how_to_spend  text,
  add column if not exists tier_benefits jsonb;

comment on column programs.how_to_spend is
  'Public-facing markdown bullets describing redemption types (award flights, upgrades, hotels, etc.). High reader value, low maintenance.';
comment on column programs.tier_benefits is
  'Array of {name, qualification, benefits[]} per elite tier. Powers the public tier table and the future cross-program tier-comparison tool.';
