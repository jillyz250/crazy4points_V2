-- Branded short links: crazy4points.com/s/<slug> -> 302 -> a full (UTM-tagged) URL.
-- Social posts get a tiny clean link; the redirect target keeps the UTMs, so GA
-- still attributes the traffic correctly. Reusable for every post/campaign.

CREATE TABLE IF NOT EXISTS short_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,          -- the short code, e.g. "nd-cfb"
  target_url  text NOT NULL,                  -- full destination (with UTMs)
  label       text,                            -- human note, e.g. "ND vs UNC FB post"
  clicks      integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Atomic click counter (called fire-and-forget from the redirect route).
CREATE OR REPLACE FUNCTION bump_short_link(p_slug text)
RETURNS void LANGUAGE sql AS $$
  UPDATE short_links SET clicks = clicks + 1 WHERE slug = p_slug;
$$;
