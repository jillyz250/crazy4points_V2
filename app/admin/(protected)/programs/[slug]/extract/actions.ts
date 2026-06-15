'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { extractProgramContent } from '@/utils/programs/extractProgramContent'
import { applyProgramField, skipProgramField, isApplyableField } from '@/utils/programs/applyProgramField'
import { mergeExtractedField, isMergeableField } from '@/utils/programs/mergeExtractedField'
import { verifyExtractedField, isVerifiableField } from '@/utils/programs/verifyExtractedField'
import { discoverSourceUrls } from '@/utils/programs/discoverSourceUrls'
import { checkUrl, type UrlCheckResult } from '@/utils/admin/checkUrl'

/**
 * Validate a single URL on demand — backs the inline "Test URL" button on the
 * per-field URL textareas. Lets the editor confirm a URL resolves before
 * clicking Run extraction, so we stop burning Firecrawl + Sonnet on 404s.
 * Ported from cards extract page (PR ported 2026-05-29).
 */
export async function validateUrlAction(formData: FormData): Promise<UrlCheckResult> {
  await assertAdmin()
  const url = String(formData.get('url') ?? '').trim()
  if (!url) {
    return { ok: false, status: 0, reason: 'unreachable' }
  }
  return checkUrl(url)
}

/**
 * Run extraction on a program. Writes to program_extractions cache only —
 * does NOT touch programs.* (per-field approval is editor-driven).
 */
export async function runProgramExtraction(formData: FormData): Promise<void> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '').trim()
  const interactive = formData.get('interactive') === 'on'

  if (!slug) {
    console.error('[program-extract] missing slug')
    return
  }

  // Per-field URLs come in as form fields named "field_url_<fieldname>".
  // Each field's value is a textarea — one URL per line. Trim, filter empties.
  // Store as array (single URL = single-item array; empty = null).
  const fieldSourceUrls: Record<string, string[] | null> = {}
  const fieldNames = ['intro', 'sweet_spots', 'lounge_access', 'quirks', 'award_chart', 'tier_benefits', 'alliance', 'hubs', 'parent_program_slug', 'award_category_chart', 'free_night_certs']
  for (const field of fieldNames) {
    const raw = String(formData.get(`field_url_${field}`) ?? '').trim()
    if (!raw) {
      fieldSourceUrls[field] = null
      continue
    }
    const urls = raw
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
    fieldSourceUrls[field] = urls.length > 0 ? urls : null
  }

  // Legacy "single URL" mode — optional fallback when no per-field URLs
  const legacySourceUrl = String(formData.get('source_url') ?? '').trim() || undefined

  // Manual markdown paste — bypasses Firecrawl entirely. For hostile sites
  // (delta.com, marriott.com) where Firecrawl returns sorry-server.
  const manualMarkdown = String(formData.get('manual_markdown') ?? '').trim() || undefined

  const supabase = createAdminClient()
  const { data: program, error } = await supabase
    .from('programs')
    .select('id, name, slug, type, extraction_source_url, field_source_urls')
    .eq('slug', slug)
    .single()

  if (error || !program) {
    console.error(`[program-extract] program not found: ${slug}`)
    return
  }

  // Persist field URLs + primary URL on the program row so they pre-fill next time.
  const urlUpdate: Record<string, unknown> = {}
  if (legacySourceUrl && legacySourceUrl !== program.extraction_source_url) {
    urlUpdate.extraction_source_url = legacySourceUrl
  }
  // Only store non-null entries in jsonb
  const sourceUrlsToStore = Object.fromEntries(
    Object.entries(fieldSourceUrls).filter(([, v]) => v !== null),
  )
  const existingFieldUrls = (program.field_source_urls as Record<string, string | null> | null) ?? {}
  if (JSON.stringify(sourceUrlsToStore) !== JSON.stringify(existingFieldUrls)) {
    urlUpdate.field_source_urls = sourceUrlsToStore
  }
  if (Object.keys(urlUpdate).length > 0) {
    await supabase.from('programs').update(urlUpdate).eq('id', program.id)
  }

  const result = await extractProgramContent({
    programId: program.id,
    programName: program.name,
    programSlug: program.slug,
    programType: program.type ?? 'airline',
    fieldSourceUrls,
    legacySourceUrl,
    interactive,
    manualMarkdown,
  })

  if (!result.ok) {
    console.error(`[program-extract] failed: ${result.error}`)
    revalidatePath(`/admin/programs/${slug}/extract`)
    return
  }
  console.log(`[program-extract] extraction ${result.extractionId} ready — auto-verifying eligible fields`)

  // ── Auto-verify all eligible text fields in parallel ───────────────────
  // Verify = merge + fact-check against scraped markdown. Saves the editor
  // from clicking Verify per field; results land in the review UI ready
  // for one-click Apply. Skips fields where current OR extracted is empty
  // OR field is structured (tier_benefits, hubs, alliance).
  await autoVerifyAllFields(program.id, result.extractionId, slug)

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Auto-verify every mergeable text field that has both current + extracted
 * content. Runs in parallel after extraction completes so the review UI
 * lands fully reconciled — no per-field Verify clicks needed.
 */
