# The Points Hub — Spec

**Status:** Locked. Ready to build.
**Date:** 2026-05-04
**Owner:** Jill
**Tagline:** *"Like having a friend who actually gets points."*

---

## 1. Goal + positioning

Build "The Points Hub" — a central landing page at `/hub` that routes users to 6 decision-support tools. **Not** an award search engine. **Not** a chart calculator. A place to figure out the smart move before wasting 3 hours on seats.aero.

Core insight: optimize for **reducing regret**, not maximizing CPP. Users want fewer dumb moves more than they want the optimal one.

## 2. The Hub page

**URL:** `/hub`
**H1:** *The Points Hub*
**Tagline:** *"Like having a friend who actually gets points."*

7 large card-style blocks. Each block opens a sub-tool:

1. **Best Way to Book It** → `/hub/best-way-to-book`
2. **Should I Transfer?** → `/hub/should-i-transfer`
3. **Will My FNC Fit?** → `/hub/fnc-fit`
4. **Earn Path** → `/hub/earn-path`
5. **Don't Sleep On These** → `/hub/dont-sleep`
6. **Where Can My Points Take Me?** → `/hub/where-can-i-go`
7. **Alliance Explorer** → `/tools/alliances` *(existing)*

Tools not yet built render the card with "Coming soon" badge + email capture (tag-specific Resend list).

---

## 3. Schema additions

### 3a. partner_redemptions — 6 new columns

```sql
alter table partner_redemptions
  -- Complexity / friction signal
  add column complexity_score text
    check (complexity_score in ('easy','annoying','nerd_stuff')),
  -- The catch in plain language
  add column what_breaks_this text,
  -- Devaluation tracking
  add column devalued_at date,
  add column devaluation_note text,
  -- Availability reality (sparse — populate only HIGH-confidence cases)
  add column availability_reality text
    check (availability_reality in ('excellent','good','mixed','rare','unicorn')),
  -- Explicit deterministic route bucket
  add column route_bucket text;
```

**Population policy per column:**

| Column | Required? | When to populate |
|---|---|---|
| `complexity_score` | Yes | Every row. Default: `easy` for online + no surcharges; `annoying` for phone-only or per-segment traps; `nerd_stuff` for multi-carrier routings. |
| `what_breaks_this` | Optional | When there's a meaningful catch worth surfacing inline. |
| `devalued_at` + `devaluation_note` | Optional | Only when a devaluation has materially changed the redemption (e.g., Dec 2025 BA Avios) |
| `availability_reality` | Optional, **sparse** | Only when industry consensus is clear (excellent/unicorn). Otherwise NULL. |
| `route_bucket` | Yes | Every row. One bucket per row. Split rows when a chart cell spans multiple buckets. |

### 3b. Route bucket enum

```
us-short        — within US, under 700mi
us-medium       — within US, 700-2500mi
us-long         — within US, 2500mi+ (Hawaii, transcons, AK)
us-eu-east      — US East Coast to Europe (3001-4000mi)
us-eu-west      — US West Coast to Europe (4001-5500mi)
us-japan        — US to Japan / Korea
us-se-asia      — US to SE Asia / China / Taiwan
us-me-india     — US to Middle East / India
us-pacific      — US to Australia / NZ / Fiji
us-africa       — US to Africa
us-samerica     — US to South America
```

**Future buckets** (when authored): `intra-eu`, `intra-asia`, `eu-asia`, etc. Defer until non-US origins matter.

### 3c. Route → bucket mapping function

Pure function: `mapRouteToBucket(originIATA, destIATA): RouteBucket`

Logic:
1. Look up origin and destination airport metadata (country, region, IATA, lat/lon)
2. Compute great-circle distance
3. Apply rules:
   - Both US (incl. HI, AK) → distance band (short / medium / long)
   - US ↔ Europe → east/west by origin longitude
   - US ↔ Asia → split by destination region (Japan/Korea vs SE Asia/China)
   - US ↔ Middle East/India → `us-me-india`
   - US ↔ Australia/NZ/Pacific → `us-pacific`
   - US ↔ Africa → `us-africa`
   - US ↔ South America → `us-samerica`

