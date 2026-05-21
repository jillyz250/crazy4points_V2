# Phase 3 — Wave 2: flip public read path from `alerts` → `content_variants` + `topics`

**Status:** Draft for Jill's review
**Date:** 2026-05-21
**Estimated effort:** 2–3 days, shipped as a sequence of small PRs (one per read path)
**Reversible:** Yes — every flip is a single small PR; rollback = `git revert`. The dual-write trigger from Wave 1 keeps both tables in sync, so reverting reads is always safe.

---

## Goal

Every public-facing query that today reads from the `alerts` table starts reading from `content_variants` (joined with `topics`) instead. **Zero URL changes**, **zero content changes**, just a different table powering the same page.

The `alerts` table stays populated (via the dual-write trigger from Wave 1) as a read-redundant safety net until Wave 3 retires it.

---

## What can break, and how we prevent it

| Risk | Mitigation |
|---|---|
| `/alerts/[slug]` 404s | Pre-flip verification script: every published slug exists in both tables with identical title + body. Gate Wave 2 on this passing. |
| Field missing from variant that the page rendered from alert | Build an **adapter** that returns the same shape (`AlertView`) as the existing `Alert` type. If a field can't be derived, log it and pause migration of that path until we decide where it lives. |
| Daily brief / newsletter renders different content | Same adapter; same verification. Newsletter is editor-reviewed before send, so any visible drift is caught in admin preview. |
| Sitemap drops URLs | Counts must match before flipping. |
| Hot alerts bar on homepage sorts differently | `is_hot`, `impact_score`, `end_date` all in adapter; verify sort order matches old `hotnessScore()` output for the current top 5. |

---

## Strategy: one adapter, many small flips

### Step A — Build the adapter (foundation, 1 file)
New file: `utils/content/alertView.ts`

Exports:
- `type AlertView` — identical shape to the existing `Alert` type from `utils/supabase/queries.ts`, so consumer code doesn't change.
- **Normalizations:** `programs` and `fact_ledger` come back as `[]` (never `null`), since `alerts` historically had inconsistent null semantics that the adapter must paper over.
- **Provenance marker:** every returned row carries `metadata.source = 'variants'` so we can grep prod logs / DB and confirm which path served the response during rollout.
- `selectAlertViewFromVariants(supabase, filters)` — runs a query like:
  ```
  select v.id, v.title, v.body as description, v.status, v.published_at,
         v.metadata, t.slug, t.topic_type as type, t.summary, t.end_date,
         t.programs, t.fact_ledger, t.metadata as topic_metadata, ...
  from content_variants v
  join topics t on t.id = v.topic_id
  where v.format = 'alert' and v.status = 'published' and t.status = 'active'
  ```
  Returns rows already mapped to the `AlertView` shape (which equals `Alert`).
- Helper `mapVariantRowToAlertView(row)` for tests + raw queries that don't want to swap their SELECT.

Open question for Wave 3: do we eventually want `AlertView` to be the canonical name everywhere, replacing `Alert`? My recommendation: yes, but not in Wave 2 — keep the surface compatible so each flip is mechanical.

### Step B — Migrate read paths, one PR per path, lowest-risk first

Migration order (each one is a small PR):

| # | Path | File | What it reads | Risk |
|---|---|---|---|---|
| 1 | Sitemap | `app/sitemap.ts` | `slug, published_at` | 🟢 lowest — XML feed |
| 2 | Short-link redirect | `app/(site)/a/[short]/page.tsx` | `slug, status` | 🟢 low — 308 to canonical |
| 3 | Build-brief voice samples | `app/api/build-brief/route.ts` (lines 48–54) | `id, title, summary, published_at` | 🟢 low — internal email content |
| 4 | Build-brief inline lookup | `app/api/build-brief/route.ts` (lines 303–314) | `id, computed_score` (score now lives on `topic.metadata.editorial_scores`) | 🟡 medium — score path changes |
| 5 | Newsletter builder | `utils/ai/runBuildNewsletter.ts` | `id, slug, title, summary, ai_summary, why_this_matters, published_at, end_date, type, impact_score` | 🟡 medium — editor previews before send |
| 6 | Homepage hot alerts | `app/(site)/page.tsx` + `getActiveAlerts()` | full `Alert` + `hotnessScore()` | 🟡 medium — homepage SEO |
| 7 | Daily brief index | `app/(site)/daily-brief/page.tsx` + `getActiveAlerts()` | full `Alert` | 🟡 medium |
| 8 | Daily brief archive | `app/(site)/daily-brief/[date]/page.tsx` + `getAlertsByPublishDate()` | full `Alert` | 🟡 medium |
| 9 | Alerts list | `app/(site)/alerts/page.tsx` + `getActiveAlertsByFilter()` | full `Alert` | 🟠 high — most-trafficked listing |
| 10 | Program detail alerts archive | `app/(site)/programs/[slug]/page.tsx` + `getAlertsByProgramSlug()` | full `Alert` | 🟠 high |
| 11 | **Alert detail page** | `app/(site)/alerts/[slug]/page.tsx` + `getAlertBySlug()` | full `Alert` | 🔴 **highest — SEO landing page** |

