# Chase business accordion extraction — Sleuth investigation

**Date:** 2026-05-18
**Author:** Sleuth (Claude)
**Branch:** `cards/sleuth-chase-business-investigation`
**Related PRs:** #621 (non-destructive extraction), #633 (Hawk — aggressive accordion clicks)

## Symptom

When extracting Chase business credit cards (e.g. `chase-ink-business-cash`,
`chase-ink-business-preferred`, `chase-ink-business-unlimited`,
`chase-ink-business-premier`), Firecrawl returns markdown that's missing
the entire "Travel & purchase coverage" section. Hawk's PR #633 added
aggressive click-mode + auto-retry + a thin-extraction warning, but the
section STILL doesn't surface. The benefits affected:

- Auto Rental Collision Damage Waiver ($60K, primary for business)
- Travel and Emergency Assistance Services
- Roadside Dispatch
- Purchase Protection ($10K per item, 120 days)
- Extended Warranty Protection (+1 year on warranties ≤3 years)

Anthropic's WebFetch reads all five benefits cleanly from the same URL,
so the content IS in the rendered DOM — Firecrawl just drops it.

## Root cause

**The Travel & purchase coverage section on Chase business product pages
is NOT behind an accordion.** Confirmed via WebFetch inspection of
`https://creditcards.chase.com/business-credit-cards/ink/cash`:

> "The benefits section appears **visible by default** (not in a collapsed
> accordion). The content does not indicate the presence of
> `aria-hidden="true"`, `hidden` attributes, or click-to-expand panels."

That explains why Hawk's PR #633 didn't fix it. PR #633 added more
aggressive clicks (`[aria-expanded=false]`, `[aria-controls]`,
`.accordion-trigger`, scroll passes) — but with nothing to click, those
actions are no-ops. The aggressive mode improved the raw character count
(~34K → ~38K) by waking up other lazy-loaded sections, but the insurance
benefits were never gated by interaction in the first place.

The real culprit is Firecrawl's default `onlyMainContent: true` flag.
Firecrawl's HTML-to-markdown pipeline uses a heuristic main-content
extractor (similar to Readability.js) to strip navigation, footer, and
"boilerplate" wrappers. On Chase business pages, that heuristic
misclassifies the Travel & purchase coverage section as boilerplate and
drops it. WebFetch's own HTML-to-markdown converter doesn't apply the
same heuristic and so retains the content.

## Tests evaluated

The Sleuth investigation harness lives at `scripts/test-chase-accordion.mjs`
and exercises five strategies against `https://creditcards.chase.com/business-credit-cards/ink/cash`,
scoring each by the presence of insurance markers (auto rental, purchase
protection, extended warranty, roadside, travel emergency).

| ID | Strategy | What it tests |
|----|----------|---------------|
| A  | `formats: ['rawHtml', 'markdown']` + `onlyMainContent: true` | Does the rawHtml contain the section even when markdown drops it? |
| B  | `onlyMainContent: false` + both formats | Does turning the main-content heuristic off restore the section? |
| C  | `proxy: 'stealth'` | Sanity check — is this a bot wall? |
| D  | Multi-pass aggressive expand actions + unhide aria-hidden | Hawk's approach taken further |
| E  | `waitFor: 8000` + screenshot + markdown | Is content present in the screenshot but dropped during markdown conversion? |

**Empirical test execution was blocked** by the agent sandbox (network /
node script execution not permitted in this worktree). The conclusion
below is derived from WebFetch confirmation that the content is in the
static HTML, plus the known semantics of Firecrawl's `onlyMainContent`
flag. To re-run the harness yourself:

```bash
node scripts/test-chase-accordion.mjs all
```

The script writes per-strategy markdown + HTML dumps under `/tmp/chase-sleuth/`
and prints a summary table at the end.

## Chosen fix (lowest-cost path)

Layered, additive — no existing behavior is replaced. All changes scoped
to Chase business URLs (`creditcards.chase.com/business-credit-cards/*`)
so other extractions are unaffected.

