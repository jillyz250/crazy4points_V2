# Promo Intelligence Engine — Architecture Plan

**Authored:** 2026-05-13
**Status:** Spec — pending Phase 0 kickoff
**Owner:** Jill (curator) + Claude (implementation)

> "We're not building scrapers. We're building a real-time loyalty
> intelligence engine. Scraping is commodity. The moat is normalization
> + cross-tool routing."

---

## Vision

Most points-and-miles sites (TPG, OMaaT, Frequent Miler) publish articles
about deals. They are weeks stale by definition. crazy4points runs **live
data with verified timestamps** — pulled directly from program websites,
enriched into a structured intelligence layer, and routed across every
Hub tool automatically.

**Editorial position:** "We tell you what's true on the program's website
right now, with the timestamp to prove it."

That's different category from blogs. It's the moat.

---

## What the system does

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  AIRLINE / ISSUER WEBSITES                                       │
│  flyingblue.com  •  krisflyer  •  americanexpress.com/transfer  │
│       │                                                          │
│       ▼  Firecrawl + per-program selector config                │
│                                                                  │
│  RAW SCRAPES → promo_rewards rows                               │
│       │                                                          │
│       ▼  enrichment pipeline (intel_*)                          │
│                                                                  │
│  ENRICHED ROWS                                                  │
│       │                                                          │
│       ├─► /programs/[slug] "Active Promos" section              │
│       ├─► /hub/dont-sleep — discount overlay on sweet spots     │
│       ├─► /hub/should-i-transfer — auto-detected transfer bonus │
│       ├─► /hub/best-way-to-book — promo flag on matching routes │
│       ├─► /hub/where-can-i-go — limited-time badge              │
│       ├─► Newsletter generator — "this week's promos" section   │
│       └─► /admin/promos — queue for curator review              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Architecture

### Single-table model

One table `promo_rewards` carries both raw scrape data AND enriched
intelligence fields. Simpler than separate `promo_rewards` +
`promo_intel`; can split later if column count gets unwieldy.

### Schema

```sql
create table promo_rewards (
  id uuid primary key default gen_random_uuid(),

  -- Identity / source
  program_id uuid references programs(id) on delete cascade,
  source_url text not null,          -- which page produced this row
  external_id text,                  -- per-program identifier if exposed
  raw_snapshot_hash text not null,   -- content hash for diff detection

  -- Scrape lifecycle
  first_scraped_at timestamptz not null default now(),
  last_scraped_at timestamptz not null default now(),
  last_seen_active boolean not null default true,  -- false when scrape no longer shows it
  scrape_run_id uuid references scrape_runs(id),

  -- Raw promo data (parsed)
  promo_label text,                  -- "25% off to Europe" / "Spontaneous Escape: BKK"
  origin_iata text,
  dest_iata text,
  origin_label text,                 -- "Europe" / "Paris" / null
  dest_label text,                   -- "New York" / "JFK" / null
  cabin text,                        -- Economy / Premium Economy / Business / First
  carrier_slug text,                 -- operating carrier slug if specified
  points_required integer,           -- exact cost as displayed
  points_baseline integer,           -- standard chart cost (for discount calc)
  cash_co_pay_amount numeric,
  cash_co_pay_currency text,
  valid_from date,
  valid_to date,
  booking_window_end date,           -- separate from travel window
  raw_payload jsonb,                 -- full structured data from selector

  -- Intelligence layer
  intel_type text                    -- 'monthly_promo' | 'transfer_bonus' | 'award_sale' |
                                      -- 'flash_sale' | 'partner_discount' | 'status_fast_track' |
                                      -- 'chart_change' | 'partner_change'
    check (intel_type in (
      'monthly_promo','transfer_bonus','award_sale','flash_sale',
      'partner_discount','status_fast_track','chart_change','partner_change'
    )),
  intel_discount_percent numeric,    -- (baseline - required) / baseline × 100
  intel_value_score numeric,         -- 0-100 normalized score (computed)
  intel_affects_redemption_ids uuid[], -- partner_redemptions rows this promo affects
  intel_affects_alert_ids uuid[],    -- alerts this promo relates to
  intel_match_confidence text        -- 'high' | 'medium' | 'low' | 'unmatched'
    check (intel_match_confidence in ('high','medium','low','unmatched')),

  -- Admin queue lifecycle
  admin_status text not null default 'pending'
    check (admin_status in ('pending','approved','published','rejected','ignored')),
  reviewed_by text,
  reviewed_at timestamptz,
  rejection_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index promo_rewards_program_id_idx on promo_rewards (program_id);
create index promo_rewards_admin_status_idx on promo_rewards (admin_status)
  where admin_status in ('pending','approved');
create index promo_rewards_valid_to_idx on promo_rewards (valid_to)
  where last_seen_active = true;
create index promo_rewards_intel_type_idx on promo_rewards (intel_type);
```

