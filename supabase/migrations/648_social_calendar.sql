-- Social content calendar (Jill, 2026-09-01). Plan-to-posted board so she stops
-- inventing each day's post. One row per platform-post (FB/IG/TikTok need different
-- copy). Fed by: recurring anchors (Bilt Rent Day, Chase/Discover quarterly),
-- manual planning, and later event signals (alerts/sweeps/experiences/articles).
-- Reviewed with Copilot 2026-09-01. Stage 1 = recurring + manual; gap/cadence +
-- ingest + analytics come later.
CREATE TABLE IF NOT EXISTS social_calendar (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_date    date NOT NULL,
  platform     text NOT NULL CHECK (platform IN ('facebook','instagram','tiktok')),
  topic        text NOT NULL,                 -- human-readable; NOT a key
  source_type  text NOT NULL DEFAULT 'manual' -- recurring | manual (later: alert|sweepstakes|experience|article)
                 CHECK (source_type IN ('recurring','manual','alert','sweepstakes','experience','article')),
  source_ref   text,                          -- anchor key for recurring; content id/url otherwise
  status       text NOT NULL DEFAULT 'suggested'
                 CHECK (status IN ('suggested','planned','drafted','posted','skipped')),
  draft_body   text,
  graphic_path text,
  link_url     text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  posted_at    timestamptz
);

-- Idempotent generation: no duplicate slot for the same source on the same
-- date+platform. Manual rows (source_ref NULL) are exempt, so Jill can add several
-- manual posts to one day/platform.
CREATE UNIQUE INDEX IF NOT EXISTS social_calendar_dedupe
  ON social_calendar (post_date, platform, source_type, source_ref)
  WHERE source_ref IS NOT NULL;

CREATE INDEX IF NOT EXISTS social_calendar_date_idx ON social_calendar (post_date);
CREATE INDEX IF NOT EXISTS social_calendar_status_idx ON social_calendar (status);
