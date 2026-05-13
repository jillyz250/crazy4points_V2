# The Brain — Unified Travel/Points Knowledge System

**Status:** Planning
**Owner:** Jill
**Created:** 2026-04-24
**Goal:** One canonical knowledge graph for every airline, hotel program, credit card, and loyalty rule. Every piece of content on crazy4points (alerts, FAQs, briefs, newsletter, decision engine) references this system. Source of truth. Flexible enough that rules can change without schema churn. Expandable to new verticals (cruise, rental car, dining, etc.) later.

---

## Guiding principles

1. **Nouns first, rules second.** Build the entity skeleton (who exists + how they relate) before writing deep rule content. A half-populated skeleton is more useful than one fully-documented program.
2. **Structured for relationships + numbers. Prose for nuance.** Ratios, IDs, tier thresholds, earning rates → columns. Sweet-spot explanations, gotchas, editorial commentary → markdown fields. Query the structured stuff, render the prose.
3. **Every fact cites its source.** Each rule/field has `source_url` + `source_verified_at`. Rules change constantly — if we can't point to an official page, we don't trust it.
4. **Staleness is first-class.** Every entity has `last_reviewed_at`. Admin UI surfaces anything >30/60/90 days old (mirror the FAQ staleness pattern already in the codebase).
5. **Content links up, not down.** Alerts/FAQs/briefs reference programs via junction tables. Programs don't know what content mentions them — content knows what it references.
6. **Expandable verticals.** A `vertical` enum (`airline` | `hotel` | `card` | `cruise` | `rental_car` | `dining` | …) on top-level tables lets us add categories without new tables.
7. **Never hard-delete.** Soft delete via `status` enum (`active` | `deprecated` | `merging` | `defunct`). Merged programs (e.g., Alaska + Hawaiian) keep history.
8. **Versioning is surgical, not universal.** Only fields that actually change over time and where history has value get `*_history` tables: award charts, transfer ratios, signup bonuses. Everything else is a simple row with `last_reviewed_at`.
9. **One junction table for content links.** `content_entity_links` (content_type + content_id + entity_type + entity_id) serves alerts/FAQs/briefs/newsletter. No per-content-type junctions.
10. **Trust tracked per fact.** Every rule-bearing row carries `source_url`, `source_type` (official | blog | rumor | user_submitted | scrape), `confidence` (high | medium | low), `source_verified_at`, `verified_by`.

---

## High-level entity map

```
ALLIANCES ─┬─ AIRLINES ─┬─ AIRCRAFT (fleet)
           │            ├─ CABINS/SEATS (lie-flat, pitch, config by aircraft)
           │            ├─ ROUTES (what they fly)
           │            └─ OPERATING_PARTNERS (codeshares, JVs)
           │
           └─ LOYALTY_PROGRAMS ─┬─ EARNING_RULES (by fare class, activity, card)
                                ├─ REDEMPTION_RULES (award chart, partner pricing)
                                ├─ TRANSFER_PARTNERS (in/out + ratios + bonuses)
                                ├─ SWEET_SPOTS
                                ├─ PROGRAM_RULES (change/cancel/expire/rebook/hold)
                                └─ ELITE_TIERS

HOTEL_PROGRAMS ─┬─ HOTEL_BRANDS ─── HOTELS (optional, massive)
                ├─ EARNING_RULES
                ├─ REDEMPTION_RULES (category/dynamic)
                ├─ TRANSFER_PARTNERS
                └─ ELITE_TIERS

CARD_ISSUERS ─── CREDIT_CARDS ─┬─ EARNING_CATEGORIES
                               ├─ BENEFITS (lounge, credits, insurance)
                               ├─ SIGNUP_BONUSES (history)
                               └─ TRANSFER_PARTNERS (links to programs)

FARE_CLASSES (global) ── maps to earning rates + cabin types

CONTENT_LINKS ── alerts, FAQs, briefs, newsletter → reference any entity above
```

---

## What each entity should eventually cover

### Airlines
Fleet, seat maps, lie-flat routes, hub cities, premium cabins offered, baggage rules, change fees, status match history, codeshare partners, JV partners, subsidiaries (LCCs).

### Loyalty programs (airline)
- Earning: by fare class, from flights, from partners, from cards, from shopping/dining portals, from hotel transfers
- Redemption: award chart (fixed/dynamic/distance), partner pricing tables, fuel surcharges, routing rules (max segments, stopovers, open jaws), married segment logic, hold policies, phone vs online booking
- Rules: expiration, change/cancel, **rebook after schedule change**, family pooling, upgrade rules, cash+points
- Sweet spots (editorial + structured)
- Elite tiers (thresholds, benefits, soft landing, status match)
- Known gotchas (markdown)

