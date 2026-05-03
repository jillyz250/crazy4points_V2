# Ways To Book — Tool Plan

**Status:** Open questions locked. Ready to build Tier 1.
**Author:** Claude + Jill
**Date:** 2026-05-03 (last updated)
**Owner:** Jill

---

## 1. Goal

Build a **redemption decision guide** (not a chart calculator) that answers a single question:

> "I want to fly **[operator]** from **[A]** to **[B]**. What are all the ways to pay with miles, and how do I get the miles I'm missing?"

It must educate as it answers. The #1 confusion in points travel is the **saver-vs-dynamic distinction** — partners can only book "saver" award space, but most travelers don't know that. The tool's flow makes this concrete.

**Why "decision guide" not "chart calculator":** in 2026, partner award redemption is *constrained optimization over incomplete inventory*, not a chart lookup. The cheapest published chart isn't always the best program — different partners see different award space for the same flight. The tool's pre-check step (telling users to verify saver inventory on the operator's own site first) and the per-row `teach_caption` column (surfacing inventory-visibility nuance like *"Cheapest chart on paper, but BA sees less AA award space than Alaska"*) are how the tool acknowledges this reality without pretending to know live availability.

**Long-term goal:** every airline on the site (~100+ programs) is covered. Tier 1 ships v1; Tier 2 + Tier 3 fill in via the editorial flywheel. See §14 for the tier roadmap and reminder system.

---

## 2. The user flow (the "kick ass" decision tree)

```
INPUT: origin, destination, operator, date (optional), points-I-have (optional)
  │
  ▼
PRE-CHECK: "Before anything else, check [operator].com for SAVER award space."
           [Deep-link to operator's award search prefilled with route + date]
           1-line teach: "Saver = the low-mile bucket. Partners can ONLY book saver."
  │
  ▼
USER PICKS A BRANCH:
  ⓐ "Saver shows on operator.com"
  ⓑ "Only dynamic / Web Special pricing shows"
  ⓒ "Nothing available"
  │
  ▼
OUTPUT (per branch):
  ⓐ Full ranked partner table (Alaska 4.5k, BA 7.5k, ...)
  ⓑ "Partners can't touch this seat. Your real options: AA Web Specials,
     cash-back redemption (Cap One, Bilt), or wait."
  ⓒ "Set a saver alert. Try ±3 days. Try a connecting hub."
```

Under each row in the ranked table:
- **Earn path panel** — top 3 paths to get this currency, expandable to all paths
- **Teach caption** — 1-line explainer of when this redemption is a good/bad deal

If the user filled the Points Wallet (§11), the ranking groups results into ✅ READY / ⚠️ ONE TRANSFER AWAY / ❌ NOT REACHABLE.

---

## 3. Data model

### 3a. New fields on `programs` (operators)

```sql
alter table programs
  add column partner_access text check (partner_access in
    ('YES_STRONG','YES_LIMITED','YES_RESTRICTED','HYBRID','NO')),
  add column partner_access_notes text,
  add column saver_search_url_template text;
```

| Field | Type | Example |
|---|---|---|
| `partner_access` | enum text | `'YES_STRONG' \| 'YES_LIMITED' \| 'YES_RESTRICTED' \| 'HYBRID' \| 'NO'` |
| `partner_access_notes` | text | "Only true saver — Web Specials NOT bookable by partners" |
| `saver_search_url_template` | text | `https://www.aa.com/booking/find-flights?...` (deep link with placeholders) |

**Tier definitions (UI badge color + tool messaging):**
- `YES_STRONG` — Reliable partner saver inventory. Tool ranks normally. (Green badge.)
- `YES_RESTRICTED` — Saver shared, but with carve-outs (cabin-specific timing, dynamic pricing not visible to partners). Tool ranks + 1-line caveat. (Yellow badge.)
- `YES_LIMITED` — Technically open, practically constrained. Tool ranks + warns "search hard, availability scarce." (Yellow badge.)
- `HYBRID` — Some partners can book, most can't. Tool only surfaces options for the partners that actually work. (Yellow badge.)
- `NO` — No partner award booking. Tool excludes from ranking. (Grey badge — "Cash, own miles, or transferable points portals only.")

### 3b. New table: `award_booking_options`

```sql
create table award_booking_options (
  id uuid primary key default gen_random_uuid(),
  booking_program_id uuid not null references programs(id),  -- e.g. Alaska Mileage Plan
  operator_program_id uuid not null references programs(id), -- e.g. American Airlines
  chart_type text not null check (chart_type in ('distance','region','dynamic','partner-fixed')),
  sample_rates jsonb not null,
  fuel_surcharges text not null check (fuel_surcharges in ('none','low','high')),
  bookable_online boolean not null,
  booking_channel text,                  -- 'ba.com', 'phone only', etc.
  requires_saver_space boolean not null,
  non_saver_fallback text,
  routing_rules text,
  teach_caption text not null,
  notes text,
  last_verified_at date not null,        -- freshness signal — partnerships drift
  verified_by text,                      -- 'jill' | 'claude+chatgpt-2026-05'
  unique (booking_program_id, operator_program_id)
);

create index idx_abo_operator on award_booking_options(operator_program_id);
create index idx_abo_booking on award_booking_options(booking_program_id);
create index idx_abo_stale on award_booking_options(last_verified_at);
```

A future cron flags rows where `last_verified_at` is older than 180 days for re-verification.

**`sample_rates` shapes by `chart_type`:**

```json
// distance — Alaska, Avios, Aeroplan
{ "tiers": [
  { "max_miles": 700, "miles": 4500 },
  { "max_miles": 1400, "miles": 7500 },
  { "max_miles": 2100, "miles": 10000 }
]}

// region — JAL, ANA, Etihad
{ "regions": [
  { "from": "USA", "to": "USA-short", "miles": 7500 },
  { "from": "USA", "to": "Hawaii",    "miles": 17500 }
]}

// dynamic — AA Web Specials, UA, DL, Flying Blue
{ "min": 9000, "typical": 12500, "note": "Web Specials sometimes 5-7k" }

// partner-fixed — Virgin Atlantic specific routes
{ "miles": 25000, "note": "Flat rate any-distance domestic" }
```

For hotels (when scope expands): `chart_type` adds `'category-fixed'` (Hyatt) and `'category-dynamic-with-cap'` (Marriott). FNC matching gets its own JSON shape under `fnc_options`. See §15.

### 3c. Existing dataset (no changes)

`programs.transfer_partners` (inbound transfers) — already powers the **earn path** panel. Reverse-query to find "which currencies transfer into Alaska?"

---

## 4. Scope — Tier 1 (v1 launch)

### Tier 1 Operators — 13 (verified 2026)

| Operator | Region | partner_access | Notes |
|---|---|---|---|
| American (AA) | US | `YES_RESTRICTED` | Only true saver — Web Specials NOT bookable by partners |
| United (UA) | US | `YES_STRONG` | Saver (X/I/O) released; expanded XN inventory NOT visible to partners |
| Delta (DL) | US | `YES_LIMITED` | Releases partner space but extremely constrained; VS/AF best access |
| Alaska (AS) | US | `YES_STRONG` | oneworld member since 2021; broad partner release |
| JetBlue (B6) | US | `HYBRID` | Qatar Avios → JetBlue works; most other programs do not |
| Southwest (WN) | US | `NO` | No alliance, no partner redemption |
| British Airways (BA) | EU | `YES_STRONG` | Standard oneworld release; surcharges vary by booker |
| Air France / KLM (AF/KL) | EU | `YES_STRONG` | Core SkyTeam, standard saver release |
| Lufthansa (LH) | EU | `YES_RESTRICTED` | F-class restricted to ~14 days out; J/Y broadly available earlier |
| Japan Airlines (JL) | APAC | `YES_STRONG` | Consistent oneworld release |
| ANA (NH) | APAC | `YES_STRONG` | Star Alliance saver release |
| Emirates (EK) | ME | `YES_RESTRICTED` | Tightly controlled; Aeroplan = broad access, Alaska = reduced post-2024 |
| Qatar (QR) | ME | `YES_STRONG` | Best access via Avios programs; oneworld saver release |

### Tier 1 Booking programs — 15

| Program | Books which operators | Chart type |
|---|---|---|
| AAdvantage (AA) | AA + oneworld | dynamic + partner-region |
| Mileage Plan (AS) | AA, JL, BA, AF/KL, LH, QR + more | per-partner distance charts |
| MileagePlus (UA) | UA + Star Alliance | dynamic |
| SkyMiles (DL) | DL + SkyTeam | dynamic |
| Avios (BA / Iberia / Aer Lingus / Qatar shared) | oneworld + Avios partners | distance (zone) |
| Flying Blue (AF/KL) | SkyTeam + partners | dynamic |
| Aeroplan (AC) | UA + Star Alliance + 45 partners | distance |
| Virgin Atlantic Flying Club | DL, ANA, KE, more | region/partner-fixed |
| ANA Mileage Club | UA + Star Alliance | region (round-trip only) |
| JAL Mileage Bank | AA + oneworld | region |
| Etihad Guest | AA, partners | partner-fixed |
| Turkish Miles & Smiles | UA + Star Alliance | region |
| **Cathay Asia Miles** | oneworld + non-alliance partners | distance |
| **Singapore KrisFlyer** | Star Alliance + partners | region |
| **Avianca LifeMiles** | UA + Star Alliance | region |

**Tier 1 row estimate:** ~13 operators × 15 booking programs = 195 max cells, but many invalid combos. **Realistic: 80-120 valid rows.**

---

## 5. Surfaces (where the tool lives)

**Primary:** `/tools/ways-to-book` — standalone tool with input form + decision tree.

**Secondary:** Auto-rendered "Ways to book me" section on each operator's `/programs/[slug]` page (filters `award_booking_options` by operator).

**Tertiary:** "What this currency can book" reverse view on each booking-program's page.

**Coverage badge:** Small "Coverage: X of Y operators · Z booking programs" line under the input form, auto-updated by querying the table. Sets honest expectations and gives return visitors a "filling in the map" feeling.

**Empty-state copy** (when user picks an operator with 0 rows):
> "We haven't authored partner-booking data for [operator] yet. What we know: [show transfer_partners-derived earn paths if available]. Check back as we expand coverage."

---

## 6. Build phases

### Phase 1 — Schema + AA end-to-end (~1 week)
- Migration: add 3 columns to `programs`, create `award_booking_options` table with indexes.
- Seed `partner_access` + notes + `saver_search_url_template` for all 13 Tier 1 operators (data already in §4 — just SQL it).
- Author **AA's full row set** (~10-15 rows: AAdvantage, Alaska, BA Avios, Cathay, JAL, Etihad, Qatar, Aeroplan, ANA, others where relevant).
- Build `/tools/ways-to-book` with input form + branching decision tree, working end-to-end **for AA only**.
- Ship behind no flag — tool is live, coverage badge says "1 of 13 operators."

### Phase 2 — Add UA + AS (~3-5 days)
- Author UA's row set (Star Alliance bookers).
- Author AS's row set (oneworld bookers, including the per-partner distance charts).
- Coverage now: 3 of 13 US carriers.

### Phase 3 — Points Wallet (~3-5 days)
- Multi-currency wallet form (chip + number inputs).
- localStorage persistence.
- Re-rank logic: ✅ READY / ⚠️ ONE TRANSFER AWAY / ❌ NOT REACHABLE tiers.
- Email-capture moment: "Save wallet across devices" → newsletter funnel.

### Phase 4 — Trip type + mix-and-match (~3-5 days)
- One-way / round-trip / mix-and-match toggle (default one-way).
- Side-by-side outbound/return tables for mix-and-match.
- Split-ticket IRROPS warning (§12).

### Phase 5 — Operator + currency page integration (~3-5 days)
- "Ways to book me" auto-section on `/programs/[slug]` for `type=airline`.
- "What this currency can book" reverse section.
- Cross-links between operator and booking-program pages.

### Phase 6 — Add DL + B6 + WN (~3 days)
- Author DL's constrained row set (VS, AF, KE, AM, WS).
- Author B6's HYBRID single row (Qatar Avios).
- WN gets a NO empty-state.
- Tier 1 US coverage: complete.

### Phase 7 — International Tier 1 (~1-2 weeks)
- Author rows for BA, AF/KL, LH, JL, NH, EK, QR.
- Tier 1 launch: complete.

### Phase 8 — Tier 2 trigger
- See §14. When Tier 1 hits 90% row coverage, surface the Tier 2 starter prompt.

**Deferred to later phases:**
- Live availability scrape (seats.aero, ExpertFlyer).
- Multi-segment routing modeling.
- Hotel awards (separate tool, §15).
- Saver-alert subscriptions ("notify me when AA saver opens DTW→CMH").
- Auth-synced wallet (currently localStorage).

---

## 7. Per-row research checklist

For each `(booking_program, operator)` pair, the author confirms with at least one current source (≤90 days old):

1. ☐ **Can this program book this operator at all?** (yes / no — kill row if no)
2. ☐ **Chart type** — distance / region / dynamic / partner-fixed
3. ☐ **Sample rates** — pull current published chart, capture as JSON
4. ☐ **Fuel surcharges** — none / low / high (BA long-haul = high, EK premium = high, LH F = high)
5. ☐ **Bookable online?** — yes / phone-only / hybrid
6. ☐ **Requires saver space?** — almost always yes for partners; no for own-program dynamic
7. ☐ **Non-saver fallback** — does the program offer dynamic pricing when saver is gone?
8. ☐ **Routing quirks** — per-segment pricing, max stopovers, region restrictions
9. ☐ **Teach caption (1 line)** — when this is a good/bad deal
10. ☐ **Stamp `last_verified_at = today` and `verified_by`**

---

## 8. Open questions — LOCKED

| # | Question | Decision |
|---|---|---|
| 1 | Junction table vs JSON column? | **Junction table** (`award_booking_options`). Bidirectional queries + typed metadata. |
| 2 | Date input — required? | **Optional.** Helps prefill saver-search deep link; not required for ranking. |
| 3 | Connections in v1? | **Defer to v2.** v1 = single-segment. Connection-relevant rules (Avios per-segment, Aeroplan stopover) ride as text captions. |
| 4 | Operator scope final? | **13 for Tier 1.** Spirit dropped. Tier 2/3 expand later (see §14). |
| 5 | Earn-path panel depth? | **Top 3 + collapsible "see all".** Sort by user friction (instant > 24h > card SUB). |
| 6 | Affiliate hooks? | **Slot now, populate later.** Component checks `programs.affiliate_url`; falls back to issuer URL. |
| 7 | Per-airline verification? | **Hard rule** — Step 6.5 in airline runbook (§13). Stamp `last_verified_at` every row. |

---

## 9. Verification status (ChatGPT 2026 pass — locked unless re-verified)

### Operator partner-access flags — LOCKED (see §4)
Big corrections from initial draft: DL = `YES_LIMITED` (was NO), B6 = `HYBRID` (was NO), LH restriction is F-class only (was generalized), AS chart is per-partner (was one unified tier).

### US-domestic partnerships — LOCKED
- **AA + JetBlue NEA** — DEAD. No award reciprocity.
- **UA + JetBlue Blue Sky** — earn/status only. Treat as NO award redemption for tool v1.
- **AA + AS** — full reciprocity, both directions.
- **AS + HA / Atmos** — joint program live but FFP/IT integration NOT fully merged 2026. Flag in copy.
- **DL partners** — LATAM, Aeromexico, Virgin Atlantic, Korean Air, WestJet ALL bookable; availability varies (VS = strongest).

### Booking-program rules — LOCKED
- **Avios** — distance-based, per-segment pricing on connections still in force.
- **Alaska Mileage Plan** — distance-based BUT partner-specific charts (each AS→Operator pair = its own chart).
- **Aeroplan** — 5,000-pt stopover rule still active.
- **ANA Mileage Club** — partner awards still round-trip only.
- **Virgin Atlantic Flying Club** — still valuable for ANA + select partners; Delta pricing significantly devalued.
- **Etihad Guest** — still usable for AA but devalued/inconsistent. Surface with caveat.

### Hotel chart rules — LOCKED (for §15 hotel scope)
- **Hyatt** — Cat 1-8, off/std/peak chart in force.
- **Marriott** — dynamic, FNC top-up up to 15k pts, FNC tiers 35k/50k/85k.
- **Hilton** — fully dynamic; Premium Room awards = variable.
- **IHG** — 40k FNC cap, top-up allowed.
- **Wyndham** — flat 7.5k/15k/30k chart still active.

### Remaining unknowns (handled per-row during research)
- Per-partner Emirates surcharge severity (Aeroplan vs Alaska vs others).
- Atmos integration milestones (FFP merger date, pricing chart unification).
- Avios 2023 zone-boundary post-revamp confirmation.

---

## 10. Why this is a 10× tool, not a 1× tool

The points world has hundreds of blog posts saying *"redeem AA flights with Alaska miles."* Nobody has built **the decision tree from a real route to a ranked, earn-path-aware list of options that respects whether saver award space actually exists.**

That's the kick-ass part: it doesn't pretend to know live availability, but it teaches the user the exact question to ask AA.com (saver yes/no?) and then takes them the rest of the way. Once `award_booking_options` is populated, the same data powers a dozen secondary surfaces (operator pages, currency pages, sweet-spot rankings, transfer-bonus alerts).

---

## 11. Points Wallet — UX spec

User can optionally enter their balances, and the ranking adapts.

### Form

```
Your points (optional, but unlocks personalized ranking)

[+ Add currency]   Autocompletes against programs table

  Amex MR     [ 100,000 ]   ✕
  Chase UR    [  20,000 ]   ✕
  Alaska      [  15,000 ]   ✕
  AAdvantage  [  30,000 ]   ✕

  [ Save wallet ]   ← stored in localStorage, persists across visits
```

### Storage

**v1:** localStorage. JSON shape `{ "<program_slug>": <balance> }`. Never leaves the browser.
**v2 (when subscriber auth lands):** sync to `subscribers.points_wallet jsonb`.

### Email-capture moment
After entering 3+ currencies: "Want to save your wallet across devices? Drop your email." → newsletter funnel.

### Re-ranking algorithm

For each `award_booking_options` row, compute:

```
hasDirect       = walletBalance(bookingProgram) >= milesCost
isOneTransfer   = exists(transfer_partner) where:
                    walletBalance(partner.from_slug) >= milesCost / partner.ratio
                    AND partner is instant or near-instant
isReachable     = any path through transfer_partners eventually reaches the program
notReachable    = otherwise
```

Output groups:
- ✅ **READY TO BOOK** — `hasDirect = true`
- ⚠️ **ONE TRANSFER AWAY** — `isOneTransfer = true` (show the transfer instructions)
- ❌ **NOT REACHABLE FROM YOUR WALLET** — show earn paths (card SUBs, hotel transfers)

### Bonus features the wallet unlocks
1. Transfer-bonus alert relevance (existing alerts system).
2. Sweet-spot suggestions — "You have 100k Amex. Here are 5 redemptions you can book today."
3. Card-app guidance — "You're 30k short of Alaska's 80k Hawaii sweet spot. The Alaska 80k SUB closes the gap exactly."
4. Expiration warnings (later, requires last-activity dates).

---

## 12. Trip type & mix-and-match

### Toggle

```
Trip type:  ◉ One-way    ○ Round-trip    ○ Mix & match (best currency each direction)
```

**Default: one-way.** Most modern award charts price each direction independently anyway.

### Mix & match output

User enters origin, dest, AND a return date. Tool shows two ranked tables side-by-side:

```
NYC → CMH (outbound)         CMH → NYC (return)
─────────────────────         ─────────────────────
Alaska     4,500 ⭐           BA Avios   7,500 ⭐
BA Avios   7,500              Alaska     4,500
AA direct  9,000              AA direct  9,000
```

Summary line: "Best mix: Alaska 4,500 mi out + BA Avios 7,500 mi back = 12,000 miles total + ~$11.20 in fees."

If both directions price best on the same currency, the tool just says "Both directions on Alaska — 9,000 mi total."

### Split-ticket IRROPS warning

Triggered when the recommended option mixes 2+ programs OR 2+ operating airlines:

```
⚠️ Heads up about split-ticket bookings

You're flying separate tickets — outbound on Alaska, return on American.
If your outbound is delayed or canceled and you misconnect to the return,
the second airline owes you nothing. They didn't sell you a connection.

Mitigations:
• Build in a long buffer between segments (overnight or full day if domestic)
• Carry-on only — checked bags don't transfer between separate tickets
• Travel insurance with trip-delay coverage helps
• Book both legs on the same airline (or program) if your trip is tight

Single-ticket round-trip protection only applies when both segments are on
ONE confirmation number, regardless of who issued the miles.
```

The last line is the nuance most blogs get wrong: **protection follows the ticket, not the currency.** Round-trip on Alaska miles for two AA flights = ONE confirmation = protected. Two one-ways = TWO confirmations = NOT protected.

---

## 13. Per-airline runbook addendum (Step 6.5)

Add to [plans/airline-page-runbook.md](airline-page-runbook.md). Triggers automatically when the `add-airline` skill is used for any airline (or hotel — see §15).

### Step 6.5 — Award booking options

For each airline page being authored or refreshed:

**Sub-step 6.5a — Verify operator-level partner_access**
- Pull one current source (TPG/OMAAT/Frequent Miler dated within 90 days, or program's own site).
- Confirm or update `programs.partner_access` and `partner_access_notes`.
- Update `saver_search_url_template` if the operator changed their search URL.

**Sub-step 6.5b — Author award_booking_options rows**
- For each booking program in the Tier 1 list (and any Tier 2 booker that's already authored), determine whether it can book this operator.
- For each YES, fill the §7 9-field checklist + sample rates.
- Skip rows where the booker can't price this operator (kill row, don't insert).

**Sub-step 6.5c — Stamp freshness**
- Set `last_verified_at = today` and `verified_by = '<author>'` on every row touched.

**Sub-step 6.5d — Cross-check reverse direction**
- If the airline being authored is ALSO a Tier 1 booking program (e.g. authoring AA also means AAdvantage as booker), author its rows pricing OTHER operators.

This keeps data fresh and grows the tool's coverage as a side effect of the existing per-airline editorial flow.

---

## 14. Tier progression & reminder system

### Tier definitions

| Tier | Operators | Booking programs | Goal |
|---|---|---|---|
| **Tier 1 (v1)** | 13 priority | 15 priority | Ship working tool covering 90% of US-traveler decisions |
| **Tier 2** | ~30-40 mid-traffic | ~10-15 niche-but-real | Add operators + bookers with real but secondary value |
| **Tier 3** | ~50+ long tail | ~15-25 long tail | Indefinite — fill in via runbook flywheel |

### Tier 1 → Tier 2 transition gate

**Trigger condition:** Tier 1 has reached 90% row coverage (≥108 of ~120 valid rows authored), AND all 13 operators have at least one row, AND all 15 booking programs have at least one row.

**Action when triggered:**
1. Surface a Tier 2 starter prompt to Jill: "Tier 1 is at 90%. Ready to start Tier 2?"
2. Tier 2 expansion plan auto-generated (operators sorted by traffic data once available, or by editorial priority).

### Tier 2 candidates

**Tier 2 operators (~30-40):** Aer Lingus, Iberia, SAS, EVA, Asiana, Aeromexico, Aegean, Etihad-as-operator, Qantas, Air New Zealand, Avianca-as-operator, Copa, Cathay-as-operator, Singapore-as-operator, LATAM, Korean Air, Virgin Atlantic-as-operator, plus more.

**Tier 2 booking programs (~10-15):** Iberia Avios (Madrid sweet spots), Aer Lingus Avios (transatlantic), Qantas Frequent Flyer, Finnair Plus, Lufthansa Miles & More, EVA Infinity, Aegean Miles+Bonus, Velocity (Virgin Australia), Emirates Skywards (own-metal-only most of the time), JetBlue TrueBlue (HYBRID), plus more.

### Tier 2 → Tier 3 transition gate

**Trigger condition:** Tier 2 reaches 75% coverage AND any Tier 3 operator gets queried by ≥3 users in a month (analytics data, future).

**Action when triggered:** Tier 3 long-tail flywheel kicks in via runbook only — no upfront batch authoring. Each new airline page authored adds rows to the tool naturally.

### Reminder mechanism

Three independent triggers ensure tier progression doesn't get forgotten:

1. **Plan doc** (this file) — Tier definitions and triggers documented here. Re-read at session start when work resumes.
2. **Memory entry** — `project_ways_to_book_tiers.md` saved to user memory, indexed in MEMORY.md. Future Claude sessions surface tier status proactively when "ways to book," "award booking," or "partner transfers" comes up.
3. **Database query** — coverage stats queryable any time via:
   ```sql
   select count(*) as rows,
          count(distinct operator_program_id) as operators_covered,
          count(distinct booking_program_id) as bookers_covered
   from award_booking_options;
   ```
   When Tier 1 hits 90%, the value of the next tier becomes obvious.

### End state

All ~100 airlines on the site have `partner_access` set. Each has a "Ways to book me" section on its `/programs/[slug]` page (rendered from rows OR an empty-state if no partners). The standalone `/tools/ways-to-book` covers everything. The tool grows alongside the editorial — every page write touches this dataset.

---

## 15. Hotel scope (deferred to v2)

Same architecture extends to hotels with chart-type additions:

- `chart_type` adds `'category-fixed'` (Hyatt) and `'category-dynamic-with-cap'` (Marriott).
- New JSON shape `fnc_options` — Free Night Certificate matching (Marriott 35k/50k/85k, Hyatt Cat 1-4/1-7, IHG anniversary 40k cap).
- For most hotels, `booking_program_id == operator_program_id` (you book Hyatt with Hyatt points), so the table is mostly self-references.
- Killer feature: "Will my FNC fit?" calculator — input dates + hotel + FNCs held → yes / yes-with-topup / no.

Hotel Tier 1 candidates: Hyatt, Marriott (already authored). Tier 2: Hilton, IHG, Wyndham, Choice, Accor.

Defer until airline tool ships and is stable.

---

## 16. Why tier-gating beats batch upfront

A 200-row upfront research project is brittle: it gets stale before it ships, blocks the v1 launch behind editorial, and teaches you nothing about whether the tool's UX actually works.

A 100-row Tier 1 launch with a hard gate to Tier 2 means: the tool is in users' hands fast, the data refresh cycle starts day one, and the "filling in the map" coverage badge becomes a visible product surface that motivates editorial work for everyone (including future Claude sessions doing per-airline authoring).
