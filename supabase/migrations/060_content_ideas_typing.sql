-- Phase 7a — content typing + topic tagging.
--
-- Capture two orthogonal axes per idea:
--   * content_type — what KIND of post (sweet_spot, destination_play, etc.).
--     Plain text + TS-side allowlist; no Postgres enum so adding new types
--     in code requires NO migration.
--   * topics — array of subject tags (baseball, marathons, hiking, etc.).
--     Grows organically; GIN-indexed for fast filtering.
--
-- For destination_play ideas: activity_frame chooses which sub-frame the
-- writer prompt swaps in (race, ski, college, theme_park, ...).
--
-- cash_rate_reference is an OPTIONAL editor-supplied baseline cash rate
-- ("$480/night for these dates"). Only used by the sweet_spot writer when
-- present and verified — otherwise the writer phrases value comparatively.
--
-- All nullable, additive. No constraints — validation happens in TS at the
-- write-time so future types/frames/topics never need a schema change.

alter table content_ideas
  add column if not exists content_type text,
  add column if not exists activity_frame text,
  add column if not exists topics text[] default '{}'::text[],
  add column if not exists cash_rate_reference text;

create index if not exists content_ideas_content_type_idx on content_ideas (content_type);
create index if not exists content_ideas_activity_frame_idx on content_ideas (activity_frame);
create index if not exists content_ideas_topics_idx on content_ideas using gin (topics);
