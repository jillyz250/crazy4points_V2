/**
 * Program extraction pipeline — per-field source URL mode.
 *
 *   1. Read field_source_urls from programs row
 *   2. Group fields by URL (so each unique URL is scraped exactly once)
 *   3. For each group: Firecrawl scrape + focused Sonnet call extracting
 *      ONLY the fields mapped to that URL
 *   4. Merge all per-URL extractions into a single ProgramExtraction
 *   5. Run review pass on the merged result
 *   6. Persist to program_extractions (status='extracted')
 *
 * NO direct writes to programs.* — that's per-field, editor-driven, via
 * the apply action.
 *
 * Legacy fallback: when field_source_urls is empty {} but extraction_source_url
 * is set, use the old "scrape one page, extract everything" mode.
 */

import { createHash } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'
import { jsonrepair } from 'jsonrepair'
import { fetchFirecrawl, fetchFirecrawlInteractive } from '@/utils/ai/firecrawl'
import { logUsage } from '@/utils/ai/logUsage'
import { createAdminClient } from '@/utils/supabase/server'
import {
  PROGRAM_EXTRACTION_SYSTEM_PROMPT,
  buildProgramExtractionUserPrompt,
} from '@/utils/programs/programExtractionPrompt'
import { reviewProgramExtraction } from '@/utils/programs/reviewProgramExtraction'
import { validateProgramExtraction } from '@/utils/programs/validateProgramExtraction'
import { verifySourceUrl } from '@/utils/programs/verifySourceUrl'
import type { ProgramExtraction } from '@/utils/programs/programExtractionSchema'

const MODEL = 'claude-sonnet-4-6'
const PER_URL_MARKDOWN_LIMIT = 40_000

export type ProgramExtractableField =
  | 'intro'
  | 'sweet_spots'
  | 'lounge_access'
  | 'quirks'
  | 'award_chart'
  | 'tier_benefits'
  | 'alliance'
  | 'hubs'
  | 'parent_program_slug'

export const ALL_EXTRACTABLE_FIELDS: ProgramExtractableField[] = [
  'intro',
  'sweet_spots',
  'lounge_access',
  'quirks',
  'award_chart',
  'tier_benefits',
  'alliance',
  'hubs',
  'parent_program_slug',
]

/**
 * Per-field URL configuration. Each field can map to:
 *   - A single string URL (legacy / convenience)
 *   - An array of URLs (multi-source — markdown from all URLs combined,
 *     focused Sonnet call extracts the field from the combined input)
 *   - null or missing key (skip extraction for that field)
 */
export type FieldSourceUrls = Partial<Record<ProgramExtractableField, string | string[] | null>>

export type ProgramExtractionResult =
  | { ok: true; extractionId: string; extraction: ProgramExtraction }
  | { ok: false; error: string }

/**
 * Empty ProgramExtraction template — every field nulled with low confidence.
 * Per-URL extractions overwrite the fields they're responsible for.
 */
function emptyExtraction(): ProgramExtraction {
  const nullField = { value: null, source_quote: null, confidence: 'low' as const }
  return {
    intro: nullField,
    sweet_spots: nullField,
    lounge_access: nullField,
    quirks: nullField,
    award_chart: nullField,
    tier_benefits: { rows: [], source_quote: null, confidence: 'low' },
    alliance: nullField,
    hubs: nullField,
    parent_program_slug: nullField,
    extraction_warnings: [],
  }
}

