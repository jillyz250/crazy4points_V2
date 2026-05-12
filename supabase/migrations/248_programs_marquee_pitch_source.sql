-- 248_programs_marquee_pitch_source.sql
-- Source-required gate on marquee_pitch.
--
-- Migration 247 added marquee_pitch (one-sentence narrative under the
-- Editor's pick card). That column had no enforcement — pitches could
-- be authored from memory, with no traceable source for any numeric
-- claim. That's exactly the failure mode the writer prompt's
-- "NO MATH UNLESS 100% VERIFIED" rule was meant to prevent, but the
-- rule only constrained the AI writer pipeline — not direct curator
-- writes to programs.marquee_pitch.
--
-- This column adds a hard gate: marquee_pitch only renders on the
-- Should I Transfer card when BOTH marquee_pitch AND
-- marquee_pitch_source_url are non-null. If the curator can't cite a
-- URL backing the pitch's claims, the card falls back to plain
-- "Editor's pick" with no narrative — better silent than fabricated.
--
-- Source URL points to the official program page (award chart, fare
-- finder, partner roster) that backs the cited numbers. Blog posts
-- and aggregators do NOT count — has to be the source of truth.
--
-- Authored: 2026-05-12

begin;

alter table programs
  add column if not exists marquee_pitch_source_url text;

comment on column programs.marquee_pitch_source_url is
  'Official source URL backing the marquee_pitch claims (award chart, fare '
  'finder, partner page). Required for marquee_pitch to render — if NULL, '
  'the Should I Transfer card falls back to plain "Editor''s pick" with no '
  'narrative. Blog posts / aggregators do not count — must be the program''s '
  'own page or a primary booking surface.';

commit;
