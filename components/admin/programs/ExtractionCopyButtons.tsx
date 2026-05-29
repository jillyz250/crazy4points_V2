'use client'

/**
 * Copy-to-clipboard helpers for the program extract review page.
 *
 * Two buttons:
 *   1. "Copy review prompt" — dumps every pending field as a markdown blob
 *      with Current vs Extracted side-by-side, source quote, confidence,
 *      and source URL. Paste into Claude to get per-field merge/skip/apply
 *      recommendations.
 *
 *   2. "Copy publish review" — dumps the FINAL state per pending field
 *      (merged if exists, otherwise extracted). Paste into Claude as a
 *      last-pass sanity check before clicking Apply on each field.
 *
 * Per-field copy buttons live on each ProgramFieldDiff card.
 */

import { useState } from 'react'

type ExtractedField =
  | { value: unknown; source_quote?: string | null; confidence?: string }
  | { rows: unknown[]; source_quote?: string | null; confidence?: string }
  | null
  | undefined

type FieldSpec = {
  key: string
  label: string
}

const FIELDS: FieldSpec[] = [
  { key: 'intro', label: 'Intro' },
  { key: 'sweet_spots', label: 'Sweet spots' },
  { key: 'lounge_access', label: 'Lounge access' },
  { key: 'tier_benefits', label: 'Tier benefits' },
  { key: 'quirks', label: 'Quirks' },
  { key: 'award_chart', label: 'Award chart' },
  { key: 'alliance', label: 'Alliance' },
  { key: 'hubs', label: 'Hubs' },
  { key: 'parent_program_slug', label: 'Parent program' },
  { key: 'award_category_chart', label: 'Category award chart' },
  { key: 'free_night_certs', label: 'Free Night Certs' },
]

function formatValue(value: unknown): string {
  if (value == null) return '_(empty)_'
  if (typeof value === 'string') {
    return value.trim().length === 0 ? '_(empty)_' : value
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '_(empty)_'
    // String arrays → bullets
    if (value.every((v) => typeof v === 'string')) {
      return value.map((v) => `- ${v}`).join('\n')
    }
    // Object arrays (e.g. tier_benefits.rows) → JSON
    return '```json\n' + JSON.stringify(value, null, 2) + '\n```'
  }
  if (typeof value === 'object') {
    return '```json\n' + JSON.stringify(value, null, 2) + '\n```'
  }
  return String(value)
}

function extractedToValue(field: ExtractedField): unknown {
  if (!field) return null
  if ('rows' in field) return field.rows
  if ('value' in field) return field.value
  return null
}

function urlListFor(
  fieldKey: string,
  fieldSourceUrls: Record<string, string | string[] | null>,
): string[] {
  const v = fieldSourceUrls[fieldKey]
  if (!v) return []
  if (Array.isArray(v)) return v.filter((u) => typeof u === 'string' && u.length > 0)
  if (typeof v === 'string' && v.length > 0) return [v]
  return []
}

function buildReviewMarkdown({
  programName,
  programType,
  programSlug,
  currentValues,
  extraction,
  appliedFields,
  mergedFields,
  fieldSourceUrls,
}: {
  programName: string
  programType: string
  programSlug: string
  currentValues: Record<string, unknown>
  extraction: Record<string, unknown>
  appliedFields: Record<string, string>
  mergedFields: Record<string, { value: string }>
  fieldSourceUrls: Record<string, string | string[] | null>
}): string {
  const lines: string[] = []
  lines.push(`# ${programName} (${programType}) — extraction review`)
  lines.push(`Program: \`/programs/${programSlug}\``)
  lines.push('')
  lines.push(
    'For each field below: tell me **merge**, **skip** (keep current), or **apply as-is** (overwrite with extracted). Watch for: duplicate qualification text, source quotes missing from page, confidence=high without quote, anything that smells off.',
  )
  lines.push('')
  lines.push(
    '**Verification protocol:** For ANY specific claim where current and extracted disagree, or where a count/date/fact looks possibly stale or surprising, include a fenced 🔍 Verify block at the end of that field with this format:',
  )
  lines.push('')
  lines.push('```')
  lines.push('🔍 Verify: <one-sentence question>')
  lines.push('URL(s): <https://… one or more>')
  lines.push('Check: <exactly what to look for on the page>')
  lines.push('```')
  lines.push('')
  lines.push(
    "I'll copy any of those blocks back to you verbatim and you'll run WebFetch / WebSearch to resolve them before I publish. Don't skip flagging just because you're \"mostly sure\" — surface the doubt and let me decide whether to verify.",
  )
  lines.push('')

  let anyPending = false

  for (const f of FIELDS) {
    const status = appliedFields[f.key]
    if (status === 'applied' || status === 'skipped') continue  // already done

    const extractedField = extraction[f.key] as ExtractedField
    const extractedValue = extractedToValue(extractedField)
    const hasExtracted =
      extractedValue != null &&
      (Array.isArray(extractedValue) ? extractedValue.length > 0 : extractedValue !== '')
    if (!hasExtracted) continue  // nothing to review

    anyPending = true
    const currentValue = currentValues[f.key]
    const sourceQuote = extractedField?.source_quote ?? null
    const confidence = extractedField?.confidence ?? null
    const urls = urlListFor(f.key, fieldSourceUrls)
    const mergedValue = mergedFields[f.key]?.value ?? null

    lines.push(`---`)
    lines.push(``)
    lines.push(`## ${f.label} (\`${f.key}\`)`)
    if (mergedValue) {
      lines.push(`_A merged version already exists — see Merged below._`)
    }
    lines.push(``)
    lines.push(`### Current`)
    lines.push(formatValue(currentValue))
    lines.push(``)
    lines.push(`### Extracted`)
    lines.push(formatValue(extractedValue))
    lines.push(``)
    if (mergedValue) {
      lines.push(`### Merged (already generated)`)
      lines.push(formatValue(mergedValue))
      lines.push(``)
    }
    if (sourceQuote) {
      lines.push(`**Source quote:** "${sourceQuote}"`)
    }
    if (confidence) {
      lines.push(`**Confidence:** ${confidence}`)
    }
    if (urls.length > 0) {
      lines.push(`**Source URL(s):**`)
      for (const u of urls) lines.push(`- ${u}`)
    }
    lines.push(``)
  }

  if (!anyPending) {
    lines.push('_All fields with extracted values have already been applied or skipped._')
  }

  return lines.join('\n')
}