```sql
create table scrape_runs (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  scraper_slug text not null,        -- 'flying-blue-promo-rewards', 'amex-transfer-bonus', etc.
  source_url text not null,
  ran_at timestamptz not null default now(),
  duration_ms integer,
  status text not null check (status in ('success','partial','failed')),
  items_seen integer default 0,
  items_new integer default 0,
  items_updated integer default 0,
  items_disappeared integer default 0,
  firecrawl_credits_used integer,
  error_log text,
  raw_response_hash text             -- for chart-delta detection (Phase 3)
);

create index scrape_runs_program_id_ran_at_idx on scrape_runs (program_id, ran_at desc);
```

```sql
create table chart_snapshots (
  id uuid primary key default gen_random_uuid(),
  program_id uuid references programs(id) on delete cascade,
  source_url text not null,
  snapshot_hash text not null,
  snapshot_text text,                -- markdown extracted from Firecrawl
  taken_at timestamptz not null default now()
);

create index chart_snapshots_program_id_taken_at_idx on chart_snapshots (program_id, taken_at desc);
```

---

## Scraper interface

### Per-program selector config

Stored as JSON files in `lib/scrapers/[slug].json`. Example for Flying Blue:

```json
{
  "slug": "flying-blue-promo-rewards",
  "program_slug": "flying-blue",
  "source_url": "https://www.flyingblue.com/en/spend/flights/rewards",
  "intel_type_default": "monthly_promo",
  "firecrawl_options": {
    "waitFor": 4000,
    "onlyMainContent": true,
    "actions": [
      { "type": "wait", "milliseconds": 3000 }
    ]
  },
  "extraction_strategy": "schema",
  "schema": {
    "type": "object",
    "properties": {
      "promos": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "carrier": { "type": "string" },
            "origin_label": { "type": "string" },
            "dest_label": { "type": "string" },
            "cabin": { "type": "string" },
            "points_required": { "type": "integer" },
            "discount_percent_displayed": { "type": "integer" }
          }
        }
      },
      "valid_through": { "type": "string", "description": "When promos expire — e.g. 'October 31, 2026'" }
    }
  },
  "field_mapping": {
    "origin_label": "origin_label",
    "dest_label": "dest_label",
    "cabin": "cabin",
    "points_required": "points_required",
    "valid_through": "valid_to"
  }
}
```

### Generic runner

```ts
// scripts/run-scraper.mjs --slug=flying-blue-promo-rewards
// scripts/run-scraper.mjs --all
// scripts/run-scraper.mjs --slug=... --dry-run

async function runScraper(config: ScraperConfig): Promise<ScrapeResult> {
  const run = await createScrapeRun(config)
  try {
    const raw = await firecrawl(config.source_url, config.firecrawl_options)
    const structured = await extract(raw, config.schema)
    const rows = applyFieldMapping(structured, config.field_mapping)
    const diff = await diffAgainstExisting(rows, config.program_id)
    await persist(diff, run)
    await markRunSuccess(run, diff)
    return { run, diff }
  } catch (err) {
    await markRunFailed(run, err)
    throw err
  }
}
```

---

## Enrichment pipeline

Runs after each scrape, before rows hit the admin queue.

```ts
function enrich(row: PromoReward): EnrichedPromoReward {
  return {
    ...row,
    intel_discount_percent: computeDiscountPercent(row),
    intel_value_score: computeValueScore(row),
    intel_affects_redemption_ids: findAffectedRedemptions(row),
    intel_affects_alert_ids: findRelatedAlerts(row),
    intel_match_confidence: classifyMatchConfidence(row),
    intel_type: classifyType(row),
  }
}
```

### Phase 1 enrichment — naive but useful

- `intel_discount_percent` — read from `discount_percent_displayed` if present, else compute from `points_required` vs baseline chart cost (when destination has `award_chart_structured`)
- `intel_value_score` — V1: just `intel_discount_percent`. Refine later.
- `intel_type` — defaulted from scraper config (`monthly_promo` for Flying Blue, `transfer_bonus` for Amex pages, etc.)
- `intel_match_confidence` — V1: `unmatched`. Phase 6 builds real matching.