**Strategy:** ship #1–#5 as one batch (low risk, internal-ish). Verify on prod for a day. Then ship #6–#10 as a second batch. Then ship #11 alone with extra scrutiny.

### Step C — Verification script (pre-flip gate, every PR runs it)
New: `scripts/phase3-verify-wave2.mjs`

For every published alert:
1. Query the OLD way (from `alerts`)
2. Query the NEW way (from `content_variants` + `topics`)
3. Diff the shape — every field consumed by the route under test must match. Differences print as `❌ <slug>.<field>: alert="..." variant="..."`.
4. **Byte-for-byte slug check** — `JSON.stringify(old.slug) === JSON.stringify(new.slug)` (catches ASCII normalization).
5. **`computed_score` match** — extracted from `topic.metadata.editorial_scores.computed_score` on the new side; must equal `alerts.computed_score` on the old side.
6. **`--strict` flag (optional)** — fails if ANY field differs, not just route-consumed ones. Useful as a Wave 3 readiness gate.
7. Exit non-zero if any diff. Each migration PR's CI runs this script.

### Step D — Per-PR rollout protocol
For each of #1–#11:
1. Branch off main
2. Update the read path to use `selectAlertViewFromVariants` (or `mapVariantRowToAlertView` for raw queries)
3. Run `scripts/phase3-verify-wave2.mjs --route=<name>` locally — must pass
4. Open PR, link to verification output
5. Smoke-test the preview URL — visual diff against prod (eyeball check on 3 sample slugs)
6. Merge
7. After merge, hit `/api/dev/test-phase3-wave2` (new endpoint, ships as part of Step A) which exercises the dual-write trigger + adapter + read path on a real test row end-to-end and self-cleans
8. Watch real prod for ~30 min — monitor `/api/errors` admin page; if any spike, `git revert` immediately (the dual-write trigger guarantees `alerts` is still current, so revert is instantaneous)
9. Wait at least 30 min between PRs in the same batch — don't pile on flips before each one is observed

### Step E — Final verification after all 11 flips ship
- Manual eyeball: top 3 Google Search Console queries for `crazy4points.com` — open each, confirm content renders
- Sitemap diff: `sitemap.xml` URL list before vs after must be byte-identical
- Newsletter dry-run: render this week's draft, compare to previous week (same Sonnet pipeline output expected)

---

## Out of scope (Wave 3)

- Stop writing to `alerts` table (keep dual-write trigger active until Wave 3)
- Move admin editorial UI from `/admin/alerts` to a unified Drafts hub
- Eventually drop `alerts` table

---

## Rollback plan

Per-PR: `git revert <sha>` → Vercel redeploys → reads flip back to `alerts`. Because the dual-write trigger keeps `alerts` faithful, there's no data loss.

Whole-Wave-2: revert all 11 PRs in reverse order. Same mechanism.

If the adapter itself has a bug: fix forward in a new PR (it's pure mapping code, no state).

---

## Open questions for Jill

1. **Batching cadence** — I have it as batches of 5 / 5 / 1 with a day between batches. Alternative: one PR per day for 11 days, smoother but slower. **My recommendation: 3 batches, ~5 days total.**
2. **Feature flag?** — could add `READ_FROM_VARIANTS=true` env var so we can flip back without redeploy. Adds complexity. **My recommendation: skip — each flip is small enough that `git revert` + Vercel redeploy (~2 min) is fine.**
3. **Do we migrate `/daily-brief/*` and `/programs/[slug]` alert sections in Wave 2, or defer?** These are public routes that read alerts. **My recommendation: include them — leaving them on the old table means we can't retire `alerts` in Wave 3 without another Wave 2.5.**
4. **`computed_score` migration** — today this is materialized on alerts table. Variants currently store it inside `topic.metadata.editorial_scores`. The build-brief inline lookup at line 303–314 reads `computed_score` directly. Two choices: (a) add `computed_score` as a real column on `topics` for fast access, or (b) extract from JSON in the query. **My recommendation: extract from JSON for now — Wave 2 ships sooner, performance is fine at 62 rows.**

---

## Your next step (for Jill)

1. Read the plan, especially the migration order table and the 4 open questions.
2. Reply with either:
   - **"accept recommendations, start step A"** — I build the adapter + verification script as PR #1 (no read path flipped yet), you review, then we start flipping
   - **"answer:"** followed by answers to the questions
   - **"questions:"** anything fuzzy
