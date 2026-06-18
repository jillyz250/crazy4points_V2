# Experiences Directory — Build Plan & Data Schema

Status: **DRAFT for review.** No code until Jill signs off on the schema.
Last updated: 2026-06-18.

## 1. Goal
A new **Experiences** section: a directory of loyalty/card programs that let you
either (A) **redeem** points/miles for experiences, or (B) get cardholder
**presale/access** to experiences. Lives at **`/experiences`** (a sortable,
filterable hub) with one **`/experiences/[slug]`** detail page per program, linked
from the **Resources** nav dropdown, and cross-linked with each program's existing
`/programs/[slug]` reference page.

**Editorial stance:** points-for-experiences is NOT framed as poor value. It can be
excellent (Marriott 1-Point Drops, Hyatt FIND points-or-cash). Cash-or-points
flexibility is a feature. Pages are honest and useful, never dismissive.

## 2. Architecture decision
**New dedicated `experiences` table + new `/experiences` route.** NOT a new
`type` on the `programs` table.

Rationale:
- Experiences are *features of* programs, not programs themselves. The `programs`
  reference-page template renders airline/hotel sections (transfer partners, award
  charts, tiers, lounges) that don't apply here.
- The experiences schema (mode, mechanic, pricing model, experience types) is
  genuinely different; overloading `programs` would add ~15 columns that are null
  for all 90+ airlines/hotels/cards.
- The hub needs its own sort/filter UI, distinct from the typed `/programs` directory.
- Cross-linking is a simple FK: `experiences.parent_program_slug -> programs.slug`.

Reused: the design system (Royal Glow tokens, `.rg-*` classes), the mobile contract,
and the same Supabase admin patterns.

## 3. Data schema — `experiences` table

```
id                    uuid primary key default gen_random_uuid()
slug                  text unique not null          -- kebab, e.g. marriott-bonvoy-moments
name                  text not null                 -- "Marriott Bonvoy Moments"
parent_program_slug   text                          -- FK-ish to programs.slug; NULL for networks (Mastercard/Visa)
parent_program_label  text not null                 -- display label even when no page exists
parent_type           text not null                 -- hotel | airline | bank_currency | card_network
mode                  text not null                 -- redeem | access | both
currency              text not null                 -- "Marriott Bonvoy points" | "Cardholder access (cash)"
region                text not null                 -- US | Global | Europe | Asia-Pacific | Canada | UK | Middle East

-- Editorial content (markdown)
intro                 text                          -- voicey overview, points-first
what_you_get          text                          -- categories / what you can redeem for OR access
how_it_works          text                          -- mechanic + pricing model; show points-or-cash
how_to_access         text                          -- eligibility, cards, status
standout_examples     text                          -- notable / recurring offers
good_to_know          text                          -- refundability, regional limits, fees, how to find inventory
value_take            text                          -- honest editorial (access angle, points-or-cash)

-- Structured / filterable
experience_types      text[]                        -- concert, sports, culinary, theater, wellness, travel,
                                                    --   festival, motorsports, family, celebrity, luxury, money_cant_buy
pricing_models        text[]                        -- fixed | auction | bid | points_or_cash | access_only
inventory_style       text                          -- year_round | limited_drop | seasonal | event_driven
min_points            integer                       -- lowest entry point in points (Marriott=1, Wyndham=2500, Atmos=10000); NULL for access-only
entry_point_label     text                          -- "From 1 point", "From 2,500 points", "Cardholder access"
booking_partner       text                          -- Ticketmaster, On Location, etc. (nullable)
refundable            text                          -- "No" | "Varies by event" | "Yes" (text, not bool -- usually nuanced)
requires_card         text[]                        -- specific cards/tiers (e.g. {"Amex Platinum","Centurion"}); empty = open to members
country_restrictions  text[]                        -- empty = none
featured_events       jsonb                         -- [{title, detail}] for the standout block

-- Provenance / ops
official_url          text not null                 -- the program's own experiences landing page
source_urls           text[]                        -- provenance for verification
last_verified         date
sort_weight           integer default 0             -- manual ordering nudge
status                text not null default 'draft' -- draft | published
created_at, updated_at timestamptz
```

Migration also: an index on `parent_program_slug` (for the cross-link lookup) and a
GIN index on `experience_types` + `pricing_models` (for hub filtering).

## 4. `/experiences` hub page (sortable + filterable)

