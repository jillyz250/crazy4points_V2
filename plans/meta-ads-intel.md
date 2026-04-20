# Social Ads Intel — Meta Ad Library via Apify

**Status:** Planned, not built. Next phase after email ingestion (Phase 6) ships.
**Created:** 2026-04-20

## Problem

Traditional RSS/blog scraping misses paid social ads. Programs push major
offers (bonus points, card signup boosts, limited promos) through Facebook +
Instagram ads that never appear on:

- Official program blogs / press pages
- Trusted travel blogs (unless a blogger happens to spot + write it up)
- Reddit
- Google Alerts (which are paused anyway — Phase 6)

Example that motivated this plan: Jill saw Alaska Airlines + Bilt ads on
Facebook with offers she had never seen anywhere else in our pipeline.

## Why not the official Meta Ad Library API

Meta's public Ad Library API (`graph.facebook.com/v19.0/ads_archive`) only
returns political and social-issue ads outside the EU. Commercial ads from
Alaska, Bilt, Chase, etc. are visible in the web UI for transparency but
are **not** accessible programmatically. This was verified 2026-04-20.

## Chosen approach: Apify Meta Ad Library Scraper

Apify maintains a purpose-built actor that scrapes the public Ad Library
web UI. Structured JSON output, maintained against Meta's DOM changes.

- **Pricing:** ~$5 per 1000 ad results
- **Free tier:** $5/month credit → ~1000 ads/month
- **Our estimated need:** ~30 brands × daily check × ~1-3 new ads per brand
  on an active day ≈ under 1000/month. Free tier likely sufficient.
- **API:** straightforward REST — `POST /v2/acts/<actor-id>/runs` with
  `{ "startUrls": [...], "maxResults": N }`.

## Watchlist (initial ~30 brands)

Seeded from our existing `programs` table. Need to resolve each brand's
Facebook Page ID before first run (one-time manual step).

**Airlines:** Alaska, American, Delta, United, Southwest, JetBlue, Air
Canada (Aeroplan), British Airways, Virgin Atlantic, Air France/KLM,
Lufthansa, Emirates, Qatar

**Hotels:** Hilton, Marriott, Hyatt, IHG, Wyndham, Choice, Accor

**Cards:** Chase Sapphire, Amex Platinum, Amex Gold, Capital One Venture,
Citi AAdvantage, Bilt

**Programs/aggregators:** The Points Guy (they advertise CC offers),
Upgraded Points, NerdWallet Travel

## Schema changes

### `sources` table
Add new rows with `type='social_ad'`:
```sql
INSERT INTO sources (name, url, type, tier, is_active, scrape_frequency, notes)
VALUES
  ('Alaska Airlines — Meta Ads', 'apify://meta-ads/alaska',
   'social_ad', 1, true, 'daily', 'FB Page ID: <TBD>'),
  -- ... 30 rows
```

Consider whether `type='social_ad'` needs to be added to any enums in
`utils/supabase/queries.ts` — check before migration.

### `intel_items` table
Add columns:
```sql
ALTER TABLE intel_items
  ADD COLUMN ad_creative_url TEXT,      -- image or video URL from the ad
  ADD COLUMN ad_landing_url TEXT,       -- where the CTA goes
  ADD COLUMN ad_run_start DATE,         -- when the ad started running
  ADD COLUMN ad_platforms TEXT[];       -- ['facebook', 'instagram']
```

## Scout integration

New module: `utils/intel/apifyMetaAds.ts`

```typescript
export async function fetchMetaAds(source: Source): Promise<RawAdResult[]>
```

- Input: a `sources` row with `type='social_ad'`
- Output: array of raw ad results from Apify
- Called from `runScout` for any source where `type='social_ad'`
- Dedup on `ad_creative_id` hash to avoid re-ingesting the same ad daily

Haiku prompt addition: new extraction pattern for ad copy. Ads are short
(~50-150 chars) and structured — usually "[offer] + [program] + [CTA]" —
so Haiku's `summarizeAlert` prompt needs a `ad_copy_mode` branch that:

- Treats the ad text as authoritative
- Extracts: offer_value (points/cashback/miles), program, bonus_type
  (signup/promo/referral), end_date if stated, minimum_spend if stated
- Sets `confidence='high'` only if the ad has a concrete number + program;
  otherwise `medium`

## Admin + brief surfacing

Brief sections get a new "📱 From the Feed" card cluster showing:
- Thumbnail of the ad creative (inline `<img>` in email)
- Ad copy + brand
- Why it matters (Haiku-summarized)
- Link to the landing URL
- "Approve" / "Reject" buttons like other intel

Admin intel-review page needs to render `ad_creative_url` as an image so
Jill can eyeball ads before approving.

## Cost & ops

- **Apify account:** free tier first, upgrade to paid ($49/mo) only if we
  exceed the watchlist or need more frequent polling
- **New daily cron:** `apify-ads-scout` runs 09:00 UTC (before build-brief)
- **Rate limits:** Apify free tier = 30 concurrent actor runs, plenty

## MVP scope (cut for first ship)

Do:
- Apify integration for 10 brands (biggest programs first)
- Schema migration (010)
- Haiku ad-copy prompt branch
- Basic brief rendering with creative thumbnails

Defer:
- TikTok Creative Center (phase 7)
- YouTube Data API (phase 7)
- Full 30-brand watchlist (expand after MVP works)
- Ad performance data / spend estimates (not in free tier)

## Open questions

1. Does Apify's free tier actually cover daily polling for 10+ brands, or
   does it burn out mid-month? → spike a 3-day trial first.
2. How do we handle the same offer running on 4 brands' ads simultaneously?
   → same dedup logic we use for cross-blog mentions (hash on
   `(program, offer_value, bonus_type)`).
3. Should video ads have transcripts extracted? → defer; ad text + CTA
   usually covers the offer.

## Phase ordering

Current: Phase 5 (intel pipeline polish — shipped)
Next:    Phase 6 (email ingestion — unlocks Google Alerts revive + #5
         official newsletter signups)
After:   **Phase 7 (this plan — social ads)**
Later:   Phase 8 (weekly newsletter build)
