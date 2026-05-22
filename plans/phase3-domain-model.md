# Phase 3 — Canonical Domain Model + Migration Invariants

**Status:** Authoritative reference for Phase 3 Wave 3 and beyond
**Date:** 2026-05-22

This document is the **constitution** of the alerts → variants migration. Code, schemas, and admin actions all defer to it. When a future change feels like it might bend one of these definitions, this doc is the tiebreaker.

ChatGPT review (2026-05-22) called this out as the most valuable Wave 3 deliverable. Writing it before migration 323 ships prevents every future engineer (including future-me) from reinterpreting the model.

---

## 1. What things ARE

### `topics`
**The unit of editorial work.** One real-world story (a transfer bonus, a devaluation, a new partner) has exactly one topic. Topics are admin-only; readers never see a `/topics/<slug>` route.

A topic owns:
- **Identity:** slug (URL-safe identifier, 1:1 with the historical `alerts.slug`)
- **Editorial gist:** `summary` — the canonical one-line editorial summary, used by the alerts projection and any snippet/card render. NOT rendered prose; just the short hook.
- **Verified facts:** `source_markdown`, `source_urls[]`, `fact_ledger` (jsonb, structured per-claim provenance)
- **Tagging:** `programs[]` (array of program slugs), `cards[]` (array of card slugs)
- **Editorial scoring:** lives in `metadata.editorial_scores` — impact/value/rarity/computed, `is_hot`, `why_this_matters`, `impact_justification`
- **Lifecycle:** `status` ∈ `{draft, active, archived}`, `end_date`, `verified_at`
- **Provenance:** `metadata.source_intel_id`, `metadata.original_alert_id`, `metadata.original_alert_created_at`, `metadata.original_alert_updated_at`

A topic does NOT own: rendered prose. Topics contain structured facts only; all rendered prose lives exclusively on variants.

### `content_variants`
**A format-specific rendering of a topic.** One topic can have at most one variant per format (`alert`, `blog`, `newsletter`, `facebook`, `twitter`, `instagram`, `linkedin`, `threads`). Uniqueness enforced by the `(topic_id, format)` constraint.

A variant owns:
- **Identity:** id (uuid), topic_id (FK), format
- **Rendered prose:** `title`, `body`
- **Lifecycle:** `status` ∈ `{draft, needs_review, approved, published, archived}`, `published_at`, `archived_at`, `publish_target_url`
- **Editorial gates:** `brand_voice_run` (bool), `fact_check_run` (bool), `fact_check_results` (jsonb)
- **Provenance:** `generated_by` ∈ `{sonnet, haiku, editor}`, `metadata.short_slug`, `metadata.alerts_source`, `metadata.voice_*`, `metadata.fact_check_claims`, `metadata.original_alert_type`, etc.

A variant inherits its **subject matter** from its topic. It does NOT independently define what story it's about.

### `alerts` (legacy)
**A read-redundant mirror, downstream of variants from Wave 3a onward.** Every published variant where `format='alert'` has a corresponding alerts row maintained by the variants→alerts trigger. Wave 1+2 kept alerts as a write-redundant mirror (admin wrote alerts, trigger projected to variants). Wave 3 inverts that direction.

After Wave 3a:
- The alerts table is NOT the source of truth for any field.
- Admin code MUST NOT INSERT/UPDATE alerts directly.
- The variants→alerts trigger is the ONLY writer to alerts.
- Anything that reads alerts is reading a shadow projection.

After Wave 3b (eventually):
- The long-term goal is to eliminate the **semantic** alerts schema. Whether the physical table is reduced to a thin compatibility projection (drop unused columns) or archived entirely will depend on the post-Wave-3a bake results.
- We do NOT carry both full schemas indefinitely.

### `alert_programs` (junction)
**Source of truth for primary/secondary program tagging.** Topics carry `programs[]` as an unordered slug array. The role (`primary` vs `secondary`) lives only in this junction.

