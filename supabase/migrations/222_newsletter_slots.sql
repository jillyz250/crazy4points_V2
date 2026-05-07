-- Newsletter redesign — slot-based shape (Phase N1+N2+N3 ship together)
-- See plans/handoff-2026-05-07-newsletter.md
--
-- Adds slot fields alongside existing newsletter columns. Old drafts (status='sent')
-- keep their existing draft_json blob; new drafts populate the slots below.
-- The new admin editor + email renderer read these fields directly.

alter table newsletters
  add column if not exists jill_prompt text,
  add column if not exists big_story_ref_type text check (big_story_ref_type in ('alert', 'intel')),
  add column if not exists big_story_ref_id uuid,
  add column if not exists big_story_html text,
  add column if not exists also_happening jsonb default '[]'::jsonb,
  add column if not exists jills_take_html text,
  add column if not exists game_slug text,
  add column if not exists game_title text,
  add column if not exists game_clue_text text,
  add column if not exists hero_kicker text;

comment on column newsletters.jill_prompt is
  'Optional admin scratchpad for steering Jill''s Take. Empty = generator picks topic from week''s intel.';
comment on column newsletters.big_story_ref_type is
  'Source of big story: alert (published alert) or intel (raw intel that did not get promoted).';
comment on column newsletters.big_story_html is
  'Plain HTML for The Big Story body. Generated from the referenced alert/intel + Jill voice.';
comment on column newsletters.also_happening is
  'JSONB array of {category, headline, blurb, link_url, alert_id?}. Free-text category. Order matters.';
comment on column newsletters.jills_take_html is
  'Plain HTML for Jill''s Take. Italic block at bottom of newsletter.';
comment on column newsletters.game_slug is
  'Slug of this week''s game (rotation pool). Hides the game card if null.';
comment on column newsletters.game_title is
  'Display title for the game card, e.g. "Middle Seat — new this week".';
comment on column newsletters.game_clue_text is
  'Optional teaser/clue text for the game card. Empty = card uses default copy.';
comment on column newsletters.hero_kicker is
  'Optional eyebrow text above the week-of stamp in the hero. Defaults to nothing.';