async function autoVerifyAllFields(
  programId: string,
  extractionId: string,
  slug: string,
): Promise<void> {
  const supabase = createAdminClient()

  // Fetch current program values + latest extraction in one go
  const [{ data: programRow }, { data: extractionRow }] = await Promise.all([
    supabase
      .from('programs')
      .select('intro, sweet_spots, lounge_access, quirks, award_chart')
      .eq('id', programId)
      .single(),
    supabase
      .from('program_extractions')
      .select('extraction, raw_markdown')
      .eq('id', extractionId)
      .single(),
  ])

  if (!programRow || !extractionRow) {
    console.warn('[auto-verify] could not fetch program/extraction rows')
    return
  }

  const extraction = (extractionRow.extraction as Record<string, unknown> | null) ?? {}
  const markdown = (extractionRow.raw_markdown as string | null) ?? ''
  if (!markdown) {
    console.warn('[auto-verify] no raw_markdown — skipping verification')
    return
  }

  const MERGEABLE = ['intro', 'sweet_spots', 'lounge_access', 'quirks', 'award_chart'] as const

  // Build the list of fields to verify, but DON'T start the work yet.
  // verifyExtractedField does read-modify-write on the same verifications
  // jsonb column, so parallel firing would race and lose all-but-one result.
  const fieldsToVerify: Array<{ field: string; currentValue: string; extractedValue: string }> = []
  for (const field of MERGEABLE) {
    if (!isVerifiableField(field)) continue
    const currentValue = ((programRow as unknown as Record<string, unknown>)[field] as string | null) ?? ''
    const extractedField = extraction[field] as { value?: string } | null | undefined
    const extractedValue = extractedField?.value ?? ''
    if (!currentValue?.trim() || !extractedValue?.trim()) continue
    fieldsToVerify.push({ field, currentValue, extractedValue })
  }

  if (fieldsToVerify.length === 0) {
    console.log('[auto-verify] no eligible fields')
    return
  }

  console.log(`[auto-verify] verifying ${fieldsToVerify.length} fields sequentially for slug=${slug}`)
  for (const { field, currentValue, extractedValue } of fieldsToVerify) {
    try {
      const r = await verifyExtractedField({
        programId,
        field,
        currentValue,
        extractedValue,
        markdown,
        extractionId,
      })
      if (!r.ok) {
        console.error(`[auto-verify] ${field} failed: ${r.error}`)
      } else {
        console.log(`[auto-verify] ${field} → ${r.verdict}`)
      }
    } catch (err) {
      console.error(`[auto-verify] ${field} threw:`, err)
    }
  }
  console.log(`[auto-verify] complete for slug=${slug}`)
}

/**
 * Apply a single extracted field to the programs row. Snapshots prior to
 * program_field_history first; updates programs.<field>; marks applied on
 * the extraction row.
 */
export async function applyExtractedField(formData: FormData): Promise<void> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const extractionId = String(formData.get('extraction_id') ?? '').trim()
  const newValueRaw = String(formData.get('new_value_json') ?? 'null')

  if (!slug || !extractionId || !isApplyableField(field)) {
    console.error(`[program-extract] invalid apply request: slug=${slug} field=${field}`)
    return
  }

  let newValue: unknown
  try {
    newValue = JSON.parse(newValueRaw)
  } catch (err) {
    console.error(`[program-extract] invalid new_value JSON for field=${field}: ${err}`)
    return
  }

  const supabase = createAdminClient()
  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('slug', slug)
    .single()

  if (!program) {
    console.error(`[program-extract] program not found: ${slug}`)
    return
  }

  const result = await applyProgramField({
    programId: program.id,
    field,
    newValue,
    extractionId,
  })

  if (!result.ok) {
    console.error(`[program-extract] apply failed for ${field}: ${result.error}`)

    // GUARDIAN: when a blank-over-populated apply is refused, surface the
    // outcome on the extraction row so the admin UI can render a clear
    // "🛡️ blocked: would blank existing value" badge instead of leaving the
    // editor wondering why nothing happened.
    if (result.reason === 'blank_guard') {
      const { data: row } = await supabase
        .from('program_extractions')
        .select('applied_fields')
        .eq('id', extractionId)
        .single()
      const applied = ((row?.applied_fields as Record<string, string> | null) ?? {})
      applied[field] = 'guard_blocked'
      await supabase
        .from('program_extractions')
        .update({ applied_fields: applied })
        .eq('id', extractionId)
    }
  }

  // Revalidate both admin extract + public program page
  revalidatePath(`/admin/programs/${slug}/extract`)
  revalidatePath(`/programs/${slug}`)
}

