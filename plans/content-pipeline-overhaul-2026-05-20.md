# Content Pipeline Overhaul — 2026-05-20 (v9)

Status: **Final. Ready for kickoff.**
Author: Jill + Claude
Supersedes: v8 (same filename, earlier today)
Changes from v8 (Copilot polish on v7 — 6/8 items already in v8, 2 remaining tightened):
- `surface_locations` execution model spelled out: Postgres trigger on publish/unpublish events + nightly cron backstop. Not computed on read.
- Provenance Panel placement locked: inline accordion below the row, not modal. Same pattern on mobile.

Changes from v7 (ChatGPT audit folded in):
- **Phase 3 compat view gets a SUNSET DATE** (90 days post-migration) + CI lint blocking new `from('alerts')` usage. Prevents the shim from becoming permanent.
- **Chip cap = 4 inline per row**: 1 status, 1 urgency, 1 provenance, 1 QA. Rest behind `more ▾`. Fights "dashboard cosplay" / cognitive overload.
- **Auto-approval tier added to the lifecycle.** High-confidence pattern matches skip Triage and land directly in Drafts. Pipeline scales beyond "Jill reviews every row."
- **Grok reframed as opportunistic signal layer, not infrastructure.** Treat as substitutable, don't build core logic around its quirks.
- **Cost estimates buffered**: real-world early-month spend likely 3-5× baseline due to iteration/retries.
- **Phase 4.5 image gen reframed as 2-week trial** with templated-graphics fallback (transfer diagrams, charts, maps, card comparisons) if DALL-E feed starts looking generic.
- **NEW Phase 7 — Editorial analytics + signal score.** Tracks per-topic engagement; feeds back into auto-approval, newsletter inclusion, homepage priority. Closes the "production-focused, not learning-focused" gap.
- **Fact-origin confidence chip added** (distinct from source confidence): `official | secondary | social-rumor | inferred | ai-discovered-only`. Visually distinguished. Hedge against AI hallucination laundering.
- **Topic canonical IDs**: human-readable slugs like `marriott-transfer-bonus-2026-q2` alongside UUIDs.
- **`pipeline_status_audit` promoted to first-class** — every status transition writes a row from Phase 1, not Phase 5. Partial event-sourcing benefits without full rewrite.

