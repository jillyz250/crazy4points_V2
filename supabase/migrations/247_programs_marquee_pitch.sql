-- 247_programs_marquee_pitch.sql
-- Add a one-sentence "why this one" pitch for the marquee redemption.
--
-- Migration 246 added programs.marquee_redemption_id so the curator can
-- pin a famous redemption per program. But "Editor's pick" as a badge
-- alone is decoration — it needs a sentence explaining WHY this is the
-- crown jewel of the program (cash equivalent, sweet-spot math,
-- the-thing-everyone-chases factor).
--
-- This column holds that sentence. Surfaced in TransferBonusCard's
-- marquee variant directly under the route. Plain text (no markdown).
--
-- Authored: 2026-05-12

begin;

alter table programs
  add column if not exists marquee_pitch text;

comment on column programs.marquee_pitch is
  'One-sentence "why this is the famous one" pitch for marquee_redemption_id. '
  'Surfaced under the route on the Editor''s pick card in Should I Transfer. '
  'Cash equivalent, sweet-spot context, or the-thing-everyone-chases factor. '
  'Plain text, no markdown. NULL when marquee_redemption_id is also NULL.';

commit;