/**
 * Mark a field as skipped on the extraction row. Doesn't touch programs.*.
 */
export async function skipExtractedField(formData: FormData): Promise<void> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const extractionId = String(formData.get('extraction_id') ?? '').trim()

  if (!slug || !extractionId || !isApplyableField(field)) return

  await skipProgramField({ field, extractionId })

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Merge the current and extracted versions of a field using Sonnet.
 * Result is stored in program_extractions.merged_fields[<field>]; Apply
 * uses the merged value when present.
 */
export async function mergeProgramField(formData: FormData): Promise<void> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const extractionId = String(formData.get('extraction_id') ?? '').trim()

  if (!slug || !extractionId || !isMergeableField(field)) {
    console.error(`[program-extract] invalid merge request: slug=${slug} field=${field}`)
    return
  }

  const supabase = createAdminClient()
  // Use any-cast on the select since we're passing a dynamic field name.
  // Safety: isMergeableField() above whitelisted `field` to a known small set.
  const { data: program } = (await supabase
    .from('programs')
    .select(`id, ${field}`)
    .eq('slug', slug)
    .single()) as unknown as { data: Record<string, unknown> | null }

  if (!program) return

  const { data: extraction } = await supabase
    .from('program_extractions')
    .select('extraction')
    .eq('id', extractionId)
    .single()

  if (!extraction) return

  // Current value from programs.<field> — text fields are strings
  const currentValue = program[field] as string | null

  // Extracted value from the extraction jsonb — text fields use { value, source_quote, confidence }
  const extractedField = (extraction.extraction as Record<string, unknown> | null)?.[field]
  const extractedValue = (extractedField as { value?: string } | null)?.value ?? null

  if (!currentValue || !extractedValue) {
    console.error(`[program-extract] merge skipped — current or extracted is empty for ${field}`)
    return
  }

  const result = await mergeExtractedField({
    programId: program.id as string,
    field,
    currentValue,
    extractedValue,
    extractionId,
  })

  if (!result.ok) {
    console.error(`[program-extract] merge failed for ${field}: ${result.error}`)
  }

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Discover candidate source URLs for each extraction field by mapping a
 * starting domain and asking Sonnet to classify the results. Persists to
 * programs.suggested_field_urls so the editor can review and apply.
 */
export async function discoverProgramSourceUrls(formData: FormData): Promise<void> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '').trim()
  const startingUrl = String(formData.get('starting_url') ?? '').trim()

  if (!slug || !startingUrl) {
    console.error(`[program-discover] missing slug or starting URL`)
    return
  }

  const supabase = createAdminClient()
  const { data: program } = await supabase
    .from('programs')
    .select('id, name, type')
    .eq('slug', slug)
    .single()

  if (!program) {
    console.error(`[program-discover] program not found: ${slug}`)
    return
  }

  const result = await discoverSourceUrls({
    programId: program.id,
    programName: program.name,
    programType: program.type ?? 'airline',
    startingUrl,
  })

  if (!result.ok) {
    console.error(`[program-discover] failed: ${result.error}`)
    revalidatePath(`/admin/programs/${slug}/extract`)
    return
  }
  console.log(
    `[program-discover] mapped ${result.total_urls_seen} urls -> ${result.candidates_sent_to_sonnet} candidates -> ${Object.values(result.suggestions).filter((v) => v != null).length} field matches`,
  )

  // Auto-register Scout sources for promo + newsroom URLs Sonnet identified.
  // Upsert on URL — re-running discovery on the same program won't create
  // duplicates. Editor doesn't have to click "+ Register" for these
  // common-case sources.
  const promoSugg = result.suggestions.promo_source
  const newsSugg = result.suggestions.newsroom_source
  const autoRegistered: string[] = []

  if (promoSugg?.urls?.[0]) {
    await upsertScoutSource({
      url: promoSugg.urls[0],
      name: `${program.name} — Current Offers`,
      kind: 'promo',
      slug,
    })
    autoRegistered.push(`promo: ${promoSugg.urls[0]}`)
  }
  if (newsSugg?.urls?.[0]) {
    await upsertScoutSource({
      url: newsSugg.urls[0],
      name: `${program.name} Newsroom`,
      kind: 'newsroom',
      slug,
    })
    autoRegistered.push(`newsroom: ${newsSugg.urls[0]}`)
  }
  if (autoRegistered.length > 0) {
    console.log(`[program-discover] auto-registered Scout sources: ${autoRegistered.join('; ')}`)
  }

  revalidatePath(`/admin/programs/${slug}/extract`)
  revalidatePath('/admin/sources')
}

