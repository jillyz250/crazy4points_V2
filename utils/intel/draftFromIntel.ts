/**
 * Draft an alert from a single intel item — the shared core behind BOTH the
 * manual "write alert" triage action and the daily auto-draft of AI-approved
 * intel.
 *
 * Runs writeEditCheck (writer -> editor -> voice gate) and persists a
 * pending_review variant via writeAlertVariant, then marks the intel
 * processed + linked. No admin-auth or revalidate concerns here; callers
 * (the server action / the cron) handle those.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { writeEditCheck } from '@/utils/ai/writeEditCheck'
import { buildExtraContext } from '@/utils/ai/buildExtraContext'
import { loadAllianceContextForPrograms } from '@/utils/supabase/queries'
import type { WriteDraftProgram } from '@/utils/ai/writeAlertDraft'
import { writeAlertVariant } from '@/utils/content/writeAlertVariant'
import { selectAlertViewFromVariants } from '@/utils/content/alertView'

export interface DraftFromIntelResult {
  ok: boolean
  alertId?: string
  error?: string
}

/**
 * Full Sonnet drafting pipeline for one intel item. Idempotent: re-running for
 * the same intel updates the existing variant (found via topic
 * metadata.source_intel_id) rather than creating a duplicate.
 */
export async function draftAlertFromIntel(
  supabase: SupabaseClient,
  intelId: string,
): Promise<DraftFromIntelResult> {
  // 1) Load intel
  const { data: intel, error: intelErr } = await supabase
    .from('intel_items')
    .select('*')
    .eq('id', intelId)
    .single()
  if (intelErr || !intel) return { ok: false, error: `intel not found: ${intelId}` }

  // 2) Recent published alerts -> voice samples for consistency
  const recentView = await selectAlertViewFromVariants(supabase, {
    status: 'published',
    activeOnly: true,
    limit: 8,
  })
  const recent_samples = recentView.map((r) => ({
    title: r.title,
    summary: r.summary ?? '',
    description: r.description ?? '',
  }))

  // 3) Resolve programs for context
  const intelSlugs = (intel.programs as string[] | null) ?? []
  const { data: programRows } = await supabase
    .from('programs')
    .select('id, slug, name, type, alliance, transfer_partners, sweet_spots, quirks')
    .in('slug', intelSlugs.length > 0 ? intelSlugs : ['__none__'])
  const allPrograms = (programRows ?? []) as WriteDraftProgram[]
  const programBySlug = new Map(allPrograms.map((p) => [p.slug, p]))
  const intelProgramIds = intelSlugs
    .map((slug) => programBySlug.get(slug)?.id)
    .filter((x): x is string => typeof x === 'string')
  const alliance_context = await loadAllianceContextForPrograms(supabase, intelProgramIds)
  const { extra_context } = await buildExtraContext(supabase, { programSlugs: intelSlugs })

  // 4) writeEditCheck — Sonnet draft + editor + voice gate
  const wec = await writeEditCheck({
    intel: {
      intel_id: intel.id as string,
      headline: intel.headline as string,
      raw_text: (intel.raw_text as string | null) ?? null,
      source_name: (intel.source_name as string | null) ?? '',
      source_url: (intel.source_url as string | null) ?? null,
      alert_type: (intel.alert_type as never) ?? null,
      programs: intelSlugs,
    },
    programs: allPrograms,
    recent_samples,
    extra_context,
    alliance_context,
  })
  if (!wec.draft) return { ok: false, error: `writeEditCheck returned no draft for ${intelId}` }

  // 5) Reuse an existing topic (by source_intel_id) so re-runs update rather
  //    than duplicate.
  const { data: existingTopic } = await supabase
    .from('topics')
    .select('id, slug, metadata')
    .eq('metadata->>source_intel_id', intelId)
    .maybeSingle()
  const existingAlertId =
    (existingTopic?.metadata as { original_alert_id?: string } | null)?.original_alert_id ?? null

  // 6) Build payload + persist via writeAlertVariant
  const primaryProgramSlug = wec.draft.primary_program_slug ?? intelSlugs[0]
  const primaryProgramId = primaryProgramSlug
    ? programBySlug.get(primaryProgramSlug)?.id ?? null
    : null
  const allProgramSlugs = Array.from(
    new Set([
      ...(primaryProgramSlug ? [primaryProgramSlug] : []),
      ...((wec.draft.secondary_program_slugs ?? []).filter((s): s is string => typeof s === 'string')),
    ]),
  )
  const slug = existingTopic?.slug ?? `intel-${intelId.slice(0, 8)}-${Date.now()}`

  let alertId: string
  try {
    const result = await writeAlertVariant(supabase, {
      id: existingAlertId ?? undefined,
      slug,
      title: wec.draft.title,
      summary: wec.draft.summary,
      description: wec.draft.description,
      type: (intel.alert_type as never) ?? 'industry_news',
      status: 'pending_review',
      action_type: wec.draft.action_type ?? null,
      end_date: wec.draft.end_date ?? null,
      source: (intel.source_name as string | null) ?? null,
      source_url: (intel.source_url as string | null) ?? null,
      source_intel_id: intelId,
      confidence_level: (intel.confidence as string | null) ?? 'medium',
      impact_score: 5,
      impact_justification: 'Auto-drafted from intel',
      value_score: 5,
      rarity_score: 5,
      primary_program_id: primaryProgramId,
      program_slugs: allProgramSlugs,
      voice_pass: wec.voice?.passed ?? null,
      voice_score: wec.voice?.score ?? null,
    })
    alertId = result.alert_id
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).slice(0, 1000)
    try {
      await supabase.from('intel_ingest_errors').insert({
        source: 'auto-draft',
        stage: 'insert',
        payload: { intel_id: intelId, primary_program_id: primaryProgramId },
        error_message: msg,
      })
    } catch {}
    return { ok: false, error: msg }
  }

  // 7) Mark intel processed + linked
  await supabase.from('intel_items').update({ processed: true, alert_id: alertId }).eq('id', intelId)
  return { ok: true, alertId }
}

/**
 * Auto-draft AI-'approved' intel that was never manually written up.
 *
 * The triage sweep honours 'rejected' / 'expired' / 'newsletter_idea' but had
 * no path for 'approved', so approved items sat at processed=false forever
 * (only the manual "write alert" button drafted them). This drafts them into
 * pending_review so they flow into the morning drafts table.
 *
 * Capped per run to bound Sonnet cost + drafts-queue volume; remaining items
 * roll to the next run. Expired approved items are intentionally skipped here
 * and left for the sweep's expired-archive step. Idempotent.
 */
export async function draftApprovedIntel(
  supabase: SupabaseClient,
  opts: { cap?: number } = {},
): Promise<{ drafted: number; errors: number; attempted: number }> {
  const cap = opts.cap ?? 5
  const nowIso = new Date().toISOString()
  const { data: candidates } = await supabase
    .from('intel_items')
    .select('id')
    .eq('processed', false)
    .is('rejected_at', null)
    .is('archived_at', null)
    .is('alert_id', null)
    .eq('triage_decision', 'approved')
    .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
    .order('created_at', { ascending: false })
    .limit(cap)

  const rows = candidates ?? []
  let drafted = 0
  let errors = 0
  for (const r of rows) {
    const res = await draftAlertFromIntel(supabase, r.id as string)
    if (res.ok) drafted++
    else errors++
  }
  return { drafted, errors, attempted: rows.length }
}
