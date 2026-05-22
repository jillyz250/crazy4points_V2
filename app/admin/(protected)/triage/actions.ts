'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { writeEditCheck } from '@/utils/ai/writeEditCheck'
import { buildExtraContext } from '@/utils/ai/buildExtraContext'
import { loadAllianceContextForPrograms } from '@/utils/supabase/queries'
import type { WriteDraftProgram } from '@/utils/ai/writeAlertDraft'
import { writeAlertVariant } from '@/utils/content/writeAlertVariant'
import { selectAlertViewFromVariants } from '@/utils/content/alertView'

/**
 * Per-item write action — same Sonnet pipeline that used to fire
 * automatically inside /api/build-brief, now triggered manually from
 * /admin/triage on the items the editor actually wants.
 *
 * Wave 3a: writes through writeAlertVariant() (content_variants + topics);
 * variants→alerts trigger mirrors back. Direct writes to alerts are blocked
 * by the G6 trigger.
 *
 * v1 = writeEditCheck only (writer → editor → voice check, ~3 calls).
 * Future buttons (Verify, Revise) handle fact-check + web-verify + revise
 * as separate explicit actions, so cost is visible at each step.
 */
export async function writeAlertFromCandidate(formData: FormData): Promise<void> {
  const intelId = String(formData.get('intel_id') ?? '').trim()
  if (!intelId) return

  const supabase = createAdminClient()

  // 1) Load intel
  const { data: intel, error: intelErr } = await supabase
    .from('intel_items')
    .select('*')
    .eq('id', intelId)
    .single()
  if (intelErr || !intel) {
    console.error(`[triage] intel not found: ${intelId}`, intelErr)
    return
  }

  // 2) Recent published alerts → voice samples for consistency.
  // Wave 2 reads come from content_variants via the AlertView adapter.
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
      alert_type: (intel.type as never) ?? null,
      programs: intelSlugs,
    },
    programs: allPrograms,
    recent_samples,
    extra_context,
    alliance_context,
  })

  if (!wec.draft) {
    console.error(`[triage] writeEditCheck returned no draft for ${intelId}`)
    return
  }

  // 5) Find existing topic by source_intel_id (Wave 3a path) so re-running
  // updates the existing variant rather than creating a duplicate.
  const { data: existingTopic } = await supabase
    .from('topics')
    .select('id, slug, metadata')
    .eq('metadata->>source_intel_id', intelId)
    .maybeSingle()
  const existingAlertId = (existingTopic?.metadata as { original_alert_id?: string } | null)?.original_alert_id ?? null

  // 6) Build write payload + persist via writeAlertVariant
  const primaryProgramSlug = wec.draft.primary_program_slug ?? intelSlugs[0]
  const primaryProgramId = primaryProgramSlug
    ? programBySlug.get(primaryProgramSlug)?.id ?? null
    : null
  const secondaryIds = (wec.draft.secondary_program_slugs ?? [])
    .map((s) => programBySlug.get(s)?.id)
    .filter((x): x is string => typeof x === 'string')
  // program_slugs[] gets the full primary+secondary set
  const allProgramSlugs = Array.from(new Set([
    ...(primaryProgramSlug ? [primaryProgramSlug] : []),
    ...((wec.draft.secondary_program_slugs ?? []).filter((s): s is string => typeof s === 'string')),
  ]))

  const slug = existingTopic?.slug ?? `intel-${intelId.slice(0, 8)}-${Date.now()}`

  let alertId: string
  try {
    const result = await writeAlertVariant(supabase, {
      id: existingAlertId ?? undefined,
      slug,
      title: wec.draft.title,
      summary: wec.draft.summary,
      description: wec.draft.description,
      type: (intel.type as never) ?? 'industry_news',
      status: 'pending_review',
      action_type: wec.draft.action_type ?? null,
      end_date: wec.draft.end_date ?? null,
      source: (intel.source_name as string | null) ?? null,
      source_url: (intel.source_url as string | null) ?? null,
      source_intel_id: intelId,
      confidence_level: (intel.confidence as string | null) ?? 'medium',
      impact_score: 5,
      impact_justification: 'Auto-drafted from Triage write action',
      value_score: 5,
      rarity_score: 5,
      primary_program_id: primaryProgramId,
      program_slugs: allProgramSlugs,
      voice_pass: wec.voice?.passed ?? null,
      voice_score: wec.voice?.score ?? null,
    })
    alertId = result.alert_id
  } catch (err) {
    console.error(`[triage] writeAlertVariant failed for ${intelId}:`, err)
    try {
      await supabase.from('intel_ingest_errors').insert({
        source: 'manual',
        stage: 'insert',
        payload: { intel_id: intelId, secondaryIds, primary_program_id: primaryProgramId },
        error_message: (err instanceof Error ? err.message : String(err)).slice(0, 1000),
      })
    } catch {}
    return
  }

  // 7) Mark intel processed + linked
  await supabase
    .from('intel_items')
    .update({ processed: true, alert_id: alertId })
    .eq('id', intelId)

  revalidatePath('/admin/triage')
  revalidatePath('/admin/alerts')
}

/**
 * Stage a candidate for editing WITHOUT running the Sonnet writer.
 *
 * Creates a skeleton alert in pending_review (title = intel headline,
 * summary = first 300 chars of raw_text, no description) and redirects
 * the editor to /admin/alerts/[id]/edit. From there they can paste
 * verified T&Cs into the verified_terms field and click Regenerate to
 * get a much better first draft with full source context — cheaper
 * (one Sonnet pass instead of two) and more accurate (writer sees the
 * T&Cs the first time).
 *
 * Same data shape as writeAlertFromCandidate, just no Sonnet call.
 */