### Phase 6 enrichment — full intelligence

- Value score weights: discount % (50%), cabin (Business 1.5x, First 2x), region scarcity (long-haul 1.3x), historical avg vs current (1.2x when below avg).
- `intel_affects_redemption_ids` — fuzzy match origin/dest/cabin against `partner_redemptions` rows.
- `intel_match_confidence` — high (exact IATA+cabin+carrier match) / medium (region+cabin) / low (region only) / unmatched (no signal).

---

## Routing — where scraped data shows up

| Surface | Trigger | Render |
|---|---|---|
| `/programs/[slug]` | Any approved promo for this program | New "Active Promos" section above existing content. Each row: route + points + valid window + "Verified [date]" |
| `/hub/dont-sleep` | Approved promo matches a sweet spot's currency + region | Yellow "🔥 [N]% off this month — verified [date]" overlay on the sweet spot card |
| `/hub/should-i-transfer` | Approved promo with `intel_type = 'transfer_bonus'` | New card alongside manually-authored transfer bonuses |
| `/hub/best-way-to-book` | Approved promo matches origin+destination IATA | "🔥 [N]% off this month" badge on matching result |
| `/hub/where-can-i-go` | Approved promo on a destination user can reach | "Limited time" badge on the row |
| Newsletter generator | Promos `published` within last 7 days | Pulled into "What's hot" section |
| `/admin/promos` | Any row with `admin_status = 'pending'` | Review queue with approve/reject/edit |

**Cardinal rule:** nothing renders on public surfaces until `admin_status = 'published'`. Curator stays the publisher always.

---

## Admin queue

New page: `/admin/promos`

```
┌──────────────────────────────────────────────────────────────┐
│ Promo Queue                                                  │
│                                                              │
│ Pending review (12)  •  Approved unpublished (3)  •  Recent  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ NEW  monthly_promo   Flying Blue                        │  │
│ │ Paris → Geneva, Economy, 7,500 miles (25% off)         │  │
│ │ Valid through Oct 31, 2026                              │  │
│ │ Source: flyingblue.com/en/spend/flights/rewards         │  │
│ │ Affects: 0 sweet spots  •  Score: 30                    │  │
│ │ Scraped 2 hrs ago                                       │  │
│ │ [ Approve & publish ]  [ Reject ]  [ Edit ]            │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ... 11 more rows ...                                         │
└──────────────────────────────────────────────────────────────┘
```

### Admin actions

| Action | Effect |
|---|---|
| **Approve & publish** | `admin_status = 'published'`, surfaces on public site immediately |
| **Approve, hold** | `admin_status = 'approved'` (still hidden) — for batched publishes |
| **Reject** | `admin_status = 'rejected'`, never appears again until manually unrejected |
| **Edit** | Curator can override scraped fields before publishing (typo fixes, label cleanup, intel_type reclassification) |
| **Ignore** | `admin_status = 'ignored'`, soft-deletes from queue without rejection (mistaken scrape) |

### Auto-disappear handling

When a scraper run no longer sees a row (`last_seen_active = false` for > 24 hrs), the public render hides it automatically. Curator gets a notification: "[N] promos no longer detected on flying-blue — auto-hidden." No manual unpublish needed.

---

## Phasing

### Phase 0 — Foundation (2 days)

- Migration 251: `promo_rewards`, `scrape_runs`, `chart_snapshots` tables
- `scripts/run-scraper.mjs` generic runner
- `lib/scrapers/` directory for selector configs
- `utils/scraper/enrich.ts` enrichment pipeline (Phase 1 naive version)
- `utils/scraper/persist.ts` insert/update/diff logic
- Stub admin page at `/admin/promos`
- No public-facing surfaces yet

### Phase 1 — First scraper: Flying Blue (1 day)

- Author `lib/scrapers/flying-blue-promo-rewards.json`
- Run + iterate until extraction is reliable
- Daily Vercel cron added
- Validate with 7 days of runs

### Phase 2 — Surface on program page (½ day)