function buildPublishMarkdown({
  programName,
  programType,
  programSlug,
  currentValues,
  extraction,
  appliedFields,
  mergedFields,
}: {
  programName: string
  programType: string
  programSlug: string
  currentValues: Record<string, unknown>
  extraction: Record<string, unknown>
  appliedFields: Record<string, string>
  mergedFields: Record<string, { value: string }>
}): string {
  const lines: string[] = []
  lines.push(`# ${programName} (${programType}) — pre-publish state`)
  lines.push(`Program: \`/programs/${programSlug}\``)
  lines.push('')
  lines.push(
    'Final state of each pending field — what WILL be written to the live page. Quick sanity-check pass: is anything still off? Otherwise ship it.',
  )
  lines.push('')

  let anyPending = false

  for (const f of FIELDS) {
    const status = appliedFields[f.key]
    if (status === 'applied' || status === 'skipped') continue

    const extractedField = extraction[f.key] as ExtractedField
    const extractedValue = extractedToValue(extractedField)
    const hasExtracted =
      extractedValue != null &&
      (Array.isArray(extractedValue) ? extractedValue.length > 0 : extractedValue !== '')
    if (!hasExtracted) continue

    anyPending = true

    // Pick final value: merged wins, else extracted
    const mergedValue = mergedFields[f.key]?.value ?? null
    const finalValue: unknown = mergedValue ?? extractedValue
    const source = mergedValue ? 'merged' : 'extracted'

    lines.push(`---`)
    lines.push(``)
    lines.push(`## ${f.label} (\`${f.key}\`) — _${source}_`)
    lines.push(``)
    lines.push(formatValue(finalValue))
    lines.push(``)
  }

  if (!anyPending) {
    lines.push('_Nothing pending — every field is applied or skipped._')
  }

  return lines.join('\n')
}

export default function ExtractionCopyButtons({
  programName,
  programType,
  programSlug,
  currentValues,
  extraction,
  appliedFields,
  mergedFields,
  fieldSourceUrls,
}: {
  programName: string
  programType: string
  programSlug: string
  currentValues: Record<string, unknown>
  extraction: Record<string, unknown>
  appliedFields: Record<string, string>
  mergedFields: Record<string, { value: string }>
  fieldSourceUrls: Record<string, string | string[] | null>
}) {
  const [status, setStatus] = useState<string | null>(null)

  async function copy(kind: 'review' | 'publish') {
    const md =
      kind === 'review'
        ? buildReviewMarkdown({
            programName,
            programType,
            programSlug,
            currentValues,
            extraction,
            appliedFields,
            mergedFields,
            fieldSourceUrls,
          })
        : buildPublishMarkdown({
            programName,
            programType,
            programSlug,
            currentValues,
            extraction,
            appliedFields,
            mergedFields,
          })

    try {
      await navigator.clipboard.writeText(md)
      setStatus(kind === 'review' ? 'Review prompt copied' : 'Publish review copied')
      setTimeout(() => setStatus(null), 2000)
    } catch {
      setStatus('Copy failed — your browser may block clipboard access')
      setTimeout(() => setStatus(null), 3000)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginBottom: '1rem',
        padding: '0.75rem',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-ui)',
        background: 'var(--color-background-soft)',
      }}
    >
      <button
        type="button"
        onClick={() => copy('review')}
        className="rg-btn-secondary"
        style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
      >
        📋 Copy review prompt (fallback)
      </button>
      <button
        type="button"
        onClick={() => copy('publish')}
        className="rg-btn-secondary"
        style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}
      >
        📋 Copy publish review
      </button>
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          color: status ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          minWidth: '10rem',
        }}
      >
        {status ?? 'Normal flow: click Verify & merge on each field below.'}
      </span>
    </div>
  )
}