Data: JSON file of ~500 most-relevant airports with `{iata, name, city, country, region, lat, lng}`.

---

## 4. Tool specs

### 4a. Should I Transfer? *(ship first)*

**URL:** `/hub/should-i-transfer`
**Question:** "Chase → BA bonus active. Worth it?"

**Inputs:**
- Source currency (Amex MR / Chase UR / Citi TY / Cap1 / Bilt) — required
- (Optional) target program if user has one in mind

**Output structure:**

1. **Active transfer bonuses** (queried from `alerts` where `type='transfer_bonus'` AND `status='published'` AND `end_date >= today`)
   For each, show:
   - "Transfer 100k UR + 25% bonus = 125k BA Avios"
   - "Equivalent to: 1 round-trip US-Europe J at 124k AA chart price"
   - "Days left: 12"
   - **"What breaks this deal"** warnings pulled from related `partner_redemptions.what_breaks_this`:
     - "⚠️ BA fuel surcharges $700+ on long-haul J"
     - "⚠️ Per-segment pricing — explodes on connections"
     - "⚠️ Recent devaluation Dec 2025 — bands 1-4 up 12-14%"
   - **Verdict chip:** "Worth it" / "Worth it for specific use cases" / "Probably skip"

2. **"Don't transfer right now" cases** when:
   - Better alternative program reaches same redemption without bonus
   - Active devaluation rumors / recent track record of nuking
   - High surcharges on the only useful operator

**Killer detail:** The verdict logic is contrarian on purpose. We're the calm adult in the room. "30% transfer bonus" doesn't mean "do it" — it means "check the math."

**Brand-voice microcopy starters:**
- "Yes, 30% bonus. No, that doesn't make BA fees stop being ridiculous."
- "Worth it. Transfer in chunks though — Amex → BA is instant, so no rush to dump all your points."
- "Skip this one. You'll never recover the value at BA's current chart."

---

### 4b. Will My FNC Fit?

**URL:** `/hub/fnc-fit`
**Question:** "Can my 35k Marriott Free Night Cert cover this hotel?"

**Inputs:**
- Cert type (radio):
  - Marriott 35k / 50k / 85k FNC
  - Hyatt Cat 1-4 / Cat 1-7
  - IHG anniversary (40k cap)
  - Hilton Premium FNC
- Hotel: name search OR brand + city dropdown

**Output:**

1. **Fit verdict** — Yes / Yes with topup / No, plus the exact topup amount
   - "Your 35k Marriott cert fits this property's 32k standard rate. Don't waste it on a property that costs less than ~25k."
   - "Your 50k cert is 8k short on peak dates. Top up with 8,000 Marriott points (allowed up to 15k topup)."
   - "This property exceeds your cert cap. Try [3 alternative properties] nearby that fit."

2. **Value score chip:**
   - **"Great use of a cert"** — cash rate ≥ $400 and cert cap ≥ rate
   - **"Fine"** — solid value
   - **"You're wasting it"** — cash rate is low; better save the cert for a higher-value property

3. **(Future) Expiration urgency**: when user enters cert expiration date, surface "expires in X days, here are the best realistic uses near you"

**Killer detail:** Marriott's own UI doesn't tell you "your cert is wasted on this $180 night." We do.

---

### 4c. Best Way to Book It *(flagship — ships in Phase 2)*

**URL:** `/hub/best-way-to-book`
**Question:** "I'm flying JFK→HNL. What's the smart move?"

**Inputs (default view — keep simple):**
- From (airport code, autocomplete)
- To (airport code, autocomplete)
- Cabin (Y / PE / J / F chips, default Y)
- *(Optional)* Date — single date or "flexible"
- *(Optional)* Points Wallet — multi-currency input
- *(Optional)* Operator filter

