# Card Finder — Filter & Benefit Taxonomy (v3 — LOCKED)

Design for the credit-card comparison/finder tool on crazy4points (points & miles only — cash-back-only cards are out of scope). **v3 is the locked reference** — converged across three AI review rounds (Copilot + ChatGPT ×2) plus internal synthesis. The schema (§12) is frozen; the benefit migration + UI/ranking build against it.

**Governing principle:** *Accuracy > completeness. Travel-card people forgive a missing filter; they never forgive a wrong one.* Ship 80% taxonomy + 100% trustworthy results, then expand.

**Build order (locked):** (1) schema freeze → (2) benefit migration (599 rows, audited) → (3) filter UI spec → (4) ranking weights.

---

## 1. Architecture — one faceted finder + an intent layer

A single finder. **Card type** is the primary facet; filters are **universal** (every card) or **type-specific** (revealed contextually). On top of the raw facets sits a **search-intent layer** — curated presets that pre-select filters and set ranking weights (not DB fields).

**Card types:** `transferable` (Amex MR, Chase UR, Citi TY, Capital One, Bilt, Wells Fargo) · `hotel` (Marriott, Hilton, Hyatt, IHG, Wyndham, Choice) · `airline` (United, Southwest, Delta, Alaska, JetBlue, Aer Lingus, Iberia, BA, Aeroplan, Hawaiian, Frontier, …).
**Sub-toggle:** `personal` (default ON) vs `business` (default OFF, with a tooltip: "sole proprietors, freelancers, side-hustlers, eBay sellers often qualify").

---

## 2. Benefit data model — family / type / provider / attributes (the big change)

v1 proposed adding more flat enum values. Both reviews rejected that ("enum of infinite sadness"). v2 adopts a **hierarchy** so new merchants/partners are *data*, not schema changes:

```
benefit_family    lounge | insurance | credit | hotel | airline | status | protection | earning | perk
benefit_type      stable, smaller enum WITHIN a family (e.g. rideshare_credit, trip_delay_insurance,
                  lounge_access, free_night_award, elite_night_credits, award_flight_discount)
provider          DATA, not enum — Uber | Lyft | DoorDash | Instacart | Priority Pass | Centurion |
                  Admirals Club | Sky Club | United Club | LoungeKey | Plaza Premium | ...
attributes JSON   value_amount, frequency, coverage_amount, deductible, per_claim_limit,
                  per_year_limit, count, companions_covered, spend_threshold_usd, category_ceiling,
                  cap_amount_usd, cap_group_id, point_value
conditions JSON   enrollment_required, booking_channel, pay_with_card_vs_hold, au_eligible,
                  primary_only, taxes_fees_only, expires_at, promo_only
benefit_source    issuer_primary | issuer_subpage | network | co_brand | inferred
confidence        high | medium | low
```

Why this matters:
- New rideshare/merchant partner → a new `provider` value, zero migration.
- Filters roll up cleanly: "rideshare credit" = `benefit_type=rideshare_credit` across providers; "Lyft specifically" = + `provider=Lyft`.
- `benefit_source` directly fixes the **sub-page-omission** problem (we can see whether a benefit was found on the primary page, a sub-page, or merely inferred) and prevents false negatives in "has X" filters.
- `conditions` keeps the fine print **structured** instead of leaking into prose (the thing that caused our worst accuracy bugs).

**Migration:** the existing flat `benefit_type` enum (599 rows) maps into family + type + provider; most attributes already exist as columns and move into the JSON or stay as typed columns. One-time, scriptable, audited.

**Dedup requirement:** some issuers list the same benefit in multiple page sections (Amex Platinum lists travel protections ~3×). The ingest needs a **deduper** that merges identical benefits with different wording (key on family+type+provider).

---

## 3. Card-scalar fields (clean filters, mostly complete today)

| Field | Powers | State |
|---|---|---|
| `annual_fee_usd` | AF range / "no AF" | 39/42 |
| `foreign_transaction_fee_pct` | "no FX fee" | 38/42 (backfill 4) |
| `issuer_id` / **`issuer_family`** | issuer filter, 5/24 + pairing logic | issuer complete; family = **new** |
| **`network`** + **`network_level`** | network filter; Visa Signature/Infinite & World/World Elite drive rental/protection inference | **new** |
| `card_type` (personal/business) | sub-toggle | complete |
| `currency_program_id` / **`transfer_eligibility`** | transferable filter; `direct`/`pool_to_unlock`/`none` | program complete; eligibility = **new** |
| `chase_5_24_subject`, `is_metal_card` | badges | partial |
| **`estimated_bonus_value_usd`**, **`estimated_first_year_net_value_usd`** | value-based sorts | **new, editorially maintained, labeled "estimated"** |

Derived value fields are *estimates* — they need an owner + refresh cadence or they rot (a stale value = exactly the accuracy failure we want to avoid). Always labeled as estimates in UI.

---