/**
 * Shared upsert used by both auto-registration (during discovery) and the
 * manual "+ Register as Scout source" button. Idempotent on URL.
 */
async function upsertScoutSource({
  url,
  name,
  kind,
  slug,
}: {
  url: string
  name: string
  kind: 'promo' | 'newsroom'
  slug: string
}): Promise<void> {
  const supabase = createAdminClient()
  const notes =
    kind === 'promo'
      ? `Auto-registered from /admin/programs/${slug}/extract discovery. Time-sensitive promo bonuses; expect frequent additions/expirations.`
      : `Auto-registered from /admin/programs/${slug}/extract discovery. Press releases / official announcements.`

  // Explicit select-then-insert-or-update rather than upsert. Avoids
  // dependency on a unique constraint that may not exist on sources.url,
  // and surfaces any actual insert/update error to the server logs.
  const { data: existing, error: selectErr } = await supabase
    .from('sources')
    .select('id')
    .eq('url', url)
    .maybeSingle()

  if (selectErr) {
    console.error(`[scout-source] select failed for url=${url}: ${selectErr.message}`)
    return
  }

  if (existing) {
    const { error: updateErr } = await supabase
      .from('sources')
      .update({ name, is_active: true, scrape_frequency: 'daily', notes })
      .eq('id', existing.id)
    if (updateErr) {
      console.error(`[scout-source] update failed for id=${existing.id} url=${url}: ${updateErr.message}`)
    } else {
      console.log(`[scout-source] updated existing source id=${existing.id} url=${url}`)
    }
    return
  }

  const { error: insertErr } = await supabase.from('sources').insert({
    name,
    url,
    type: 'official_partner',
    tier: 1,
    is_active: true,
    use_firecrawl: true,
    scrape_frequency: 'daily',
    notes,
  })

  if (insertErr) {
    console.error(`[scout-source] insert failed for url=${url}: ${insertErr.message}`)
  } else {
    console.log(`[scout-source] inserted new source url=${url}`)
  }
}

/**
 * One-click register a Scout source from the discovery panel.
 * Used for time-sensitive content (promos, newsroom) that doesn't belong in
 * the static program page but DOES belong in the alerts pipeline.
 */
export async function registerScoutSource(formData: FormData): Promise<void> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '').trim()
  const url = String(formData.get('url') ?? '').trim()
  const programName = String(formData.get('program_name') ?? '').trim()
  const kind = String(formData.get('kind') ?? '').trim()  // 'promo' | 'newsroom'

  if (!slug || !url || !programName || (kind !== 'promo' && kind !== 'newsroom')) return

  const name = kind === 'promo' ? `${programName} — Current Offers` : `${programName} Newsroom`
  await upsertScoutSource({ url, name, kind, slug })

  revalidatePath(`/admin/programs/${slug}/extract`)
  revalidatePath('/admin/sources')
}

/**
 * Apply discovered URL suggestions to programs.field_source_urls in bulk.
 * Overwrites any existing per-field URLs with the suggestions. Skips fields
 * where the suggestion is null.
 */
