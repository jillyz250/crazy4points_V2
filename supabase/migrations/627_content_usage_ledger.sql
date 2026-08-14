-- content_usage — a running ledger of every story we've published in a channel,
-- so we don't repeat ourselves. One row per (story, channel, time). The newsletter
-- builder reads it to avoid reusing a recent headline / Jill's Take; the newsletter
-- send + social-post flows write to it going forward. Backfilled from past
-- newsletters (big_story_ref_id, sweet_spot_ref_id) and "Social post:" reminders.

create table if not exists content_usage (
  id          uuid primary key default gen_random_uuid(),
  -- where the story was used
  channel     text not null check (channel in (
    'newsletter_headline', 'jills_take', 'sweet_spot', 'also_happening', 'social'
  )),
  -- the story it points at (alert/topic when we have an id; slug/title always kept
  -- for readability + dedup even when the ref_id is unknown, e.g. old social posts)
  ref_type    text check (ref_type in ('alert', 'intel')),
  ref_id      uuid,
  ref_slug    text,
  title       text,
  -- when it went out, and a pointer back to the issue/post that used it
  used_at     timestamptz not null default now(),
  source_ref  text,        -- newsletter week_of, reminder id, etc.
  created_at  timestamptz not null default now()
);

create index if not exists content_usage_channel_used_idx on content_usage (channel, used_at desc);
create index if not exists content_usage_ref_id_idx on content_usage (ref_id);
create index if not exists content_usage_ref_slug_idx on content_usage (ref_slug);

-- Idempotency: don't log the same story to the same channel from the same source twice.
create unique index if not exists content_usage_dedup_idx
  on content_usage (channel, coalesce(ref_id::text, ref_slug, title), coalesce(source_ref, ''));

-- Tag a Jill's Take with the alert it's about, so we can track + avoid repeating it.
alter table newsletters add column if not exists jills_take_ref_id uuid;
