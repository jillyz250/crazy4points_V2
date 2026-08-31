/**
 * Manually drain the undecided intel backlog through the editorial planner.
 *
 * The daily crons (build-brief + intel-triage-sweep) each auto-drain a couple of
 * batches, which keeps a normal day at zero backlog. This script is for CLEARING
 * A LARGE STANDING BACKLOG on demand (e.g. after a spike-ingest day dumps 100+
 * items at once) — it runs many batches back-to-back with no serverless time
 * limit. Same engine (drainUndecidedBacklog -> generateEditorialPlan ->
 * persistPlanDecisions) as the crons, so decisions are identical and it's fully
 * idempotent / resumable: re-run any time; already-decided rows drop out of the
 * pool automatically.
 *
 * Usage:
 *   npx tsx scripts/drain-triage-backlog.ts               # up to 30 batches (~840 items)
 *   npx tsx scripts/drain-triage-backlog.ts --batches=10  # cap batches
 *   npx tsx scripts/drain-triage-backlog.ts --batch-size=28
 *
 * Cost: ~1 Sonnet call per batch (~28 items). Each batch ~2-2.5 min.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { drainUndecidedBacklog } from '@/utils/intel/drainUndecidedBacklog'

for (const p of [resolve(process.cwd(), '.env.local'), resolve(process.cwd(), '../../../.env.local')]) {
  try {
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1')
    }
  } catch {}
}

function argNum(flag: string, dflt: number): number {
  const a = process.argv.find((x) => x.startsWith(`${flag}=`))
  if (!a) return dflt
  const n = Number(a.split('=')[1])
  return Number.isFinite(n) ? n : dflt
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) { console.error('Missing SUPABASE creds'); process.exit(1) }
  const sb = createClient(url, key)

  const maxBatches = argNum('--batches', 30)
  const batchSize = Math.min(argNum('--batch-size', 28), 35)

  // Count before
  const countUndecided = async () => (await sb.from('intel_items')
    .select('id', { count: 'exact', head: true })
    .is('triage_decision', null).is('rejected_at', null).is('archived_at', null).is('alert_id', null)
    .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)).count ?? 0
  const before = await countUndecided()
  console.log(`\nUndecided (actionable) before: ${before}`)
  console.log(`Draining up to ${maxBatches} batches x ${batchSize} items...\n`)

  // Seed the dupe guard with recently published alert titles.
  const { data: pub } = await sb.from('alerts')
    .select('title').eq('status', 'published').order('created_at', { ascending: false }).limit(80)
  const alreadyCovered = (pub ?? []).map((r) => r.title as string).filter(Boolean)

  const t0 = Date.now()
  const res = await drainUndecidedBacklog(sb, {
    batchSize,
    maxBatches,
    alreadyCovered,
    onBatch: ({ batch, sent, persisted, poolRemaining }) => {
      console.log(`  batch ${batch}: sent ${sent}, persisted ${persisted}, ~${poolRemaining} left in fetch window  (${Math.round((Date.now() - t0) / 1000)}s elapsed)`)
    },
  })

  const after = await countUndecided()
  console.log(`\n=== DRAIN COMPLETE ===`)
  console.log(`batches=${res.batches} itemsSeen=${res.itemsSeen} decided=${res.decisionsPersisted}`)
  console.log(`  approved=${res.approved} rejected=${res.rejected} blog_idea=${res.blogIdea} newsletter_idea=${res.newsletterIdea} nullPlans=${res.nullPlans}`)
  console.log(`Undecided (actionable): ${before} -> ${after}  (drained ${before - after})`)
  if (after > 30) console.log(`\n${after} still undecided — re-run to continue (idempotent).`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
