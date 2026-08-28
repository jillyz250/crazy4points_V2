-- The campaign creative LIBRARY, made browsable in the admin. Each row is one ad
-- creative (usually an AI image) with the EXACT prompt that made it, so the next
-- similar experience is a color/team swap, not a rebuild. Colors adapt to the
-- event's team palette (brand-safe — colors aren't trademarks, only logos are);
-- we never use real team logos. Mirrors plans/campaign-creative-library.md.

CREATE TABLE IF NOT EXISTS campaign_creatives (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,                 -- "VIP College Football — ND vs UNC"
  event         text,                           -- "Notre Dame vs North Carolina, Oct 3"
  category      text,                           -- college-football / concert / suite ...
  color_scheme  text,                           -- "Royal Glow purple + gold" / "ND navy + gold"
  prompt        text,                           -- the exact Copilot image prompt (reusable)
  image_url     text NOT NULL,                  -- /campaigns/<file>.jpg or hosted URL
  used_on       text,                           -- where it shipped, e.g. /go/nd-unc-marriott-moment
  source        text NOT NULL DEFAULT 'copilot',-- copilot | build_graphic
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_creatives_created_idx
  ON campaign_creatives (created_at DESC);
