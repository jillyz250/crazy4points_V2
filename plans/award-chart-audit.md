# Award Chart Audit — Phase 0.5

**Status:** Inventory of every program with authored partner_redemptions, classified by chart type for the Award Chart Rebuild (Option C, v2.1).
**Driving plan:** `plans/award-chart-rebuild.md`
**Schema gate:** locked at `lib/awardChart.ts` v1 after Avios pilot passed 15/15 (PR #408)
**Date:** 2026-05-11

---

## Methodology

- Source: every `*_partner_redemptions*.sql` migration (067, 071, 077, 085, 092, 136, 140, 200, 202, 204, 206, 208, 223, 224)
- Each program below = one row in the inventory; classification reflects how the program's *real-world* chart works, not how we currently encoded it
- "Row count" = approximate partner_redemptions rows where this program is the currency. Counts pulled by inspection of migration content, not live DB query (we're in audit mode, no infra calls)
- "Source URL" = official chart authority. WebFetch-verify in Phase 2 before authoring each.

## Legend

| Code | Meaning |
|---|---|
| 🟢 | Coverage is already good for the chart type; Phase 2 authoring should be quick |
| 🟡 | Coverage is partial / has known data issues; Phase 2 authoring needs careful re-research |
| 🔴 | Coverage is thin or wrong (e.g. dynamic-pricing collapsed range); Phase 2 needs full re-author from scratch |
| ★ | Recommended for Phase 2 batch 1 (high-impact + clean chart type) |

---

## Inventory

### Tier 1 — Distance-pure (`type: distance`)

| Program | Slug | Rows | Source URL | Notes | Status |
|---|---|---|---|---|---|
| **Aeroplan** ★ | `aeroplan` | ~12 | aircanada.com/en/aeroplan/use-your-miles | Distance bands, multi-partner. Star Alliance + own. Recently 2026 chart revision — verify. | 🟢 |
| **Etihad Guest** ★ | `etihad` | ~15 | etihadguest.com (per-partner pages) | Distance bands DIFFER PER PARTNER (AA chart ≠ AS/Atmos chart ≠ EY own-metal). The JFK-HNL bug originated here. | 🔴 |
| **Avianca LifeMiles** | `avianca` | ~25 | lifemiles.com (zone-ish but treated as distance) | Star Alliance + bilateral. Has some single-zone US logic — possibly fits `zone` instead. Audit when authoring. | 🟡 |
| **ANA Mileage Club** | `ana` | ~10 | ana.co.jp/en/us/amc/reference/tukau/award | **RT-only** classic award chart; use `rt_only: true, one_way_multiplier: 0.5`. Round-the-world award is separate (skip for v1). | 🟢 |

### Tier 2 — Distance + modifiers (`type: distance_plus_modifiers`)

The Avios family + Asia Miles + Qantas. All validated as fitting the schema in the pilot.

| Program | Slug | Rows | Source URL | Notes | Status |
|---|---|---|---|---|---|
| **BA Avios** ★ | `british_airways` / `ba-avios` | ~12 | ba.com/en-us/executive-club/spending-avios | Pilot's reference shape. Includes peak/off-peak, RFS caps, multi-partner. Two slugs — pick one canonical (recommend `ba-avios` for currency, `british_airways` for carrier). | 🟢 |
| **Iberia Plus** | `iberia` | ~6 | iberia.com/us/avios | Shares BA bands, own off-peak windows, famous MAD-JFK J off-peak unicorn → fits as `overrides[]`. | 🟢 |
| **Qatar Privilege Club** | `qatar` | ~6 | qatarairways.com/privilegeclub | Distinct partner table from BA; uses Avios as the currency name. Switched to "Avios" branding in 2024. | 🟢 |
| **Finnair Plus** | `finnair` | 3 | finnair.com/en-us/finnair-plus | Avios-family. Limited authored; one row pattern — re-research. | 🟡 |
| **Cathay Asia Miles** | `cathay` | ~8 | cathaypacific.com/asiamiles | Distance bands + "Standard/Choice/Tailored" tiers. Treat tiers as cabin-modifier multipliers or as separate sub-charts. | 🟡 |
| **Qantas Frequent Flyer** | `qantas` | 3 | qantas.com/au/en/frequent-flyer/use-points/classic-flight-rewards | Distance bands + partner-specific tables + peak/off-peak. Classic Reward vs Any Seat — model Classic only for v1. | 🟢 |
| **Alaska/Atmos Rewards** ★ | `atmos` | ~7 | alaskaair.com/account/mileage-plan/redeem-miles | Preserved legacy distance-based partner chart. Per-partner bands. **Famous sweet spots live here.** | 🟢 |

### Tier 3 — Zone-based (`type: zone`)

| Program | Slug | Rows | Source URL | Notes | Status |
|---|---|---|---|---|---|
| **AA AAdvantage** ★ | `aa` | ~30 | aa.com/i18n/aadvantage-program/miles/award-flights/award-chart | Largest authored set. Mostly fixed saver chart per region. AAnytime is dynamic (separate sub-chart or treat as `dynamic`). | 🟢 |
| **Turkish Miles & Smiles** | `turkish` | 1+ | turkishairlines.com/en-int/miles-and-smiles | Star Alliance partner zone chart. Sweet spot: us-eu-east J for ~45k. | 🟢 |
| **KrisFlyer** | `krisflyer` | 1+ | singaporeair.com/en_UK/us/ppsclub-krisflyer | SQ own-metal zone + Star Alliance partner table. | 🟢 |
| **Korean SKYPASS** | `korean-air` | TBD | koreanair.com/global/en/skypass/ | Zone, SkyTeam partner. Limited authored. | 🟡 |
| **JAL Mileage Bank** | `jal` | 3 | jal.co.jp/en/jmb/use/award/ | **Hybrid**: zone for own-metal, distance for partners. Might need 2 separate chart entries (one program, two chart objects?) or accept the hybrid via overrides. | 🟡 |
| **Virgin Atlantic Flying Club** | `virgin-atlantic` | TBD | virginatlantic.com/gb/en/flying-club/use-miles | Zone chart. Famous ANA partner sweet spot lives here. | 🟢 |
| **Miles & More** | `miles-and-more` | 4 | miles-and-more.com/en/en/redeem | Lufthansa group. Star Alliance partner zone. | 🟡 |
| **SriLankan FlySmiLes** | `srilankan` | 2 | srilankan.com/flysmiles | Oneworld partner zone. Limited use case. | 🟡 |
| **JetBlue TrueBlue** | `jetblue` | ~5 | jetblue.com/trueblue | Bilateral partners only (Aer Lingus, Hawaiian, etc.). Each is a small zone. | 🟢 |

### Tier 4 — Dynamic pricing (`type: dynamic`)

| Program | Slug | Rows | Source URL | Notes | Status |
|---|---|---|---|---|---|
| **United MileagePlus** ★ | `united` | ~6 | united.com/ual/en/us/account/mileageplus | Pure dynamic. Need per-bucket p10/p50/p90 — current data has a single 5k-50k floor-to-ceiling range, the bug that triggered this rebuild. | 🔴 |
| **Delta SkyMiles** | `delta` | TBD | delta.com/us/en/skymiles/use-miles/book-with-miles | Pure dynamic. Has lower-priced Flash Sale rows that should be `overrides[]`. | 🔴 |
| **Air France/KLM Flying Blue** | `air-france` | TBD | flyingblue.com | Dynamic + monthly Promo Rewards. Promos modeled as `overrides[]` with time-bounded dates. | 🔴 |
| **Frontier Miles** | `frontier` | 1 | flyfrontier.com/myfrontier/miles | Dynamic / cash-equivalent. Low priority for Hub surfaces. | 🟡 |
| **Allegiant Allways** | `allegiant` | 1 | allegiantair.com/allways-rewards | Cash-equivalent. Possibly skip from Hub entirely. | 🟡 |
| **Caribbean Miles** | `caribbean-airlines` | 1 | (program email 2026-05-08) | Single flat rate Y 15k. Fits as `fixed_route` for the small network. | 🟢 |

### Tier 5 — Fixed-route / hybrid (`type: fixed_route`)

| Program | Slug | Notes |
|---|---|---|
| **Caribbean Miles** | `caribbean-airlines` | See Tier 4 above; could be modeled either way. Recommend `fixed_route` since the network is small + flat-rate. |

### Tier 6 — Defunct / out of scope

| Program | Slug | Reason |
|---|---|---|
| **Spirit Free Spirit** | `spirit` | Program defunct May 2026 (per memory). Remove rows. |
| **Czech OK Plus** | `czech-airlines` | Defunct (skipped in Round 9 per migration 208 header). |

---

## Programs needing peak/off-peak calendars

These will need `peak_calendar` populated when authored:

| Program | Notes |
|---|---|
| BA Avios | Standard BA peak calendar (school holidays + summer + Christmas/NY) |
| Iberia Plus | Distinct from BA; verify per Iberia page |
| Qatar Privilege Club | Distinct from BA — narrower windows |
| Qantas FF | Australian summer + Easter + Christmas peak |
| Cathay Asia Miles | CNY + summer + holiday peaks |
| Virgin Atlantic Flying Club | Has peak surcharges on own-metal |
| Air France/KLM Flying Blue | Promo Rewards windows function similarly |

## Programs with known route overrides

These need `overrides[]` content in Phase 2:

| Program | Override | Notes |
|---|---|---|
| Iberia Plus | MAD-JFK J off-peak ~34k | Famous unicorn |
| AA AAdvantage | Web Specials (route-specific monthly) | Time-bounded; recurring |
| Air France/KLM | Monthly Promo Rewards | Time-bounded; recurring |
| Avios family | Reward Flight Saver caps | Modeled as `rfs_caps`, not overrides |
| Atmos | Specific Cathay J / EY F sweet spots | Some routes priced under the band logic |

## Hybrid concerns

| Program | Concern | Resolution |
|---|---|---|
| JAL Mileage Bank | Zone for own-metal, distance for partners | Author as TWO chart objects on same program (`award_chart_structured` + `partner_chart_structured`?), OR fold into `zone` with one partner = distance via `fixed_route` overrides. Decide in Phase 2 batch 4. |
| AA AAdvantage AAnytime | Dynamic-pricing tier alongside fixed saver | Author as `dynamic` chart object alongside the main zone; OR add a `tier: 'saver' \| 'anytime'` field to `ZonePartnerChart`. Lean toward second pattern. |
| Cathay Asia Miles tiers | Standard / Choice / Tailored | Author as cabin-multiplier on bands OR as separate sub-charts. Decide in Phase 2 batch 2. |
| Two slugs for BA Avios | `british_airways` (carrier) + `ba-avios` (currency) | Already a known pattern from `feedback_program_slug_convention.md`. Author chart on `ba-avios`. |

---

## Recommended Phase 2 batches

Total ~22 programs to author. Suggest 4 batches:

### Batch 1 — Bedrock ★ (5 programs)
Highest-impact + cleanest charts. Lock the authoring pattern.
- AA AAdvantage (zone — biggest set)
- Aeroplan (distance)
- Atmos Rewards (distance per partner)
- BA Avios (distance_plus_modifiers — pilot's reference)
- United MileagePlus (dynamic — fixes the original JFK-HNL bug)

### Batch 2 — Avios siblings + distance heavies (5 programs)
- Iberia Plus
- Qatar Privilege Club
- Etihad Guest (re-author from scratch; was 🔴)
- Avianca LifeMiles
- ANA Mileage Club

### Batch 3 — Star Alliance zone + Cathay (5 programs)
- Turkish Miles & Smiles
- KrisFlyer
- Miles & More
- Cathay Asia Miles
- JAL Mileage Bank

### Batch 4 — Dynamic + tail (5–6 programs)
- Delta SkyMiles
- Flying Blue (Air France/KLM)
- Virgin Atlantic Flying Club
- Qantas Frequent Flyer
- Finnair Plus
- SriLankan FlySmiLes (defer if time-boxed)

Plus Caribbean / Frontier / Allegiant / JetBlue as **simple fixed_route or zone closers** at the end.

---

## Open questions surfaced by the audit

1. **Two-slug programs (BA Avios)** — confirm canonical: chart authored on `ba-avios`, carrier rows use `british_airways`. Same pattern for `cathay` vs `cathay_pacific`, `aer-lingus` vs `aer_lingus`, etc. Need a one-time slug-cleanup migration before Phase 2 to deduplicate.

2. **AAnytime + saver coexistence** — recommend extending `ZonePartnerChart` with optional `anytime` cabin costs alongside saver, OR adding a top-level `tiers: { saver, anytime }` discriminator. Lightest schema change wins.

3. **JAL hybrid** — needs a design decision. Suggest: support multiple chart objects per program via `award_chart_structured.charts[]` array, each with its own `type`. Resolves JAL + AAnytime + any future hybrids.

4. **Programs out of v1 scope** — Korean SKYPASS, SriLankan, Frontier, Allegiant: limited authoring + small audience. OK to skip from initial chart authoring; surface "no chart yet" on the result row instead of 5k-50k lies.

5. **Sweet-spot anchoring** — Don't Sleep cards rely on `cost_miles_low/high` today. After Phase 3 switches, those cards should call the chart compute against the canonical route in the row's `region_or_route` text. May need a structured route hint (origin IATA + dest IATA) per Don't Sleep row.

---

## What's next

Sign-off needed on:
- [ ] Phase 2 batch ordering (above)
- [ ] Open question #3 (JAL hybrid → multi-chart pattern)
- [ ] Open question #2 (AAnytime + saver coexistence)
- [ ] Open question #1 (slug-cleanup migration before authoring)

Once signed off:
- Phase 1 ships: `programs.award_chart_structured jsonb` migration + `lib/awardChart.compute.ts` ported from `scripts/avios-pilot.mjs` + admin preview-compute endpoint
- Phase 2 batch 1 begins
