# Public Airline Pages — Plan

**Goal:** A public, points-focused cheat sheet per airline. Not Wikipedia. Six sections, all maintainable, mostly editorial — not a fleet/route encyclopedia.

**Status:** Phase 1 in progress (this PR). Phases 2 and 3 follow in separate PRs.

---

## Decision history

We considered a comprehensive encyclopedia per airline (history, fleet, lie-flat seats, routes, home airport, etc.) and rejected it. Reasoning:

- **Volume.** 89 airlines × ~10 sections × 30 min each = 400+ hours; would never finish.
- **Maintenance debt.** Routes/fleet/seats change constantly. Stale pages on a points site is *worse* than no pages — readers lose trust.
- **Commodity content.** Wikipedia, SeatGuru, FlyerTalk wiki, AwardWallet already cover that ground.
- **Brand voice mismatch.** "Sassy traveler-friend" doesn't fit a fleet table.

So we narrowed to **points-relevant content only**. Stuff Wikipedia doesn't do, that ages slowly, that benefits from editorial voice.

---

## What lives on each public page

| Section | Source | Format | Maintenance |
|---|---|---|---|
| Header strip — name, alliance, currency, official site | `programs` table | Auto-rendered | None |
| Intro — voicey "why this program matters" | New `intro` (markdown) | Markdown | Annual touch-up |
| Transfer partners — who transfers IN, ratio, notes | New `transfer_partners` (JSONB) | Rendered table | When ratios change (rare) |
| Sweet spots — curated redemptions w/ mile cost | New `sweet_spots` (markdown) | Markdown w/ examples | Quarterly review |
| Tips & quirks — expiry, family pooling, stopovers, oddities | New `quirks` (markdown) | Markdown | Annual |
| Active alerts — live alerts tagged to this program | DB join (existing) | Auto cards | Zero |

Cut for V1: aircraft fleet, lie-flat configs, route maps, home airport, founding history.

---

## Data model

One migration adds four columns + a staleness timestamp to `programs`:

```sql
alter table programs
  add column intro              text,
  add column transfer_partners  jsonb,
  add column sweet_spots        text,
  add column quirks             text,
  add column content_updated_at timestamptz;
```

`transfer_partners` shape:
```json
[
  { "from_slug": "chase", "ratio": "1:1", "notes": "Often 25-30% transfer bonus", "bonus_active": false },
  { "from_slug": "amex",  "ratio": "1:1", "notes": null, "bonus_active": false }
]
```

Everything else is markdown so editorial voice survives.

---

## Phases

### Phase 1 — Backend + admin (this PR)
- Migration 026 adds the five fields
- New server action `updateProgramPageContent`
- New `ProgramPageContentEditor` admin component — expandable per-row, four text inputs (intro / partners JSON / sweet spots / quirks), Save touches `content_updated_at`
- Staleness pill (>60 days warning — content moves slower than FAQs)
- No public route yet — admin only

### Phase 2 — One public page, end-to-end (next PR)
- Route `/programs/[slug]`
- Template component reads programs row + active/recent alerts
- Renders the six sections
- Build for Flying Blue ONLY first; no nav, no index — direct URL only
- Sanity check the layout, voice, alert integration before exposing

### Phase 3 — Nav + index + scaling (later PR)
- Header gets "Resources" dropdown → "Airlines"
- Index page at `/programs?type=airline` lists all airlines
- Soft public launch with top 4–5 airlines populated
- Fill in remaining airlines opportunistically

### Later (optional)
- Reuse template for hotels and credit cards
- Writer/fact-checker reads `intro + transfer_partners + sweet_spots + quirks` as `extra_context` instead of `faq_content` — structured grounding beats one giant text blob
- `faq_content` retires once page content covers it

---

## Anti-goals

- Don't auto-scrape transfer partner ratios. They change rarely; manual is fine.
- Don't pre-write all 89 airlines. Build the template, populate one, validate, scale.
- Don't add fleet/route/seat data. That's commodity Wikipedia content; not our job.
- Don't promise comprehensiveness. The promise is *curated points-relevant value*.

---

## Open questions for later phases

- Featured image per program? (Probably skip for V1; alliance/currency badges may be enough.)
- Comments / community contributions? No — keep it editorial.
- "Last updated" public-facing? Probably yes, builds trust ("Reviewed Apr 2026").
- Sitemap inclusion? Yes once Phase 3 ships.