export async function stageAlertFromCandidate(formData: FormData): Promise<void> {
  const intelId = String(formData.get('intel_id') ?? '').trim()
  if (!intelId) return

  const supabase = createAdminClient()

  const { data: intel, error: intelErr } = await supabase
    .from('intel_items')
    .select('*')
    .eq('id', intelId)
    .single()
  if (intelErr || !intel) {
    console.error(`[triage:stage] intel not found: ${intelId}`, intelErr)
    return
  }

  // Resolve programs (lookup primary id from first program slug)
  const intelSlugs = (intel.programs as string[] | null) ?? []
  const { data: programRows } = await supabase
    .from('programs')
    .select('id, slug')
    .in('slug', intelSlugs.length > 0 ? intelSlugs : ['__none__'])
  const programs = programRows ?? []
  const primaryProgramSlug = intelSlugs[0] ?? null
  const primaryProgramId = primaryProgramSlug
    ? programs.find((p) => p.slug === primaryProgramSlug)?.id ?? null
    : null

  // Reuse intel.alert_id if a skeleton already exists for this intel
  // (e.g. editor clicked Stage twice). findVariantByAlertId via topic
  // metadata.source_intel_id would also catch it; the intel_items.alert_id
  // pointer is the simpler lookup.
  const existingAlertId = (intel.alert_id as string | null) ?? null

  const slug = `intel-${intelId.slice(0, 8)}-${Date.now()}`

  let alertId: string
  try {
    const result = await writeAlertVariant(supabase, {
      id: existingAlertId ?? undefined,
      slug,
      title: intel.headline as string,
      summary: ((intel.raw_text as string | null) ?? (intel.headline as string)).slice(0, 300),
      description: null,
      type: (intel.type as never) ?? 'industry_news',
      status: 'pending_review',
      action_type: 'monitor',
      end_date: (intel.expires_at as string | null) ?? null,
      source: (intel.source_name as string | null) ?? null,
      source_url: (intel.source_url as string | null) ?? null,
      source_intel_id: intelId,
      confidence_level: (intel.confidence as string | null) ?? 'medium',
      impact_score: 5,
      impact_justification: 'Staged from Triage (no draft yet)',
      value_score: 5,
      rarity_score: 5,
      primary_program_id: primaryProgramId,
      program_slugs: intelSlugs,
    })
    alertId = result.alert_id
  } catch (err) {
    console.error(`[triage:stage] writeAlertVariant failed for ${intelId}:`, err)
    try {
      await supabase.from('intel_ingest_errors').insert({
        source: 'manual',
        stage: 'stage',
        payload: { intel_id: intelId, primary_program_id: primaryProgramId },
        error_message: (err instanceof Error ? err.message : String(err)).slice(0, 1000),
      })
    } catch {}
    return
  }

  // Mark intel as processed + linked
  await supabase
    .from('intel_items')
    .update({ processed: true, alert_id: alertId })
    .eq('id', intelId)

  revalidatePath('/admin/triage')
  revalidatePath('/admin/alerts')
  // Send the editor straight to the edit page — they'll paste T&Cs there.
  redirect(`/admin/alerts/${alertId}/edit`)
}

/**
 * Skip a candidate — editor doesn't want it written. Marks intel as
 * processed + rejected so it drops out of the inbox.
 */
const PRESET_REJECT_REASONS = new Set([
  'duplicate',
  'low-signal',
  'wrong-program',
  'off-brand',
  'not-actionable',
])

export async function dismissCandidate(formData: FormData): Promise<void> {
  const intelId = String(formData.get('intel_id') ?? '').trim()
  if (!intelId) return

  // Reason capture: preset value OR "other:<free text>". Anything we don't
  // recognize and isn't an explicit "other:" gets stored verbatim — better
  // than silently dropping editor commentary.
  const rawReason = String(formData.get('rejected_reason') ?? '').trim()
  let rejectedReason: string | null = null
  if (rawReason) {
    if (PRESET_REJECT_REASONS.has(rawReason)) {
      rejectedReason = rawReason
    } else if (rawReason.startsWith('other:')) {
      rejectedReason = rawReason.slice(0, 500)
    } else {
      rejectedReason = `other:${rawReason}`.slice(0, 500)
    }
  }

  const supabase = createAdminClient()
  await supabase
    .from('intel_items')
    .update({
      processed: true,
      rejected_at: new Date().toISOString(),
      rejected_reason: rejectedReason,
    })
    .eq('id', intelId)

  revalidatePath('/admin/triage')
}

/**
 * Snooze an intel item to a future date. Hidden from Active view until
 * snoozed_until passes. Triage-page side: 1d / 3d / 1w preset buttons +
 * custom date input (Phase 1d.4 wires the UI).
 */
export async function snoozeIntel(formData: FormData): Promise<void> {
  const intelId = String(formData.get('intel_id') ?? '').trim()
  const snoozedUntilRaw = String(formData.get('snoozed_until') ?? '').trim()
  if (!intelId || !snoozedUntilRaw) return
  const snoozedUntil = new Date(snoozedUntilRaw)
  if (Number.isNaN(snoozedUntil.getTime())) return

  const supabase = createAdminClient()
  await supabase
    .from('intel_items')
    .update({ snoozed_until: snoozedUntil.toISOString() })
    .eq('id', intelId)

  revalidatePath('/admin/triage')
}

/**
 * Reverse a snooze. Surfaces the item back in Active immediately.
 */
export async function unsnoozeIntel(formData: FormData): Promise<void> {
  const intelId = String(formData.get('intel_id') ?? '').trim()
  if (!intelId) return

  const supabase = createAdminClient()
  await supabase
    .from('intel_items')
    .update({ snoozed_until: null })
    .eq('id', intelId)

  revalidatePath('/admin/triage')
}