> **🔑 KEY INVARIANT:** `topics.programs[]` is a **projection** of `alert_programs`, not an independent source of truth. When the two disagree, the junction wins. Any future code that treats both as authoritative will produce drift.

After Wave 3a, when topic.programs[] changes the junction is reconciled atomically inside `writeAlertVariant()`.

---

## 2. What "primary program" means — precisely

A topic has at most ONE primary program. The primary is the program the story is *fundamentally about*. Examples:

- "Hyatt Award Chart Moving to 5 Tiers" → primary = `hyatt`
- "Chase Sapphire Reserve raises fee" → primary = `chase-sapphire-reserve`
- "Amex MR transfer to KLM 20% bonus" → primary = `amex-membership-rewards`, secondary = `klm`

### Authority transfer (Wave 3a → Wave 3b)

**During Wave 3a:** `topic.metadata.primary_program_id` is the authoritative source. The trigger and the helper both read/write to this jsonb path.

**After migration 324 (Wave 3a + 1):** Authority transfers exclusively to a new column `topics.primary_program_id uuid`. The metadata copy becomes derived/compatibility-only — written by the trigger as a mirror, read by no one. Future engineers MUST treat the column as source of truth and ignore the metadata copy.

**Junction reconciliation:** Whenever `primary_program_id` is set:
1. The corresponding `programs.id`'s `alert_programs(alert_id, program_id, role)` row gets `role='primary'`.
2. All other tagged programs become `role='secondary'`.
3. The denormalized `topics.programs[]` array is reconstructed from the junction (`primary` first, then `secondary` in insertion order).

---

## 3. Synchronization guarantees (Wave 3a bake period)

During Wave 3a + bake, the variants→alerts trigger MUST maintain these guarantees:

