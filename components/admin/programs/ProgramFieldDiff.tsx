/**
 * Per-field diff view + Apply/Skip controls for program extraction.
 *
 * Renders a card showing:
 *   - Current value (what's live on the program page today)
 *   - Extracted value (what Sonnet returned, with source quote + confidence)
 *   - Apply button (overwrites current with extracted)
 *   - Skip button (marks as reviewed, current stays)
 *   - Status badge if already applied / skipped from a prior session
 *
 * Apply is destructive (overwrites manually-authored content), so the snapshot
 * to program_field_history happens server-side BEFORE the UPDATE.
 */

import ExtractionActionButton from '@/components/admin/cards/ExtractionActionButton'

type ExtractedField =
  | { value: unknown; source_quote?: string | null; confidence?: string }
  | { rows: unknown[]; source_quote?: string | null; confidence?: string }
  | null
  | undefined

// Fields where merging makes sense (long-form editorial text).
// Must match MERGEABLE_FIELDS in utils/programs/mergeExtractedField.ts
const MERGEABLE_FIELDS = new Set(['intro', 'sweet_spots', 'lounge_access', 'quirks', 'award_chart'])

export default function ProgramFieldDiff({
  field,
  label,
  description,
  programSlug,
  extractionId,
  currentValue,
  extractedField,
  appliedStatus,
  mergedValue,
  mergedSource,
  verification,
  applyAction,
  skipAction,
  mergeAction,
  verifyAction,
}: {
  field: string
  label: string
  description: string
  programSlug: string
  extractionId: string
  currentValue: unknown
  extractedField: unknown
  appliedStatus: string | null
  mergedValue: string | null
  mergedSource?: string | null
  verification?: {
    verdict: 'confirmed' | 'corrected' | 'unverifiable'
    discrepancies: Array<{
      claim: string
      current_says: string
      extracted_says: string
      source_says: string
      resolution: string
    }>
    corrected_value: string
    notes: string
    generated_at: string
  } | null
  applyAction: (formData: FormData) => Promise<void>
  skipAction: (formData: FormData) => Promise<void>
  mergeAction: (formData: FormData) => Promise<void>
  verifyAction: (formData: FormData) => Promise<void>
}) {
  const extracted = extractedField as ExtractedField
  // Pull extracted value — tier_benefits uses rows[], everything else uses value
  const extractedValue =
    extracted && 'rows' in extracted
      ? extracted.rows
      : extracted && 'value' in extracted
      ? extracted.value
      : null
  const sourceQuote = extracted?.source_quote ?? null
  const confidence = extracted?.confidence ?? null

  // Skip rendering if extraction has no data AND current is empty too
  const hasExtractedContent = extractedValue != null && (Array.isArray(extractedValue) ? extractedValue.length > 0 : true)
  const hasCurrentContent = currentValue != null && (Array.isArray(currentValue) ? currentValue.length > 0 : currentValue !== '')

  if (!hasExtractedContent && !hasCurrentContent) {
    return null  // Both empty - nothing to review
  }

  // Status badge
  let statusBadge: React.ReactNode = null
  if (appliedStatus === 'applied') {
    statusBadge = <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-ui text-[10px] uppercase tracking-wide text-emerald-800">✓ Applied</span>
  } else if (appliedStatus === 'skipped') {
    statusBadge = <span className="rounded-full bg-gray-100 px-2 py-0.5 font-ui text-[10px] uppercase tracking-wide text-gray-700">⏭ Skipped</span>
  }

  // Determine if there's a meaningful diff worth showing
  const sameValue = JSON.stringify(currentValue ?? null) === JSON.stringify(extractedValue ?? null)

  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-white p-4">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-[var(--color-primary)]">{label}</h3>
          <p className="font-body text-xs text-[var(--color-text-secondary)]">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge}
          {confidence ? (
            <span className="font-ui text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)]">
              [{confidence}]
            </span>
          ) : null}
        </div>
      </header>

      {sameValue && hasCurrentContent ? (
        <p className="mb-3 rounded-[var(--radius-ui)] border border-emerald-200 bg-emerald-50/50 p-2 font-body text-xs text-emerald-800">
          ✓ Extracted value matches current — no change needed.
        </p>
      ) : null}

      <div className={`grid gap-3 ${mergedValue ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {/* Current value */}
        <div>
          <p className="mb-1 font-ui text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)]">
            Current (live on site)
          </p>
          <div className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-2 font-body text-sm">
            {renderValue(currentValue)}
          </div>
        </div>

        {/* Extracted value */}
        <div>
          <p className="mb-1 font-ui text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)]">
            Extracted (from {sourceQuote ? 'source page' : 'editor synthesis'})
          </p>
          <div className={`rounded-[var(--radius-ui)] border p-2 font-body text-sm ${hasExtractedContent ? 'border-[var(--color-primary)] bg-white' : 'border-[var(--color-border-soft)] bg-[var(--color-background-soft)] italic text-[var(--color-text-secondary)]'}`}>
            {renderValue(extractedValue)}
          </div>
        </div>

        {/* Merged value (only shown when present) */}
        {mergedValue ? (
          <div>
            <p className="mb-1 font-ui text-[10px] uppercase tracking-wide text-emerald-700">
              {mergedSource === 'manual_edit'
                ? '📝 Manual override (Claude-verified text)'
                : '✨ Merged (current voice + extracted facts)'}
            </p>
            <div className="rounded-[var(--radius-ui)] border-2 border-emerald-400 bg-emerald-50/30 p-2 font-body text-sm">
              {renderValue(mergedValue)}
            </div>
          </div>
        ) : null}
      </div>

      {sourceQuote ? (
        <p className="mt-2 border-l-2 border-[var(--color-border-soft)] pl-2 font-body text-xs italic text-[var(--color-text-secondary)]">
          Source: &ldquo;{sourceQuote}&rdquo;
        </p>
      ) : null}

      {/* Verification result */}
      {verification ? (
        <div className="mt-3 rounded-[var(--radius-ui)] border-2 border-blue-300 bg-blue-50/40 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-ui text-[11px] font-bold uppercase tracking-wide text-blue-900">
              🔍 Verification — verdict:{' '}
              <span
                className={
                  verification.verdict === 'corrected'
                    ? 'text-amber-700'
                    : verification.verdict === 'confirmed'
                      ? 'text-emerald-700'
                      : 'text-gray-700'
                }
              >
                {verification.verdict}
              </span>
            </p>
            <p className="font-ui text-[10px] text-[var(--color-text-secondary)]">
              {new Date(verification.generated_at).toLocaleString()}
            </p>
          </div>
          {verification.notes ? (
            <p className="mb-2 font-body text-xs text-blue-900">{verification.notes}</p>
          ) : null}
          {verification.discrepancies.length > 0 ? (
            <details className="mb-2">
              <summary className="cursor-pointer font-ui text-[11px] font-semibold uppercase tracking-wide text-blue-900">
                {verification.discrepancies.length} discrepancy resolution{verification.discrepancies.length === 1 ? '' : 's'}
              </summary>
              <ul className="mt-1 space-y-2">
                {verification.discrepancies.map((d, i) => (
                  <li key={i} className="rounded-[var(--radius-ui)] border border-blue-200 bg-white p-2 font-body text-xs">
                    <p className="font-semibold text-blue-900">{d.claim}</p>
                    <p className="mt-1 text-[var(--color-text-secondary)]"><strong>Current:</strong> {d.current_says || '(silent)'}</p>
                    <p className="text-[var(--color-text-secondary)]"><strong>Extracted:</strong> {d.extracted_says || '(silent)'}</p>
                    <p className="text-[var(--color-text-secondary)]"><strong>Source:</strong> {d.source_says || '(silent)'}</p>
                    <p className="mt-1 text-blue-800"><strong>Resolution:</strong> {d.resolution}</p>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
          <details>
            <summary className="cursor-pointer font-ui text-[11px] font-semibold uppercase tracking-wide text-blue-900">
              Final verified version (Apply will use this)
            </summary>
            <div className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded-[var(--radius-ui)] border border-blue-200 bg-white p-2 font-body text-xs">
              {verification.corrected_value}
            </div>
          </details>
        </div>
      ) : null}

      {/* Actions */}
      {hasExtractedContent && !sameValue && appliedStatus !== 'applied' ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Verify & merge against source — text fields with both current + extracted.
              Replaces the standalone Merge button. Verify does the merge AND fact-checks
              against the scraped markdown in one pass. */}
          {MERGEABLE_FIELDS.has(field) && hasCurrentContent && hasExtractedContent ? (
            <form action={verifyAction} className="inline">
              <input type="hidden" name="slug" value={programSlug} />
              <input type="hidden" name="field" value={field} />
              <input type="hidden" name="extraction_id" value={extractionId} />
              <ExtractionActionButton
                variant="secondary"
                label={verification ? '🔍 Re-verify & merge' : '🔍 Verify & merge with source'}
                pendingLabel="Verifying…"
              />
            </form>
          ) : null}

          {/* Apply — priority: VERIFIED > MERGED > EXTRACTED */}
          <form action={applyAction} className="inline">
            <input type="hidden" name="slug" value={programSlug} />
            <input type="hidden" name="field" value={field} />
            <input type="hidden" name="extraction_id" value={extractionId} />
            <input
              type="hidden"
              name="new_value_json"
              value={JSON.stringify(verification?.corrected_value ?? mergedValue ?? extractedValue)}
            />
            <ExtractionActionButton
              variant="secondary"
              label={
                verification
                  ? `Apply verified ${label}`
                  : mergedValue
                    ? `Apply merged ${label}`
                    : `Apply ${label}`
              }
              pendingLabel="Applying…"
            />
          </form>

          {/* Skip */}
          <form action={skipAction} className="inline">
            <input type="hidden" name="slug" value={programSlug} />
            <input type="hidden" name="field" value={field} />
            <input type="hidden" name="extraction_id" value={extractionId} />
            <ExtractionActionButton variant="danger" label="Skip" pendingLabel="Skipping…" />
          </form>
        </div>
      ) : null}
    </article>
  )
}

/**
 * Render any value shape (string, string[], object, null) for display.
 * Long text gets a max-height with scroll; arrays render as a list.
 */
function renderValue(value: unknown): React.ReactNode {
  if (value == null) {
    return <span className="italic text-[var(--color-text-secondary)]">— (empty)</span>
  }
  if (typeof value === 'string') {
    if (value.trim() === '') return <span className="italic text-[var(--color-text-secondary)]">— (empty)</span>
    return (
      <div className="max-h-64 overflow-auto whitespace-pre-wrap">
        {value}
      </div>
    )
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="italic text-[var(--color-text-secondary)]">— (empty)</span>
    // If it's an array of strings (hubs), render as comma-separated
    if (typeof value[0] === 'string') {
      return <div>{(value as string[]).join(', ')}</div>
    }
    // Otherwise it's tier_benefits or similar - render as JSON
    return (
      <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs">
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }
  // Object — render as JSON
  return (
    <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