export async function applyDiscoveredUrls(formData: FormData): Promise<void> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '').trim()
  if (!slug) return

  const supabase = createAdminClient()
  const { data: program } = await supabase
    .from('programs')
    .select('id, suggested_field_urls')
    .eq('slug', slug)
    .single()

  if (!program) return

  const suggestions =
    (program.suggested_field_urls as Record<string, { urls?: string[] } | null> | null) ?? {}

  // Editorial fields (intro, sweet_spots) are never auto-populated even
  // if discovery accidentally returns them. They stay manual.
  const EDITORIAL_FIELDS = new Set(['intro', 'sweet_spots'])

  const newFieldUrls: Record<string, string[]> = {}
  for (const [field, s] of Object.entries(suggestions)) {
    // Skip metadata keys + Scout-source keys (those go to /admin/sources, not field_source_urls)
    if (['generated_at', 'starting_url', 'total_urls_seen', 'candidates_sent', 'promo_source', 'newsroom_source'].includes(field)) continue
    if (EDITORIAL_FIELDS.has(field)) continue
    if (s && Array.isArray(s.urls) && s.urls.length > 0) {
      newFieldUrls[field] = s.urls
    }
  }

  await supabase
    .from('programs')
    .update({ field_source_urls: newFieldUrls })
    .eq('id', program.id)

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Auto-verify an extracted field against the scraped source markdown.
 * Calls Sonnet with current + extracted + raw markdown; stores a verdict
 * and a corrected final version in program_extractions.verifications[field].
 * Apply picks up corrected_value when present.
 */
export async function verifyProgramField(formData: FormData): Promise<void> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const extractionId = String(formData.get('extraction_id') ?? '').trim()

  if (!slug || !extractionId || !isVerifiableField(field)) {
    console.error(`[program-extract] invalid verify request: slug=${slug} field=${field}`)
    return
  }

  const supabase = createAdminClient()
  const { data: program } = (await supabase
    .from('programs')
    .select(`id, ${field}`)
    .eq('slug', slug)
    .single()) as unknown as { data: Record<string, unknown> | null }

  if (!program) return

  const { data: extraction } = await supabase
    .from('program_extractions')
    .select('extraction, raw_markdown')
    .eq('id', extractionId)
    .single()

  if (!extraction) return

  const currentValue = (program[field] as string | null) ?? ''
  const extractedField = (extraction.extraction as Record<string, unknown> | null)?.[field]
  const extractedValue = (extractedField as { value?: string } | null)?.value ?? ''
  const markdown = (extraction.raw_markdown as string | null) ?? ''

  if (!currentValue || !extractedValue || !markdown) {
    console.error(`[program-extract] verify skipped — missing current/extracted/markdown for ${field}`)
    return
  }

  const result = await verifyExtractedField({
    programId: program.id as string,
    field,
    currentValue,
    extractedValue,
    markdown,
    extractionId,
  })

  if (!result.ok) {
    console.error(`[program-extract] verify failed for ${field}: ${result.error}`)
  }

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Save a manually-edited override for a field. Editor paste-target:
 *   "Copy review prompt" -> Claude reviews + edits/verifies -> paste back here.
 *
 * Writes to program_extractions.merged_fields[field] with source='manual_edit'
 * so the Apply button picks it up the same way it picks up auto-merge results.
 * The original extracted value stays untouched in extraction.<field>.
 *
 * Only allowed for mergeable (text) fields. Structured fields (tier_benefits,
 * hubs, alliance) should be edited via /admin/programs/[slug]/edit instead.
 */
export async function saveManualOverride(formData: FormData): Promise<void> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '').trim()
  const field = String(formData.get('field') ?? '').trim()
  const extractionId = String(formData.get('extraction_id') ?? '').trim()
  const value = String(formData.get('value') ?? '').trim()

  if (!slug || !extractionId || !isMergeableField(field)) {
    console.error(`[program-extract] invalid manual override: slug=${slug} field=${field}`)
    return
  }
  if (!value) {
    console.error(`[program-extract] manual override is empty for ${field}`)
    return
  }

  const supabase = createAdminClient()
  const { data: extractionRow } = await supabase
    .from('program_extractions')
    .select('merged_fields')
    .eq('id', extractionId)
    .single()

  const mergedFields = ((extractionRow?.merged_fields as Record<string, { value: string; generated_at: string; source?: string }> | null) ?? {})
  mergedFields[field] = {
    value,
    generated_at: new Date().toISOString(),
    source: 'manual_edit',
  }

  await supabase
    .from('program_extractions')
    .update({ merged_fields: mergedFields })
    .eq('id', extractionId)

  revalidatePath(`/admin/programs/${slug}/extract`)
}

/**
 * Mark the entire extraction as completed (editor done reviewing).
 */
export async function completeExtraction(formData: FormData): Promise<void> {
  await assertAdmin()
  const slug = String(formData.get('slug') ?? '').trim()
  const extractionId = String(formData.get('extraction_id') ?? '').trim()
  if (!slug || !extractionId) return

  const supabase = createAdminClient()
  await supabase
    .from('program_extractions')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', extractionId)

  revalidatePath(`/admin/programs/${slug}/extract`)
}
