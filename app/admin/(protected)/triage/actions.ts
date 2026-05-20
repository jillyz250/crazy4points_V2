'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/utils/supabase/server'
import { writeEditCheck } from '@/utils/ai/writeEditCheck'
import { buildExtraContext } from '@/utils/ai/buildExtraContext'
import { loadAllianceContextForPrograms, updateAlert, setAlertPrograms } from '@/utils/supabase/queries'
import type { Alert } from '@/utils/supabase/queries'
import type { WriteDraftProgram } from '@/utils/ai/writeAlertDraft'

/**
 * Per-item write action — same Sonnet pipeline that used to fire
 * automatically inside /api/build-brief, now triggered manually from
 * /admin/triage on the items the editor actually wants.
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

  // 2) Recent published alerts → voice samples for consistency
  const { data: voiceRows } = await supabase
    .from('alerts')
    .select('title, summary, description')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(8)
  const recent_samples = (voiceRows ?? []).map((r) => ({
    title: r.title as string,
    summary: (r.summary as string | null) ?? '',
    description: (r.description as string | null) ?? '',
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

  // 5) Persist to alerts (update if pending row exists, else insert)
  let alertId: string | null = null
  {
    const { data: existing } = await supabase
      .from('alerts')
      .select('id')
      .eq('source_intel_id', intelId)
      .maybeSingle()
    const draftRow: Partial<Omit<Alert, 'id' | 'created_at' | 'updated_at'>> = {
      title: wec.draft.title,
      summary: wec.draft.summary,
      description: wec.draft.description,
      action_type: wec.draft.action_type,
      end_date: wec.draft.end_date,
      voice_pass: wec.voice?.passed ?? null,
      voice_score: wec.voice?.score ?? null,
      status: 'pending_review',
    }
    if (existing?.id) {
      alertId = existing.id as string
      await updateAlert(supabase, alertId, draftRow)
    } else {
      // alerts table has several NOT NULL columns the write action used to
      // omit, causing silent insert failures. Match the shape that
      // run-scout/route.ts uses when it stages alerts directly: slug, type,
      // impact/value/rarity scores, impact_justification, source attribution,
      // confidence_level, primary_program_id.
      const slug = `intel-${intelId.slice(0, 8)}-${Date.now()}`
      const primaryProgramSlug = wec.draft.primary_program_slug ?? intelSlugs[0]
      const primaryProgramId = primaryProgramSlug
        ? allPrograms.find((p) => p.slug === primaryProgramSlug)?.id ?? null
        : null
      const insertRow = {
        source_intel_id: intelId,
        slug,
        type: (intel.type as string | null) ?? 'industry_news',
        impact_score: 5,
        value_score: 5,
        rarity_score: 5,
        impact_justification: 'Auto-drafted from Triage write action',
        source: (intel.source_name as string | null) ?? null,
        source_url: (intel.source_url as string | null) ?? null,
        confidence_level: (intel.confidence as string | null) ?? 'medium',
        primary_program_id: primaryProgramId,
        ...draftRow,
      }
      const { data: inserted, error: insErr } = await supabase
        .from('alerts')
        .insert(insertRow)
        .select('id')
        .single()
      if (insErr || !inserted) {
        console.error(`[triage] alert insert failed for ${intelId}:`, insErr)
        // Also log to ingest errors so Jill can see what happened
        try {
          await supabase.from('intel_ingest_errors').insert({
            source: 'manual',
            stage: 'insert',
            payload: { intel_id: intelId, insert_row: insertRow as Record<string, unknown> },
            error_message: (insErr?.message ?? 'no error message').slice(0, 1000),
          })
        } catch {}
        return
      }
      alertId = inserted.id as string
    }
  }

  // 6) Set primary + secondary programs on the junction
  const primaryId = wec.draft.primary_program_slug
    ? programBySlug.get(wec.draft.primary_program_slug)?.id ?? null
    : null
  const secondaryIds = (wec.draft.secondary_program_slugs ?? [])
    .map((s) => programBySlug.get(s)?.id)
    .filter((x): x is string => typeof x === 'string')
  if (primaryId || secondaryIds.length > 0) {
    await setAlertPrograms(supabase, alertId, { primaryId, secondaryIds })
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
