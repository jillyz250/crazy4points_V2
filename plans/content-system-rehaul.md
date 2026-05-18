# Content System Rehaul — Topics → Variants

**Status:** Phase 1 in progress (2026-05-18)

## Vision

**One topic → many variants.** A `topics` row holds verified facts + sources. From there, the editor generates format-specific variants (alert, blog, newsletter, FB, Twitter, IG, LinkedIn, Threads) with their own tone/length conventions. Nothing publishes without manual per-variant approval.

## Core principles

1. **Facts verified ONCE, at topic level.** Editor pastes issuer markdown → Haiku extracts a structured fact ledger → editor reviews → topic is `verified`. All variants generated from that ledger.
2. **Variant generators are constrained.** Each Sonnet prompt receives the ledger + source_markdown + brand voice + format conventions + the rule: "use only facts in the ledger."
3. **Brand voice per variant.** Different formats get different prompts (FB punchier than blog).
4. **Fact-grep on every variant.** Post-generation regex scan for dollar amounts/percentages/dates that aren't in the ledger.
5. **Manual approval per variant.** Editor reviews each format, hits Publish individually.
6. **Channels independent.** A topic may publish as alert + FB but skip blog — editor's choice.

## Anti-fabrication safeguards (HARD requirements)

### Topic level
1. **Source-quote substring check** — every `source_quote` in the fact_ledger must appear as an exact substring of `source_markdown`. Reject extraction if not.
2. **Issuer-domain allowlist** — every URL must be on an approved issuer domain.
3. **Confidence floor** — `confidence: 'low'` claims flagged for editor review.

### Variant level
1. **Constrained prompt** — generator told to use ONLY ledger facts.
2. **Post-generation fact-grep** — regex scan for unsupported dollar amounts, percentages, dates, named cards/programs/merchants.
3. **Banned patterns** — no "according to The Points Guy" / "per NerdWallet" / etc.

## Data model

### `topics` table (migration 297)
- `id`, `slug`, `title`, `summary`
- `source_markdown` (raw verified content)
- `source_urls[]` (issuer-domain canonical URLs)
- `fact_ledger` jsonb (array of `{claim, category, source_url, source_quote, confidence, verified_at, verified_by}`)
- `fact_check_status` enum (`pending | verified | partially_verified | failed`)
- `verified_at`, `verified_by`
- `programs[]`, `cards[]`, `topic_type`, `end_date`, `status`, `created_by`

### `content_variants` table (migration 298)
- `id`, `topic_id` (fk cascade)
- `format` enum (`alert | blog | newsletter | facebook | twitter | instagram | linkedin | threads`)
- `title`, `body`, `metadata` jsonb (format-specific: hashtags, image_prompt, subject_line, etc.)
- `brand_voice_run`, `fact_check_run`, `fact_check_results` jsonb
- `status` enum (`draft | needs_review | approved | published | archived`)
- `published_at`, `publish_target_url`, `generated_by`, `generation_prompt_version`
- UNIQUE constraint on `(topic_id, format)`

## Format conventions (research-backed 2026)

### `alert`
- 200-400 words, inverted pyramid (hook → numbers bullets → meaning → activation → catch)
- Renders at `/alerts/<topic.slug>` — upserts into existing `alerts` table

### `blog`
- 1,500-2,500 words, one H1 + 2-5 H2s, meta description 155-160 chars
- Renders at `/blog/<topic.slug>` — needs new `blog_posts` table

### `newsletter`
- 50-150 words/slot, subject line 40-70 chars, preview 35-55 chars, CTA 2-4 words
- Pushes into `content_ideas` queue (existing slot system)

### `facebook`
- 40-200 words, 3-5 niche hashtags MAX, ends with crazy4points URL, no engagement bait
- Manual paste — variant marked published with URL captured from editor

### `twitter`
- ≤280 chars (sweet spot 71-100), 1-2 hashtags MAX, front-load value first 100 chars
- Manual paste — variant marked published with URL captured

### `instagram`
- 138-150 char caption (or 800-1500 carousel), 5-hashtag CAP (platform-enforced), hashtags in first_comment_text
- Manual paste — variant marked published with URL captured

### `linkedin`
- 1,300-1,900 chars (47% higher engagement), first 210-235 chars critical, 3-5 hashtags at end
- Manual paste — variant marked published with URL captured

### `threads`
- ≤500 chars, 1-2 Topic Tags, timely conversational
- Manual paste — variant marked published with URL captured

## Universal rules across all variants

1. Issuer-source policy enforced via topic.fact_ledger.
2. End with crazy4points URL on social formats.
3. No engagement bait ("Comment below!" etc).
4. Emoji policy: OK on FB/IG/Threads; sparing on Twitter/LinkedIn; never in blog headers.

## Phase 1 ship plan (5 PRs)

1. ✅ **PR 1 — Schema** (Schema-Steve, #622, MERGED)
2. ✅ **PR 2 — Topic CRUD + Haiku fact extraction** (Topic-Tess, #623, merged into pr1 branch)
3. ✅ **PR 3 — 8 variant generators + fact-grep + UI grid** (Quill, #626, merged into pr2 branch)
4. ⏳ **PR 4 — Per-variant publish handlers** (Penny) — gates on topic.fact_check_status=verified + variant.status=approved
5. ⏳ **PR 5 — Backfill legacy alerts + content_ideas → topics** (Bram) — script with dry-run default

## Recovery note (2026-05-18)

PR #623 and #626 were stacked PRs that merged into their parent branches, NOT into main. A recovery PR brings both into main as one diff. After that lands, Penny can build PR 4 on a clean main.

## Open decisions (settled)

- ✅ Backfill old alerts into topics (not run-in-parallel)
- ✅ All 8 formats in Phase 1
- ✅ Haiku for fact extraction (with hard substring check), Sonnet for variant generation
- ✅ Topics admin-only (no public `/topics/<slug>` route)
- ✅ Force topic-first workflow (no one-off alerts without a topic)
- ✅ Keep current 3-slot newsletter structure