Layout:
- Hero / intro (what this is; the honest "great access, sometimes points-or-cash" stance).
- **Grouped sections** (default view):
  - **Redeem points for experiences** (mode in redeem/both)
  - **Access & presales** (mode in access/both)
  - **Browse by category** (chips: Concerts · Sports · Dining · Money-can't-buy · Auctions · Points + Cash)
- **Filter facets** (multi-select, staged + Apply like the Card Finder):
  - Mode: Redeem · Access · Both
  - Parent type: Hotel · Airline · Bank/currency · Card network
  - Experience type: concert / sports / dining / wellness / travel / festival / money-can't-buy / ...
  - Pricing model: points-or-cash · auction/bid · fixed · access-only
  - Region
  - Card required? (yes/no)
- **Sort options:**
  - A–Z (default)
  - Lowest entry point (`min_points` asc, NULLs last) — surfaces Marriott 1-Point Drops, Wyndham 2,500, etc.
  - Parent type (group hotels/airlines/banks)
- Tile = name, parent label, mode badge, currency, entry_point_label, 2-3 experience-type chips.

Mobile contract: `repeat(auto-fit, minmax(...))` grid, 44px tap targets, no overflow at 375px,
filters in a collapsible drawer.

## 5. `/experiences/[slug]` detail page

Sections render by `mode`:
- **Intro** (always)
- **What you can redeem for** (redeem/both) / **What access you get** (access/both)
- **How it works** (mechanic + pricing model; show points-or-cash slider note)
- **Who's eligible / how to access** (requires_card, status)
- **Standout examples** (featured_events)
- **Good to know** (refundability, regional, fees)
- **Value take** (honest editorial)
- **Cross-link card** -> parent `/programs/[parent_program_slug]` (when not null)
- Outbound CTA to `official_url`.

## 6. Cross-linking with program pages
- On the experience page: a "Part of [Parent Program]" card linking to
  `/programs/[parent_program_slug]` (skip if NULL).
- On the program reference page (`/programs/[slug]`): if an experiences row exists with
  `parent_program_slug = this.slug`, show an **"Experiences"** callout/section linking to
  `/experiences/[experience-slug]`. (One query: `experiences where parent_program_slug = slug`.)
  This delivers Jill's "link to the Marriott page where it says Experiences."

## 7. Nav
Add to `RESOURCE_ITEMS` in `components/layout/Header.tsx` (desktop + mobile):
`{ label: "Experiences", href: "/experiences" }` — placed after Hotels/Alliances,
before Points Hub. Optional live count like the program directories.

## 8. Authoring workflow
- Copilot's per-program field dump = the **draft** dataset (good starting point).
- Per project rule, **re-verify each program against its official experiences URL**
  before publishing (Copilot is research-assist, not source of truth). Capture
  `source_urls` + `last_verified`.
- Voice: sassy-traveler-friend, points-first, honest value. No derived per-point math
  (e.g. don't compute cents-per-point); qualitative + official figures only
  ("from 2,500 points or $35" is an official figure and OK).
- Seed via one SQL migration (ASCII-scrubbed), same as program pages.

## 9. Build sequence (one phase, ordered)
1. Migration: create `experiences` table + indexes.
2. Seed migration: all 26 rows (re-verified content).
3. Queries: `getExperiences()` (hub, with filters), `getExperienceBySlug()`,
   `getExperiencesForProgram(slug)` (cross-link).
4. `/experiences` hub page (grouped + sort/filter, Card-Finder-style staged filters).
5. `/experiences/[slug]` detail template (mode-aware sections).
6. Program-page cross-link section.
7. Nav: add Experiences to Resources (desktop + mobile).
8. Verify: mobile contract sweep at 375px; live-render checks; cross-links both directions.

## 10. Final roster (27 programs -> 26 detail pages; BIO = section of Amex)

### Bucket A — redeem (mode = redeem or both)
Hotels: Marriott Bonvoy Moments · World of Hyatt FIND · Hilton Honors Experiences ·
IHG One Rewards Access · Accor ALL Experiences · **Wyndham Rewards Experiences** ·
**Choice Privileges Experiences**
Airlines: Delta SkyMiles Experiences · United MileagePlus Exclusives ·
American AAdvantage Experiences · Emirates Skywards Exclusives ·
Air Canada Aeroplan Experiences · Qantas Experiences ·
British Airways Experiences (Avios) · Qatar Privilege Club Experiences (Avios) ·
Air France-KLM Flying Blue · Lufthansa Miles & More · **Atmos Rewards Unlocked (Alaska/Hawaiian)**
Bank/currency: Capital One Entertainment (**both**) · Virgin Red · Bilt Experiences (**both**)

### Bucket B — access (mode = access)
Amex Experiences (incl. **By Invitation Only** as a section) · Chase Experiences ·
Citi Entertainment · Mastercard Priceless · Visa Infinite / Signature

### Corrections from verification (2026-06-18)
Copilot said Wyndham / Choice / Alaska have no platform — **all three verified to have
real, current platforms** and are INCLUDED:
- Wyndham Rewards Experiences (auctions + fixed from 2,500 pts)
- Choice Privileges Experiences (bid points; fixed from ~5,000 pts)
- Atmos Rewards "Unlocked" / formerly Alaska Mileage Plan Unlocked (auctions + miles, from 10,000 pts)

### Parent-program mapping (verify each slug exists in `programs`)
Most map to an existing reference page (marriott, hyatt, hilton, ihg, accor, delta,
united, american, emirates, aeroplan, qantas, british-airways, qatar, air-france-klm/
flying-blue, lufthansa/miles-and-more, capital-one, virgin-red/virgin-atlantic, bilt,
wyndham, choice, atmos, amex, chase, citi). **Mastercard Priceless** and **Visa** have
NO program page -> `parent_program_slug = NULL`, show `parent_program_label` only.