## 4. Universal filters (all types)
- **Card scalars:** annual fee · no FX fee · issuer · network/network-level · personal/business
- **Welcome bonus:** amount · currency · spend required · window · elevated/limited-time · **estimated value ≥ $X**
- **Lounge** (progressive disclosure): "any lounge" → Priority Pass · Centurion · Admirals · Sky Club · United Club · LoungeKey · Plaza Premium · Escape
- **Travel insurance:** trip delay · cancellation · interruption · baggage delay · lost luggage · rental CDW (primary vs secondary) · travel accident · emergency evac · emergency medical · roadside · travel & emergency assistance
- **Purchase protections:** purchase protection · extended warranty · return protection · cell-phone
- **Credits:** by category (travel/hotel/airline/dining/rideshare/streaming/wireless/entertainment/merchant) **and** "≥ $X total annual credits"
- **App-fee credits:** Global Entry · TSA PreCheck · CLEAR
- **Earn rate (simple, v1):** "≥ Nx [dining/groceries/gas/travel/hotels/airfare/transit/office]" — no cap UI
- **Concierge**

---

## 5. Type-specific filters

**Transferable:** transfer partners (+ ratio) · **transfer eligibility** (direct / pool-to-unlock / none, surfaced in UI) · **pooling rules** (Amex household, Citi household+expiration, Cap One, Bilt none) · **transfer timing** (`instant / same_day / 1-2_days / variable`, per partner) · minimum transfer increment · bonus earning categories · portal redemption bonus.

**Hotel:** hotel program · free-night certificate (+ **category ceiling / point value**) · anniversary night vs free-night-after-spend · elite status conferred (+ tier) · **elite night credits** · **award-discount benefit** (Hilton 5th-night-free, IHG 4th-reward-night, etc.) · **resort-fee waiver on award stays** (Hyatt yes / others no) · **point expiration policy** (program-level — Hyatt none-with-activity, Marriott 24mo, IHG 12mo, Wyndham/Choice 18mo) · spend-based unlocks.

**Airline:** airline program · free checked bag (+ count / companions) · priority boarding · **priority security / dedicated check-in** (distinct from boarding) · **companion pass** vs **companion certificate/ticket** (separate) · club membership/passes · **inflight discount** vs **flight credit** (separate mechanics) · **award change/cancel fee policy** (program-level) · **award surcharge / close-in-fee waivers** · award-flight discount / spend unlock · PQP/EQM status boost.

> **Program-level vs card-level:** point-expiration and award-change-fee policies are properties of the **program** (Hyatt/Wyndham/United), not the card — stored on `programs`, not `credit_cards`. Much of this is already authored in program `quirks`/`award_chart` and just needs structuring.

---

## 6. Search-intent presets (the conversion layer)
Curated composites = pre-selected filters + ranking weights, not DB columns. Examples:
- **International travel** → weights no-FX + transfer partners + travel protections + lounge + broad acceptance
- **Airport luxury** → lounge + premium travel credits
- **Free-night hunters** → free-night certs + hotel status + award discounts
- **Status seekers** → elite status conferred + spend-unlocks + night credits
- **Companion-ticket seekers**, **Family travel**, **Beginner transferable points**, **Low AF / high value**, **Business spending**, **Best welcome bonus now**

These are editorial leverage + the biggest conversion lever both reviewers flagged. Build the ranking engine to accept weights in v1; ship the presets in v1.5.

---

## 7. Ranking & explainability
- **Default sort = relevance score**, weighted by the user's selected filters (never affiliate payout — users smell it).
  - e.g. lounge +40 · no_fx +20 · fee_fit +20 · transferability +10 · protections +10.
- **Secondary sorts:** lowest AF · highest welcome bonus (value) · best first-year value · best ongoing value · best for selected categories.
- **"Why this card matched"** line under each result ("Matches: lounge access, no FX fee, strong travel insurance, under your AF budget"). Cheap, large trust gain, kills the "why is a $250 card here?" moment.

---

## 8. Phased scope (accuracy-first)
- **v1 (launch):** card-scalar filters (nearly ready) + clean benefit filters (lounge, FX, insurance, credits, Global Entry, free-night cert) + **simple earn-rate (dining/groceries/gas/travel only)** + relevance ranking + "why it matched" + **`benefit_source` surfaced in UI** (a subtle "verified" badge — prevents false-negative confusion). Family/type/provider model in place; `benefit_source` populated; derived value sorts shippable (governed, §3). **80% taxonomy, 100% trustworthy.**
- **v1.5:** search-intent presets · pooling / transfer-eligibility / transfer-timing surfacing · resort-fee-waiver + award-discount filters · **niche earn-rate categories** (transit, airfare-vs-travel, office spend).
- **v2:** long-tail providers · network-level inference · "approval difficulty" *soft badges* (see §10) · earn-rate cap UI.

*(Round-3 moves: `benefit_source` UI moved UP into v1 for trust; niche earn-rate categories moved DOWN to v1.5 for accuracy.)*

