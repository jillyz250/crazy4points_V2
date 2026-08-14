-- 623 — "Changes, Cancellations & Delays" program-page section.
-- New content dimension flagged 2026-08-14: airline pages cover earn + book
-- but go silent on what happens when plans change (how to change/cancel an
-- award, fees, involuntary-delay waivers, phone numbers). Piloted on Flying
-- Blue, rolls out across airline pages via the add-airline pipeline.
--
-- Markdown prose, rendered as its own tile (see components/programs/
-- SimpleTileGrid.tsx). NULL = section hidden.

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS changes_policy text;

COMMENT ON COLUMN programs.changes_policy IS
  'Markdown: how to change/cancel an award booking, fees, delay/involuntary rules, phone numbers. Rendered as the "Changes, Cancellations & Delays" tile.';