**Logic:**
1. Compute great-circle distance
2. `mapRouteToBucket(origin, dest)` → bucket
3. Query: `partner_redemptions where route_bucket = $bucket and cabin = $cabin`
4. If wallet set: tier into READY / ONE TRANSFER AWAY / NOT REACHABLE
5. Sort by `cost_miles_low` ascending within each tier

**Row card content** (reuses primitives from operator-page section):
- Program name + alliance color stripe
- Cabin badge
- Miles cost (with `~` prefix for dynamic)
- Cash fee chip (color-coded)
- **Reality Check chip** when `availability_reality` is set ("✅ Easy to book" / "⚠️ Unicorn")
- **Complexity chip** ("Easy" / "Annoying" / "Nerd stuff")
- `teach_caption` (italic, brand voice)
- `what_breaks_this` (red callout when set)
- **Where to search** ("Search on alaskaair.com →")
- **Confidence + last_verified** footer ("Verified May 2026 · HIGH")

**Killer detail:** "Why this weird option is secretly better" — surfaced via `teach_caption`. Plus the chip system tells users what they're signing up for in terms of friction.

---

### 4d. Earn Path *(ships in Phase 3, tightened scope)*

**URL:** `/hub/earn-path`
**Question:** "I need 70k Atmos for Hawaii. Fastest realistic way?"

**Inputs:**
- Target currency + amount
- *(Optional)* Current balances
- **Three buttons:** Fastest / Cheapest / Easiest

**Output (one ranked list per button):**

- **Fastest:** active transfer bonuses → instant transfers → near-term SUBs
- **Cheapest:** ratio-optimal transfers (avoid 5:1 hotel transfers) → no-AF cards → category bonuses
- **Easiest:** single-step transfers from currencies user already has → cards they're likely pre-approved for

**Scope cuts (per critique):**
- No hotel-airline transfer edge cases in v1 (defer)
- No time-to-goal speculative modeling
- No "earn from shopping portal" v1

**Killer detail:** Three buttons = three different recommendations. Most users want one, not all three. The framing acknowledges optimization is multi-dimensional.

---

### 4e. Don't Sleep On These *(ships in Phase 3)*

**URL:** `/hub/dont-sleep`
**Question:** "What are 2026's best redemptions?"

**Data source:** Hybrid — editorial curation + structured `partner_redemptions` rows + recent alerts.

**Schema add (TBD):** A small `sweet_spots` table OR a `is_sweet_spot bool` flag on partner_redemptions with curated editorial copy.

**Output:**
- Top 8-12 redemptions, grouped by region/cabin
- Each has:
  - Sweet Spot Health Score chip ("Stable" / "At risk" / "On life support")
  - "Why this still survives" framing (what makes it defensible)
  - What might kill it
  - One-tap to Best Way to Book It with route prefilled

**Killer detail:** "Survival odds" framing — points world is full of dying sweet spots, this surfaces which ones still work.

---

### 4f. Where Can My Points Take Me? *(ships LAST in Phase 4)*

**URL:** `/hub/where-can-i-go`
**Question:** "I have 100k Amex MR. Where's the best place to spend them?"

**Inputs:**
- Multi-currency Points Wallet — required
- *(Optional)* Departure region (defaults to "any US")

**Logic:** Reverse query of Best Way to Book It. For each currency the user holds (or can transfer to):
- Find redemptions where the user's balance is sufficient
- Surface highest-value ones first (sorted by *realistic usefulness*, NOT cpp)

**Output groups:**
- "Use directly" (sufficient balance in destination program)
- "One transfer away" (instant or 24-hour transfer)
- "Worth earning toward" (small gap, high value)

**Architecture: shares engine with Don't Sleep On These.** Same ranking + filter logic, different framing.

**Future v2:** Mood-based discovery — "beach," "lie-flat," "no fuel surcharges," "weekend." Filter chips on top of the engine.

---

## 5. Build phases

