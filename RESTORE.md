# RESTORE — Database snapshot recovery playbook

When something is lost, broken, or you need to compare against a known-good state, this is the playbook.

## How snapshots work (60-second tour)

Snapshots are gzipped JSON files of every editorial table, stored in the private Supabase Storage bucket `db-backups`. Metadata (when, what label, size, who) is in the `backup_snapshots` table. There are two ways snapshots get created:

1. **Manual** — admin clicks "Take snapshot" at `/admin/backups`. Use before risky operations.
2. **Nightly cron** — Vercel cron at 07:00 UTC (~2-3am US Eastern). Doesn't require any machine to be on.

Snapshots cover these tables:
- `programs`, `credit_cards`, `credit_card_benefits`, `credit_card_welcome_bonuses`, `issuers`
- `alerts`, `alert_programs`, `card_co_brand_programs`
- `topics`, `content_variants`, `blog_posts`
- `content_ideas`, `subscribers`
- `program_field_history` (the per-field undo trail)
- `sources`, `partner_redemptions`, `hotel_properties`
- `backup_snapshots` (the index itself)

Operational/log tables are NOT in snapshots (firecrawl logs, usage logs, extraction artifacts).

## Scenarios

### Scenario 1: "I think this field was different last week — can I see what it was?"

1. Go to `/admin/backups`
2. Find a snapshot from before the suspected change
3. Click **Download** → opens a signed URL to the `.json.gz` file (5 min TTL)
4. `gunzip` locally and grep for the row in question
5. Compare to the current DB value

Example:
```bash
gunzip -k snapshots-2026-05-12-marriott.json.gz
jq '.tables.programs[] | select(.slug=="marriott-bonvoy") | .transfer_partners_outbound' \
  snapshots-2026-05-12-marriott.json
```

### Scenario 2: "I just blanked a field. Can I undo it?"

For programs, FIRST CHECK the `program_field_history` table — it captures every per-field overwrite automatically:

```sql
SELECT field_name, previous_value, new_value, applied_at
  FROM program_field_history
 WHERE program_id = '<uuid>'
 ORDER BY applied_at DESC
 LIMIT 10;
```

If you find the row, copy `previous_value` and UPDATE the field back manually.

If the destruction wasn't from `applyProgramField` (e.g. someone ran ad-hoc SQL), fall through to Scenario 1 — pull a snapshot from before the damage.

### Scenario 3: "I just ran something destructive across many rows and need to undo broadly"

1. **Don't run anything else.** Especially don't run more snapshots over the broken state.
2. Identify the most recent snapshot taken BEFORE the bad operation. The admin page shows them in reverse chronological order.
3. Download the .json.gz, unzip.
4. For each affected row, manually craft an UPDATE statement using the values from the snapshot's JSON:

```javascript
// Mini node script to generate UPDATEs from a snapshot
import { readFileSync } from 'node:fs'
const dump = JSON.parse(readFileSync('snapshots-XXX.json', 'utf8'))
const rows = dump.tables.credit_cards.filter(c => c.issuer_id === 'CHASE_UUID')
for (const r of rows) {
  console.log(`UPDATE credit_cards SET name = '${r.name.replace(/'/g, "''")}', annual_fee_usd = ${r.annual_fee_usd ?? 'NULL'} WHERE id = '${r.id}';`)
}
```

5. Paste UPDATEs into Supabase SQL editor.

### Scenario 4: "The whole DB is hosed and we need to start over"

This is the heavy-recovery path. Outside the scope of snapshots — at that point you'd:

1. Snapshot the current (broken) state for forensics
2. Restore the most recent good snapshot row-by-row using the script in Scenario 3, scaled up
3. Replay any migrations that ran AFTER the snapshot was taken
4. Manually replay any editorial work that happened AFTER the snapshot

If you find yourself in this scenario, **upgrade to Supabase Pro tier ($25/mo) for point-in-time recovery** — it can roll the entire DB back to any second in the last 7 days from the Supabase dashboard. That's the right insurance for full-DB disasters.

## Pruning old snapshots

There's no automated pruning yet. At ~5 MB per snapshot and Supabase Free tier's 1 GB Storage allowance, we can hold ~200 snapshots before needing to clean up. With one nightly + occasional manuals, that's roughly 6 months of history.

When pruning becomes needed:
- Keep one snapshot per week for the last 4 weeks (28 daily → 4 weekly)
- Keep one snapshot per month older than 4 weeks
- Keep ALL manual snapshots regardless of age (they have intent attached)

A pruning script can be added later — not urgent.

## What this DOESN'T cover

- **Storage bucket contents** (hotel images, OG images, etc.) — those live in other buckets and aren't backed up by this system. Add separately if you start storing irreplaceable assets.
- **Auth users** — Supabase auth.users is managed by Supabase, not in our snapshot. If you lose admin users, restore via the Supabase dashboard.
- **Sub-second precision** — daily granularity means anything done between two snapshots is gone. Use the manual snapshot button before any risky op.