### Hotel programs
Category chart, peak/off-peak, 5th night free, cash+points, suite upgrade rules, breakfast benefit rules by tier, elite benefits, transfer partners, award chart type (fixed/dynamic), brand family.

### Credit cards
Earning by category (groceries, dining, travel, etc.), welcome offer history, annual fee, credits (travel, dining, statement), lounge access (Priority Pass, Centurion, Admirals, etc.), travel insurance terms (trip delay, rental CDW, etc.), foreign transaction fees, authorized user terms, transfer partners with ratios + historical bonuses.

### Aircraft / cabins (Phase 4)
Aircraft type, airline, cabin configs (F/J/PY/Y), seat pitch/width, lie-flat y/n, direct aisle access, suite doors, routes aircraft flies.

---

## Phased build plan

### Phase 1 — Skeleton (nouns + relationships)
**Goal:** Every entity exists and is linked. No deep rule content yet. Content can start referencing structured IDs immediately.

**Tables:**
- `alliances`
- `airlines` (+ `alliance_id`, parent_group, carrier_type)
- `loyalty_programs` (with `vertical = airline`, alliance_id, owner_group, program_type: single_account | shared_currency | single_airline)
- `airline_programs` (junction: which airlines belong to which programs, with `relationship` enum)
- `hotel_programs` (vertical = hotel)
- `hotel_brands` (belongs_to hotel_program)
- `card_issuers`
- `credit_cards` (belongs_to card_issuer, has currency → points to a loyalty_program or has its own)
- `fare_classes` (reference table: F, J, W, Y, basic economy, etc.)
- `entity_slug_redirects` (old_slug, new_slug, entity_type, reason, created_at) — handles mergers/rebrands without breaking URLs, AI references, or content links
- `content_entity_links` (content_type enum: alert | faq | brief | newsletter; content_id; entity_type enum; entity_id) — single junction for all content→entity references
- `change_log` (entity_type, entity_id, field, old_value, new_value, changed_by, changed_at, change_reason) — audit trail across all rule-bearing tables

**Source-tracking columns on every rule-bearing table:**
- `source_url` text
- `source_type` enum (`official` | `blog` | `rumor` | `user_submitted` | `scrape`)
- `confidence` enum (`high` | `medium` | `low`)
- `source_verified_at` timestamptz
- `verified_by` text
- `last_reviewed_at` timestamptz

**Deliverables:**
- Supabase migration
- Seed data: 3 alliances, ~60 airlines, ~25 airline loyalty programs, 7 hotel programs + brands, top 5 card issuers + ~30 cards
- Admin UI: list + edit CRUD for each table (shadcn forms)
- **Stale review queue** — admin view listing entities with `source_verified_at` > 90 days, sorted by count of stale fields + severity of source_type. Operational backbone for keeping the brain accurate.
- Slug validation on write + automatic `entity_slug_redirects` row creation when an entity slug changes

**Exit criteria:** Can tag any alert or FAQ to one or more structured program/airline/card IDs via `content_entity_links`. Admin can see a prioritized list of entities needing review.

---

### Phase 2 — Earning & transfers
**Goal:** Answer "how do I get these points?" for anything in the system.

**Tables:**
- `transfer_partners` (source_entity_type + source_id → target_entity_type + target_id, ratio, min_transfer, notes). Generic enough to cover card→airline, card→hotel, hotel→airline, program→program.
- `transfer_bonus_history` (promo ratios over time for each transfer pair)
- `card_earning_rules` (card_id, category, rate, cap, notes, source_url)
- `program_earning_rules` (program_id, activity_type, fare_class_id, rate, notes) — e.g., "United earns 5x base miles per $ spent"
- `signup_bonus_history` (card_id, offer, spend_req, date_range)

**Deliverables:**
- Migrations + admin UI
- Backfill transfer-partner matrix for Chase/Amex/Cap One/Citi/Bilt → all programs
- Backfill hotel→airline transfer ratios

**Exit criteria:** Can answer "if I have Amex MR, where can I transfer them and at what ratio, and is there currently a bonus?"

---

### Phase 3 — Redemption & program rules
**Goal:** Answer "how do I use these points?" and "what are the rules?"

**Tables:**
- `sweet_spots` (program_id, route_pattern, cabin, cost, cash_value, notes_md, source_url, last_verified_at)
- `award_chart_entries` (program_id, origin_region, dest_region, cabin, fare_class, cost_one_way, cost_round_trip, peak/off_peak)
- `program_rules` (program_id, rule_type enum, rule_text_md, source_url) — rule_type covers: change, cancel, expiration, rebook_schedule_change, hold_policy, routing, stopover, open_jaw, family_pooling, fuel_surcharge, phone_fees
- `elite_tiers` (program_id, tier_name, requirements_jsonb, benefits_md, source_url)
- `hotel_program_rules` (5th night free, suite upgrades, breakfast, etc. — similar shape)