- `/programs/flying-blue` "Active Promos" section
- Renders approved + published rows
- Verified timestamp + staleness amber chip when > 48 hrs old
- **Per-row baseline display (Option B, locked 2026-05-13):** when the
  source page shows a discount %, also surface the back-calculated
  rate. Copy pattern: "18,750 miles *(rate ~25,000, currently 25% off)*"
  — uses the word "rate," not "rack rate," and frames the baseline as
  observed from the program's site rather than as our chart claim.
  - Inferred baselines render with the `~` symbol so readers see
    they're approximate, not a precise chart number.
  - Only shown when `intel_inferred_baseline` is set (i.e. the
    program's site labeled the promo with a discount %).
  - For programs that scrape an EXPLICIT baseline (e.g. "Normal:
    25,000"), drop the `~` and use the exact number.

### Phase 3 — Chart delta detection (1 day)

> Curator decision pending — see "Open questions" below.

- On every scrape, hash the full page content into `chart_snapshots`
- Compare to previous snapshot
- On diff: insert a `promo_rewards` row with `intel_type = 'chart_change'`
- Surfaces in admin queue as "Chart changed on Flying Blue — review diff"
- Most valuable feature for devaluation early-warning

### Phase 4 — Cross-tool propagation (1-2 days)

- Don't Sleep overlay
- Should I Transfer auto-card for `intel_type = 'transfer_bonus'`
- Best Way to Book promo badge
- Where Can I Go limited-time badge
- Newsletter generator integration

### Phase 5 — Issuer promo scraping (1 day)

- New scrapers for Amex/Chase/Citi/Cap1/Bilt transfer-bonus pages
- Same architecture, different domains
- Feeds Should I Transfer + alerts pipeline

### Phase 6 — Promo → route matching (2 days)

- Build `findAffectedRedemptions()` with fuzzy origin/dest/cabin matching
- Add `intel_match_confidence` classification
- Admin queue surfaces match suggestions; curator confirms ambiguous ones

### Phase 7 — Chart Derivation Engine (Option C, 3-4 days)

> **Conceived 2026-05-13** after the Flying Blue scraper went live and
> we realized every promo with a stated discount % is a data point
> about the unpublished chart.
>
> Phase 2 already surfaces inferred baselines on a per-promo basis
> (Option B — "currently 25% off Flying Blue's rate of ~25,000").
> Phase 7 is the AGGREGATION evolution: instead of trusting a single
> promo's inferred number, collect dozens of observations per route
> bucket and surface a statistical distribution with sample size.
>
> **Locked: do not ship public-facing aggregated charts until
> sample_count >= 30 per cell AND curator approves the copy.**

Every promo with `discount_percent_displayed` gives us:
  `inferred_baseline = points_required / (1 - discount/100)`

Example: Flying Blue Business at 63,500 with -25% → baseline ~84,667.

Aggregate across many promos for the same `(origin_region, dest_region, cabin)`
tuple and the inferences converge to the actual chart cell. **This is
the chart-derivation feature.** No competitor can do this because nobody
else captures the data automatically with timestamps.

Implementation:
- Migration 252 (shipped early): `intel_inferred_baseline` column.
  Enrichment computes when scraper extracts the discount %.
- New `derived_chart_cells` table aggregating inferences by
  `(currency_program_id, origin_region, dest_region, cabin)`:
  - `inferred_baseline_p25 / p50 / p75 / p95` (percentiles over time)
  - `sample_count` — how many observations contributed
  - `confidence` — derived from sample count + variance
  - `last_observed_at` — most recent observation
  - `curator_approved_for_public boolean default false` — gate
    against accidentally surfacing thin or noisy cells
- Cron job: aggregate `promo_rewards` into `derived_chart_cells` daily.
- Surface on `/programs/[slug]` as a "Derived chart" section ONLY when:
  1. The program lacks an official published chart
  2. The cell has `sample_count >= 30`
  3. Curator has flipped `curator_approved_for_public = true`
- Public copy framing (curator-locked):
  "Derived rate: ~25,000 miles (47 observations over 6 months,
   p25–p75: 22,500–28,000). This is crazy4points' estimate — not the
   program's published rate. Confirm in the booking engine before
   transferring."
- Devaluation alarm: if a freshly-observed promo's inferred baseline
  is meaningfully higher than the rolling p50, auto-create a draft
  alert (`intel_type='chart_change'`).

Relationship to Option B (Phase 2):
- Phase 2 shows ONE promo's inferred number with hedging
- Phase 7 shows the AGGREGATE across many promos with explicit
  sample size + percentiles
- Both are honest; Phase 7 is just stronger evidence

### Phase 8 — Expand program coverage (~3 hrs per program)

- KrisFlyer Spontaneous Escapes
- Aeroplan Bonus
- LifeMiles flash sales
- United promo sales
- Air France/KLM (variant of Flying Blue)
- Add programs as time permits

### Phase 9 — Availability probes (DEFERRED, 2 days)

- Higher legal/ToS risk than chart scraping
- Build only after Phases 0-7 prove the architecture
- Probes a few known routes per program to detect saver-space trends

### Phase 10 — Adjacent intel (1-2 days each)

- Status promos (fast-tracks, challenges)
- Card-offer changes (welcome bonus refreshes)
- PDF chart diffs
- Partner-list deltas
- Fuel surcharge tables
- New-route launches

---

## MVP definition

**Minimum to ship a real product:** Phases 0-5 (~7-8 days focused work).

That gives you:
- A working scraper architecture extensible to any program
- Flying Blue surfaces live promos on /programs/flying-blue
- Chart change detection running across all scraped programs
- Cross-tool propagation working on at least one Hub surface
- Issuer transfer-bonus detection working

Anything past Phase 5 is incremental upside.

---

## Cost model

| Item | Cost |
|---|---|
| Firecrawl 5,000 credits/mo | $0 (existing subscription) |
| Vercel Cron (free tier) | $0 (≤100 invocations/day) |
| Supabase tables + indexes | Negligible (within free tier) |
| Per scrape ≈ 1-2 Firecrawl credits | At daily cadence: ~30 credits/day per program → ~1000/month for 30 programs. Well within 5k budget. |

Total operating cost increase: **$0** with current subscriptions.

---

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Site layout changes break a selector | Per-program error rate threshold; alert curator when extraction returns 0 rows two runs in a row |
| Firecrawl rate-limit / quota | Exponential backoff + cron staggering; weekly cadence as fallback |
| Stale data shown as live | `last_scraped_at` rendered prominently; > 48 hrs triggers staleness chip; > 7 days auto-hides |
| Legal / ToS concerns | Public-content scraping only (Phase 8 probes deferred); respectful rate limits; respect robots.txt |
| Curator queue overload | Auto-classify intel_type so curator can batch by type; reject-all-for-program quick-action; ignore-similar quick-action |
| Bad enrichment poisons routing | All routing checks `admin_status = 'published'` — nothing leaks to public surfaces unreviewed |

---

## Open questions

1. **Phase 3 (chart delta detection) — ship in Phase 3 or split off?**
   - Recommendation: ship in Phase 3. It's where the moat compounds most.
   - Counterargument: it has zero dependency on the promo flow and could be a parallel project. Could start Phase 3 work as soon as Phase 0 schema lands.

2. **How to handle `promo_rewards` rows that match multiple programs?** (e.g., Amex bonus to Avianca affects both Amex and Avianca program pages.)
   - Proposal: `program_id` is the SOURCE program (where it was scraped from). Add `program_ids[]` array for cross-references. Public renderer reads both.

3. **What's the alert pipeline integration?**
   - Approved promo with `intel_type ∈ {transfer_bonus, award_sale, flash_sale, chart_change}` auto-creates a draft alert in the existing `alerts` table. Curator can publish via the existing alert flow.
   - Need to confirm the writer prompt handles auto-drafts cleanly.

4. **Email subscriber triggers?**
   - Out of scope for MVP. After Phase 5, consider: when curator publishes a high-score promo (`intel_value_score > 70`), offer "send to subscribers now" button.

---

## Decisions locked (2026-05-13)

- ✅ **Single table model** (`promo_rewards` with embedded intel fields) — splits later only if needed
- ✅ **Firecrawl 5000 credits/mo** subscription already in place — sufficient for full build
- ✅ **Admin queue, no auto-publish** — curator is always the publisher
- ✅ **Phase 2 public baseline display (Option B)** — show per-promo
  inferred baseline as "rate ~X, currently N% off" when the source
  labels a discount. Use the word "rate," not "rack rate."
- ✅ **Phase 7 aggregated chart (Option C)** — derived chart cells with
  sample size + percentiles, gated on `sample_count >= 30` AND curator
  approval before any public surface.
- ⏳ **Chart delta detection in Phase 3** — pending curator confirmation

---

## Next concrete steps

When kickoff happens:

1. Write Migration 251 for the three tables
2. Build `scripts/run-scraper.mjs` generic runner
3. Author `lib/scrapers/flying-blue-promo-rewards.json` selector config
4. First end-to-end scrape run; iterate until reliable
5. Add daily Vercel Cron
6. Stub `/admin/promos` queue page

Phase 0+1 ships in ~3 days of focused work.
