-- 253_program_stack_note_override.sql
-- Adds programs.stack_note_override for the "Live now" hero on
-- /programs/[slug].
--
-- When a program has BOTH an active transfer_bonus alert AND active
-- published promo_rewards, the page auto-renders a "stack" callout
-- showing how the two combine ("transfer bonus + promo discount =
-- pay ~60% of the standard rate"). The math is auto-computed from
-- the available data.
--
-- This column lets the curator override the auto-generated copy with
-- editorial voice when the auto-text misses nuance. NULL = use the
-- auto-generated version. Plain text, ASCII-only per project rule.
--
-- Authored: 2026-05-13

begin;

alter table programs
  add column if not exists stack_note_override text;

comment on column programs.stack_note_override is
  'Curator-authored override for the auto-generated stack callout '
  'on /programs/[slug] Live Now hero. When set, replaces the auto '
  'text. NULL = use auto-generated version. Plain text only.';

commit;
