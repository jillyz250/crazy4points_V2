# Content system rehaul — backfill (PR 5)

Backfill script that migrates existing rows from the legacy `alerts` +
`content_ideas` tables into the new `topics` + `content_variants` tables
introduced by PR 1 (`supabase/migrations/297_topics.sql`,
`supabase/migrations/298_content_variants.sql`).

See `plans/content-system-rehaul.md` for the full design.

## What the script does

Script: `scripts/backfill-alerts-to-topics.ts`

For every row in legacy `alerts`:

1. Skip if a `topics` row already exists with the same slug.
2. Insert a `topics` row carrying:
   - `slug`, `title`, `summary`
   - `source_markdown` = `alerts.description` (the legacy body becomes the
     markdown — imperfect, but it's the best we have for legacy data)
   - `source_urls` = `[alerts.source_url]` (filtered if null)
   - `fact_ledger` = `[]` — editor must backfill after review
   - `fact_check_status` = `'pending'` — legacy data wasn't run through the
     new verifier pipeline; editor must flip to `verified` after review
   - `programs` = joined from `alert_programs → programs.slug`
   - `cards` = `[]` (legacy alerts weren't card-tagged)
   - `topic_type` = `alerts.type` if it maps cleanly to the new enum, else
     `'other'`
   - `end_date` = preserved
   - `status` = `'active'` if `alerts.status='published'` else `'draft'`
   - `created_by` = `'backfill-2026-05-18'` (so we can find/rollback these rows)
   - `created_at` = preserved from the source alert
3. Insert a `content_variants` row of format `alert` linked to the new
   topic, carrying `body` = description, `title` = title, scoring +
   `source_url` + `action_type` packed into `metadata`, `status` =
   published/draft mirror, `publish_target_url` = `/alerts/<slug>`,
   `generated_by` = `'editor'`.

For every newsletter `content_ideas` row:

- If `source_alert_id` is set: link a `content_variants` row of format
  `newsletter` to the topic created from that alert.
- If `source_alert_id` is null: create a standalone topic (`idea-<slug>`)
  + a newsletter variant.

## Idempotency

- Topics are skipped if a row with the same slug already exists.
- Variants are skipped if a `(topic_id, format)` pair already exists.
- Editor edits made after a previous backfill run are never overwritten —
  the script is strictly skip-if-exists, never upsert-overwrite.

## How to run

1. Confirm `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and
   `SUPABASE_SERVICE_ROLE_KEY`.
2. Dry-run (default — prints counts + sample slugs, makes no writes):
   ```
   npx tsx scripts/backfill-alerts-to-topics.ts --dry-run
   ```
   (Running with no flag also dry-runs — write requires explicit opt-in.)
3. Review the planned numbers (topics to create, variants to create, any
   errors).
4. Execute:
   ```
   npx tsx scripts/backfill-alerts-to-topics.ts --write
   ```
5. Re-run the dry-run command. Every row should now appear under
   "skipped (already exist)" — that confirms idempotency.

## Rollback

Delete every topic the script created. The FK on `content_variants.topic_id`
is `on delete cascade`, so variants drop with their topic.

```sql
delete from topics where created_by = 'backfill-2026-05-18';
```

That also unwinds standalone topics created from orphan content_ideas
(they use the same `created_by` tag).

The legacy `alerts` and `content_ideas` tables are never touched, so the
old pipeline keeps working regardless of backfill state.

## Manual editor work after backfill

Backfilled topics are deliberately marked `fact_check_status = 'pending'`
and ship with `fact_ledger = []`. Variants generated from them won't pass
the new fact-check gate.

For each backfilled topic the editor wants to keep live, they need to:

1. Open the topic in the new admin Topics UI (PR 3).
2. Review `source_markdown` against the current state of the offer / news
   item — legacy alert descriptions may be stale.
3. Add fact-ledger entries for the claims the variants still rely on, or
   run the Haiku fact-extractor (PR 2) over the source markdown.
4. Flip `fact_check_status` to `verified` (or `partially_verified`) once
   the ledger covers what the variants claim.

Until that's done, backfilled topics are visible in admin but their
variants stay in `'published'` status from the legacy publish — they
just won't be regenerable by Sonnet/Haiku without a verified ledger.

## What this script does NOT do

- It does not delete or modify legacy `alerts` / `content_ideas` rows.
  They stay in place so the existing public pages keep working; a future
  cleanup pass can archive them once everything reads from the new
  tables.
- It does not infer card tags. Legacy alerts weren't card-tagged; editors
  add `cards[]` manually after backfill.
- It does not auto-run on deploy. It is a CLI-only one-shot — the editor
  runs `--dry-run`, reviews, then `--write`.