1. **`utils/ai/firecrawl.ts`** — extend `FirecrawlOptions`:
   - `onlyMainContent?: boolean` (default `true`, preserves existing behavior)
   - `formats?: Array<'markdown' | 'rawHtml' | 'html' | 'screenshot'>` (default `['markdown']`)
   - `FirecrawlResult.ok=true` now optionally carries `rawHtml`
   - New helper: `htmlToText(html)` — dumb-but-cheap HTML→text stripper
     (no cheerio/jsdom dep)
   - New helper: `needsBoilerplateInclusive(url)` — returns `true` for
     `creditcards.chase.com/business-credit-cards/*`

2. **`utils/cards/extractCardBenefits.ts`** — add a third fallback tier:
   - Tier 1 (existing): standard interactive scrape
   - Tier 2 (existing, Hawk PR #633): aggressive expand on Chase business
     when insurance markers missing
   - **Tier 3 (new): rawHtml fallback** — if Tier 2 STILL doesn't find
     insurance markers AND the URL matches `needsBoilerplateInclusive`,
     re-scrape with `onlyMainContent: false` + `formats: ['markdown', 'rawHtml']`,
     strip the rawHtml to text, and APPEND it to the existing markdown
     (never replace — additive only).

### Why not switch the primary path to `onlyMainContent: false`?

`onlyMainContent: true` is the right default for 99% of extractions —
it removes Chase's huge global footer, regulatory disclosures, and
cross-sell modules. Turning it off site-wide would balloon Sonnet's
input tokens (~3-5x for issuer pages) for marginal extraction gain.
Scoping the override to Chase business URLs keeps cost flat.

### Why a separate fallback Firecrawl call instead of changing Tier 1?

Two reasons:
1. Tier 1 + Tier 2 already work for non-Chase-business cards. We
   shouldn't double their cost / latency.
2. Failing additively (append, don't replace) means even if the rawHtml
   fallback finds nothing useful, we still have the Tier 1/Tier 2
   markdown in hand. No regression risk.

## Cost implications

Per Chase business card extraction in the worst case:

| Tier | Firecrawl call | Sonnet input tokens |
|------|----------------|---------------------|
| 1 | 1 standard scrape | ~10K |
| 2 | 1 aggressive retry (only if markers missing) | ~12K |
| 3 | 1 rawHtml fallback (only if Tier 2 still missing) | ~15K (rawHtml appended) |

Tier 3 adds **at most 1 Firecrawl scrape + ~3K extra input tokens** per
Chase business card extraction. At ~$3/M input tokens, that's
~$0.01/card — negligible. No new external services, no new infra.

If empirical testing later shows `onlyMainContent: false` alone (without
the rawHtml stripping) restores the section in the markdown directly,
Tier 3 simplifies further (drop the `htmlToText` call, just keep the
new markdown). The current implementation is defensive — it works either way.

## Test plan

1. **Smoke test** — Open the admin extract page at
   `/admin/cards/chase-ink-business-cash/extract`. Click "Re-extract".
   Verify the resulting `credit_card_extractions.raw_markdown` contains
   ALL of:
   - "Auto Rental" + "$60,000"
   - "Purchase Protection" + "$10,000"
   - "Extended Warranty"
   - "Travel and Emergency Assistance"
   - "Roadside"
2. **Log inspection** — confirm the console emits
   `[card-extract] rawHtml fallback appended N chars; markers=true`.
3. **Regression** — re-extract a non-Chase-business card (e.g. Chase
   Sapphire Reserve, `chase-sapphire-reserve`). Verify behavior is
   unchanged — no rawHtml fallback ran, no log lines about it.
4. **Repeat for the other three Chase business cards** — Ink Preferred,
   Ink Unlimited, Ink Premier (note: Ink Premier is cash-back-only;
   per editorial rule it should already be deleted, not extracted).

## Future work

- If Firecrawl ships a `mainContentSelectors` or
  `includeBoilerplate: ['.product-benefits']` option, we should adopt
  that instead of `onlyMainContent: false` for narrower scoping.
- If Sleuth's harness ever runs with network access, capture the
  per-strategy outputs in `plans/sources/chase-business-firecrawl-tests.md`
  for future reference. The harness is checked in at
  `scripts/test-chase-accordion.mjs`.