---

## 9. Schema changes required (summary)
1. Benefit table → `benefit_family`, `benefit_type` (stable enum), `provider` (data), `attributes` JSON, `conditions` JSON, `benefit_source`, `confidence`. Migrate 599 rows.
2. `credit_cards`: add `network`, `network_level`, `issuer_family`, `transfer_eligibility`, `estimated_bonus_value_usd`, `estimated_first_year_net_value_usd`.
3. Earn rates: add `cap_group_id` (so "category cap" filters know shared vs per-category — today `cap_amount_usd` can't express it).
4. Free-night certs: structured `category_ceiling` / `point_value`.
5. Pooling rules (per transferable currency).

---

## 10. Data-quality work before/at launch
- Normalize the **filter-relevant** `other` benefit rows into the new hierarchy (leave legitimately-untyped noise as `perk/other`).
- Resolve the ~19 same-name/different-type inconsistencies (keep legit ones like CDW primary/secondary).
- Fix **mis-attribution** (IHG Business United TravelBank fixed; scan for more across sibling cards).
- Close **sub-page benefit omissions** — extraction must probe issuer benefit sub-pages; `benefit_source` makes the gap visible.
- **Dedup** repeated benefits (benefit-inflation).
- Backfill the 4 null card scalars.
- Drop redundant benefit rows that duplicate card scalars (e.g. "no FX fee" as a benefit row — filter from the field).
- **"Approval difficulty / popup-risk"**: deferred and, if ever shipped, **soft badges with disclaimers, never filters** — it's folklore, not issuer-sourced fact (the one reviewer suggestion we're resisting on accuracy grounds).

---

## 11. Resolved (round 3 — all locked)
1. **Migrate to family/type/provider now** — yes; foundation, deferring guarantees rework.
2. **v1 cut line** — correct, with `benefit_source` UI moved up, niche earn-rates moved down (§8).
3. **Derived value fields** — ship in v1, *governed*: quarterly refresh, single editorial owner, labeled "estimated" everywhere.
4. **`benefit_source` + dedup** — required, non-optional (correctness infra).
5. **Three primitives added** (§5): transfer timing, point-expiration policy (program), award change/cancel policy (program).

---

## 12. SCHEMA FREEZE (LOCKED — build step 1)

Additive + non-destructive: add new columns/tables, keep existing ones, migrate data in step 2, deprecate old later. Nothing is dropped in the freeze.

### `credit_card_benefits` — add
| Column | Type | Notes |
|---|---|---|
| `benefit_family` | text + CHECK | `lounge, insurance, credit, hotel, airline, status, protection, earning, perk` |
| `provider` | text (nullable) | DATA, not enum — Uber, Lyft, Priority Pass, Centurion, … |
| `attributes` | jsonb default `{}` | value_amount, frequency, coverage_amount, deductible, per_claim_limit, per_year_limit, count, companions_covered, spend_threshold_usd, category_ceiling, cap_amount_usd, cap_group_id, point_value |
| `conditions` | jsonb default `{}` | enrollment_required, booking_channel, pay_with_card_vs_hold, au_eligible, primary_only, taxes_fees_only, expires_at, promo_only |
| `benefit_source` | text + CHECK | `issuer_primary, issuer_subpage, network, co_brand, inferred` |
| `confidence` | text + CHECK | `high, medium, low` |

Keep `benefit_type` (existing enum) — step 2 maps each value to a (family, smaller-type) pair. `metadata`/`coverage_amount`/`value_amount`/`spend_threshold_usd` stay for back-compat; new writes prefer `attributes`.

### `credit_cards` — add
`network` text+CHECK (`visa, mastercard, amex, discover`) · `network_level` text (Visa Signature/Infinite, World/World Elite…) · `issuer_family` text · `transfer_eligibility` text+CHECK (`direct, pool_to_unlock, none`) · `estimated_bonus_value_usd` numeric · `estimated_first_year_net_value_usd` numeric · `value_estimated_at` timestamptz (governance/freshness).

### `credit_card_earn_rates` — add
`cap_group_id` text (nullable) — earn rows sharing a cap carry the same `cap_group_id`; null = its own cap. Resolves the shared-vs-separate ambiguity.

### `programs` — add
`point_expiration_policy` text · `award_change_fee_policy` text · `pooling_rules` text. (Transfer timing lives per-partner inside `transfer_partners_outbound` JSON rows as `transfer_time`.)

### Free-night certs
No new column — `free_night_award` benefits carry `category_ceiling` / `point_value` inside `attributes`.

### Step-2 data migration (separate, audited)
Map 599 `benefit_type` rows → `benefit_family` + smaller `benefit_type` + `provider`; backfill `benefit_source` (default `issuer_primary`, flag known sub-page ones); dedup benefit-inflation; normalize the filter-relevant `other` rows. Run the existing accuracy auditor pattern over the result.