- **G1.** Every variant with `format='alert'` and `status IN ('published', 'archived')` has a corresponding `alerts` row that is **semantically equal after canonical normalization** to: `slug` (= topic.slug), `title` (= variant.title), `description` (= variant.body, NOT topic.summary), `summary` (= topic.summary, NOT variant.body). The split is critical: summary is the editor's one-line gist owned by the topic; description is the full prose owned by the variant. Canonical normalization (defined by `writeAlertVariant()`) handles whitespace, newline, unicode, and HTML-entity edge cases so the parity harness doesn't generate false positives.
- **G2.** Status mapping (inverse of Wave 1):
  - `variant.status='draft'` → `alerts.status='draft'`
  - `variant.status='needs_review'` → `alerts.status='pending_review'`
  - `variant.status='published'` → `alerts.status='published'` (and `topic.end_date < now()` → optionally `expired`; see Wave 3a impl)
  - `variant.status='archived'` → `alerts.status='soft_rejected'` (**historical compatibility only** — the alerts table's `soft_rejected` status was used for editorial rejection, but in the variants world `archived` means "intentionally retired historical content," NOT rejected. Keep this mapping during the bake; revisit in Phase 4 when we decide whether to drop the alerts table or split `archived` into `archived_historical` vs `archived_rejected`.)
- **G3.** `alerts.short_slug` is null OR equals `variant.metadata.short_slug` exactly.
- **G4.** `alerts.alert_programs` rows match `topic.programs[]` exactly, with role inherited from primary/secondary resolution above.
- **G5.** Editorial scoring fields on alerts (`impact_score`, `value_score`, etc.) equal `topic.metadata.editorial_scores.*`.
- **G6.** No alerts row exists without a matching variant. The variants→alerts trigger is the only writer; direct alerts INSERTs MUST be blocked at the DB layer. Application-layer enforcement is not sufficient — a future engineer running an ad-hoc SQL snippet would silently corrupt the projection without it. Migration 323 ships a BEFORE INSERT/UPDATE trigger on alerts that raises EXCEPTION when `pg_trigger_depth() = 0` (i.e. the write didn't originate from the variants→alerts trigger).

The parity harness (`scripts/phase3-wave3-parity-harness.mjs`) verifies G1–G5 on every published row and gates every admin-action-rewrite PR.

---

## 4. Invariants that MUST NEVER break

These are the hard rules. A change that breaks any of these gets blocked and reverted.

### I1. Variants are the superset of alerts
Every semantic concept that lives on alerts MUST be reachable from `(variant, topic, alert_programs)` without going through alerts. If a field is added to alerts without a variant/topic equivalent, the schema parity check in migration 323 fails.

### I2. The variant is the canonical row
Admin code reads from variants. Public reads from variants (per Wave 2). Anything that reads alerts is either (a) a legacy code path being migrated, or (b) a deliberate compatibility shim during the bake.

### I3. The harness is authoritative
If the parity harness fails on a PR, the **rewrite is wrong** — not the harness. Do NOT "fix" the harness to make a PR pass. The harness exists to catch silent drift; muzzling it defeats the entire migration.

### I4. URLs are forever
`/alerts/[slug]` URLs must keep working through every wave. Slugs must be byte-stable across the migration. Adding alerts is not allowed to change existing URLs.

### I5. The dual-write direction is deterministic
At any moment, exactly ONE direction is active: either alerts→variants (Wave 1+2 era) or variants→alerts (Wave 3a+). Migration 323 performs the atomic switch. Two triggers must never run simultaneously.

### I6. `primary_program_id` has one authoritative source
During Wave 3a: `topic.metadata.primary_program_id`. After migration 324: `topics.primary_program_id` column. Never both. The transition is atomic in migration 324.

### I7. `alerts.id` stability
Topics preserve the original alert id via `topic.metadata.original_alert_id`. After Wave 3a, this id is referenced by external links (`/admin/alerts/[id]/edit`), audit logs, and historical refs. The variants→alerts trigger MUST preserve the original alert id when writing the mirror row — never auto-generate a new one.

### I8. No partial projections
If a variant has `status='published'`, the mirrored alerts row MUST be complete — no NULLs in fields that the public read path treats as required (slug, title, summary, type, status, published_at, primary_program_id when one exists). The trigger fills sensible defaults for any required field that lacks an explicit source on the variant/topic; it never writes a half-baked alerts row.

If a downstream consumer queries alerts and finds a NULL in a "required" field, that's a bug in the trigger, not the consumer.

---

## 5. Wave 3a definition of done

Wave 3a is **complete** when:

1. All 8 admin action files / cron routes write exclusively to `content_variants + topics + alert_programs` via `writeAlertVariant()` (no direct alerts INSERT/UPDATE remains).
2. Migration 323 has flipped the trigger direction; the variants→alerts trigger is the only writer to alerts.
3. The parity harness shows **zero drift** for 24 continuous hours across every published row.
4. No `/admin/errors` entries reference the old write paths or the inverse trigger.

Until all four hold, Wave 3a is not done — even if individual PRs have merged.

---

## 6. Open questions deferred to Phase 4

These are out of Wave 3 scope; documented here so they're not lost:

- Should editorial metadata (voice_pass, fact_check_claims, originality_pass) be promoted from `content_variants.metadata` to real columns? When the Drafts hub redesign happens, yes for the hot fields.
- Does the `alerts` physical table eventually go away, or stay as a compatibility projection? Decide after 1–2 weeks of clean bake post-Wave-3a.
- Does `/admin/alerts` rebrand to `/admin/drafts`? Decision deferred to Phase 4 UI work.
- Does `topics` get a `published_at` column derived from the variant? Maybe, if Phase 4 queries need it. Until then, `MAX(variant.published_at)` is fine.

---

## Reading order for any future engineer touching this

1. This doc.
2. `plans/phase3-wave1-alerts-to-variants-backfill.md` — historical: how the safety net got built.
3. `plans/phase3-wave2-flip-read-path.md` — historical: how public reads moved.
4. `plans/phase3-wave3-retire-alerts.md` — current: write-path inversion.
5. `utils/content/alertView.ts` — the read-side adapter.
6. `utils/content/writeAlertVariant.ts` — the write-side helper (Wave 3a).
