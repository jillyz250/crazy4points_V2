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

export default function ProgramFieldDiff({
  field,
  label,
  description,
  programSlug,
  extractionId,
  currentValue,
  extractedField,
  appliedStatus,
  applyAction,
  skipAction,
}: {
  field: string
  label: string
  description: string
  programSlug: string
  extractionId: string
  currentValue: unknown
  extractedField: unknown
  appliedStatus: string | null
  applyAction: (formData: FormData) => Promise<void>
  skipAction: (formData: FormData) => Promise<void>
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

      <div className="grid gap-3 md:grid-cols-2">
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
      </div>

      {sourceQuote ? (
        <p className="mt-2 border-l-2 border-[var(--color-border-soft)] pl-2 font-body text-xs italic text-[var(--color-text-secondary)]">
          Source: &ldquo;{sourceQuote}&rdquo;
        </p>
      ) : null}

      {/* Actions */}
      {hasExtractedContent && !sameValue && appliedStatus !== 'applied' ? (
        <div className="mt-3 flex gap-2">
          <form action={applyAction} className="inline">
            <input type="hidden" name="slug" value={programSlug} />
            <input type="hidden" name="field" value={field} />
            <input type="hidden" name="extraction_id" value={extractionId} />
            <input type="hidden" name="new_value_json" value={JSON.stringify(extractedValue)} />
            <ExtractionActionButton variant="secondary" label={`Apply ${label}`} pendingLabel="Applying…" />
          </form>
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