Changes from v6 (Claude's final audit — Critical fixes + Should-fix + polish all folded in):
- **CRITICAL: `INSTEAD OF` triggers added to the `alerts` view in Phase 3** so writes against the view redirect to `content_variants`. Postgres views are read-only by default; without this every existing `from('alerts').insert/update` call breaks.
- **CRITICAL: Phase 3 explicit FK drop-and-recreate.** Postgres can't have FKs referencing views — every constraint that references `alerts(id)` (intel_items.alert_id, newsletters.big_story_ref_id, alert_programs.alert_id, alert_overrides.alert_id, alert_history.alert_id) must be dropped, the rename run, then constraints recreated against `content_variants(id)`.
- **CRITICAL: `CREATE EXTENSION IF NOT EXISTS pg_trgm;` added to the Phase 1 migration** so the GIN trigram index can be created.
- **CRITICAL: Phase 0.5 expanded to audit every migration 280-309** (not just 297-300, 304) — new script `scripts/audit-prod-migrations.mjs`.
- Race-guard caveat: best-effort, not race-proof (midnight boundary + normalization-edge gaps).
- `getRecentDecisionFor` repoint to read from view called out explicitly in Phase 3.
- Phase 3 backfill field-mapping table added (alerts → topics + content_variants).
- `source_id` → `source_name` (column doesn't exist; reuse what's there).
- Per-platform voice rules added to `editorialRules.ts` — `BRAND_VOICE_FACEBOOK`, `BRAND_VOICE_INSTAGRAM`, `BRAND_VOICE_LINKEDIN`, `BRAND_VOICE_X`. Voice check pulls the right one per format.
- `content_variants.format='twitter'` renamed to `'x'` in a small Phase 4.5 migration so DB and UI agree.
- Chip color hex values locked: green `#10b981`, amber `#f59e0b`, red `#ef4444`, purple `#8b5cf6`, grey `#6b7280`.
- Phase 4 blog editor explicitly inherits the alerts editor's QA chip set + gates.
- Phase 6 trigger simplified to `content_variants > 500` (no admin-perf metric required).
- QA regression test #7 lists the explicit 20 fields validated.
- Open Questions pruned to genuinely-open items only.

Changes from v5:
- **Phase 2c (Grok poller) moved from DEFERRED to PLANNED** — Jill has a free Grok account; we use Grok's native X Live Search to get X coverage for ~$5-15/mo instead of $200 X API. 2-week trial gates the build. xAI API setup added as a 10-minute prerequisite.
- **Phase 2d (X API direct) remains an escalation path** — only triggered if the Grok trial reveals significant gaps.
- **New Phase 4.5 — Social variants + image generation.** Generates Facebook / Instagram / LinkedIn / X copy from each topic; DALL-E 3 generates one master image per topic in brand-locked style, auto-cropped per platform. Manual trigger only (no auto-post).
- Updated cost summary reflects Grok + DALL-E spend.

Changes from v4 (Copilot's final-5% additions):
- Performance budget for chips (concrete acceptance test).
- Global ingestion error contract (`intel_ingest_errors` table + admin badge).
- Data retention policy (quarantine 90d, errors 30d, backups 30d, intel/variants forever).
- New Phase 6 — Unified search index (postponed, optional).
- QA regression suite (10 tests, runs in CI).
- Phase 3 migration dry-run plan (prod-copy validation before live).
- Email security hardening (attachment strip, HTML sanitize, 1MB cap).

Changes from v3:
- Phase 3 alerts compat layer: rename `alerts` → `alerts_legacy`, create view (correct mechanics).
- Phase 3 variants reuse alerts' UUIDs so all FKs continue resolving without junction-table rewrites.
- `surface_locations` moved to Phase 1 so the Provenance Panel ships complete.
- `utils/intel/ingestItem.ts` shared helper explicitly declared as a Phase 1 deliverable.
- Haiku diff failure mode: **fail-open** (surface on error — prefer false alarm to missed update).
- Email-inbound from unverified senders → logged to new `intel_email_quarantine` table.
- Race-condition guard: UNIQUE constraint on `(headline_normalized, date_trunc('day', created_at))`.
- Chips: **no icons**, names + colors only, mapped to existing design tokens. Adds `/admin/glossary` reference page.
- X poller deferred indefinitely (cost too high pre-revenue). Grok poller deferred pending cost investigation.
- Cost summary section added.
- Two explicit questions for Copilot: FK strategy on alert junctions (4), and chip-density perf acceptance test (10).

## Why this exists

The content pipeline grew organically over four months. It works, but:

- Admin nav has **two pages doing one job** (`/admin/intel` and `/admin/triage`).
- **Topics, content_variants, blog_posts** tables — migrations 297-300, 304 — were merged to repo but **never applied to prod**. Code references tables that don't exist; Topics admin page and parts of Triage are silently broken in prod.
- **Five intake sources are planned but only one is wired** — Claude Scout works; forwarded emails, X/Grok, Google Alerts, and program emails are not yet ingested.
- **UX friction**: rejected items render as full-text blocks instead of one-liners; there's no snooze; expired items linger in foreground views; "what's published right now" has no dedicated view; sort order doesn't lead with "needs my attention."
- **Provenance is invisible**: a row doesn't show where it came from, how confident the source was, what QA gates ran, or where it's currently showing. The editor has to dig to find what should be on the surface.
- **Editorial features Jill spent months building** (fact-check, voice check, originality, T&C gate, override audit log, persona detection, regenerate, AI summaries) live only on alerts; blog has no QA wiring.

This plan reorganizes the system around a unified `topics + content_variants` model, brings the pending migrations to prod, adds the missing intake sources, overhauls editorial UX, and surfaces provenance everywhere via a pervasive labeling system — without losing a single existing feature.

## Non-negotiables

1. **No QA feature loss.** The `/alerts/[id]/edit` editor and every gate it runs keep working end-to-end after migration.
2. **Newsletter auto-pull keeps working.** `runBuildNewsletter()` continues to produce slot-populated drafts. Sonnet continues to write `jills_take_html` in Jill's brand voice.
3. **No public-site regressions.** Published alerts continue rendering on the home page, program pages, and live bars. Acceptance test before each merge: prod-copy pixel diff.
4. **Each phase ships as one PR**, independently reviewable and reversible.
5. **Migrations are applied manually.** Claude generates clipboard-ready SQL blocks; Jill pastes into the Supabase dashboard SQL editor.

## Unified status lifecycle

Every pipeline item (intel item, draft, variant, newsletter issue) uses one of:

| Status | Meaning | Default visibility |
|---|---|---|
| `new` | Just arrived, unscored | Top of Triage |
| `pending` | Needs Jill's decision | Top of Triage / Drafts |
| `auto-approved` | Pattern-matched + high confidence → skips Triage, lands in Drafts | Drafts default view |
| `snoozed` | Deferred to `snoozed_until` date | Snoozed tab only |
| `approved` | Greenlit by Jill, ready to draft or publish | Active queue |
| `gated` | Failed fact / voice / originality | Top of Drafts (needs fix) |
| `published` | Live on the public site | Published tab |
| `expired` | Past `end_date`, auto-transitioned | Archive tab |
| `rejected` | Not pursuing | Collapsed one-liner |
| `archived` | Manually shelved, or auto-archived 30d after expire | Hidden by default |

## Auto-approval rules (skip Triage, land in Drafts)

To avoid Jill becoming the bottleneck, items matching ALL of these conditions are auto-promoted past Triage:

1. Source confidence = `high` (Layer 2 / `getRecentDecisionFor` would have allowed it).
2. **Confirmation count >= 2** within first 6 hours (multiple independent sources).
3. **Fact-origin confidence = `official` or `secondary`** (NOT `social-rumor`, `inferred`, or `ai-discovered-only`).
4. Program has **3+ historical published alerts of the same `alert_type`** (known pattern; not novel territory).
5. **No Haiku-diff banner** (no API failure on the dedup check).

Items that meet only some criteria stay in Triage. Auto-approved items get a clear chip in Drafts so Jill can spot-check the bypass.

This is a **trust-building dial** — start strict, loosen criteria over time as confidence in the patterns grows. Phase 1 ships the auto-approval logic but the conditions can be edited in code without a migration.

Status pill colors, consistent everywhere:
- Green = `published`
- Blue = `new` / `pending` / `approved`
- Amber = `gated`
- Purple = `snoozed`
- Grey = `rejected` / `expired` / `archived`

## UX patterns

- **Reject = one-liner.** Rejected rows render as a dim strikethrough single line: `Title · Source · rejected 2d ago by Jill ▾`. Click to expand. No paragraph blocks haunting the queue.
- **Snooze.** Picker with presets `1 day / 3 days / 1 week / custom date`. Sets `snoozed_until`. Item hides from default view, auto-returns on the date, visible in a `Snoozed` tab with wake date shown.
- **Sort by attention.** Default sort everywhere: `pending` + `gated` first, then `new`, then freshest within bucket. Secondary tabs always present: `Active / Snoozed / Rejected / Archive / Published / Promoted`.
- **Auto-expire.** Hourly cron flips `published → expired` when `end_date` passes. Public site stops surfacing them (live bars, banners, "active alerts" lists). Database row stays forever for SEO.
- **Auto-archive.** Daily cron flips `expired → archived` 30 days after expiry.
- **Published tab everywhere.** Each section shows a `Published` filter showing what's live, count badge included. **Scope: all formats** — alerts, blog posts, future formats. Format filter chips inside.
- **Promoted tab** (Triage only). Scope: `intel_items WHERE alert_id IS NOT NULL`. Future: also include `variant_id IS NOT NULL` when blog promotion is wired in Phase 3.
- **Default Inbox filter hides promoted items.** A big driver of "feels like a backlog" is that promoted-to-alert items still show in Intel. Hide them by default; surface in the `Promoted` tab.

## Pervasive labeling system (Chips)

Every list row, every detail view shows provenance and state via a shared `components/admin/chips/` library. Without these, the redesign won't feel different even after the plumbing is done — the editor still has to dig to know what's true.

### Chip taxonomy

**Style rules**: no icons. Names + colors only. Every chip is a single word or short phrase plus a status color. Colors locked in `styles/globals.css` as new tokens:
- `--color-chip-green: #10b981` (success: published, passed, verified, high confidence)
- `--color-chip-amber: #f59e0b` (warning: gated, partial, waived, medium confidence)
- `--color-chip-red: #ef4444` (error: failed, missing, low confidence, duplicate)
- `--color-chip-purple: #8b5cf6` (deferred: snoozed)
- `--color-chip-grey: #6b7280` (neutral: source type, persona, rejected, expired, archived)
- `--color-chip-blue: #3b82f6` (active: new, pending, approved)

A `/admin/glossary` reference page documents every chip name, what it means, and which color it uses, so any new admin user can decode the UI at a glance.

**Source provenance** (intel + drafts + alerts):
- `Source: OMAAT` (or Reddit, TPG email, X, Grok, manual)
- `scrape` / `email` / `social` / `ai-discovery` / `manual` — source type, neutral grey
- `high` (green) / `medium` (amber) / `low` (red) — source confidence
- **Fact origin (NEW, distinct from source confidence)**: `official` (green) / `secondary` (blue) / `social rumor` (amber) / `inferred` (amber) / `AI-discovered only` (red). Hedges against hallucination laundering — distinguishes "Marriott press release" from "Grok said it summarizing X posts."
- `2h ago` / `3d ago` / `May 12` — when it arrived (relative under 7d, absolute beyond)
- `+2 confirmations` — when other sources later confirmed the same item

**Editorial state** (drafts + alerts):
- Status pill: `draft` / `pending` / `gated` / `published` / `expired` / `archived`
- `T&Cs verified` (green) / `T&Cs waived` (amber) / `T&Cs missing` (red)
- `Fact-check passed` (green) / `Fact-check 2 issues` (amber) / `Fact-check failed` (red)
- `Voice 5/5` (green) / `Voice 3/5` (amber) / `Voice failed` (red)
- `Originality passed` (green) / `Originality flag` (amber) / `Duplicate` (red)
- `Persona: punchy` / `Persona: stakes` / `Persona: visual` (neutral)

**Generation provenance** (drafts + variants):
- `Generated by Sonnet · May 18` / `Edited by Jill · May 19`
- `Prompt v3` — which prompt revision produced this

**Lifecycle** (alerts + variants):
- `End date: May 31 (11d left)` — countdown chip turns amber under 3 days, red under 24 hours
- `Expires in 2d` — for time-boxed items
- `LIVE` — green dot on currently-published items

**Surface presence** (published items):
- `Home banner` / `Live bar (marriott-bonvoy)` / `Program page (chase-ur)` — where the alert is showing right now

**Newsletter**:
- `Week of May 20` · `4 / 5 slots` · `0 errors` · `15 recipients`

### Where chips appear — HARD CAP: 4 inline per row

Cognitive load matters. Every row shows **at most 4 chips inline**: 1 status, 1 urgency, 1 provenance, 1 QA. Everything else is collapsed behind `more ▾`. The instinct to label every dimension was right; the instinct to render every dimension inline was wrong.

- **Triage row** → status, source provenance (with confidence), when, `more ▾`
- **Drafts row** → status, end-date urgency (if applicable), format, QA roll-up, `more ▾`
- **Alerts/Published row** → status (LIVE), end date, source, `more ▾`
- **Hover** any chip → tooltip with full context.
- **Click an item** → expandable **Provenance Panel**. Renders **inline below the row, accordion-style** (not modal). Click again to collapse. Mobile: same accordion pattern, no full-screen takeover. Content:
  > Scout caught this from OMAAT (high confidence, fact-origin: secondary) on May 5 14:22. You approved in Triage on May 6 09:15. Sonnet drafted v1 on May 6, fact-check passed (4 claims, all supported). Voice 5/5. You edited and published on May 6 11:40. Live on: home banner + marriott-bonvoy program page. **2 other sources later confirmed**: TPG email (May 12), Reddit r/awardtravel (May 15).

### Schema additions to support chips (all Phase 1)

- `intel_items.confirmation_count int default 0` — incremented when a dup is silently attached.
- `intel_items.confirming_sources text[]` — source names of confirming-dup intel items.
- `intel_items.fact_origin text` — `official | secondary | social-rumor | inferred | ai-discovered-only`. Distinct from confidence. Set at ingestion based on source.
- `topics.canonical_id text unique` — human-readable identifier like `marriott-transfer-bonus-2026-q2`. Slug-formatted, machine-generable from `<primary_program>-<alert_type>-<year>-<quarter-or-month>`.
- `content_variants.prompt_version text` — which prompt produced this draft.
- `content_variants.generated_by text` — `sonnet | haiku | editor`.
- `content_variants.edited_by text` — last hand-editor (usually `jill`).
- `content_variants.surface_locations text[]` — populated by a small computed function showing where the variant is currently rendered. **Phase 1** (not Phase 5) so the Provenance Panel ships complete.

**`surface_locations` execution model**: a Postgres function `compute_surface_locations(variant_id)` runs (a) on publish/unpublish events via a trigger on `content_variants`, and (b) nightly via `/api/cron/recompute-surface-locations` as a backstop in case the trigger ever misses (e.g. bulk update without trigger fire). Not computed on read — the chip is cheap to render only if the column is pre-populated.

### Pipeline status audit (promoted to first-class in Phase 1)

Every status transition writes one row to `pipeline_status_audit`. Originally planned for Phase 5; promoted to Phase 1 so we get debuggability from day one without rewriting the data model toward full event sourcing.

```sql
create table pipeline_status_audit (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz default now(),
  entity_type text not null,         -- 'intel_items' | 'content_variants' | 'topics'
  entity_id uuid not null,
  from_status text,
  to_status text not null,
  reason text,                       -- 'auto-expire cron' | 'jill approved' | etc.
  actor text                         -- 'system' | 'jill' | 'sonnet' | 'cron-job-name'
);
```

Append-only. Powers the Provenance Panel's full timeline. If a status flips unexpectedly, you can replay history.

## Dedup model

**URL is not a dedup key.** A single source URL like `https://thepointsguy.com/news/` is a hub — different visits surface different stories. Dedup signal must be content-based.

### Three layers, in order

1. **Scout in-batch dedup** (exists): Haiku consolidates same-story-across-sources to one finding per scout run.
2. **`getRecentDecisionFor` semantic gate** (exists, refined): blocks staging when a matching alert exists for the same `program + alert_type`, **only if that alert's status is `pending` or `published`** (i.e. still active). Expired/rejected/archived alerts do NOT block — same promo running again later surfaces cleanly.
3. **Headline-similarity check** (NEW, Phase 1): on insert, normalize headline (lowercase, strip stopwords, strip punctuation) and compare via `pg_trgm` similarity (>= 0.7) against last 14 days of intel_items.

### The Haiku diff (NEW)

When Layer 2 *would* block, run a cheap Haiku call before suppressing:

> Existing alert: `<title + body summary>`. New intel: `<headline + raw_text>`. Does the new intel introduce a NEW fact not in the existing alert (deadline extended, rate changed, destination added, walked back, etc.)? Reply JSON: `{has_new_facts: bool, summary: string}`.

- `has_new_facts: false` → suppress silently. Insert intel_item with `dup_of_intel_id = <original>`, `processed = true`, `confirmation_count++` on the original. Never surfaces in Triage. Shows as `+N confirmations` on the original.
- `has_new_facts: true` → surface in Triage with an `update_to_alert_id` link and Haiku's diff summary. Editor decides: amend the live alert, or write a separate update.
- **API error / timeout / malformed JSON** → fail-open: surface in Triage with a banner ("dedup check failed, please review manually"). Prefer a false alarm over a missed real update.

Cost: Haiku at ~$0.0005 per check, only runs when Layer 2 would block. Volume stays low.

### Jill's scenario, locked

**Day 0**: First source (OMAAT) reports Marriott 30% transfer bonus, expires next month → goes through pipeline → published as alert with `end_date=<one month out>`.

**Day 7**: Second source (TPG email forward) surfaces the same bonus.
- Layer 2: matching alert exists (`marriott + transfer_bonus`, status `published`) → would block.
- Haiku diff: no new facts → **suppressed silently**. `confirmation_count = 1` on the original. Triage queue untouched.
- You see: small `+1 confirmation` chip on the alert. No second pipeline run. No second article.

**Day 12**: Third source reports "Marriott extended the bonus to two months."
- Layer 2: would block.
- Haiku diff: `has_new_facts: true, summary: "deadline extended from May 31 to June 30"` → **surfaces in Triage** with link to original alert. You amend the live alert.

**Day 200**: Marriott runs another 30% bonus.
- Original alert is now `expired` for 5 months.
- Layer 2: matching alert exists but status is `expired` → does NOT block. New intel surfaces normally.

### What is explicitly NOT a dup signal

- `source_url` alone (hub pages produce different stories on different days).
- `programs[]` match without `alert_type` match (Marriott has lots of unrelated news).
- Age alone (a 3-month-old story can become news again if corrected/reversed).

### When dup detected: write-and-attach, not discard

- **Insert** the row with `dup_of_intel_id = <original>` and `processed = true`. Audit trail preserved.
- **Increment** `intel_items.confirmation_count` on the original. Powers the `+N confirmations` chip.
- **Append** source name to `intel_items.confirming_sources text[]` on the original for the provenance panel.

### Race condition guard

If Scout and email forwarding both pick up the same headline in the same minute, parallel `ingestItem` calls could each miss the other in Layer 3 and both insert. Guard with a Postgres UNIQUE constraint:

```sql
CREATE UNIQUE INDEX intel_items_headline_day_idx
  ON intel_items (headline_normalized, (date_trunc('day', created_at)))
  WHERE headline_normalized IS NOT NULL;
```

Second insert raises `23505`; `ingestItem` catches the error, looks up the existing row, marks the loser as `dup_of_intel_id` and increments `confirmation_count`. Clean parallel-safe path.

**Caveat**: This is **best-effort, not race-proof**. The constraint won't catch (a) a midnight boundary case (11:59pm vs 12:01am same headline, different `day` partitions), or (b) slight normalization differences across sources ("30%" vs "30 percent"). Layer 3 fuzzy similarity catches both of those at insert time; the UNIQUE constraint is a backstop for exact-normalized duplicates only. Acceptable trade-off — the gaps are rare and Layer 3 handles them.

## Nav, after

Admin → Pipeline section:
- **Sources** (unchanged)
- **Triage** (Intel + Triage collapsed into one page)
- **Drafts** (unified — alerts + topic-driven blog drafts)
- **Newsletter** (unchanged location, polished internals)

Alerts and Blog disappear from the admin nav — they remain public-site destinations only.

## Phased plan

### Phase 0 — Backlog cleanup

Confirmed via `scripts/audit-stale-intel.mjs` (already shipped):
- 22 expired (`expires_at < now()`)
- 6 orphans (>30 days, unprocessed, no alert, not rejected)
- 10 apparent dup `source_url`s (spot-check needed — same URL ≠ same story)

Action: clipboard-ready SQL block sets `rejected_at = now()` with `rejected_reason = 'auto-archive: expired'` or `'auto-archive: stale orphan'`. **No DELETE** — rows stay in DB for audit. Hide promoted items (`alert_id IS NOT NULL`) from default Intel view.

Output: one PR + one SQL block to paste.

### Phase 0.5 — Apply pending migrations to prod

**Audit step**: Run `scripts/audit-prod-migrations.mjs` (already shipped) which probes every migration from 280-309 against actual prod schema and prints `APPLIED` / `MISSING` per migration. **Audit run on 2026-05-20 found 11 missing migrations**:

```
284 — credit_cards.rotating_categories_refreshed_at
287 — credit_cards.points_transferable
290 — welcome_bonuses table + spend_required_usd column
291 — credit_cards.cadence_days
294 — experience_program_card_links table
297 — topics table  ← this is why Topics page is broken
298 — content_variants table
300 — blog_posts table
301 — transfer_partners.outbound_ratio
302 — transfer_partners.verified_at
304 — intel_items.triage_decision  ← this is why Triage queries return empty
```

**Apply step**: One consolidated SQL block contains every missing migration in numerical order. Paste in Supabase dashboard. **`CREATE EXTENSION IF NOT EXISTS pg_trgm;`** prepended so Phase 1 trigram index works.

**Verify step**: Re-run `audit-prod-migrations.mjs` — all 11 should report `APPLIED`. Topics admin page loads. Triage `triage_decision` queries return data. `select 1 from pg_extension where extname = 'pg_trgm'` returns a row.

**Why this matters more than I originally thought**: The schema drift between repo and prod is much wider than the topics/variants block. Card-related features (rotating-category refresh dates, points-transferable flag, cadence days, experience-card links, welcome bonuses) are likely silently broken too. Phase 0.5 fixes everything at once.

Output: one consolidated SQL block to paste.

### Phase 1 — Triage UX overhaul + Chips library + Ingest helper

- Merge `/admin/intel` + `/admin/triage` into one `/admin/triage` page (old URL redirects).
- Implement reject-as-one-liner.
- Implement snooze with `1d / 3d / 1w / custom` picker.
- Implement "sort by attention" default.
- Add tabs: `Active / Snoozed / Rejected / Archive / Promoted`.
- Ship **`utils/intel/ingestItem.ts`** — shared insert helper that runs Layer 1 + Layer 2 + Layer 3 + Haiku diff before writing. All future intake sources (Scout, email, X, Grok, manual) call this helper. Existing Scout path repointed to use it.
- Ship **`components/admin/chips/`** library with full chip taxonomy above. Use immediately on Triage. Mapped to existing `--color-*` design tokens; add new chip-specific tokens as needed.
- Ship **`/admin/glossary`** — reference page listing every chip name, what it means, what color it uses. New admins can decode the UI at a glance.
- Ship **Provenance Panel** as an expandable detail surface.
- Ship the **`surface_locations`** computed function so the "Live on" section of the Provenance Panel works from Phase 1 (not deferred to Phase 5).

Output: one PR. Schema additions, in order:
1. `CREATE EXTENSION IF NOT EXISTS pg_trgm;` (prereq for trigram index)
2. `intel_items`: `snoozed_until`, `dup_of_intel_id`, `confirmation_count`, `confirming_sources`, `headline_normalized`, GIN trigram index on `headline_normalized`, UNIQUE constraint on `(headline_normalized, date_trunc('day', created_at))`.
3. `content_variants`: `prompt_version`, `generated_by`, `edited_by`, `surface_locations`.
4. `intel_ingest_errors` table (per Ingestion error contract section).

### Phase 2 — Multi-source ingestion (email-first; social deferred)

All new intake sources land in `intel_items` via the shared `ingestItem` helper from Phase 1, so they hit the polished Triage and run through the unified dedup pipe.

#### 2a. Email-forwarding intake (ship first)
- Provision `intel@crazy4points.com`.
- Provider: **Resend Inbound** if available on the current plan, else **CloudMailin** or **Postmark Inbound** (decide during scoping).
- New endpoint: `app/api/intel-email-inbound/route.ts` — parses email, runs Haiku classification (program tagging, confidence, alert_type guess), calls `ingestItem`.
- **Sender verification**: an allowlist table (`intel_email_senders`) lists approved sender domains/addresses. Verification via DKIM/SPF + allowlist membership.
- **Unverified senders → quarantine**: emails from unknown senders are written to `intel_email_quarantine` (raw payload + sender + received_at) and NOT promoted to intel. A small admin view `/admin/triage/quarantine` lets Jill review, then either promote (auto-adds sender to allowlist) or delete.
- **Security hardening** (must run before classification or storage):
  - **Strip attachments** entirely. Body text + URLs are the only payload.
  - **Sanitize HTML** with a strict allowlist (`p`, `a`, `ul`, `li`, `strong`, `em` only). Strips `<script>`, inline event handlers, `<iframe>`, `<style>`, external resource references.
  - **Reject emails > 1MB** before parsing — drop with `intel_ingest_errors` row.
  - **URL extraction** uses a strict regex + domain allowlist (no `javascript:`, no `data:`, no obvious malware-tracking domains).
- Google Alerts come in for free once this works (forward digest emails to `intel@`).
- Program marketing emails (Hyatt, Marriott, Delta promo blasts) come in the same way.

#### 2b. Program email subscription manager (ship with 2a)
- `sources` table additions: `intake_method` enum (`scrape | email | x | grok | manual`) and `inbox_address text`.
- Admin UI: subscribe to a program's marketing list using `intel+marriott@crazy4points.com`, register the source, every email lands as intel tagged with `source_name` from the registered source (uses the existing `intel_items.source_name` column — no new column needed).

#### 2c. Grok poller (with native X Live Search) — PLANNED (opportunistic, NOT infrastructure)

**Framing**: Grok is an opportunistic signal layer, not a load-bearing dependency. The xAI API is a moving target — pricing, models, and Live Search behavior could change quarterly. Build the integration thin and substitutable; if Grok becomes unreliable or expensive, swap it out without disrupting the rest of the pipeline.

**Why this is the answer instead of paying X directly (today)**: Grok has X Live Search built into its API. We get X coverage *and* an analysis layer on top for ~$5-15/mo, vs $200/mo for X API direct.

**Prerequisite (one-time, ~10 minutes)**:
1. Log into xAI developer console at `https://console.x.ai` with the same login as Jill's free Grok consumer account.
2. Add a credit card to billing (required even with free credits).
3. Generate an API key; save as `XAI_API_KEY` in `.env.local` and Vercel project env vars.
4. Verify with a curl test that the key works and Live Search returns X data.
5. Pick the current Grok model name (xAI rotates; check console at build time).

**Build**:
- Cron job (`/api/cron/poll-grok`, daily at e.g. 06:30 local time) prompts Grok with: *"Search X for loyalty program changes (transfer bonuses, devaluations, status promos, signup bonus boosts) in the last 24 hours worth alerting points-and-miles enthusiasts about. Return JSON: {findings: [{headline, source_url, source_handle, programs, alert_type, confidence, raw_text}]}"*.
- Each finding hits `ingestItem` with `source_type='ai-discovery'`, `source_name='grok-x-search'`, plus the underlying X handle preserved in `source_url` so the provenance panel shows who posted the original.
- All Phase 1 dedup runs: Layer 2 catches things Scout already caught; Layer 3 catches things email forwarding already caught.

**Trial gate**:
- 2-week observation period after first deploy. Track: (a) unique findings not captured by Scout or email, (b) signal quality (how many surfaces become actual alerts), (c) actual API spend.
- Decision at end of trial:
  - Strong signal, low cost → keep running.
  - Weak signal or unjustified cost → disable cron, keep code dormant.
  - Significant gaps Grok misses → consider escalating to Phase 2d.

#### 2d. X API direct — ESCALATION PATH ONLY
- Triggered only if Phase 2c reveals Grok misses important signals (e.g. specific brand accounts Grok deprioritizes).
- $200/mo Basic tier; revisit when subscriber revenue exceeds $400/mo for 2x cushion.
- Build: dedicated cron `/api/cron/poll-x` querying specific accounts + hashtags. Code is mostly the same shape as Phase 2c but bypasses Grok.

Output: 2a + 2b ship as one PR. 2c and 2d are separate spike tasks, not blocking.

### Phase 3 — Alerts → variants migration

The architectural lift. Unifies alerts and blog under one schema.

#### Backfill mechanics

**Step A — drop FK constraints referencing `alerts(id)`.** Postgres won't let a foreign key reference a view, so every constraint pointing at `alerts.id` must be dropped *before* the rename:

```sql
ALTER TABLE intel_items DROP CONSTRAINT IF EXISTS intel_items_alert_id_fkey;
ALTER TABLE newsletters DROP CONSTRAINT IF EXISTS newsletters_big_story_ref_id_fkey;
ALTER TABLE alert_programs DROP CONSTRAINT IF EXISTS alert_programs_alert_id_fkey;
ALTER TABLE alert_overrides DROP CONSTRAINT IF EXISTS alert_overrides_alert_id_fkey;
ALTER TABLE alert_history DROP CONSTRAINT IF EXISTS alert_history_alert_id_fkey;
-- audit step finds any others
```

**Step B — rename and backfill**:
- `ALTER TABLE alerts RENAME TO alerts_legacy;` — preserves all data.
- Insert one `topics` row per `alerts_legacy` row. **Field mapping**:

  | alerts_legacy column | → | topics column |
  |---|---|---|
  | `title` | → | `title` |
  | `slug` | → | `slug` |
  | `summary` | → | `summary` |
  | `verified_terms` (text) | → | `fact_ledger` (jsonb — wrapped as `{"raw_terms": "..."}`) |
  | `source_url` | → | `source_urls[0]` |
  | `primary_program_id` + secondary IDs (from `alert_programs`) | → | `programs[]` |
  | `type` | → | `topic_type` |
  | `end_date` | → | `end_date` |
  | `status` (mapped) | → | `status` (mapped per lifecycle table) |
  | `id` | → | NEW UUID (topics has its own id) |

- Insert one `content_variants` row per `alerts_legacy` row with `format='alert'` AND **`id = alerts_legacy.id`** (UUID reuse). Field mapping:

  | alerts_legacy column | → | content_variants column |
  |---|---|---|
  | `id` | → | `id` (reused — see why below) |
  | `title` | → | `title` |
  | `description` | → | `body` |
  | `fact_check_claims` | → | `fact_check_results` (jsonb) |
  | `voice_pass`, `voice_score`, `voice_lead_mode`, `voice_notes` | → | `brand_voice_run` (jsonb roll-up) |
  | `originality_pass`, `originality_notes`, `originality_checked_at` | → | `metadata.originality` (jsonb) |
  | `status` (mapped) | → | `status` |
  | `published_at` | → | `published_at` |
  | `created_at`, `updated_at` | → | `created_at`, `updated_at` |
  | `topic_id` = newly-inserted topics.id | → | `topic_id` |

  **Why reuse UUIDs**: every FK (`intel_items.alert_id`, `newsletters.big_story_ref_id`, `alert_programs.alert_id`, `alert_overrides.alert_id`, `alert_history.alert_id`) currently points at `alerts.id`. After the rename + backfill, the same UUIDs exist in `content_variants` — so the data references resolve once the constraints point at the new target.

**Step C — recreate FK constraints against `content_variants(id)`**:

```sql
ALTER TABLE intel_items
  ADD CONSTRAINT intel_items_alert_id_fkey
  FOREIGN KEY (alert_id) REFERENCES content_variants(id) ON DELETE SET NULL;
ALTER TABLE newsletters
  ADD CONSTRAINT newsletters_big_story_ref_id_fkey
  FOREIGN KEY (big_story_ref_id) REFERENCES content_variants(id) ON DELETE SET NULL;
ALTER TABLE alert_programs
  ADD CONSTRAINT alert_programs_alert_id_fkey
  FOREIGN KEY (alert_id) REFERENCES content_variants(id) ON DELETE CASCADE;
ALTER TABLE alert_overrides
  ADD CONSTRAINT alert_overrides_alert_id_fkey
  FOREIGN KEY (alert_id) REFERENCES content_variants(id) ON DELETE CASCADE;
ALTER TABLE alert_history
  ADD CONSTRAINT alert_history_alert_id_fkey
  FOREIGN KEY (alert_id) REFERENCES content_variants(id) ON DELETE CASCADE;
```

Junction column names (`alert_id`, `big_story_ref_id`) stay — only the target changes. Renaming columns later is a separate cleanup task; not urgent.

**Step D — create the compatibility view**:

```sql
CREATE VIEW alerts AS
SELECT
  cv.id, cv.title, cv.body AS description, cv.status,
  cv.published_at, cv.created_at, cv.updated_at,
  t.slug, t.summary, t.source_urls[1] AS source_url,
  t.topic_type AS type, t.end_date,
  -- ... (full column list to be enumerated in the migration script;
  --     QA regression test #7 below validates the exact 20 fields)
FROM content_variants cv
JOIN topics t ON t.id = cv.topic_id
WHERE cv.format = 'alert';
```

**Step E — add `INSTEAD OF` triggers so the view is writable**. Postgres views are read-only by default. Without these, existing code paths doing `from('alerts').insert/update/delete` will error:

```sql
CREATE OR REPLACE FUNCTION alerts_view_insert() RETURNS trigger AS $$
BEGIN
  -- Upsert into topics + content_variants;
  -- See migration script for full mapping logic.
  ...
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER alerts_view_insert_trigger
  INSTEAD OF INSERT ON alerts
  FOR EACH ROW EXECUTE FUNCTION alerts_view_insert();

-- Similar for UPDATE and DELETE.
```

This lets every existing `supabase.from('alerts').insert/update/delete` call keep working transparently — code paths that haven't been repointed yet are unaffected. Code path repoint becomes a follow-up cleanup, not a blocker.

**Step F — repoint these two functions explicitly** (in addition to the editor):
- `/alerts/[id]/edit` server actions: read/write `content_variants` directly (faster than going through the view).
- `runBuildNewsletter()`: query `content_variants WHERE format='alert' AND status='published'` directly.
- `getRecentDecisionFor` in `app/api/run-scout/route.ts`: query the `alerts` view (no change to logic; the view returns the same shape).

#### Pre-flight backup
- Take a manual `backup_snapshots` row immediately before the migration runs (in addition to the existing nightly cron). One-line script.

#### Migration dry-run (Copilot-requested)

Before touching prod, run the full migration on a prod-copy database:

1. **Clone**: take a fresh prod backup, restore to a staging Supabase project.
2. **Run migration** end-to-end on the clone.
3. **Validate**:
   - Row counts match: `count(alerts_legacy) === count(content_variants WHERE format='alert')`.
   - UUIDs match: every `content_variants.id` exists in `alerts_legacy.id`.
   - FK integrity: zero orphaned rows in `alert_programs`, `alert_overrides`, `alert_history`, `intel_items`, `newsletters` referencing the alerts UUID.
   - View round-trip: `SELECT title, slug, status FROM alerts LIMIT 100` returns identical rows to `SELECT title, slug, status FROM alerts_legacy LIMIT 100` (sort-stable).
   - Newsletter dry-run: `runBuildNewsletter()` on the clone produces a draft whose slot output matches a pre-migration snapshot of the same week.
4. **Sign-off gate**: all four validations must pass before the migration is run on prod. Failures block the PR.
5. **Cleanup**: drop the staging clone after sign-off.

Output: a `scripts/migrate-alerts-to-variants-dryrun.mjs` script that runs the validation queries and prints pass/fail per check.

#### Acceptance test
- Full QA pipeline (T&Cs → writer → fact-check → voice → originality) runs end-to-end on three migrated variants; results identical to pre-migration.
- Public-site pixel diff on home page, three program pages, three live alert detail pages against a prod-copy snapshot.

#### Feature flag
- Ship the migration with the routing change behind `FEATURE_ALERTS_AS_VARIANTS`. Flip in stages: read-only first (variants are written to but reads still come from `alerts_legacy` via a backup view); then full cutover.

#### Phase 3 rollback plan

If post-deploy something breaks:
1. **Flip feature flag back** — `/alerts/[id]/edit` server actions revert to reading/writing `alerts_legacy` directly.
2. **Revert the routing PR** — `git revert <sha>` of the server-action repoint.
3. **Drop the triggers + view**:
   ```sql
   DROP TRIGGER IF EXISTS alerts_view_insert_trigger ON alerts;
   DROP TRIGGER IF EXISTS alerts_view_update_trigger ON alerts;
   DROP TRIGGER IF EXISTS alerts_view_delete_trigger ON alerts;
   DROP FUNCTION IF EXISTS alerts_view_insert();
   DROP FUNCTION IF EXISTS alerts_view_update();
   DROP FUNCTION IF EXISTS alerts_view_delete();
   DROP VIEW alerts;
   ```
4. **Drop the new FK constraints, restore the table, recreate original FKs**:
   ```sql
   ALTER TABLE intel_items DROP CONSTRAINT intel_items_alert_id_fkey;
   -- (same for other 4 constraints)
   ALTER TABLE alerts_legacy RENAME TO alerts;
   ALTER TABLE intel_items
     ADD CONSTRAINT intel_items_alert_id_fkey
     FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE SET NULL;
   -- (same for other 4)
   ```
5. **(Last resort)** Restore from the pre-flight `backup_snapshots` row via `/admin/backups/restore`.

Total rollback time: < 20 minutes if steps 1-4 are run. Step 5 only if 1-4 reveal data damage.

Output: largest PR. One-way once the flag is fully flipped and the rollback window passes.

#### Compat-view sunset (CRITICAL — prevents "cursed archaeology")

The `alerts` view is a **migration bridge, not a permanent shim**. Add to the Phase 3 PR:

1. **`SUNSET_ALERTS_VIEW_AT = '2026-08-20'`** constant — 90 days post-migration.
2. **CI lint** that fails any new PR introducing `from('alerts').insert/update/delete/select` outside of the public-site read paths. New code must hit `content_variants` directly.
3. **Sunset PR scheduled for the sunset date**: drops the view + triggers, audits remaining usage, and finalizes the migration. If any usage still exists at that point, the sunset PR doesn't merge until it's gone.

Why this matters: Postgres `INSTEAD OF` triggers become opaque archaeology within 6 months — debugging an insert that goes through three indirection layers wastes hours. Pinning a sunset date forces the codebase to migrate fully rather than coast on the compat shim forever.

### Phase 4 — Unified Drafts hub

- New `/admin/drafts` page listing every `content_variants` row regardless of format, with a `destination` chip (Alert / Blog) + full chip taxonomy.
- Click row → opens the right editor (`/alerts/[id]/edit` for alerts, new `/drafts/blog/[slug]/edit` for blog variants).
- Old `/admin/alerts` redirects to `/admin/drafts?format=alert`.
- Old `/admin/content-ideas?type=blog` redirects to `/admin/drafts?format=blog`.
- Remove Alerts and Blog from admin nav.

**Blog editor QA wiring**: the new `/drafts/blog/[slug]/edit` editor inherits the same QA chip set and gates as the alerts editor — fact-check, voice check, originality check, T&Cs gate, override audit log. All run through `content_variants` columns (same plumbing). Voice check uses `BRAND_VOICE_BLOG` from `editorialRules.ts` (slightly longer-form pivot from the alert voice).

Output: one PR. Pure routing + new index page + blog editor surface that reuses alert-editor components.

### Phase 4.5 — Social variants + image generation

Generates per-platform social copy and a brand-locked image for each topic. Manual trigger only — you decide when to push something to socials. No auto-posting.

**Why this fits cleanly**: `content_variants.format` already supports `'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'threads'`. Drafts hub already lists every variant. The QA pipeline applies. We just need per-platform Sonnet prompts + image gen + a small UI.

#### Copy generation (Sonnet, one prompt per platform)

`utils/ai/variants/generate{Facebook,Instagram,LinkedIn,X}.ts` — one prompt per platform with platform rules baked in:

| Platform | Char limit | Hashtag style | Voice tweak |
|---|---|---|---|
| Facebook | <80 best, 63K max | optional, sparse | conversational, link previews matter |
| Instagram | 2,200 caption | up to 30, mid-density | visual-first, no clickable links in caption |
| LinkedIn | 3,000 | 3-5 max | slight professional pivot, longer storytelling |
| X | 280 | high tolerance | punchier, dryer |

Each prompt pulls from the topic's verified fact ledger (same source the alert uses). Voice check + fact-check pass-through from the parent topic for facts — **but voice check on the social variant uses the platform-specific voice rules** (`BRAND_VOICE_FACEBOOK`, `BRAND_VOICE_INSTAGRAM`, `BRAND_VOICE_LINKEDIN`, `BRAND_VOICE_X` — new exports in `editorialRules.ts`). The base brand voice (sassy traveler-friend) is preserved with per-platform tone modulation: LinkedIn gets a slight professional pivot, X gets punchier/drier, Instagram stays visual-first. Voice check measures against the right variant per platform, not the alert's voice.

**Naming consistency**: `content_variants.format='twitter'` is **renamed to `'x'`** in a Phase 4.5 migration so DB and UI agree everywhere. One-line SQL: `UPDATE content_variants SET format='x' WHERE format='twitter'; ALTER TABLE content_variants DROP CONSTRAINT content_variants_format_check; ALTER TABLE content_variants ADD CONSTRAINT content_variants_format_check CHECK (format IN ('alert','blog','newsletter','facebook','instagram','linkedin','x','threads'));`.

#### Image generation (DALL-E 3) — 2-week trial, then re-evaluate

**Reframing**: AI-generated editorial illustration looks fresh for ~2 weeks before reading as generic AI slop, especially in travel/finance niches that are saturated with it. Phase 4.5 ships DALL-E generation as a **trial**, with a fallback plan.

**Trial setup**:
- Ship DALL-E generation per topic as designed.
- Run for 2 weeks.
- Evaluate the feed: does it look distinctively Crazy4Points, or does it blend into the generic "Midjourney points blog" aesthetic?

**Decision at end of trial**:
- **Distinctive** → keep DALL-E, refine brand-style prefix.
- **Generic** → switch to **templated branded graphics** (no AI generation):
  - Transfer diagrams (Chase UR → Hyatt with logos + ratio)
  - Award-chart cells (visual representations of point cost vs. cabin)
  - Card comparison cards (welcome bonus + earn rates side by side)
  - Map cutouts for destination-focused alerts
  - Stylized "What changed" before/after for devaluations
- Templated graphics use existing brand tokens (colors, fonts) and inject topic data via a small templating engine (similar to Open Graph image generation).

**Why this matters**: Visual identity is part of your moat. The pipeline is trusted intelligence; the visuals should communicate that, not undercut it.

**Image gen settings (for the trial)**:
- One master image per topic, 1792×1024 (DALL-E 3 max landscape).
- Sonnet writes the visual prompt from topic facts.
- Brand-style prefix locked in `editorialRules.ts`: *"Editorial flat illustration, Royal Glow palette (#6B2D8F purple, #D4AF37 gold), no text in image, clean composition, no people, magazine cover quality."*
- Auto-crops: IG 1080×1080, FB+LinkedIn 1200×630, X 1600×900, IG portrait 1080×1350.
- Storage: Supabase Storage bucket `social-images`, indexed by `topic_id`.
- Regenerate button + manual visual-prompt override.

#### UI

- Drafts row gets a **"Generate social variants"** button (visible when topic has at least one published variant).
- Click → fires Sonnet for all 4 platforms in parallel + DALL-E for the master image. Returns in ~20-40 seconds with a progress indicator.
- Per-platform editor surface: variant text + char counter + hashtag chip + per-crop image preview + per-variant Regenerate + Copy-to-clipboard buttons.
- Variant chips from Phase 1 apply: voice check (inherited), originality check (run fresh for X to avoid recycling old posts).

#### Schema

- New table `social_images`: `topic_id, master_url, crops jsonb {square, landscape_facebook, landscape_linkedin, landscape_x, portrait_ig}, prompt_used text, generated_at`.
- `content_variants` already supports the format values; no new columns needed.

#### Cost

- Sonnet for 4 variants per post: ~$0.08 per topic.
- DALL-E 3 standard for master image: $0.04 per topic.
- At 50 topics/month: **~$6/mo total.**

Output: one PR. Ships after Phase 4 (Drafts hub must exist first).

### Phase 5 — Lifecycle automation

- `/api/cron/auto-expire` — hourly. Flips `published → expired` where `end_date` has passed.
- `/api/cron/auto-archive` — daily. Flips `expired → archived` where `expired_at < now() - 30 days`.
- `/api/cron/retention-sweep` — daily. Enforces retention policy (quarantine 90d, ingest_errors 30d, pipeline_status_audit 180d).
- Add `Published` and `Expired` tabs to Drafts and Newsletter index pages.
- Update public-site queries to filter out `expired` and `archived` rows from active surfaces.

Output: one PR.

### Phase 6 — Unified search index (optional, post-launch)

Defer until volume justifies. **Trigger**: total `content_variants` > 500.

- Add `search_vector tsvector` columns to `topics`, `content_variants`, `intel_items`.
- Postgres full-text search via `to_tsvector('english', title || ' ' || body)` + GIN index.
- Trigram similarity for fuzzy matches across the same surface.
- `/admin/search` global search page; chips, statuses, dates filterable.
- Provenance Panel becomes searchable: search "Marriott devaluation" finds the topic + every variant + every confirming intel item.

Output: one PR. Not blocking Phase 1-5.

### Phase 7 — Editorial analytics + signal score (post-launch, learning loop)

**Why this exists**: The pipeline is currently production-focused but not learning-focused. Without engagement feedback, the AI never gets smarter and Jill is guessing about what readers actually care about. This phase closes the loop.

**Trigger**: ship after Phase 5 stabilizes — needs a few weeks of real publishing data first.

#### Tracked metrics (per content_variant)

- **CTR** (clicks from email/social/home to alert detail page)
- **Open rate** (newsletter only)
- **Dwell time** (seconds on page before bounce/next-click)
- **Scroll depth** (% of article scrolled)
- **Newsletter signup conversion** (visitor → subscriber attributed back to the entry alert)
- **Affiliate click-through** (when relevant)
- **"Was this useful?" rating** (small 👍/👎 widget at the bottom of each alert)

Storage: new table `content_engagement` keyed by `variant_id`, daily-aggregated rollups.

#### Signal score (per topic)

Each topic accumulates a 0-100 score:
- Source credibility (weighted by `fact_origin`)
- Duplicate confirmations (more sources = higher)
- Historical engagement on similar topics (clustered by `programs + alert_type`)
- Conversion history (signups attributed to this topic family)
- Freshness decay
- Urgency boost (countdown < 7d)
- Rarity (less-covered programs surface higher when something happens)

Stored as `topics.signal_score numeric`, recomputed nightly.

#### What signal score drives

- **Auto-approval threshold** — tighten or loosen the bar based on historical accuracy of high-score predictions.
- **Newsletter slot selection** — `runBuildNewsletter()` prefers high-signal-score topics for `big_story_ref`.
- **Homepage placement** — the live bar surfaces the highest-signal active alerts first.
- **Social variant priority** — Phase 4.5 auto-suggests generating socials for high-signal topics.
- **Editorial prompts** — feed top-scoring patterns back into Sonnet system prompts ("readers respond to X angle for Y type of news").

Output: one PR. Adds analytics ingestion, signal score computation, and feedback into the four downstream surfaces.

## Schema changes summary

### Migrations to APPLY from repo (Phase 0.5)
- 297 — `topics` table
- 298 — `content_variants` table
- 299 — indexes
- 300 — `blog_posts` table
- 304 — `intel_items.triage_decision`, `triage_reasoning`, `triage_decided_at`

### NEW migrations to write
- **Phase 1**: extend `intel_items` with `snoozed_until timestamptz`, `dup_of_intel_id uuid`, `archived_at timestamptz`, `confirmation_count int default 0`, `confirming_sources text[]`, `headline_normalized text` + GIN trigram index + UNIQUE constraint on `(headline_normalized, day)`. Extend `content_variants` with `prompt_version text`, `generated_by text`, `edited_by text`, `surface_locations text[]`. New table: `intel_ingest_errors`.
- **Phase 2**: extend `sources` with `intake_method text`, `inbox_address text`. Add `source_type` enum values: `'email'`, `'social'`, `'ai-discovery'`. New tables: `intel_email_senders` (allowlist), `intel_email_quarantine` (rejected inbound).
- **Phase 3**: rename `alerts` → `alerts_legacy`. Create view `alerts`. No new tables.
- **Phase 5**: `pipeline_status_audit` log table.
- **Phase 6** (optional): `search_vector tsvector` columns + GIN indexes on `topics`, `content_variants`, `intel_items`.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Public-site regression in Phase 3 | `alerts` view preserves all reads. Pixel diff against prod-copy before merge. Rollback steps documented. |
| Newsletter auto-pull breaks in Phase 3 | Test `runBuildNewsletter()` on manual run against migrated data before flipping. |
| QA gate regressions in Phase 3 | Run full pipeline on three migrated variants pre-merge; results must match pre-migration byte-for-byte. |
| Email-forwarding spam in Phase 2 | Restrict inbound to verified senders (allowlist + DKIM/SPF gates); quarantine + admin review. |
| X API cost ($200+/mo) | Skip X initially; ship Grok-only. Revisit when subscriber revenue covers it. |
| Haiku diff false-positives suppress real updates | Fail-open; weekly admin audit page reviews diff decisions. |
| **Compat-view becomes cursed archaeology** | SUNSET_ALERTS_VIEW_AT = 90 days post-migration + CI lint blocking new `from('alerts')` usage. Forces full migration. |
| **AI hallucination laundering** (AI-invented claim washes through pipeline and looks authoritative) | `fact_origin` chip distinct from source confidence. Visually red for `ai-discovered-only`. Auto-approval excludes ai-discovered-only. |
| **DALL-E feed looks generic / "AI blog" aesthetic** | 2-week trial in Phase 4.5; fallback to templated branded graphics if feed fails the distinctiveness test. |
| **Editorial fatigue** (every item demands inspection) | Auto-approval tier skips Triage for high-confidence pattern matches. Trust grows over time as criteria loosen. |
| **System is production-focused without learning loop** | Phase 7 ships analytics + signal score to feed engagement back into prioritization. |
| **Real-world API spend exceeds estimate** | Buffered cost table; budget alerts at 2× and 5× baseline. |

## Definition of done

- Admin nav shows: **Sources, Triage, Drafts, Newsletter**. Nothing else in the pipeline section.
- Every QA feature that worked on 2026-05-20 still works.
- A rejected item is one line. A snoozed item is invisible until its date. An expired item is off the public site. A published item appears in a `Published` tab.
- Five intake sources operational: **Claude Scout (existing), forwarded email, Google Alerts (via email), program marketing emails (via email), Grok poller (with X Live Search)**. X API direct optional / escalation only.
- Phase 4.5 social pipeline operational: one-click generation of Facebook/Instagram/LinkedIn/X copy + brand-locked DALL-E image with per-platform crops, manual trigger only.
- Topics admin page loads. Triage page returns real data.
- **Every list row in admin shows source, confidence, when, status, and relevant QA chips.** Every item has an expandable Provenance Panel.
- A duplicate intel item attaches to the original silently, increments `confirmation_count`, never triggers a second pipeline run.

## Performance budget (chips + admin pages)

Hard guardrails. Each violated number is a Phase 1 rollback trigger.

- Triage page: render 50 rows × 3-5 chips each in **< 200ms on a 2020 MacBook Air** and **< 350ms on an iPhone 12**.
- Provenance Panel expand: **< 100ms** to fully render after click.
- Drafts page: same Triage budget applies.
- No scroll jank at 50 rows on either device.
- Initial JS bundle for any admin page: **< 250KB gzipped** (chip library must not bloat this).

Acceptance test: Playwright script renders prod-copy data on both devices; logs each metric. CI fails the PR on any breach.

## Ingestion error contract

Every ingestion path (Scout, email inbound, Grok, manual paste) calls `ingestItem`. If anything in the chain throws — classifier failure, dedup failure, surface_locations failure, parser failure — `ingestItem` swallows the exception and writes to a new `intel_ingest_errors` table:

```sql
create table intel_ingest_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null,              -- 'scout' | 'email' | 'grok' | 'manual' | 'x'
  stage text not null,                -- 'classify' | 'dedup' | 'haiku-diff' | 'insert' | 'surface'
  payload jsonb not null,             -- raw input that triggered the failure
  error_message text,
  error_stack text
);
```

Triage header shows a small **red `Ingest errors (N)`** chip when `count(*) WHERE created_at > now() - interval '24h' > 0`. Click to see the failures. Silent ingestion failures become impossible.

## Data retention policy

| Table | Retention | Why |
|---|---|---|
| `intel_items` | Forever | Audit trail, dup confirmations, historical signal |
| `content_variants` | Forever | Public-site SEO + historical archive |
| `alerts_legacy` | Forever (after Phase 3) | Recoverable rollback target |
| `intel_email_quarantine` | 90 days | Allowed time to review + promote/discard |
| `intel_ingest_errors` | 30 days | Long enough to diagnose, short enough to stay small |
| `backup_snapshots` | 30 days | Already enforced by existing cron |
| `pipeline_status_audit` | 180 days | Sample-size for editorial workflow analysis |

A daily cron (`/api/cron/retention-sweep`) deletes rows past their window. Soft-delete pattern (set `deleted_at`) not used — these are truly safe to discard at expiry.

## QA regression suite

Ships in Phase 1, runs in CI on every PR. Ten tests, each <2 seconds:

1. **`ingestItem` happy path** — Scout-shaped finding becomes intel_item; status='new'.
2. **`ingestItem` dedup** — second identical headline within 14 days marks `dup_of_intel_id` and increments `confirmation_count`.
3. **`ingestItem` Haiku diff** — mocked Haiku response with `has_new_facts: true` surfaces in Triage with `update_to_alert_id`.
4. **`ingestItem` race guard** — two parallel inserts of same `headline_normalized + day` produce one row + one dup marker.
5. **Status transitions** — every valid status change enforced; invalid transitions rejected.
6. **`runBuildNewsletter()`** — produces slot-populated draft from migrated `content_variants` data; output matches pre-migration snapshot.
7. **`alerts` view** — selecting from view returns same shape as pre-migration `alerts` table for these exact 20 fields: `id`, `title`, `slug`, `type`, `status`, `summary`, `description`, `end_date`, `source_url`, `verified_terms`, `fact_check_claims`, `voice_pass`, `voice_score`, `voice_lead_mode`, `originality_pass`, `originality_notes`, `primary_program_id`, `created_at`, `updated_at`, `published_at`.
8. **Provenance Panel** — given a fully-populated intel_item + variant + dups, renders source chain + confirmations + surface_locations correctly.
9. **Snooze** — item with `snoozed_until = now() + 1d` hidden from default view; visible in Snoozed tab; re-emerges after date passes.
10. **Reject collapse** — rejected row renders as one-liner; click expands.

Failing test blocks merge. No exceptions.

## Cost summary (monthly run-rate adder)

| Item | Baseline cost | Notes |
|---|---|---|
| Haiku diff calls | ~$1.50 | Only fires when Layer 2 would block; ~100 checks/day at $0.0005 |
| Inbound email provider | $0-20 | Resend Inbound if available on current plan; CloudMailin/Postmark fallback |
| Grok poller (with X Live Search) | ~$5-15 | Daily cron; xAI API; X coverage included |
| Sonnet for social variants (Phase 4.5) | ~$4 | 4 platforms × 50 topics/mo × ~$0.02 each |
| DALL-E 3 standard for social images | ~$2 | 50 master images/mo at $0.04 |
| X API direct (escalation only) | $200+ | Only built if Grok trial reveals gaps |
| **Baseline total (full Phase 1-5 incl. social)** | **~$13-41/mo** | Negligible relative to current Anthropic spend |

**Real-world spend caveat**: baseline assumes no iteration overhead. Early months typically run **3-5× baseline** as we tune prompts, regenerate failed gen output, re-run QA on edits, and experiment with platform variants. Plan for $40-200/mo during the first 2-3 months stabilizing; then it drops back to baseline as patterns settle. Still cheap in absolute terms.

## Open questions for Copilot / Jill

1. **Inbound email provider**: Resend Inbound (consolidate with existing Resend usage) vs CloudMailin/Postmark (dedicated, more inbound-feature-rich)? Decide during Phase 2 scoping.
2. **Dup `source_url` review**: handle 10 rows manually in Phase 0, or scripted pass + Jill spot-checks?
3. **Haiku diff weekly audit**: do you want a small `/admin/diff-audit` page that shows the last 20 Haiku diff decisions so you can sanity-check the suppress/surface calls? My recommendation: yes, ships in Phase 1.
4. **Chip density on mobile**: default proposal is "show status + source + when on narrow viewports; everything else behind `more ▾`." Confirm during Phase 1 implementation.
