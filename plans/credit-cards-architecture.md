# Credit Cards Architecture Plan

**Status:** Round 3 (incorporates Copilot review #2, 2026-04-27)
**Author:** Jill + Claude Code
**Review history:**
- Round 1: Copilot review — flagged benefits-table flexibility, SUB sortability, transfer-partner normalization, derived layer, affiliate networks, decision-logic flags. Most accepted.
- Round 2: Copilot review — flagged consistency enforcement on benefits, tag governance, effective AF in view, transfer-partner deferral was too aggressive, display logic layer, recommendation-engine prep, data discipline as Phase 2 priority. All accepted with one calibration (tag governance done at admin layer, not separate lookup table).

## Round 1 review changes applied

- `credit_card_benefits.metadata` (jsonb) — captures lounge guest rules, insurance details, statement credit merchant restrictions, free-night caps without exploding the schema
- `credit_card_welcome_bonuses.estimated_value_usd` — editorial-controlled valuation so "sort by SUB" actually works (60K UR ≠ 60K Hilton ≠ $600 cash)
- `credit_card_earn_rates.booking_channel` — cleaner than `flights_through_portal` vs `flights_direct` category sprawl
- `credit_cards.affiliate_network`, `affiliate_id`, `deep_link_template` — CJ Affiliate / Rakuten Advertising generate links rather than serving static URLs
- `credit_cards.tags` (text[]) — editorial flags like `flagship`, `beginner-friendly`, `best-dining-2026` (replaces Copilot's suggested boolean columns; flexible without schema changes)
- Phase 5 spec gains "highlight differences only" toggle in the comparison view + a `credit_card_summaries` materialized view for hub performance

## Round 2 review changes applied

- `credit_card_benefits.benefit_type` — precise subtype (`lounge_priority_pass`, `trip_delay_insurance`, `free_night_award`, etc.) with CHECK constraint. `category` stays for broad grouping. Forces consistent values across rows of the same type.
- **Tag governance:** TypeScript-side validation in admin actions (curated `KNOWN_TAGS` const). Lookup-table option deferred until tag count exceeds ~30 — cheap upgrade path.
- `credit_card_summaries.effective_annual_fee_usd` — `annual_fee_usd - sum(guaranteed credits)`. Single most-important sort metric on the hub.
- **`program_transfers` brought into Phase 1** — empty table created with the rest of the schema. UI/Phase 7 reverse query reads directly from this table (never JSONB). Backfill from existing JSONB lands in a follow-up migration with no app-code changes.
- **Display logic per `benefit_type`** — frontend renderer mapping in Phase 4 (no DB column for it).
- `credit_cards.intended_user` (text[]) — audience targeting separate from editorial tags. Powers landing pages, future recommendations, SEO segmentation.
- **Phase 2 reframed:** "Admin CRUD + editorial validation" — schema enforces structure; admin layer enforces semantics (`KNOWN_TAGS`, `KNOWN_BENEFIT_TYPES`, `last_verified` reminders).

---

## Goals

1. **Each card gets its own page** with structured, sortable benefits — not a wall of text
2. **Each issuer (Chase, Amex, Citi, Cap One, etc.) gets its own page** that aggregates their cards + currency program
3. **A `/cards` hub** with filter/sort across all cards (by issuer, fee, co-brand, transfer partners, earn rate, etc.)
4. **Hotel/airline program pages auto-show the cards that earn into them** (e.g. `/programs/hyatt` lists the two Chase WoH cards + any card whose currency transfers to Hyatt)
5. **Affiliate-ready** — every card has an `affiliate_url` field that's NULL until a partnership starts, then populated. No code changes needed when relationships flip on.
6. **Alerts can reference cards** — when scout flags an "increased SUB" finding, the alert page automatically links to the card's page (via affiliate URL if available)
7. **Highly nuanced data captured cleanly** — Sapphire Reserve's $75K-spend tier-2 perks, three flavors of travel insurance, rotating bonus categories, portal redemption rates, etc. Each as a structured row, not free-form prose.

## Why this isn't a `programs` table extension

The existing `programs` table holds **loyalty currencies and hotel/airline programs** — Hyatt, Chase UR, United MileagePlus. Its fields (intro, transfer_partners, sweet_spots, tier_benefits, lounge_access, alliance, hubs) make sense for those entities.

Credit cards have a fundamentally different shape:
- ~25 unique fields per card (annual fee, SUB, FX fee, 5/24 subject, credit profile, etc.)
- Multiple earn rates per card (one row per category)
- Multiple benefits per card (one row per benefit, often with conditional thresholds)
- Multiple welcome bonus offers per card (history of SUBs)

Forcing all this into `programs` would balloon it to 40+ columns with most NULL for any given row, and the multi-row data (earn rates, benefits) couldn't be modeled at all. Separate tables are the right call.

## Data model

Five new tables. Schema is generic across all issuers/cards.

### `issuers`

Banks and card issuers. ~10 rows expected.

```
id              uuid PK
slug            text unique not null      -- 'chase', 'amex', 'citi', 'capital-one', 'bilt', 'barclays', 'wells-fargo', 'us-bank', 'discover'
name            text not null             -- 'Chase', 'American Express'
logo_url        text
intro           text                      -- editorial overview of the issuer
website_url     text                      -- main consumer site
notes           text
created_at      timestamptz default now()
updated_at      timestamptz default now()
last_verified   date
```

### `credit_cards`

One row per card. ~50-100 cards expected over time.

```
id                          uuid PK
slug                        text unique not null      -- 'chase-sapphire-reserve', 'world-of-hyatt', 'amex-platinum'
issuer_id                   uuid not null FK -> issuers
name                        text not null             -- 'Chase Sapphire Reserve', 'The World of Hyatt Credit Card'
image_url                   text                      -- card art
intro                       text                      -- editorial overview
official_url                text                      -- non-affiliate Chase page
affiliate_url               text                      -- NULL until partnership exists
last_verified               date

annual_fee_usd              integer                   -- current AF, e.g. 795 for CSR
card_type                   text not null check (card_type in ('personal','business'))
card_tier                   text check (card_tier in ('premium','mid','starter','hotel_cobrand','airline_cobrand','business','secured','charge'))

currency_program_id         uuid FK -> programs       -- 'chase-ur', 'amex-mr', etc. NULL for cards that don't earn a transferable currency
co_brand_program_id         uuid FK -> programs       -- 'hyatt' for WoH card. NULL for non-cobrand cards

foreign_transaction_fee_pct numeric(4,2)              -- 0.00 for premium, 3.00 for many starters
chase_5_24_subject          boolean default true      -- true for most Chase cards
credit_score_recommended    text                      -- 'fair' | 'good' | 'excellent'

-- Affiliate (NULL until partnership active)
affiliate_url               text                      -- already declared above; documenting alongside related fields
affiliate_network           text                      -- 'cj' | 'rakuten' | 'issuer_direct' | NULL
affiliate_id                text                      -- network-specific ID (publisher_id, advertiser ID, etc.)
deep_link_template          text                      -- e.g. 'https://www.tkqlhce.com/click-XXXX-YYYY?url={dest}' for CJ

-- Editorial tags (replaces hardcoded "is_best_in_class_*" booleans for flexibility)
tags                        text[] default '{}'       -- e.g. ['flagship', 'best-dining-2026', 'premium-travel']
                                                      -- governed by KNOWN_TAGS const in admin actions; lookup table deferred until 30+ tags
intended_user               text[] default '{}'       -- audience targeting, separate semantic from tags
                                                      -- e.g. ['beginner', 'frequent-traveler', 'business-owner', 'foodie', 'family']
                                                      -- powers landing pages, SEO segmentation, future recommendation prep

is_active                   boolean default true      -- false if discontinued
notes                       text
created_at                  timestamptz default now()
updated_at                  timestamptz default now()
```

GIN indexes on the array columns for fast filtered queries:
```
create index credit_cards_tags_gin          on credit_cards using gin (tags);
create index credit_cards_intended_user_gin on credit_cards using gin (intended_user);
```

### `credit_card_earn_rates`

One row per earn category per card. Captures rotating + capped categories.

```
id              uuid PK
card_id         uuid not null FK -> credit_cards on delete cascade
category        text not null            -- 'dining', 'travel', 'gas', 'groceries', 'streaming',
                                          --  'travel_through_portal', 'flights_through_portal',
                                          --  'hotels_through_portal', 'everything_else',
                                          --  'rotating_quarterly', 'transit', 'add_on'
multiplier      numeric(5,2) not null    -- 8.00 for CSR dining, 1.0 for everything else
cap_amount_usd  integer                   -- $1500 cap on rotating, NULL for uncapped
cap_period      text check (cap_period in ('quarterly','annual','monthly','lifetime'))
rotating        boolean default false     -- true for Freedom Flex 5x rotators
booking_channel text check (booking_channel in ('direct','portal','any')) default 'any'
                                          -- distinguishes "5x flights via portal" from "3x flights direct"
                                          -- without splitting categories into _through_portal variants
notes           text
created_at      timestamptz default now()
updated_at      timestamptz default now()
```

### `credit_card_benefits`

One row per benefit per card. The most flexible table — captures statement credits, insurance, status, free nights, anything benefit-shaped.

```
id                  uuid PK
card_id             uuid not null FK -> credit_cards on delete cascade
category            text not null         -- BROAD GROUPING: 'statement_credit', 'insurance', 'lounge_access',
                                          --  'free_night', 'status_conferred', 'protection', 'spend_unlock',
                                          --  'portal_redemption', 'transfer_partner_unlock'
benefit_type        text not null         -- PRECISE SUBTYPE — drives frontend render template + metadata shape
                                          --  CHECK constraint enumerates: see KNOWN_BENEFIT_TYPES below
name                text not null         -- 'Trip Delay Reimbursement', 'Annual Travel Credit'
value_amount        numeric(10,2)         -- 300 for $300 travel credit, 1.5 for 1.5cpp portal
value_unit          text check (value_unit in ('USD','nights','pct','points','miles','points_per_dollar') or value_unit is null)
coverage_amount     numeric(10,2)         -- $10K trip cancel ceiling
frequency           text check (frequency in ('per_trip','annual','anniversary','monthly','lifetime','one_time','quarterly'))
spend_threshold_usd numeric(10,2)         -- 75000 for CSR's tier-2 unlocks; NULL = always-on
description         text
sort_order          integer default 0     -- for ordering within a card's benefits list
metadata            jsonb default '{}'    -- shape varies by category; see examples below
created_at          timestamptz default now()
updated_at          timestamptz default now()
```

**Why `metadata jsonb`:** different benefit categories carry wildly different fields. Flat columns would mean ~30 nullable fields, most NULL on any row. Examples by category:

```jsonc
// category = 'lounge_access'
{ "network": "priority_pass", "guests_per_visit": 2, "visits_per_year": "unlimited" }

// category = 'travel_insurance' (trip delay variant)
{ "delay_hours": 6, "max_per_trip_usd": 500, "max_per_year_usd": 2000, "covered_persons": "cardholder + family" }

// category = 'rental_insurance'
{ "type": "primary", "covered_loss_types": ["collision","theft"], "vehicle_value_cap_usd": 75000 }

// category = 'statement_credit' (DoorDash-style)
{ "merchant": "doordash", "amount_usd": 25, "split": "monthly", "annual_total_usd": 300, "expires": "use_or_lose" }

// category = 'free_night'
{ "category_cap": 4, "expiration_months": 12, "after_spend_usd": 15000 }
```

Indexed query patterns (e.g., "all cards with Priority Pass") use jsonb path operators:
```
select c.* from credit_cards c
join credit_card_benefits b on b.card_id = c.id
where b.category = 'lounge_access'
  and b.metadata->>'network' = 'priority_pass';
```

GIN index on `metadata` to keep these queries fast:
```
create index credit_card_benefits_metadata_gin on credit_card_benefits using gin (metadata);
```

**`benefit_type` controlled list (CHECK constraint):**

```
check (benefit_type in (
  -- Lounge access
  'lounge_priority_pass', 'lounge_centurion', 'lounge_admirals_club',
  'lounge_skyclub', 'lounge_united_club', 'lounge_polaris',
  -- Insurance
  'trip_delay_insurance', 'trip_cancellation_insurance', 'trip_interruption_insurance',
  'baggage_delay_insurance', 'lost_luggage_insurance',
  'rental_car_cdw_primary', 'rental_car_cdw_secondary',
  'travel_accident_insurance', 'emergency_evacuation_insurance',
  -- Statement / travel credits
  'travel_credit_annual', 'doordash_credit', 'dining_credit',
  'streaming_credit', 'wireless_credit', 'walmart_credit', 'saks_credit',
  'global_entry_credit', 'tsa_precheck_credit', 'clear_credit',
  'hotel_credit', 'airline_credit', 'flight_credit',
  -- Hotel-specific
  'free_night_award', 'free_night_after_spend',
  -- Status
  'status_hyatt_discoverist', 'status_hyatt_explorist', 'status_hyatt_globalist',
  'status_marriott_silver', 'status_marriott_gold', 'status_marriott_platinum',
  'status_hilton_silver', 'status_hilton_gold', 'status_hilton_diamond',
  'status_hertz_gold', 'status_avis_preferred', 'status_national_emerald',
  -- Other
  'purchase_protection', 'extended_warranty', 'return_protection',
  'cellphone_protection', 'concierge', 'prepaid_extra_value',
  'transfer_partner_access', 'portal_redemption_bonus', 'spend_unlock_perk'
))
```

This list is the source of truth — the frontend renderer (Phase 4) maps each `benefit_type` to a display template. Adding new benefit types requires a migration to extend the CHECK list. Tradeoff: catches typos at write time, costs a migration when issuers invent new perks (rare).

If the CHECK list becomes unwieldy (~100+ types), promote to a real `benefit_types` lookup table.

### `program_transfers`

Normalizes the JSONB transfer-partner data currently on `programs.transfer_partners`. Created empty in Phase 1; backfilled from JSONB in a follow-up migration. UI/Phase 7 reverse-query reads from this table only — never touches the JSONB.

```
id                  uuid PK
from_program_id     uuid not null FK -> programs    -- e.g. chase-ur
to_program_id       uuid not null FK -> programs    -- e.g. hyatt
ratio               text not null                    -- '1:1', '1000:600', '5:4'
bonus_active        boolean default false
bonus_pct           integer                          -- 30 for "30% bonus"
bonus_starts        date
bonus_ends          date
notes               text
last_verified       date
created_at          timestamptz default now()
updated_at          timestamptz default now()

-- A given pair shouldn't appear twice
unique (from_program_id, to_program_id)
```

Indexes for the reverse query "which currencies transfer to this program?":
```
create index program_transfers_to_idx   on program_transfers (to_program_id);
create index program_transfers_from_idx on program_transfers (from_program_id);
```

**Why this is in Phase 1, not deferred:**
1. The "Cards that earn into me" feature on hotel/airline pages (Phase 7) is one of the strongest differentiators of this product (per Copilot review #2). Building it on top of JSONB parsing and then refactoring later is more work than getting the schema right once.
2. Empty table is zero-risk.
3. Backfill is a single migration that runs after Phase 7 ships, before any user-visible features depend on the data being complete.

**Backfill plan (separate migration, post-Phase-7):**
```sql
insert into program_transfers (from_program_id, to_program_id, ratio, bonus_active, notes)
select
  p.id as from_program_id,
  to_p.id as to_program_id,
  (tp->>'ratio') as ratio,
  coalesce((tp->>'bonus_active')::boolean, false) as bonus_active,
  tp->>'notes' as notes
from programs p
cross join lateral jsonb_array_elements(p.transfer_partners) as tp
join programs to_p on to_p.slug = tp->>'from_slug'
where p.transfer_partners is not null
  and jsonb_array_length(p.transfer_partners) > 0
on conflict (from_program_id, to_program_id) do nothing;
```

(Note: existing `transfer_partners.from_slug` field is a slight misnomer — it stores the source currency that transfers INTO the program. The migration translates that back into the canonical `from → to` direction.)

After backfill verification, a future migration can drop `programs.transfer_partners` (the JSONB column). That step requires updating [components/programs/TransferPartnersTable.tsx](components/programs/TransferPartnersTable.tsx) and any writer pipeline references — separate concern, not blocking this plan.

### `credit_card_welcome_bonuses`

History of SUB offers per card. Current offer has `is_current = true`.

```
id                  uuid PK
card_id             uuid not null FK -> credit_cards on delete cascade
bonus_amount        integer not null           -- 60000 for "60K points"
bonus_currency      text not null              -- 'Ultimate Rewards points', 'miles', 'cash back'
spend_required_usd  integer not null           -- 4000 for "$4K in 3 months"
spend_window_months integer not null           -- 3
extras              text                       -- "+30K more for 2x earn on first $15K"
estimated_value_usd numeric(10,2)              -- editorial valuation: 60K UR ≈ $1,200; 100K Hilton ≈ $500
                                               -- enables "sort by SUB value" and "best SUB right now"
window_start        date                       -- when this offer opened
window_end          date                       -- NULL = current standard offer; set when offer ended
is_current          boolean default false      -- only ONE per card should be true at a time
source_url          text
notes               text
created_at          timestamptz default now()
updated_at          timestamptz default now()
```

Constraint to enforce only one `is_current = true` per card via partial unique index:
```
create unique index credit_card_welcome_bonuses_one_current_per_card
  on credit_card_welcome_bonuses (card_id) where is_current = true;
```

## Existing header placeholder this plan fulfills

The site's Tools dropdown ([components/layout/Header.tsx:11](components/layout/Header.tsx:11)) already shows a `Card Benefits Search` entry with `comingSoon: true` and `href: null`. **This plan IS that tool.** When Phase 5 (the `/cards` hub) ships, we flip that entry to `comingSoon: false, href: "/cards"`. The "Card Benefits Search" name should arguably be renamed at the same time — `Cards` or `Card Comparison` is more accurate to what we're building (a sortable/comparable hub, not a search box). Decision deferred to Phase 5 cutover.

## URL / page structure

```
/cards                                 — Hub: sortable, filterable grid
/cards/[slug]                          — Individual card detail
/issuers                               — Issuer index (Chase, Amex, etc.)
/issuers/[slug]                        — Issuer page (lists their cards + currency program if applicable)

/programs/[slug]                       — EXISTING. Hotel/airline pages get a new "Cards that earn into me" section
                                         (auto-queried via co_brand_program_id + currency_program_id reverse-lookup)

/admin/cards                           — Admin list of all cards
/admin/cards/new                       — Add card form
/admin/cards/[id]/edit                 — Edit card + nested forms for earn rates, benefits, SUBs
/admin/issuers                         — Admin list of issuers (small, infrequent edits)
```

## Sortable / comparable UX (the `/cards` hub)

Filters:
- Issuer (Chase, Amex, etc.)
- Card type (personal / business)
- Card tier (premium / mid / starter / hotel co-brand / airline co-brand)
- Annual fee range (slider)
- Currency program (Chase UR, Amex MR, etc.)
- Co-brand program (Hyatt, United, etc.)
- Has lounge access (boolean derived from benefits)
- Foreign transaction fee (boolean: 0% only)
- Chase 5/24 subject (boolean: hide if you're maxed out on 5/24)

Sort:
- Annual fee (asc/desc)
- Welcome bonus value (current SUB only)
- Best earn rate on selected category (e.g. "rank by dining multiplier")

Comparison view:
- Select up to 4 cards → side-by-side table
- Rows: AF, SUB, top earn rates, key benefits (lounge, travel credit, free night, status, etc.)
- **"Highlight differences only" toggle** — collapses rows where all selected cards have identical values, leaving only the rows that actually differ. Otherwise comparison tables drown in matching values (e.g. "no FX fee, no FX fee, no FX fee, no FX fee" across four premium cards).

## "Cards that earn into me" on hotel/airline pages

Auto-derived from two queries on each program page:

1. **Direct co-brands:** `select * from credit_cards where co_brand_program_id = '<this program id>'`
2. **Transfer-partner pathway:** `select * from credit_cards where currency_program_id in (select id from programs where currency transfers to <this program>)`

Render as compact cards with: image, name, AF, current SUB, "Apply" button (uses affiliate_url if set, else official_url).

For Hyatt specifically, this would surface:
- Chase World of Hyatt Credit Card (direct co-brand)
- Chase World of Hyatt Business Credit Card (direct co-brand)
- Chase Sapphire Preferred (UR transfers to Hyatt 1:1)
- Chase Sapphire Reserve (UR transfers to Hyatt 1:1)
- Chase Freedom Unlimited (when paired with a UR-earning premium card)
- Chase Ink cards (UR transfers to Hyatt 1:1)
- Bilt Mastercard (Bilt transfers to Hyatt 1:1)

Without writing a single per-page query — pure data-driven.

## Alert integration

When scout produces a finding tagged with a card's currency program (e.g. `programs: ['chase-ur']` for an "increased CSR SUB" alert), the alert detail page should optionally surface the related card. Two paths:

1. **Manual:** add a `related_card_id` column to `alerts` (FK to `credit_cards`). Author/editor sets it during alert creation.
2. **Auto-derived:** if alert mentions a card name in title/description, fuzzy-match to credit_cards.slug. Riskier but no manual step.

Recommend (1) — explicit, no false matches. Add to admin alert form as an optional dropdown.

When the alert renders, if `related_card_id` is set:
- Show a card panel inline ("This alert is about the Chase Sapphire Reserve")
- Apply button uses affiliate_url if set
- Click-tracking lives on the apply button (separate concern, future)

## Affiliate strategy

Phases:
1. **Now:** schema in place with `affiliate_url` column, all NULL.
2. **Apply for partnerships:** Chase Affiliate Program, Amex Issuer Direct, individual issuer programs. Multi-week approval cycles.
3. **As relationships start:** populate `affiliate_url` on the relevant card row. Page renders affiliate URL automatically.
4. **Disclosure:** every page with a populated affiliate_url needs a visible affiliate disclosure ("This site receives compensation when you apply through our links"). Render conditionally based on whether ANY visible card on the page has an affiliate_url. Footer + per-card.

## Build phases

Each phase is roughly 1 session. Order is dependency-aware.

### Phase 1 — Schema (this session if approved)
- Migration: 5 new tables + indexes + RLS policies
- Update `utils/supabase/queries.ts` with TypeScript interfaces
- No UI changes
- **Deliverable:** SQL paste into Supabase + a PR with the migration file

### Phase 2 — Admin CRUD + editorial validation
- `/admin/issuers` (list + new/edit forms)
- `/admin/cards` (list + new/edit forms; nested forms for earn rates, benefits, SUBs)
- Reuses existing form components (TextField, SelectField, etc.)
- **Editorial governance baked in (not a separate phase):**
  - `KNOWN_TAGS` const in `lib/cards/tags.ts` — admin form validates `tags` input against this list, rejects unknown values, suggests near-matches
  - `KNOWN_BENEFIT_TYPES` const mirrors the DB CHECK constraint — admin form provides a typeahead, can't submit unlisted values
  - `KNOWN_INTENDED_USERS` const for the audience array
  - `last_verified` reminder column in admin table — sort by oldest, flag rows >90 days as stale
  - Required-field discipline: a card row can't be saved with status='active' unless it has at least one current SUB row, one earn rate row, and at least one benefit row. Drafts allowed without that.
- **Deliverable:** can enter card data via admin AND data quality is enforced at write time, not discovery time

### Phase 3 — Author the first 4 cards
Via SQL inserts (per the "prefer SQL" preference) for speed:
- Chase World of Hyatt Credit Card (personal, $95 AF)
- Chase World of Hyatt Business Credit Card ($199 AF)
- Chase Sapphire Preferred ($95 AF)
- Chase Sapphire Reserve ($795 AF)

Plus the issuer row for Chase. Each card includes 5-15 earn rate rows + 10-25 benefit rows + 1 current SUB row.

### Phase 4 — Public card detail page (`/cards/[slug]`)
- Server-rendered page that pulls the card + nested rows
- Sections: hero (image + name + AF + SUB + apply button), intro, earn rates table, benefits accordion grouped by category, fine-print
- **Required: section-jump TOC at the top of the page.** Below the hero, a sticky-or-scrolling TOC bar shows section names (Welcome bonus, Earn rates, Free nights, Status, Insurance, Protection, etc.) — clickable anchor links that scroll to the matching section. Same pattern as program pages use today. Cards have lots of dense content; readers shouldn't have to scroll the whole page to find baggage delay terms or the SUB. **Applies to every card going forward** — gets rendered automatically from whichever sections actually have content (hide TOC entries for empty categories).
- Schema.org structured data (Product / FinancialProduct) for AI visibility per memory `project_ai_visibility.md`
- **Benefit display mapping (frontend renderer per `benefit_type`):** a single `<BenefitCell />` component takes a benefit row and dispatches to type-specific renderers based on `benefit_type`. Each renderer knows how to format its `metadata` shape:
  - `lounge_priority_pass` renderer reads `metadata.guests_per_visit`, `metadata.visits_per_year`
  - `trip_delay_insurance` renderer reads `metadata.delay_hours`, `metadata.max_per_trip_usd`
  - `free_night_award` renderer reads `metadata.category_cap`, `metadata.expiration_months`
  - Default renderer (for unmapped types) shows raw `name + description + value`
  - Lives at `lib/cards/benefit-renderers.ts` — add a new render fn whenever we add a benefit_type to the CHECK list
- This is what keeps the UI from devolving into if/else spaghetti as the benefit catalog grows.

### Phase 5 — Cards hub (`/cards`)
- Server-rendered grid with all cards
- Client-side filter + sort UI (issuer, AF, tier, currency, etc.)
- Same component reused for `/issuers/[slug]` filtered to that issuer
- **Header cutover:** flip `Card Benefits Search` in [Header.tsx:11](components/layout/Header.tsx:11) from `comingSoon: true, href: null` to `comingSoon: false, href: "/cards"`. Optionally rename to `Cards` or `Card Comparison` at the same time (the new hub does sort+compare, not literal text search — though search-by-name could be a filter on the page).

**Derived data layer (introduced in this phase):** add a materialized view `credit_card_summaries` to keep hub queries fast. View columns:

```
card_id, slug, name, image_url, annual_fee_usd,
effective_annual_fee_usd,            -- annual_fee - sum(guaranteed credit values), the #1 sort metric
card_type, card_tier, issuer_slug,
currency_program_slug, co_brand_program_slug,
has_lounge_access (bool, derived),
has_priority_pass (bool, derived),
has_free_night (bool, derived),
has_transferable_points (bool, derived from currency_program presence + program_transfers count),
max_dining_multiplier,
max_travel_multiplier,
current_sub_amount, current_sub_currency, current_sub_value_usd,
foreign_transaction_fee_pct, tags, intended_user
```

**`effective_annual_fee_usd` calculation logic:**
- Start with `annual_fee_usd`
- Subtract sum of `value_amount` from benefits where `category in ('travel_credit', 'dining_credit', 'streaming_credit', ...)` AND `frequency = 'annual'` AND `metadata->>'guaranteed' != 'false'` (default to guaranteed)
- Statement credits with merchant restrictions or "use it or lose it" mechanics need an editorial flag (`metadata->>'reliable_breakage' = 'high|medium|low'`) — only `high` reliability counts toward effective AF
- Result represents the realistic out-of-pocket cost for someone who actually uses the card's primary credits

Refresh policy: `refresh materialized view concurrently credit_card_summaries` triggered after admin saves on cards / earn rates / benefits / SUB tables. ~50-100 cards × ~30 columns = trivial refresh time. Concurrent refresh keeps reads non-blocking.

Why introduce this in Phase 5 and not Phase 1: schema flux is too high before Phase 4 (when we render the first card detail page and discover what queries we actually need). Materialize once query shapes stabilize.

### Phase 6 — Issuer pages (`/issuers/[slug]`)
- Issuer hero (logo, intro, website link)
- Their currency program (if they have one) — link to existing /programs page
- Their cards (grid, same component as /cards hub filtered)

### Phase 7 — "Cards that earn into me" on hotel/airline pages
- New component: `RelatedCards.tsx`
- Mounted in [app/(site)/programs/[slug]/page.tsx](app/(site)/programs/[slug]/page.tsx) above or below properties table
- Auto-queries direct co-brands + transfer-partner pathway

### Phase 8 — Alert ↔ Card linking
- Add `related_card_id` to `alerts`
- Admin alert form gets a card dropdown
- Alert page renders related-card panel

### Phase 9 — Affiliate URLs (when relationships start)
- Populate `affiliate_url` on relevant cards
- Add disclosure component, render conditionally
- Click tracking infrastructure (optional, separate concern)

## Open questions / decisions for review

1. **Card slug format:** do we use the full bank+card name like `chase-sapphire-reserve` or a shorter `csr` for popular ones? Recommendation: full names always. SEO + clarity.

2. **Discontinued cards:** Soft-delete via `is_active=false` or hard-delete? Recommendation: soft-delete. Historical SUBs and category data have research value.

3. **Issuer slug for currency programs:** Chase has `chase-ur` as a program slug. Should `/issuers/chase` be the issuer page and `/programs/chase-ur` stay as the currency page? Or should `/issuers/chase` redirect to / supersede `/programs/chase-ur`? Recommendation: keep them separate. Issuer page is editorial, currency page is structured data.

4. **Card image hosting:** Where do card art images live? Public bucket on Supabase Storage? Vercel Blob? CDN? Recommendation: Supabase Storage (already in stack).

5. **Multiple SUB tracks:** Some cards (CSP) have separate SUBs for personal vs. existing-customer, "1-2 free nights" cards have rotating bonuses. Schema handles via multiple rows but UI needs to surface the relevant one. Recommendation: only show `is_current` SUB on the public page; show all in admin.

6. **Card families / sister cards:** Chase Trifecta = Sapphire + Freedom + Ink. Should we model card families explicitly? Recommendation: NO. Surface via `currency_program_id` reverse-query ("Other cards that earn UR"). A separate `card_family` table is over-engineered until proven needed.

7. **Business vs. personal:** Some users want only personal, others mix. Recommendation: prominent filter on the hub, default to "all".

8. **Velocity expectation:** With ~50-100 cards eventually, can the editorial team realistically maintain currency? Recommendation: a `last_verified` field (already in schema) + admin dashboard column highlighting cards >90 days since verification. Reuse the same pattern as programs.

9. **Search SEO:** card pages with structured data should rank for "Chase Sapphire Reserve benefits" type queries. Add JSON-LD per `project_ai_visibility.md` plan from day one.

10. **Reviews / commentary:** are these editorial pages or pure data pages? Recommendation: data pages with a short editorial `intro` field. No long-form reviews. The data IS the value.

## Migration ordering and rollback

- Phase 1 migration (creating 5 tables) is purely additive — no rollback risk. If we abandon the project, the tables sit empty.
- Phase 7+ touches existing /programs/[slug] pages (adds a new section). Rollback = remove the `<RelatedCards />` component import. No data loss.
- No destructive operations anywhere in the plan.

## Coordinated work: deprecating `programs.transfer_partners` (JSONB)

This plan creates `program_transfers` (the normalized join table) in Phase 1 but leaves the existing `programs.transfer_partners` JSONB column in place during the transition. The two coexist until:

1. Backfill migration populates `program_transfers` from JSONB (separate migration, post-Phase-7)
2. Reads in [components/programs/TransferPartnersTable.tsx](components/programs/TransferPartnersTable.tsx) and [utils/ai/programReferenceData.ts](utils/ai/programReferenceData.ts) get rewritten to query `program_transfers`
3. Writes (admin program edit form) get rewritten to update `program_transfers` instead of mutating JSONB
4. JSONB column finally dropped in a cleanup migration

These are tracked separately from this plan but flagged as **dependencies** for Phase 7 (Cards that earn into me) — that phase reads from `program_transfers` only, never the JSONB. If backfill hasn't happened by Phase 7, the reverse-query just returns empty for currencies whose transfers aren't yet ingested.

## Non-goals (explicitly NOT in this plan)

- **Personalized account-based recommendations** ("which card should I get based on my spend?"). Would need user accounts. The `intended_user` array prepares the *data shape* for static recommendation pages (e.g. `/cards/best-for-beginners`), but no per-user logic.
- **Auto-syncing AF / SUB / earn rates from issuer sites.** Manual editorial maintenance.
- **Card application flow integration.** Link out to issuer; no in-app apply flow.
- **Credit score modeling.** Display recommended score range; don't pull user scores.
- **Foreign currency cards.** US market only.
- **Decision-logic boolean flags** (`is_best_in_class_dining`, etc.) — replaced with `tags text[]` and `intended_user text[]`. Boolean columns lock us into specific judgments that go stale; arrays scale with editorial intent without schema migrations.
- **Separate `card_tags` / `benefit_types` lookup tables.** Deferred. Admin-side TS const validation handles governance until tag/type counts justify the lift to lookup tables.

## Memory references

- [project_credit_cards_and_affiliates.md](memory) — original sketch (will be superseded by this doc once approved)
- [project_ai_visibility.md](memory) — JSON-LD requirement for cards
- [feedback_prefer_sql_over_admin_forms.md](memory) — Phase 3 data entry will be SQL
- [feedback_migrations_visibility.md](memory) — every phase's migration goes into a file in supabase/migrations/
- [project_resources_nav_trigger.md](memory) — resources nav trigger doesn't apply to cards (which get their own /cards hub)