### Phase 0 — Foundation (~1 day)
- Migration 083: add 6 new columns to `partner_redemptions`
- Migration 084: backfill `complexity_score` + `route_bucket` for AA's 115 rows (mechanical from existing data)
- Update `plans/airline-page-runbook.md` Step 6.5 with the new columns + availability_reality policy
- Update `ACTIVE-BUILD.md`: newsletter done; Hub is next phase
- JSON airport dataset added at `data/airports.json`

### Phase 1 — Hub + Should I Transfer? (~3-4 days)
- `/hub` page with 7 block cards + tagline
- 5 stubs with email capture (Resend tag-specific list)
- `/hub/should-i-transfer` live with full UX
- New verdict-chip primitive

### Phase 2 — FNC Fit + Best Way to Book It (~5-6 days)
- `/hub/fnc-fit` with cert-type input + property search + fit math
- `/hub/best-way-to-book` with airport input + Wallet + 3-tier output
- Shared route bucket logic
- Reality Check + Complexity chips render across all rows

### Phase 3 — Don't Sleep + Earn Path (~5-6 days)
- `/hub/dont-sleep` with curated sweet spots (build small `sweet_spots` table)
- `/hub/earn-path` with 3-button output

### Phase 4 — Where Can My Points Take Me? (~4-5 days)
- `/hub/where-can-i-go` built on the Don't Sleep engine
- Wallet-driven personalization

### Phase 5+ — Tier 2 tools
- Build My Travel Stack
- Is This Still a Sweet Spot?
- Status Match Finder
- Transfer Bonus History

---

## 6. Brand voice microcopy starters

For consistency across tools. Author teach_captions and verdicts in this voice.

**Anchor phrases (reuse, don't overuse):**
- "Don't sleep on this."
- "The smart move is..."
- "Skip unless..."
- "Worth it if..."
- "We did the math so you don't have to."

**Verdict tones:**
- "Yes, but..." — qualifying praise
- "Skip this one." — direct rejection
- "Calm down." — counterweight to hype
- "It's a trap." — strong negative

**Reality Check chip text:**
- "Excellent" → "Easy to book"
- "Good" → "Usually open"
- "Mixed" → "Worth a search"
- "Rare" → "Set an alert"
- "Unicorn" → "Don't count on it"

**Complexity chip text:**
- "Easy" → green chip
- "Annoying" → yellow chip
- "Nerd stuff" → grey chip (worn as a badge of honor for the pros)

---

## 7. Decisions locked (no re-litigation)

1. ✅ Name: **The Points Hub** at `/hub`
2. ✅ Tagline: ***"Like having a friend who actually gets points."***
3. ✅ 6 Tier 1 tools + Alliance Explorer = 7 blocks
4. ✅ Build order: Should I Transfer? first, then FNC Fit + Best Way, then Don't Sleep + Earn Path, then Where Can My Points Take Me?
5. ✅ Schema: 6 new columns on partner_redemptions
6. ✅ `availability_reality` populated **sparsely** — only HIGH-confidence cases. NULL means no chip rendered.
7. ✅ Block 6+2 share engine, two surfaces
8. ✅ No zero-input default for v1 — tools require inputs
9. ✅ No metrics for v1 (free Vercel Analytics if needed later)
10. ✅ ACTIVE-BUILD updates to Hub phase; newsletter done
11. ✅ Email capture on "Coming soon" stubs (Resend tag-specific lists)
12. ✅ Drop "Best Card For My Route" → defer to Tier 2 as "Build My Travel Stack" with ecosystem-first framing

---

## 8. Open scope decisions (resolve as we build)

- `sweet_spots` table schema (Phase 3 design)
- Email capture tag taxonomy in Resend
- Hub card visual treatment (icons? illustrations? text-only?)
- Airport dataset license + source (likely OpenFlights public domain or similar)

---

## 9. Anti-patterns (reaffirmed, no exceptions)

- ❌ Live award availability search
- ❌ "Best CPP" calculators
- ❌ Generic "Best Credit Cards" SEO content
- ❌ Massive dynamic award calendars without real availability
- ❌ Flight deal feeds
- ❌ Anything that competes head-on with seats.aero / ExpertFlyer / Point.me on inventory data