**Deliverables:**
- Migrations + admin UI
- Editorial review flow: AI drafts → human approves (mirror FAQ content editor)

**Exit criteria:** Can answer "what happens if my award flight reschedules and I want to rebook on a different airline."

---

### Phase 4 — Operational depth
**Goal:** Answer "is this a good flight / hotel?"

**Tables:**
- `aircraft_types` (iata_code, manufacturer, model)
- `airline_aircraft` (airline_id, aircraft_type_id, fleet_count, routes_served)
- `cabin_configurations` (airline_aircraft_id, cabin, seat_count, pitch, width, lie_flat, direct_aisle, suite_doors, notes)
- `routes` (airline_id, origin_iata, dest_iata, aircraft_type_id, frequency, cabin_available)
- `card_benefits` (card_id, benefit_type, description_md, terms_url) — lounge access, insurance, credits
- `hotels` (optional — hotel_brand_id, name, city, category, notes) — defer unless there's a clear use case

**Deliverables:** Migrations + admin UI. Likely semi-automated via scraping/APIs (SeatGuru-style sources) — manual entry is prohibitive at this depth.

**Exit criteria:** Can render a flight-search result with lie-flat indicator + pitch + aircraft type from our data.

---

### Phase 5+ — New verticals (cruise, rental car, dining portals, etc.)
Add rows to `loyalty_programs`/`credit_cards` with new `vertical` values. Pattern is established — extend rather than redesign.

---

## Content integration (runs through all phases)

### Junction
- `content_entity_links` — single table for all content → entity references (alerts, FAQs, briefs, newsletter). Replaces the per-content-type junctions. The existing `alert_programs` data migrates into this table in Phase 1.

### Rendering
- Every entity has a canonical detail page: `/airlines/[slug]`, `/programs/[slug]`, `/cards/[slug]`, `/hotels/[slug]`
- Alerts/FAQs/briefs auto-link entity mentions to detail pages
- Detail pages aggregate: summary facts + related sweet spots + transfer partners + recent alerts mentioning this entity + FAQs

### AI integration
- Scout pipeline tags alerts to structured entity IDs, not just free text
- AI summaries reference entity slugs
- FAQ generation per program already exists (`program_faq_cache`) — migrate to link to new `loyalty_programs` table in Phase 1

---

## Considered and declined

These patterns were evaluated and rejected. Recorded here so we don't relitigate them later without new information.

### Unified polymorphic `entities` table
**Proposed:** single `entities` table with `entity_type` discriminator; airlines/programs/cards reference it via `entity_id`.
**Rejected because:** destroys real foreign key constraints (a field that must reference an airline can no longer be constrained to the airlines table), worsens query plans, breaks Supabase auto-generated types, complicates RLS, and admin UIs still need to be per-entity because the fields differ. Postgres handles ~20 related tables fine.
**What we kept from the idea:** single `content_entity_links` junction. That captures the real win (avoiding N junction tables per content type) without the costs of a polymorphic spine.

