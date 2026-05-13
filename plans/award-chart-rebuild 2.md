# Award Chart Rebuild (Option C) — v2.1

**Status:** v2.1 reorders phases per Copilot's second-pass review (2026-05-11).
Schema locked as ready-to-implement. Pilot first, then audit.
**Driving incident:** /hub/best-way-to-book showed "Etihad Guest 7k-10k miles" for JFK→HNL (a 4,983-mile route). Real Etihad price for that distance is ~22k. Root cause: one partner_redemptions row collapses an entire distance-based chart into a single low/high range, then is tagged to every US route bucket. We're lying to users by accident.

**v2 changelog vs v1:**
- Added a fifth chart type `distance_plus_modifiers` for Avios / Asia Miles / Qantas (was missed)
- Peak / off-peak calendars now a first-class concept (BA, Iberia, Qantas, Flying Blue, Virgin Atlantic, Asia Miles need them)
- Route-specific overrides as a top-level escape hatch (AA Web Specials, Iberia MAD-JFK, Qantas Classic vs Any Seat)
- Optional `elite_modifiers` slot for future-proofing
- Dynamic pricing uses **percentile ranges** (p10 / p50 / p90), not low/typical/high
- Inserted a **Phase 0.5 Avios pilot** before locking the schema — Avios is the worst-case test
- ANA RT-only handled with `rt_only` + `one_way_multiplier` flags

---

## Why we're rebuilding

Current model:
```
partner_redemptions
  ├── currency_program_id (e.g. Etihad Guest)
  ├── operating_carrier_id (e.g. American)
  ├── route_buckets text[] (e.g. ['us-short','us-medium','us-long'])
  ├── cabin
  ├── cost_miles_low, cost_miles_high   ← THE PROBLEM
  └── narrative columns (what_breaks_this, availability_reality, ...)
```

This works for **fixed/zone-based** charts (one cost per region/cabin). It breaks for:
- **Distance-based** (Etihad, Aeroplan, LifeMiles, ANA RT, KrisFlyer partners): cost varies continuously with miles
- **Distance + modifiers** (Avios family, Asia Miles, Qantas): distance bands + partner overrides + peak/off-peak + RFS caps
- **Dynamic-pricing** (United, Delta, AA AAnytime, Flying Blue saver): cost varies with demand
- **Hybrid / route-specific** (AA Web Specials, Iberia MAD-JFK, Avianca BOG-MAD): published exceptions to the base chart

When the same row is tagged us-short + us-medium + us-long, a 5k-50k range becomes "5k for JFK-HNL" in the sort, which is false.

## The new model

Move the **cost** out of partner_redemptions and into structured columns on `programs`. Keep partner_redemptions for **carrier × currency × cabin narrative metadata only**.

### Schema sketch

```sql
alter table programs add column award_chart_structured jsonb;
-- Optional partial index for partner lookups
create index if not exists programs_award_chart_partners_idx
  on programs using gin ((award_chart_structured -> 'partners'));
```

`award_chart_structured` is one of five shapes (`type` discriminator).

### Type 1: distance

Pure distance bands. No partner-specific quirks.

```json
{
  "type": "distance",
  "rt_only": false,
  "one_way_multiplier": 1.0,
  "partners": {
    "american_airlines": {
      "bands": [
        { "max_miles": 650,  "cabin": { "economy": 4500 } },
        { "max_miles": 1000, "cabin": { "economy": 5500 } },
        { "max_miles": 2000, "cabin": { "economy": 8000 } },
        { "max_miles": 3000, "cabin": { "economy": 11000 } },
        { "max_miles": 4500, "cabin": { "economy": 17500 } },
        { "max_miles": 7000, "cabin": { "economy": 22000, "business": 44000 } }
      ]
    }
  },
  "overrides": []
}
```

ANA's RT-only chart uses `rt_only: true, one_way_multiplier: 0.5`.

### Type 2: zone

Region-to-region matrix.

```json
{
  "type": "zone",
  "partners": {
    "american_airlines": {
      "matrix": {
        "us-short":   { "economy": 7500,  "business": 25000 },
        "us-medium":  { "economy": 12500, "business": 25000 },
        "us-long":    { "economy": 12500, "business": 25000 },
        "us-eu-east": { "economy": 30000, "business": 57500, "first": 85000 }
      }
    }
  },
  "overrides": []
}
```

