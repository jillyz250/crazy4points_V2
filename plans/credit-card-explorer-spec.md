# Credit Card Explorer — Spec

_Status: draft for review · 2026-06-24_

## 1. Why this exists

We already have a **Credit Card Finder** at `/cards` ([`components/cards/CardFinder.tsx`](../components/cards/CardFinder.tsx)). It is **intent-first**: the page opens with a "Start here → choose your filters" CTA and shows nothing until the user picks filters and presses Search. That's the right shape for *"I know what I want."*

What's missing is the **browse-first** counterpart — the user who wants to *see the landscape*, sort it, and compare a few cards before committing to filters. Today there is:

- **No default browsable view** — the full set of ~90 cards is gated behind the filter funnel.
- **No sorting** — results are fixed to `authored-first, then fee ascending` ([`CardFinder.tsx:166`](../components/cards/CardFinder.tsx)). You can't sort by welcome bonus, fee, or top earn rate.
- **No comparison** — no way to put 2–3 cards side by side.
- **Heavy reliance on text tiles** — card art is a known backlog item (no images on any of the 86 cards; copyrighted, don't scrape). Tiles must stay data-rich, not image-led.
- **~47/90 cards unauthored** — render as greyed "Coming soon," so any browse view must degrade gracefully.

The Explorer is the answer to *"just show me what's out there and let me poke at it."*

## 2. Recommended architecture

**Unify, don't fragment — but Explore is the primary experience, Refine is "Advanced filters."** (Refined after Copilot review, 2026-06-24.) Evolve `/cards` into a single surface where:

- **Explore (default, primary)** — _"browsing a shelf."_ All cards visible immediately as a sortable, lightly-filterable grid. Quick-filter chips (issuer, card type, fee band, "no FX," "has lounge") sit inline above the grid and apply **live** (no Search button). A sort dropdown drives order.
- **Refine (secondary, framed as "Advanced filters")** — _"operating a machine."_ The deep filter panel (program target, full benefit taxonomy, earn categories) that **already ships today as the entire current Finder**. Kept behind an "Advanced filters" button, NOT presented as a co-equal mode toggle. Still uses draft→Search because these filters are heavyweight and intent-driven.

> **Scope reality check (correcting a Copilot assumption):** Refine is not new work — the current `/cards` page *is* Refine. This project adds **one** new layer (Explore) on top of proven code and reframes the existing panel. We are not "building three products at once."

**Routing & SEO.** One canonical route `/cards`; applied filters live in query params (no separate canonical tags per filter state). Explore is the default render and must emit real card HTML server-side (the page is already a Server Component handing data to the client grid — keep it that way; never a blank-until-hydration grid). Optional `?mode=refine` to deep-link the advanced panel. Existing deep-link params (`?program=`, `?benefits=`, `?earns=`, `?fee=`) keep working. Metadata reframed from "Finder" → "Explorer/Browse."

The program-target grouping ("Earns X directly" vs "Transfers to X") stays exactly as built and becomes one possible result shape.

### 2.1 State model (locked, per Copilot)
Same `Filters` TypeScript shape, two roles — _"same vocabulary, different grammar":_
- `applied` — canonical filters currently driving the grid. **Explore mutates `applied` live.** Only `applied` is reflected in the URL.
- `draft` — Refine's own working copy, **seeded from `applied` when the panel opens**. Commits to `applied` on Search; discarded on close/cancel.

This is the pattern the current `CardFinder` already implements ([`CardFinder.tsx:140`](../components/cards/CardFinder.tsx)) — formalize it, don't reinvent it. Filtering/sorting is extracted into a **pure function** `(cards, filters, sort) => cards[]` so it can relocate server-side later without a rewrite (escape hatch for >300–400 cards).

## 3. Features (scoped)

### 3.1 Browse-first default grid
- On load, show all active, open, non-closed cards (same dataset as `listCardsForFinder`, [`queries.ts:2624`](../utils/supabase/queries.ts)).
- **All 88 cards are authored** (verified 2026-06-24; the "Coming soon" greying was a bug — see appendix). The greyed-tile mechanism is retained only as a guard for genuinely-skeletal *future* cards (no `intro`); in practice nothing is greyed today.

### 3.2 Sorting (new)
A sort `<select>` over the in-memory dataset (~88 rows — no server round-trip). Logic lives in the **pure filter/sort function** (§2.1):
- **Most relevant** (default) — current `authored-then-fee` behavior. _(Note per Copilot: "relevance" will grow into real ranking logic — keep it isolated in the pure function so it can move server-side.)_
- **Annual fee: low → high** / **high → low** (every card has a fee — no null handling needed).
- **Welcome bonus value** — `sub.estimated_value_usd` desc (nulls last). Per the no-derived-math memory, display only the official bonus figure; sort on the stored estimate.
- **Top earn rate** — `topEarn[0].multiplier` desc.

### 3.3 Quick filters (inline, live)
Lightweight chips that filter without the Search button: card type (All/Personal/Business), issuer, **fee bands**, no-FX, lounge access. A subset of the existing `passes()` logic. **Fee uses bands, not a slider** (decision §7.1): `$0 · $1–95 · $96–250 · $251–550 · $551+` — tappable, mobile-friendly, maps to how people think about fees. The continuous slider is retired.

### 3.4 Compare tray (new) — mobile-first layout (per Copilot)
- Each tile gets a clear "Compare" affordance (a labeled pill, not a tiny checkbox). Cap at **3** cards.
- **Tray:** collapsed = a small sticky pill ("Compare 2 cards") that expands on tap to show selected cards with remove buttons + a primary "Compare" CTA. First add fires a subtle toast ("Added to compare — pick up to 2 more").
- **Comparison view — attribute-first, not card-first:**
  - Desktop: true side-by-side columns (one per card).
  - Mobile (375px): **stacked by attribute** — each row is one attribute (Fee, Welcome bonus, Top earn, Lounge, No-FX, Transfers) with the 2–3 card values beneath it. Avoids horizontal-scroll-hell.
  - A **"highlight differences" toggle** emphasizes rows where values differ.
  - Clear exit ("Back to cards"); never trap the user.
- Pure client-side; data already loaded. No new query.

### 3.5 Presets — also the answer to "browse fatigue" (per Copilot)
Curated entry chips that pre-apply filters and deep-link via existing params — zero new plumbing, and explicitly **thin wrappers over the real taxonomy, never a parallel one.** They double as Explore's lightweight clustering, so we do NOT build a separate clustering system. Site is points-only, so no "cash-back" cluster. **v1 presets (locked 2026-06-24):** **No annual fee · First travel card · Premium travel (status + credits) · Best for lounges · Best for hotels · Transfers to airline partners.** ("Transfers to airline partners" chosen over "Best for dining" as the 6th — it fits the transfer-ecosystem-obsessed audience better than a generic spend category. **Dining is the first preset to add** once usage data warrants.)

## 4. Data — no schema changes required

Everything the Explorer needs is already returned by `listCardsForFinder` ([`queries.ts:2592`](../utils/supabase/queries.ts)): `annualFee`, `topEarn`, `bonusCategories`, `benefitTypes`, `sub` (with `estimated_value_usd`), `transferEligibility`, `noFxFee`, `authored`. Compare and sort are presentation-only.

- **Card art:** out of scope — stays on the backlog. Tiles remain text/data-led. If/when affiliate art lands, the tile component is the single place to add it.
- **Sort by bonus value** depends on `estimated_value_usd` being populated; where null, the card sorts last. No new derived numbers shown to users (honors the avoid-derived-math rule).
- **Annual fee:** all 88 cards have a non-null fee (range $0–$895), so no unknown-fee edge case.
- **Stale data:** `revalidate = 3600` is fine — welcome bonuses don't change hourly and a bonus monitor already exists. On-demand revalidation is the lever if a specific offer needs faster turnaround. Not re-architecting around this.

## 5. Build phases (order locked 2026-06-24)

1. **Sorting + live quick-filters** — ✅ **SHIPPED** (PR #949). Explore bar with sort dropdown + live quick-filter chips (card type, fee bands, no-FX, lounge); fee slider retired; filter/sort logic extracted to `utils/cards/finder.ts`. Highest ROI, lowest risk, big perceived improvement.
2. **Explore / Advanced-Filters framing** — ✅ **SHIPPED** (PR #949). Removed the "Start here" CTA; Explore bar is the primary surface; deep panel reframed as "Advanced filters" (header + Done), opened via "All filters →"; "Clear all filters" moved into the Explore bar; page + metadata renamed "Finder" → "Credit Card Explorer." (Reusable CardTile/CardGrid extraction deferred to Phase 4 when Compare needs it — YAGNI.)
3. **Presets** — ✅ **SHIPPED** (PR #950). "Popular starting points" band of 6 gold-accented one-tap presets (No annual fee · First travel card · Premium travel · Best for lounges · Best for hotels · Transfers to airline partners). Each pre-applies real filter values; selecting is exclusive and clears any individual filters; toggling off returns to all cards. Counts verified non-empty (22/11/7/15/13/29). Moved ahead of Compare (per Copilot): tiny effort, high value, teaches the taxonomy.
4. **Compare tray** — ✅ **SHIPPED** (PR #951). "+ Compare" button on every tile (cap 3, others disable at 3); sticky tray with removable chips + Compare/Clear; overlay compares 6 attributes (fee, welcome bonus, top earn, lounge, no-FX, transfers) attribute-first — 3 columns on desktop, 1-column stacked with per-cell card names on mobile (`.rg-compare-*` in globals.css); "Highlight differences" toggle shades rows whose values differ; Back-to-cards + per-card Remove. Pure client-side.

Each phase is independently shippable and testable.

## 6. Mobile contract (must pass at 375px)
- Grid already uses `repeat(auto-fit, minmax(min(280px,100%),1fr))` — keep it.
- Sort/quick-filter row must wrap, not overflow; verify `scrollWidth - clientWidth === 0`.
- Compare tray: sticky bottom bar with ≥44px tap targets; comparison view is **attribute-first stacked** on mobile (§3.4), not a horizontally-scrolling table.
- All new controls use design tokens only (no hardcoded colors/fonts/spacing).

### 6.1 Cross-cutting (per Copilot)
- **Empty states:** when filters yield 0 cards, say so helpfully ("No cards match — try removing X or Y"), don't just render blank.
- **Analytics:** instrument Explore vs Refine vs preset vs Compare usage — this tells us whether the two-mode design earns its keep and whether Refine ever deserves its own route.
- **Sort analytics (instrument from day one, per Copilot):** track default-sort retention + usage of fee asc/desc, welcome-bonus value, and top-earn-rate. Sharp insight: _users often don't filter — they sort_, so the sort dropdown quietly becomes the de-facto recommendation engine. Knowing which sort people actually use guides the future ranking work (§3.2).
- **Performance:** memoize the pure filter/sort function over the dataset; trivial at 88 rows, future-proof as it grows.

## 7. Filter taxonomy — to lock before building

This is the master list of filter categories, each mapped to the underlying data and annotated with **how many of the 88 active cards currently match** (so we don't surface dead-end filters). Coverage is the live count as of 2026-06-24.

> **Two-tier rule (revised per Copilot — optimize for intent, not just supply):**
> - **High-intent filters always surface, even at 1–3 cards** — users happily accept few results for these: **No-FX, lounge access, Priority Pass, annual free night, cell phone protection, fee bands, transfers to partners.**
> - **Exploratory filters require ≥4 cards** — e.g. drugstores, fitness, streaming. Below that they're a dead end → fold into parent or drop. Marked ⚠ below.
>
> Implementation: tag a `highIntent: true` subset in the taxonomy config; the ≥4 floor applies only to the rest.

### Axis A — Card attributes (always-visible quick filters)
| Filter | Control | Source |
|---|---|---|
| Points program (target) | dropdown | `currency` / `coBrand` + inbound transfers |
| Annual fee | bands: $0 · ≤$95 · ≤$250 · $250+ | `annual_fee_usd` |
| Card type | Personal / Business | `card_type` |
| No foreign transaction fee | toggle | `foreign_transaction_fee_pct = 0` |
| Network | Visa / Mastercard / Amex | `network` |
| Issuer | chips | `issuer` |

### Axis B — Benefits (grouped chips; card must have all selected)
> **Display order (locked 2026-06-24): Points → Lounge → Airline → Hotel → Credits → Status → Insurance → Protection.** Lead with rewards (a points site), end with the "broccoli" (insurance/protection — important but rarely what someone shops on first). The table below is grouped by data family for reference; render in the locked order.
| Group | Filter | Cards | Maps to benefit_type(s) |
|---|---|--:|---|
| **Lounge** | Lounge access | 12 | all `lounge_*` |
| | Priority Pass specifically | 6 | `lounge_priority_pass` |
| **Airline** | Free checked bag | 28 | `free_checked_bag` |
| | Priority boarding | 21 | `priority_boarding` |
| | Companion pass / certificate | 16 | `companion_pass`, `status_southwest_companion_pass` |
| **Hotel** | Annual free night | 14 | `free_night_award`, `free_night_after_spend` |
| | Hotel elite status | ~20 | `status_marriott_*`, `status_hilton_*`, `status_ihg_*`, `status_hyatt_*` |
| | Hotel credit | 26 | `hotel_credit` |
| **Credits** | Annual travel credit | 14 | `travel_credit_annual` |
| | Global Entry / TSA PreCheck credit | 22 | `global_entry_credit` |
| | Airline fee credit | ~20 | `airline_credit`, `flight_credit` |
| | Rideshare / food-delivery credit | ~18 | `doordash_credit`, `uber_credit`, `lyft_credit` |
| | Dining credit | 8 | `dining_credit` |
| | CLEAR credit | 4 | `clear_credit` |
| | Streaming / entertainment credit ⚠ | 5 | `streaming_credit`, `entertainment_credit` |
| **Insurance** | Rental car coverage (CDW) | ~29 | `rental_car_cdw_primary` (4) + `rental_car_cdw_secondary` (25) |
| | — primary CDW only (premium) | 4 | `rental_car_cdw_primary` |
| | Trip cancellation / delay | ~25 | `trip_cancellation_insurance`, `trip_delay_insurance`, `trip_interruption_insurance` |
| | Baggage insurance | ~28 | `baggage_delay_insurance`, `lost_luggage_insurance` |
| | Cell phone protection | 18 | `cellphone_protection` |
| **Protection** | Purchase protection | 34 | `purchase_protection` |
| | Extended warranty | 32 | `extended_warranty` |
| | Return protection | 5 | `return_protection` |
| **Status (non-hotel)** | Rental car status ⚠ | 7 | `status_hertz_*`, `status_national_*` |
| | Airline elite status ⚠ | 3 | `status_southwest_a_list` |
| **Points** | Transfers to airline/hotel partners | 29 | `transfer_partner_access` |
| | Points boost on travel portal | 5 | `portal_redemption_bonus` |

### Axis C — Earns bonus points on (spend categories; card earns >1x)
| Filter | Cards | Maps to earn category(s) |
|---|--:|---|
| Dining & restaurants | 51 | `dining`, `dining_other`, `dining_citi_nights` |
| Flights | ~35 | `flights`, `airline`, `airline_tickets`, `airfare_portal` |
| Hotels | ~30 | `hotels`, `hotel`, `hotels_through_portal`, `marriott`, `ihg`, `hyatt*` |
| Travel (general / portal) | ~24 | `travel`, `travel_through_portal`, `hotels_cars_attractions_portal`, `car_rentals*` |
| Gas & EV charging | ~25 | `gas`, `gas_stations`, `ev_charging` |
| Groceries | ~16 | `groceries`, `grocery`, `groceries_us_supermarkets`, `online_grocery` |
| Transit & commuting | ~15 | `transit`, `local_transit` |
| Streaming & media | ~14 | `streaming`, `internet_phone_tv`, `telecom` |
| Rideshare & food delivery | ~10 | `lyft`, `doordash` |
| Office & advertising (business) | ~8 | `office_supplies`, `advertising`, `marketing`, `shipping`, `business_purchases` |
| Drugstores ⚠ | 2 | `drug_stores` |
| Fitness / gym ⚠ | 2 | `fitness_gym`, `fitness_clubs`, `peloton` |

### 7.1 Annual fee — bands, not a slider (decided 2026-06-24)
Live distribution of all 88 cards drove the boundaries (first three bands split into near-perfect thirds):

| Band | Cards | Meaning |
|---|--:|---|
| **$0** | 22 | No annual fee |
| **$1–95** | 22 | Low / starter |
| **$96–250** | 22 | Mid-tier |
| **$251–550** | 13 | Premium |
| **$551+** | 9 | Ultra-premium |

Bands beat a slider on mobile: one tap, 44px targets, no fiddly precise drag, and they map to real fee tiers. Used in both Explore and Refine; the old continuous slider is retired.

### Taxonomy decisions (all locked 2026-06-24)
- **A. Coverage floor** ✅ — two-tier rule: high-intent filters surface even at 1–3 cards; everything else needs ≥4.
- **B. Rental car / "car insurance"** ✅ — one "Rental car coverage" chip in Explore; the **"Primary CDW only" sub-filter lives in Advanced Filters only**, not as a top-level chip (4 cards is too niche to surface up front; power users will find it).
- **C. Two benefit axes** ✅ — keep Benefits and "Earns bonus on" as **separate** sections. Merging them makes a junk drawer.
- **D. Group order** ✅ — **Points → Lounge → Airline → Hotel → Credits → Status → Insurance → Protection** (rewards first, protections last).

## 8. Decision log

**All resolved 2026-06-24:**
- ✅ Unified `/cards`, Explore primary, Refine = "Advanced filters" (not a co-equal mode); revisit a separate `/cards/finder` route only if analytics show a distinct split workflow.
- ✅ Annual fee = bands, slider retired (§7.1).
- ✅ Compare cap = 3; attribute-first mobile layout (§3.4).
- ✅ Coming-soon greying = keep as guard only; nothing greyed today (bug fixed).
- ✅ Taxonomy floor = two-tier; rental-car primary-CDW in Advanced only; Benefits/Earn axes separate; group order Points-first.
- ✅ v1 presets (6): No annual fee · First travel card · Premium travel · Best for lounges · Best for hotels · Transfers to airline partners. Dining = first to add later.
- ✅ Build order: sorting + quick-filters → Explore/Advanced framing → presets → compare.
- ✅ Instrument sort usage from day one (§6.1).

**Remaining (not blocking — settle during build):**
- Exact copy/labels for preset chips and the "highlight differences" compare toggle.
- Which analytics tool/events (depends on what's already wired site-wide).

The spec is decision-complete; ready to build Phase 1 (sorting + live quick-filters) on Jill's go.

---

## Appendix — authoring-flag bug (fixed 2026-06-24)
The Finder marked 19 fully-authored cards (incl. `amex-gold`, `citi-double-cash`, `amex-business-platinum`) as greyed "Coming soon" because the `authored` flag keyed off the **optional `good_to_know` callout** instead of real authoring. All 88 active cards have a populated `intro`, benefits, earn rates, and a welcome bonus. Fixed in [`utils/supabase/queries.ts`](../utils/supabase/queries.ts) `listCardsForFinder` to key `authored` off `intro`. (The "47/86 unauthored" figure in older notes was a stale 2026-06-03 snapshot.)
