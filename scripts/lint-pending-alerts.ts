/**
 * Pre-triage lint for pending_review alerts. READ-ONLY CLI.
 * Uses the shared logic in utils/alerts/lintPendingAlerts.ts (same checks the
 * daily-brief pre-triage runs).
 *
 * Run: npx tsx --env-file=.env.local scripts/lint-pending-alerts.ts
 */
import { createClient } from '@supabase/supabase-js'
import { lintPendingAlert, type AlertForLint, type PublishedForDupe } from '../utils/alerts/lintPendingAlerts'

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data: pend } = await sb
    .from('alerts')
    .select('id, slug, title, summary, description, source_url, primary_program_id, start_date, end_date')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })
  const pending = pend ?? []

  const { data: pub } = await sb
    .from('alerts')
    .select('id, title, primary_program_id')
    .in('status', ['published', 'expired'])
    .order('created_at', { ascending: false })
    .limit(1000)
  const published = (pub ?? []) as PublishedForDupe[]

  const { data: progs } = await sb.from('programs').select('id, name')
  const progName = new Map((progs ?? []).map((p: any) => [p.id, p.name]))

  // verified_terms per pending alert (via topic -> variant metadata)
  const vt = new Map<string, string | null>()
  for (const a of pending) {
    const { data } = await sb.from('topics').select('content_variants(metadata)').eq('slug', a.slug).maybeSingle()
    const cv = (data as any)?.content_variants
    const meta = Array.isArray(cv) ? cv[0]?.metadata : cv?.metadata
    vt.set(a.id, (meta?.verified_terms as string) ?? null)
  }

  let flagged = 0
  for (const a of pending) {
    const flags = lintPendingAlert({ ...(a as AlertForLint), verified_terms: vt.get(a.id) ?? null }, published)
    if (flags.length) {
      flagged++
      console.log(`\n⚑ ${a.title.slice(0, 72)}`)
      console.log(`   program: ${progName.get(a.primary_program_id) || 'none'} | source: ${(a.source_url || '').slice(0, 60)}`)
      for (const f of flags) console.log(`   - [${f.kind}] ${f.message}`)
    } else {
      console.log(`\n✓ ${a.title.slice(0, 72)} — clean`)
    }
  }
  console.log(`\n----\n${pending.length} pending · ${flagged} flagged · ${pending.length - flagged} clean`)
}

main().catch((e) => { console.error(e); process.exit(1) })
