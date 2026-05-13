# Two-Pass Extraction — Backlog & Rollout Plan

Created: 2026-05-13
Status: capability shipped for credit cards (PR #496); rollout to other content types pending

## The pattern

Every structured extraction from issuer/operator pages should run as two passes:

1. **Pass 1 — initial extraction:** Sonnet reads scraped markdown, returns full structured JSON matching our schema. Uses our forced checklist for common items.
2. **Pass 2 — completeness review:** Sonnet re-reads the same markdown + pass 1's output. Returns ONLY additions — items in the markdown but missing from pass 1. Conservative bias; only adds, never modifies.

Cost: doubles Sonnet spend (~$0.06 → $0.12 per item). Worth it for systematic completeness improvement on every extraction.

## Implementation reference

For credit cards, see:
- `utils/cards/cardReviewPrompt.ts` — review prompt template
- `utils/cards/reviewExtraction.ts` — orchestrator + merge logic
- `utils/cards/extractCardBenefits.ts` — wires pass 2 after pass 1
- UI: emerald border + "+ review pass" badge on added items

Same architecture reused for other content types — just swap the schema and prompt.

## Where two-pass is applied

| Content type | Status | Notes |
|---|---|---|
| Credit cards | ✅ Live | PR #496 — applies to all future card extractions |
| Loyalty currency programs (Chase UR, Amex MR, etc.) | 📋 To build | Tomorrow's priority — transfer partner data |
| Airlines (75 in DB) | 📋 To re-run | Most authored before two-pass existed; likely incomplete |
| Alliances (oneworld, SkyTeam, Star Alliance) | 📋 To re-run | Same — pre-two-pass |
| Hotels | 📋 Apply from day 1 | When hotel authoring begins, use two-pass |
| Issuer pages (`/issuers/[slug]`) | 📋 To build | If we extract issuer-level content |

## Backlog: airline + alliance re-runs

We've authored ~75 airline programs and 3 alliance pages over the past months. All authored via the older single-pass extractor (`scripts/scrape.mjs` and friends) or manual entry. Two-pass would likely surface:

- Named premium programs (e.g., United Polaris, BA First, AA Flagship)
- Currency-level features (no expiry, mileage pooling, family sharing)
- Award chart sub-sections often buried in FAQ
- Alliance-specific benefits (oneworld Emerald lounge access rules)
- Sweet spot variations (one-way vs roundtrip, surcharge differences)

### Plan

When we build the program extraction pipeline tomorrow (transferable currencies), we'll have the same two-pass capability. Once that pipeline works for currencies, point it at:

1. **Alliances (3 cards):** oneworld, SkyTeam, Star Alliance — re-extract with two-pass
2. **Airlines with rich sweet-spot content (top 20):** United, Delta, AA, Southwest, Alaska, Hawaiian, JetBlue, Aer Lingus, BA, Iberia, Air France, KLM, Qantas, Singapore, Cathay, ANA, Emirates, Etihad, Turkish, Lufthansa
3. **Airlines with sparser pages (next 30):** Avianca, LATAM, Aeroplan, etc.
4. **Niche carriers (remaining ~25):** Lower priority, only if comparison tool surfaces gaps

Cost estimate: 75 airlines × $0.12/two-pass = $9. Trivial.

Time estimate: with the extraction pipeline in place, ~2-3 minutes per airline (mostly waiting for Sonnet). Half-day to run all 75.

### Trigger condition

Don't re-run airlines until **(a)** the currency program extraction pipeline is working end-to-end, **(b)** we've validated it on Chase UR + Amex MR + Citi TY, and **(c)** the schema for any new fields surfaced by two-pass is locked in.

This prevents thrashing the data — re-running today catches old misses; re-running again next week to add a new schema field thrashes the audit trail.

## Other content types that benefit from two-pass

- **Promo ingestion** (`run-promo-scraper` cron) — currently single-pass. Should adopt two-pass for any promo with multiple discount tiers or stacking conditions.
- **Alert generation** (`writeAlertDraft`) — already two-pass-ish via the AI rewriter, but could benefit from explicit review for fact-checking.
- **Newsletter** (`buildNewsletter`) — uses Sonnet generation; review pass would catch missed sweet spots, mismatched links, or fact errors.

These can adopt the pattern opportunistically.

## Key principle

**Two-pass is a quality-vs-cost tradeoff that almost always wins.** Cost doubles; quality jumps materially. For any extraction where the schema is dense and the source is structured prose, two-pass is the right default. Single-pass should be the exception (e.g., when the source is already a structured feed).