export async function extractProgramContent({
  programId,
  programName,
  programSlug,
  programType,
  fieldSourceUrls,
  legacySourceUrl,
  interactive = false,
  manualMarkdown,
  skipIfUnchanged = false,
}: {
  programId: string
  programName: string
  programSlug: string
  programType: string
  fieldSourceUrls: FieldSourceUrls
  legacySourceUrl?: string
  interactive?: boolean
  /**
   * Manual markdown paste — bypasses Firecrawl entirely. When provided,
   * the pipeline skips URL verification + pre-scrape and uses this string
   * as raw_markdown for every configured field. Use for sites with hostile
   * bot detection (delta.com, marriott.com, etc.) — editor scrapes via
   * Firecrawl playground (or any other means) and pastes the markdown.
   */
  manualMarkdown?: string
  /**
   * Cron-only: skip Sonnet entirely when the SHA-256 of the combined scraped
   * markdown matches the most-recent extraction's hash for this program.
   * Saves ~$0.20 per refresh on unchanged content. Editor-initiated runs
   * never set this — they always re-verify.
   */
  skipIfUnchanged?: boolean
}): Promise<ProgramExtractionResult> {
  const supabase = createAdminClient()

  // Normalize each field's URL config to an array of URLs (single string
  // becomes a single-item array; null/missing stays empty).
  const fieldToUrls = new Map<ProgramExtractableField, string[]>()
  for (const field of ALL_EXTRACTABLE_FIELDS) {
    const raw = fieldSourceUrls[field]
    if (raw == null) continue
    const list = Array.isArray(raw) ? raw : [raw]
    const cleaned = list
      .map((u) => (typeof u === 'string' ? u.trim() : ''))
      .filter((u) => u.length > 0)
    if (cleaned.length > 0) fieldToUrls.set(field, cleaned)
  }

  // Legacy fallback: if NO per-field URLs configured and a legacySourceUrl
  // is provided, use it for every field (original migration 266 behavior).
  if (fieldToUrls.size === 0 && legacySourceUrl) {
    for (const f of ALL_EXTRACTABLE_FIELDS) fieldToUrls.set(f, [legacySourceUrl])
  }

  // Manual-markdown mode: paste-only, no Firecrawl. Pipeline:
  //   - Skip URL pre-flight + scrape
  //   - Use the paste as the single markdown source for every configured field
  //   - Save raw_markdown = paste (auto-verify will reconcile against the same)
  const hasManualMarkdown = manualMarkdown && manualMarkdown.trim().length > 100
  if (hasManualMarkdown && fieldToUrls.size === 0) {
    // Editor pasted markdown but configured no fields — default to extracting
    // every supported field from the paste.
    for (const f of ALL_EXTRACTABLE_FIELDS) fieldToUrls.set(f, ['manual-paste://'])
  }

  if (fieldToUrls.size === 0) {
    return { ok: false, error: 'No source URLs configured. Assign a URL to at least one field before running extraction.' }
  }

  // Collect all unique URLs across all fields.
  const allUrls = new Set<string>()
  for (const urls of fieldToUrls.values()) urls.forEach((u) => allUrls.add(u))

  // Pre-flight verify every unique URL in parallel.
  // Manual-markdown mode skips verification (pseudo-URL "manual-paste://").
  let verifiedMap = new Map<string, string>()  // original URL → final URL after redirect
  let failedUrls: { url: string; error: string }[] = []
  if (hasManualMarkdown) {
    for (const u of allUrls) verifiedMap.set(u, u)
  } else {
    const verifications = await Promise.all(
      Array.from(allUrls).map(async (u) => ({ url: u, result: await verifySourceUrl(u) })),
    )
    for (const v of verifications) {
      if (v.result.ok) verifiedMap.set(v.url, v.result.finalUrl)
      else failedUrls.push({ url: v.url, error: v.result.error })
    }
  }

  if (verifiedMap.size === 0) {
    await supabase.from('program_extractions').insert({
      program_id: programId,
      source_url: Array.from(allUrls)[0] ?? '',
      raw_markdown: null,
      markdown_chars: 0,
      used_interactive: interactive,
      extraction: {},
      model: MODEL,
      status: 'failed',
      error_message: `All URLs failed pre-flight: ${failedUrls.map((f) => `${f.url}: ${f.error}`).join('; ')}`,
    })
    return { ok: false, error: 'All URLs failed pre-flight verification.' }
  }

  // Domains known to redirect Firecrawl to anti-bot "sorry" pages.
  // For these, automatically use Firecrawl stealth proxy (residential IP +
  // fingerprint randomization). Slower + costs more but actually returns
  // real markdown instead of an error page.
  const HOSTILE_DOMAINS = [
    'delta.com',
    'aa.com',
    'jetblue.com',
    'lufthansa.com',
    'swiss.com',
    'austrian.com',
    'singaporeair.com',
    'cathaypacific.com',
    'qatarairways.com',
    'emirates.com',
  ]
  function isHostile(u: string): boolean {
    try {
      const host = new URL(u).hostname.toLowerCase()
      return HOSTILE_DOMAINS.some((d) => host === d || host.endsWith('.' + d))
    } catch {
      return false
    }
  }

  // Pre-scrape each unique verified URL exactly ONCE — no matter how many
  // fields reference it. Stored in markdownByUrl for per-field combination.
  const markdownByUrl = new Map<string, string>()
  if (hasManualMarkdown) {
    // Manual paste mode: every URL maps to the same pasted markdown.
    // Sonnet extracts each configured field from the same blob.
    for (const u of verifiedMap.keys()) markdownByUrl.set(u, manualMarkdown!.slice(0, PER_URL_MARKDOWN_LIMIT))
    console.log(`[extract] using manual-paste markdown (${manualMarkdown!.length} chars) for ${verifiedMap.size} field-URLs`)
  } else {
    await Promise.all(
      Array.from(verifiedMap.entries()).map(async ([originalUrl, finalUrl]) => {
        const stealth = isHostile(finalUrl)
        const md = interactive
          ? await fetchFirecrawlInteractive(finalUrl, { maxChars: PER_URL_MARKDOWN_LIMIT, stealth })
          : await fetchFirecrawl(finalUrl, { maxChars: PER_URL_MARKDOWN_LIMIT, stealth })
        if (md) markdownByUrl.set(originalUrl, md)
        if (stealth) console.log(`[extract] used stealth proxy for ${finalUrl}`)
      }),
    )
  }

  // Group fields by URL SET (fields with the same set of URLs share a
  // Sonnet call). Group key = sorted comma-joined URLs.
  const groups = new Map<string, { urls: string[]; fields: ProgramExtractableField[] }>()
  for (const [field, urls] of fieldToUrls.entries()) {
    const validUrls = urls.filter((u) => verifiedMap.has(u) && markdownByUrl.has(u))
    if (validUrls.length === 0) continue
    const key = [...validUrls].sort().join('|')
    const existing = groups.get(key)
    if (existing) existing.fields.push(field)
    else groups.set(key, { urls: validUrls, fields: [field] })
  }

  if (groups.size === 0) {
    return { ok: false, error: 'All field URLs failed scrape; nothing to extract.' }
  }

  // Content fingerprint: hash the combined markdown across all scraped URLs
  // (sorted-by-URL so ordering is stable across runs). If it matches the most
  // recent extraction's hash, the page hasn't changed since last refresh —
  // skip Sonnet entirely, save ~$0.20 per program.
  const fingerprintInput = Array.from(markdownByUrl.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([u, md]) => `${u}\n${md}`)
    .join('\n\n')
  const markdownHash = createHash('sha256').update(fingerprintInput).digest('hex')

  if (skipIfUnchanged) {
    const { data: lastExt } = await supabase
      .from('program_extractions')
      .select('id, markdown_hash, extraction')
      .eq('program_id', programId)
      .in('status', ['extracted', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (lastExt?.markdown_hash === markdownHash) {
      const combinedForSkip = Array.from(markdownByUrl.values()).join('\n\n').slice(0, 80_000)
      const primaryUrlForSkip = verifiedMap.values().next().value ?? ''
      const { data: skipRow } = await supabase
        .from('program_extractions')
        .insert({
          program_id: programId,
          source_url: primaryUrlForSkip,
          raw_markdown: combinedForSkip,
          markdown_chars: fingerprintInput.length,
          markdown_hash: markdownHash,
          used_interactive: interactive,
          extraction: lastExt.extraction ?? {},
          model: MODEL,
          status: 'skipped_unchanged',
          error_message: null,
        })
        .select('id')
        .single()
      console.log(`[program-extract] ${programSlug} markdown unchanged (sha=${markdownHash.slice(0, 8)}) — skipped Sonnet`)
      return {
        ok: true,
        extractionId: skipRow?.id ?? '',
        extraction: (lastExt.extraction ?? emptyExtraction()) as ProgramExtraction,
      }
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'ANTHROPIC_API_KEY not set' }
  const client = new Anthropic({ apiKey })

  const merged: ProgramExtraction = emptyExtraction()
  let totalInputTokens = 0
  let totalOutputTokens = 0
  const combinedMarkdownParts: string[] = []
  let primaryUrlForRecord = ''

  // Track skipped fields (URLs failed pre-flight or scrape)
  for (const [field, urls] of fieldToUrls.entries()) {
    const allFailed = urls.every((u) => !markdownByUrl.has(u))
    if (allFailed) {
      const failedDetails = urls
        .map((u) => failedUrls.find((f) => f.url === u)?.error ?? 'no markdown')
        .join('; ')
      merged.extraction_warnings.push(
        `Skipped field "${field}" — all URLs failed: ${failedDetails}`,
      )
    }
  }

  for (const { urls, fields } of groups.values()) {
    // Combine markdown from this group's URLs with section headers
    const groupMarkdown = urls
      .map((u) => {
        const finalUrl = verifiedMap.get(u) ?? u
        return `=== SOURCE: ${finalUrl} ===\n\n${markdownByUrl.get(u) ?? ''}`
      })
      .join('\n\n')

    primaryUrlForRecord = primaryUrlForRecord || (verifiedMap.get(urls[0]) ?? urls[0])
    combinedMarkdownParts.push(`=== GROUP fields(${fields.join(',')}) ===\n${groupMarkdown}`)

    const fieldList = fields.join(', ')
    let response
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: 12000,
        // Prompt caching: system prompt + markdown cached for 5 minutes.
        // verifyExtractedField fires per-field afterward and reads the same
        // markdown from cache at 10% input cost.
        system: [
          {
            type: 'text',
            text: PROGRAM_EXTRACTION_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildProgramExtractionUserPrompt(
                programName,
                programSlug,
                programType,
                urls.join(', '),
                groupMarkdown,
                { extractOnlyFields: fields, fieldList },
              ),
              cache_control: { type: 'ephemeral' },
            },
          ],
        }],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      merged.extraction_warnings.push(`Sonnet failed for group (fields: ${fieldList}): ${message}`)
      continue
    }

    await logUsage(response, 'extract_program_content_per_field', {
      program_id: programId,
      url_count: urls.length,
      fields: fields.join(','),
    })
    totalInputTokens += response.usage?.input_tokens ?? 0
    totalOutputTokens += response.usage?.output_tokens ?? 0

    const textBlock = response.content.find((c) => c.type === 'text')
    if (!textBlock || textBlock.type !== 'text') continue
    const rawText = textBlock.text.trim()

    let parsed: ProgramExtraction
    try {
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
      if (!cleaned.startsWith('{')) {
        merged.extraction_warnings.push(
          `Sonnet returned prose (not JSON) for group (fields: ${fieldList}). First 100 chars: "${cleaned.slice(0, 100)}..."`,
        )
        continue
      }
      try {
        parsed = JSON.parse(cleaned) as ProgramExtraction
      } catch {
        parsed = JSON.parse(jsonrepair(cleaned)) as ProgramExtraction
      }
    } catch (err) {
      merged.extraction_warnings.push(
        `JSON parse failed for group (fields: ${fieldList}): ${err instanceof Error ? err.message : String(err)}`,
      )
      continue
    }

    // Merge ONLY the fields this group was responsible for
    for (const field of fields) {
      const extracted = (parsed as unknown as Record<string, unknown>)[field]
      if (extracted) {
        ;(merged as unknown as Record<string, unknown>)[field] = extracted
      }
    }
    if (parsed.extraction_warnings && parsed.extraction_warnings.length > 0) {
      merged.extraction_warnings.push(...parsed.extraction_warnings.map((w) => `[fields: ${fieldList}]: ${w}`))
    }
  }

  // Review pass on the merged extraction — runs against the COMBINED markdown
  // from all URLs, looking for fields the per-URL passes missed.
  // CRUCIAL: pass skipFields (fields with no source URL) so review doesn't
  // override the editor's "keep manual" intent.
  const skipFields = ALL_EXTRACTABLE_FIELDS.filter((f) => !fieldToUrls.has(f))
  const combinedMarkdown = combinedMarkdownParts.join('\n\n')
  const review = await reviewProgramExtraction({
    programName,
    markdown: combinedMarkdown,
    programId,
    extraction: merged,
    skipFields,
  })

  // Post-extraction validation — catches known Sonnet failure patterns
  // (duplicate tier quals, missing source quotes, hallucinated quotes).
  // Adds warnings; does NOT modify field values.
  const validated = validateProgramExtraction(review.extraction, combinedMarkdown)
  const finalExtraction = validated

  // Persist
  const { data: inserted, error: insertErr } = await supabase
    .from('program_extractions')
    .insert({
      program_id: programId,
      source_url: primaryUrlForRecord,
      raw_markdown: combinedMarkdown.slice(0, 80_000),
      markdown_chars: combinedMarkdown.length,
      markdown_hash: markdownHash,
      used_interactive: interactive,
      extraction: finalExtraction,
      model: MODEL,
      input_tokens: totalInputTokens || null,
      output_tokens: totalOutputTokens || null,
      review_pass_ran: review.ran,
      review_pass_added_count: review.addedFields,
      status: 'extracted',
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    return { ok: false, error: `DB insert failed: ${insertErr?.message ?? 'unknown'}` }
  }

  return { ok: true, extractionId: inserted.id, extraction: finalExtraction }
}

function isExtractableField(s: string): s is ProgramExtractableField {
  return (ALL_EXTRACTABLE_FIELDS as readonly string[]).includes(s)
}