### Universal versioning (history table as source of truth, current = SQL view)
**Proposed:** every rule-bearing table becomes `*_history` with `valid_from`/`valid_to`; the current state is exposed as a view.
**Rejected because:** breaks Supabase RLS, breaks client typegen, complicates updates (views aren't simply writable), and adds migration overhead for slow-moving data that doesn't need history.
**Instead:** history tables **only** where versioning delivers value — award charts, transfer ratios, signup bonuses. Everything else is a simple row with `last_reviewed_at` + `change_log` entries for audit.

### Generic rule engine
**Proposed:** `rules` table + `evaluateRule(entity, rule_type, context)` evaluator.
**Rejected because:** a real rule engine is a 6–12 month project (DSL design, evaluator, context models, debugging tools, admin UI). We're building a content reference system, not a booking engine. Structured columns + markdown prose answers every question content needs today.
**Revisit if:** we ever build a product-facing decision engine that programmatically evaluates routing/pricing.

### Dedicated AI retrieval API (`/api/brain/query`)
**Proposed:** a unified query endpoint that wraps brain queries for AI callers.
**Rejected because:** premature abstraction. Supabase + typed queries is already the retrieval layer. We don't yet have duplicated query logic or enough callers to justify a wrapper.
**Revisit if:** 3+ callers repeat the same query patterns, or we need shared caching/auth across AI consumers.

### Composite `freshness_score` float
**Proposed:** single float per entity summarizing staleness.
**Rejected because:** fake precision. A weighted score hides what's actually stale.
**Instead:** count of stale fields + flagged sources, surfaced in the admin review queue. Plain and actionable.

---

## Key design decisions (to revisit each phase)

1. **`programs` table (existing) fate:** keep as-is during Phase 1. In Phase 1 exit, migrate its data into `loyalty_programs` + `airline_programs`. Alerts referencing old `programs.id` get remapped. Drop old table at Phase 1 close.

2. **Structured vs prose:** default to **structured columns** for anything queryable (ratios, costs, thresholds, booleans). Default to **markdown fields** for anything editorial (sweet-spot narratives, gotchas, tier benefit descriptions). Never put queryable data in markdown.

3. **JSONB escape hatch:** use for fields that vary in shape (`benefits` per elite tier, `routing_rules` per program). Don't default to jsonb — use it when a real column would be wrong.

4. **Source tracking:** every rule-bearing row gets `source_url` + `source_verified_at` + `verified_by`. Admin UI flags any source_verified_at > 90 days old.

5. **Edit workflow:** AI-drafted → human approved, mirroring the FAQ content editor. Never publish AI output raw.

6. **Versioning:** for fields that change (award charts, transfer ratios, signup bonuses), use a history table rather than overwriting. `*_history` tables with `valid_from`/`valid_to`.

---

## Open questions — resolved

### Q1. Existing `programs` table — evolve in place, don't replace

Current shape (from `utils/supabase/queries.ts` interface `Program`):
```
id, slug, name, type (airline|hotel|credit_card|car_rental|cruise|
  shopping_portal|travel_portal|lounge_network|ota),
tier, monitor_tier (daily|weekly|monthly), is_active, description,
logo_url, program_url, faq_content, faq_updated_at, notes,
last_verified, created_at
```

**Decision:** evolve the existing table. No parallel migration.
- Rename `type` → `vertical` (values unchanged)
- Add: `alliance_id`, `parent_group`, `program_type` (`single_account` | `shared_currency` | `single_airline` | null), `owner_group`, `status` (`active` | `deprecated` | `merging` | `defunct`), plus the source-tracking column set (`source_url`, `source_type`, `confidence`, `source_verified_at`, `verified_by`)
- Keep `monitor_tier`, `faq_content`, `faq_updated_at` — still useful operationally
- `airlines` becomes a **new** table (operating carriers are distinct from programs — Flying Blue vs AF/KLM/Transavia)
- `airline_programs` junction links them

**Why:** zero data migration, existing alerts keep working, existing FAQ content stays attached.

### Q2. Slug strategy

Pattern: `{issuer-prefix-if-needed}-{name-kebab}`.
- Airlines: `air-france`, `united-airlines`, `british-airways`
- Programs: `flying-blue`, `mileage-plus`, `avios`, `world-of-hyatt`
- Cards: `chase-sapphire-preferred`, `amex-platinum`, `cap-one-venture-x` (issuer prefix because card names collide)
- Issuers: `chase`, `amex`, `capital-one`

Mergers/rebrands go through `entity_slug_redirects` — never rewrite a slug in place.

### Q3. Permissioning

Admin-only writes, public reads for entity detail pages. No public-facing API surface yet.
- Admin routes under `app/admin/(protected)/`
- Public pages under `app/(site)/airlines/[slug]`, `/programs/[slug]`, `/cards/[slug]`
- Revisit when/if user accounts with favorites ship — not now.

### Q4. Image storage

**Supabase Storage**, not Vercel Blob.
- Already in Supabase; one less vendor
- RLS ties storage permissions to existing auth
- Logos rarely rotate; Vercel Blob's edge-delivery advantage doesn't matter here
- Cheaper at this scale

One bucket: `entity-logos/`. Path: `{vertical}/{slug}.{ext}` (e.g., `airline/air-france.svg`). Store `storage_path` on the entity row, resolve to public URL at render.

### Q5. Search — defer

Phase 1 ships without search. ~150 total entities; admin list filters client-side.

When it's needed (public directory pages, or >500 rows): **Supabase + pg_trgm** first. External search (Typesense/Meilisearch) only when unified full-text across alerts + FAQs + entities becomes a real need.

---

## Success metrics

- Every published alert links to ≥1 structured entity
- Every FAQ answer is attached to a program_id
- >80% of rule-bearing rows have `source_verified_at` within 90 days
- Content team can answer any "where do I transfer / how do I redeem / what are the rules" question by querying the brain, not Googling
- Adding a new vertical (e.g., cruise) takes <1 week because the pattern is stable

---

## How to resume this plan

Next time, ask: **"Pull up the brain plan"** and reference this file (`plans/knowledge-brain.md`). Phase-by-phase breakdown, open questions, and design principles are all here.