### Type 3: distance_plus_modifiers (NEW in v2)

For Avios / Asia Miles / Qantas — distance bands plus partner-specific tables, peak/off-peak, RFS caps, multi-carrier rules.

```json
{
  "type": "distance_plus_modifiers",
  "partners": {
    "british_airways": {
      "bands": [
        { "max_miles": 650,  "peak": { "economy": 7500  }, "off_peak": { "economy": 6500  } },
        { "max_miles": 2000, "peak": { "economy": 13000 }, "off_peak": { "economy": 11000 } },
        { "max_miles": 4000, "peak": { "economy": 26000 }, "off_peak": { "economy": 20750 } }
      ],
      "rfs_caps": {
        "economy":  { "us-eu-east": 175 },
        "business": { "us-eu-east": 550 }
      }
    },
    "qatar_airways": {
      "bands": [...],
      "multiplier": 1.0
    }
  },
  "peak_calendar": [
    { "start": "2026-06-01", "end": "2026-09-01" },
    { "start": "2026-12-15", "end": "2027-01-05" }
  ],
  "overrides": [
    { "from": "MAD", "to": "JFK", "cabin": "business",
      "miles": 34000, "season": "off_peak",
      "note": "Iberia Plus off-peak unicorn" }
  ]
}
```

### Type 4: dynamic

Percentile ranges per bucket × cabin. Dynamic pricing is honest about its distribution.

```json
{
  "type": "dynamic",
  "partners": {
    "united": {
      "ranges_by_bucket": {
        "us-short": { "economy": { "p10": 6000,  "p50": 12000, "p90": 22000 } },
        "us-long":  { "economy": { "p10": 12500, "p50": 30000, "p90": 60000 } }
      }
    }
  },
  "overrides": []
}
```

Optional finer grain (used when bucket is too coarse):
```json
"ranges_by_distance": [
  { "max_miles": 500,  "economy": { "p10": 6000, "p50": 12000, "p90": 20000 } },
  { "max_miles": 1500, "economy": { "p10": 8000, "p50": 15000, "p90": 30000 } }
]
```

### Type 5: fixed_route

One-off published rates. Rare; used for chart exceptions that don't fit anywhere else.

```json
{
  "type": "fixed_route",
  "routes": [
    { "from": "BOG", "to": "MAD", "cabin": { "business": 63000 } }
  ]
}
```

### Optional future-proofing on every chart type

```json
"elite_modifiers": {
  "silver": 0.95,
  "gold":   0.90
}
```

Not used in compute today; just reserves the slot so future v3 doesn't need a schema migration.

### Cost compute function

```ts
// lib/awardChart.ts
export interface AwardCostResult {
  miles: number | { low: number; high: number }
  exact: boolean       // true for chart-based, false for dynamic ranges
  band?: string        // "4,501–7,000 mi @ 22k" for distance charts
  season?: 'peak' | 'off_peak'
  source: 'chart' | 'override' | 'dynamic_estimate'
  notes?: string
}

export function computeAwardCost(
  program: Program,
  partnerCarrierSlug: string,
  origin: Airport,
  destination: Airport,
  cabin: RedemptionCabin,
  options?: { travelDate?: string; eliteTier?: string },
): AwardCostResult | null {
  const chart = program.award_chart_structured
  if (!chart) return null

  // 1) Overrides ALWAYS win (Web Specials, MAD-JFK unicorn, etc.)
  const ov = matchOverride(chart, origin, destination, cabin, options?.travelDate)
  if (ov) return ov

  const distance = distanceMiles(origin, destination)
  const bucket   = mapRouteToBucket(origin, destination)
  const season   = chart.peak_calendar
    ? inPeakWindow(chart.peak_calendar, options?.travelDate) ? 'peak' : 'off_peak'
    : undefined

  switch (chart.type) {
    case 'distance':                 return computeDistance(chart, partnerCarrierSlug, distance, cabin)
    case 'zone':                     return computeZone(chart, partnerCarrierSlug, bucket, cabin)
    case 'distance_plus_modifiers':  return computeDistancePlus(chart, partnerCarrierSlug, distance, cabin, season)
    case 'dynamic':                  return computeDynamic(chart, partnerCarrierSlug, bucket, distance, cabin)
    case 'fixed_route':              return computeFixed(chart, origin, destination, cabin)
  }
}
```

