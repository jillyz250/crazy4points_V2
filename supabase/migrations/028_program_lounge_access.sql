-- Phase A of lounge treatment: per-airline `lounge_access` markdown field.
--
-- Free-form summary covering own-brand lounges, alliance/partner access,
-- eligibility (cabin class + status tier + paid pass), notable flagships,
-- and rough membership/day-pass pricing. ~4-6 paragraphs/bullets.
--
-- Phase B (gated on 5+ airlines having this populated) ships a
-- standalone `lounges` table + /lounges directory + Tools dropdown entry.
-- See: project_lounge_finder_trigger memory.
--
-- Not adding lounge structure here — keeping Phase A as just a markdown
-- summary. Don't conflate the two products.

alter table programs
  add column if not exists lounge_access text;

comment on column programs.lounge_access is
  'Public-facing markdown summary of lounge access — own-brand lounges, alliance access, eligibility by class/tier, paid options, flagship callouts. Phase A of lounge treatment. Phase B will be a separate /lounges directory.';
