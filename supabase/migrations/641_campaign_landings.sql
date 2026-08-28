-- Reusable ad-campaign landing pages. Each row renders a conversion-focused page
-- at /go/[slug]: a single offer (usually a Marriott/points experience), a deadline
-- for urgency, a prominent newsletter capture, and an outbound CTA to the real
-- offer. Built so the NEXT experience ad is one row + one UTM URL, not a rebuild.
-- Ad landings are noindex; the signup tags subscribers via source='campaign_landing'
-- plus referrerPath (=/go/<slug>) for per-campaign attribution.

CREATE TABLE IF NOT EXISTS campaign_landings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,           -- URL segment: /go/<slug>
  eyebrow       text,                            -- small label, e.g. "College Football"
  headline      text NOT NULL,
  subhead       text,
  body_md       text,                            -- "what's included" / details (plain lines)
  image_url     text,
  deadline      timestamptz,                     -- offer/auction close (drives urgency)
  deadline_label text,                           -- e.g. "Bidding closes September 18"
  outbound_url  text NOT NULL,                   -- where the CTA sends them (Marriott auction)
  outbound_label text NOT NULL DEFAULT 'See the full offer',
  utm_campaign  text,                            -- for reference / matching ad UTMs
  experience_id uuid REFERENCES experience_listings(id) ON DELETE SET NULL,
  active        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaign_landings_slug_active_idx
  ON campaign_landings (slug) WHERE active = true;