### What partner_redemptions becomes

After the rebuild, partner_redemptions rows still exist but `cost_miles_low/high` are **deprecated and ignored by the cheapest-first sort**. The row tells us:
- Which (currency × carrier × cabin) combinations exist
- Narrative: what_breaks_this, availability_reality, booking_channel, fuel_surcharges, teach_caption
- Route bucket tags (still useful for "is this combo even relevant to this route?")

Cost comes from the program's `award_chart_structured` at query time, given the actual route distance and (optionally) travel date.

---

## Phased plan

### Phase 0 — Avios pilot (1 day) ★ schema gate
Avios stresses every dimension: distance bands + partner-specific tables + peak/off-peak + RFS caps. If the schema models Avios cleanly, it models anything. **Schema cannot be locked until this passes.**

- [ ] Draft strict TypeScript types in `lib/awardChart.ts` for all 5 chart types (compile-only; no runtime use yet)
- [ ] Author British Airways Avios chart in v2 schema JSON (hand-typed file under `lib/awardCharts/__pilot/ba_avios.ts` for now)
- [ ] Implement `computeAwardCost` v1 covering at minimum distance, distance_plus_modifiers, zone branches + override matcher + peak-calendar matcher
- [ ] Validate 10–20 real routes against ba.com chart (LHR–JFK economy peak, MAD–JFK off-peak, DOH–BKK Qatar partner, JFK–LON multi-carrier, BOS–DUB short, GRU–LHR Y/J, etc.)
- [ ] Document any schema gaps; only proceed when zero gaps remain
- [ ] Lock v1 schema types (no further edits without explicit v2 bump)

### Phase 0.5 — Audit (½ day, no code)
Once Avios validates the schema, classify the rest.

- [ ] List every program with authored partner_redemptions (programs.slug + count of active rows)
- [ ] Classify each into one of 5 types: distance / zone / distance_plus_modifiers / dynamic / fixed_route
- [ ] For each program, locate the authoritative chart source (official URL)
- [ ] Flag programs needing peak/off-peak calendars + estimated date ranges
- [ ] Flag known route overrides per program
- [ ] Output: `plans/award-chart-audit.md` — one entry per program

### Phase 1 — Schema + compute (1 day)
- [ ] Migration: add `programs.award_chart_structured jsonb` + GIN index
- [ ] `lib/awardChart.ts` — types + computeAwardCost + 5 type-specific computers
- [ ] Override matcher + peak-calendar matcher as separate pure functions
- [ ] Unit tests for each chart type with hand-authored mini charts

### Phase 2 — Author charts for current coverage (3–5 days, batched)
One PR per program, smallest first. Ordering puts the cleanest charts first to build authoring rhythm:

**Zone-based (easiest):**
- [ ] AA AAdvantage (zone)
- [ ] Turkish Miles & Smiles (zone)
- [ ] KrisFlyer (zone — partner table)
- [ ] Korean SKYPASS (zone)
- [ ] Virgin Atlantic Flying Club (zone — includes the famous ANA partner award)

**Distance-pure:**
- [ ] Aeroplan (distance)
- [ ] Etihad Guest (distance, multi-partner)
- [ ] LifeMiles (distance)
- [ ] ANA Mileage Club (distance, `rt_only: true, one_way_multiplier: 0.5`)
- [ ] Cathay Asia Miles (distance + modifiers — see below)
- [ ] Qantas Frequent Flyer (distance_plus_modifiers)

**Distance + modifiers:**
- [ ] BA Avios (Avios pilot result becomes this)
- [ ] Iberia Plus Avios (shares BA base, own off-peak windows)
- [ ] Qatar Privilege Club Avios (shares BA base, own RFS, own partner table)

**Dynamic:**
- [ ] United MileagePlus (per-bucket percentile ranges)
- [ ] Delta SkyMiles (per-bucket percentile ranges)
- [ ] Air France/KLM Flying Blue (dynamic + Promo Rewards overrides)
- [ ] Alaska/Atmos (mix — partner per-program charts)
- [ ] JAL Mileage Bank (zone + distance per partner)
- [ ] Air Canada (alias to Aeroplan)

