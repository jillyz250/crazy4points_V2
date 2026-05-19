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
      const { data: inserted, error: insErr } = await supabase
        .from('alerts')
        .insert({ source_intel_id: intelId, ...draftRow })
        .select('id')
        .single()
      if (insErr || !inserted) {
        console.error(`[triage] alert insert failed for ${intelId}:`, insErr)
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
export async function dismissCandidate(formData: FormData): Promise<void> {
  const intelId = String(formData.get('intel_id') ?? '').trim()
  if (!intelId) return

  const supabase = createAdminClient()
  await supabase
    .from('intel_items')
    .update({
      processed: true,
      rejected_at: new Date().toISOString(),
      reject_reason: 'manually skipped from /admin/triage',
    })
    .eq('id', intelId)

  revalidatePath('/admin/triage')
}