Estimated: ~20 charts × 30–90 min each = 10–30 hours total. Distance_plus_modifiers programs (BA, Iberia, Qatar, Qantas, Asia Miles) are the heaviest.

### Phase 3 — Switch hub tools to use the chart (1 day)
- [ ] `getRedemptionsForBucket` (Best Way to Book) — fetch rows; compute cost via chart for the actual route distance; sort by computed cost (median for dynamic ranges)
- [ ] `getActiveTransferBonuses` → top sweet spot — recompute the cheapest known route from chart
- [ ] `getWalletRedemptions` (Where Can I Go) — recompute reach using chart ranges
- [ ] `getDontSleepSweetSpots` — keep curated rows; they don't need chart lookup since they're per-route already, but surface the chart band inline as proof
- [ ] BestWayToBookResultRow: show "Distance band: 4,501–7,000 mi → 22k" inline when chart is distance-based, so the user sees the rule that gave them the number

### Phase 4 — Deprecate stale cost columns (½ day)
After 1 week of monitoring + spot-checks:
- [ ] Stop reading `partner_redemptions.cost_miles_low/high` from any hub surface
- [ ] Keep the columns for admin/historical reference; do not remove
- [ ] Update admin UI to show "(computed from chart)" instead of letting editors author per-row miles

### Phase 5 — Phase out partner_redemptions cost authoring (when calm)
- [ ] Remove the miles fields from the admin form
- [ ] Editors only author narrative + route bucket tags going forward
- [ ] Build a minimal `/admin/programs/[slug]/chart` editor (form-shaped per chart type) so chart authoring isn't raw JSON

---

## Risk + mitigation

1. **JSON schema drift** — locked v1 shape via strict TypeScript types; bump to v2 explicitly later if needed.
2. **Chart authoring errors** — ship a "preview compute" admin endpoint in Phase 1 that lets the editor enter a sample route + date and see the computed cost before saving.
3. **Distance bucket edge cases** — Hawaii / Alaska / Caribbean inclusion in "US domestic" definitions varies by program. Confirm per program in Phase 0 audit, not assumed.
4. **Dynamic-pricing programs still have a range problem** — even per-bucket, US-long economy on United might be 12.5k–60k. Acceptable because p10/p50/p90 is honest about distribution, and the "Dynamic — expect upper end" chip already signals it.
5. **Peak calendars change yearly** — calendar is just a date range list; trivial to update. Admin chart editor will surface a date picker.
6. **Editor learning curve on JSON authoring** — Phase 1 ships compute + raw JSON; Phase 5 ships form-shaped editor. In between, Claude + Jill author together.

---

## Open questions (still pending Jill's call)

1. **Scope:** all 20 programs in one push, or start narrower? *(Recommendation: do Phase 0 audit and Avios pilot first; then pick 5-7 high-impact programs for Phase 2 batch 1.)*
2. **Program metal vs partner metal:** model both pricing tracks, or partner only? *(Recommendation: both, since they're often different. Etihad on AA ≠ Etihad on Etihad. Easy to add — partners dict just has an entry for the carrier matching the program.)*
3. **Promo rewards** (Flying Blue Promo, AA Web Specials, Avios RFS): second chart on same program, or separate row? *(v2 answer: overrides + RFS caps as fields on the main chart, not a separate program.)*
4. **Date input to compute:** Where does the travel date come from in /hub/best-way-to-book? Today the form has no date picker. *(Recommendation: add an optional travel-date input; if absent, compute uses off-peak as the "best case" and labels it as such.)*

## Cross-references
- Driving incident: /hub/best-way-to-book JFK→HNL Etihad result, screenshot 2026-05-11
- Existing prose award charts: `programs.award_chart` (text, kept as-is — that's editorial copy for the program page)
- Hub-column backfill scope: AA + UA (migrations 084, 224)
- Memory: `project_how_to_book_partners_tool.md` — the booking-disclosure work depends on this rebuild for cost accuracy
- Memory: `project_award_chart_rebuild.md` — session pickup
