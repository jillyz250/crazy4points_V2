import type { CardExtraction } from '@/utils/cards/cardExtractionSchema'
import ExtractionActionButton from './ExtractionActionButton'

type CardFieldVerdict = {
  field: string
  verdict: 'confirmed' | 'corrected' | 'unverifiable'
  extracted_value: string
  source_says: string
  corrected_value: string
  note: string
}

type CardVerification = {
  verdict: 'confirmed' | 'corrected' | 'unverifiable' | 'error'
  notes: string
  field_verdicts: CardFieldVerdict[]
  generated_at?: string
  error?: string
}

/**
 * Server component that renders an extracted card payload in a scannable
 * format with source quotes inline, plus Re-save / Reject action buttons.
 *
 * Now also surfaces auto-verify results (added PR 2 of the cards port):
 * top banner shows overall verdict; expandable section shows per-field
 * verdicts with corrected values where applicable.
 */
export default function ExtractionReview({
  extractionId,
  sourceUrl,
  status,
  extraction,
  verification,
  createdAt,
  savedAt,
  errorMessage,
  resaveAction,
  rejectAction,
}: {
  extractionId: string
  sourceUrl: string
  status: string
  extraction: CardExtraction
  verification?: CardVerification | null
  createdAt: string
  savedAt: string | null
  errorMessage: string | null
  resaveAction: (formData: FormData) => Promise<void>
  rejectAction: (formData: FormData) => Promise<void>
}) {
  const wb = extraction.welcome_bonus

  // savedAt being set means the extraction was already applied to the public
  // card row (auto-applied on first save). The Re-publish button is only
  // useful for pushing a re-extraction over the existing data — it's not
  // required for a first-time extraction.
  const alreadyPublished = !!savedAt && status === 'saved'

  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-white p-5 shadow-[var(--shadow-soft)]">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">
            Latest extraction
          </h2>
          <p className="font-body text-xs text-[var(--color-text-secondary)]">
            Status: <strong>{status}</strong>
            {' · '}Extracted: <strong>{fmtTimestamp(createdAt)}</strong>
            {savedAt ? <> · Saved: <strong>{fmtTimestamp(savedAt)}</strong></> : null}
          </p>
          <p className="mt-0.5 font-body text-xs text-[var(--color-text-secondary)]">
            Source: <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline">{sourceUrl}</a>
          </p>
        </div>
        <div className="flex gap-2">
          <form action={rejectAction}>
            <input type="hidden" name="extraction_id" value={extractionId} />
            <ExtractionActionButton variant="danger" label="Reject extraction" pendingLabel="Rejecting…" />
          </form>
        </div>
      </header>

      {/* Status banner — tells the user exactly where they stand. The
          earlier "Re-apply" button confused users into thinking they had to
          click it on every extraction. They don't — extraction auto-saves
          to the public card row. */}
      {alreadyPublished ? (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[var(--radius-ui)] border border-emerald-200 bg-emerald-50/40 px-3 py-2">
          <p className="font-body text-sm text-emerald-900">
            <strong>✅ Live on the public card page.</strong>{' '}
            <span className="text-emerald-800/80">
              This extraction is already published. The button below only re-pushes
              if you re-extracted and want to overwrite the existing data.
            </span>
          </p>
          <form action={resaveAction}>
            <input type="hidden" name="extraction_id" value={extractionId} />
            <ExtractionActionButton
              variant="ghost"
              label="🔄 Re-publish"
              pendingLabel="Re-publishing…"
            />
          </form>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[var(--radius-ui)] border border-amber-200 bg-amber-50/40 px-3 py-2">
          <p className="font-body text-sm text-amber-900">
            <strong>⚠ Not yet published.</strong>{' '}
            <span className="text-amber-800/80">
              Click below to apply this extraction to the public card page.
            </span>
          </p>
          <form action={resaveAction}>
            <input type="hidden" name="extraction_id" value={extractionId} />
            <ExtractionActionButton
              variant="primary"
              label="✅ Publish to card page"
              pendingLabel="Publishing…"
            />
          </form>
        </div>
      )}

      {/* Save error (if any) */}
      {errorMessage ? (
        <div className="mb-4 rounded-[var(--radius-ui)] border border-red-300 bg-red-50 p-3">
          <p className="font-ui text-xs uppercase tracking-wide text-red-800">Error</p>
          <p className="mt-1 font-body text-sm text-red-900">{errorMessage}</p>
        </div>
      ) : null}

      {/* Auto-verify verdict panel */}
      {verification && verification.verdict ? (
        <VerificationPanel verification={verification} />
      ) : null}

      {/* Warnings */}
      {extraction.extraction_warnings && extraction.extraction_warnings.length > 0 ? (
        <div className="mb-4 rounded-[var(--radius-ui)] border border-amber-200 bg-amber-50 p-3">
          <p className="font-ui text-xs uppercase tracking-wide text-amber-800">Warnings</p>
          <ul className="mt-1 list-disc pl-5 font-body text-sm text-amber-900">
            {extraction.extraction_warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      ) : null}

      {/* Top-level facts */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <FactCard label="Annual fee" value={fmtUsd(extraction.annual_fee_usd?.value)} confidence={extraction.annual_fee_usd?.confidence} quote={extraction.annual_fee_usd?.source_quote} />
        <FactCard label="FX fee" value={extraction.foreign_transaction_fee_pct?.value === 0 ? '0%' : extraction.foreign_transaction_fee_pct?.value != null ? `${extraction.foreign_transaction_fee_pct.value}%` : '—'} confidence={extraction.foreign_transaction_fee_pct?.confidence} quote={extraction.foreign_transaction_fee_pct?.source_quote} />
        <FactCard label="Credit score" value={extraction.credit_score_recommended?.value ?? '—'} confidence={extraction.credit_score_recommended?.confidence} quote={extraction.credit_score_recommended?.source_quote} />
        <FactCard label="Authorized user fee" value={fmtUsd(extraction.authorized_user_fee_usd?.value)} confidence={extraction.authorized_user_fee_usd?.confidence} quote={extraction.authorized_user_fee_usd?.source_quote} extra={extraction.authorized_user_fee_structure?.value} />
        <FactCard label="Referral bonus" value={extraction.referral_bonus_amount?.value != null ? `${extraction.referral_bonus_amount.value.toLocaleString()} ${extraction.referral_bonus_currency?.value ?? ''}` : '—'} confidence={extraction.referral_bonus_amount?.confidence} quote={extraction.referral_bonus_amount?.source_quote} />
        <FactCard label="Referral cap/yr" value={extraction.referral_cap_per_year?.value != null ? extraction.referral_cap_per_year.value.toLocaleString() : '—'} confidence={extraction.referral_cap_per_year?.confidence} />
      </div>

      {/* Intro */}
      {extraction.intro?.value ? (
        <div className="mt-6 rounded-[var(--radius-card)] border-l-4 border-l-[var(--color-primary)] bg-[var(--color-background-soft)] p-4">
          <p className="font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">Editorial intro</p>
          <p className="mt-1 font-body text-base text-[var(--color-text-primary)]">{extraction.intro.value}</p>
        </div>
      ) : null}

      {/* Welcome bonus */}
      <h3 className="mt-6 font-display text-lg font-semibold text-[var(--color-primary)]">Welcome bonus</h3>
      {wb && wb.main && wb.main.bonus_amount ? (
        <div className="mt-2 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] p-4">
          <p className="font-body text-base text-[var(--color-text-primary)]">
            <strong>{wb.main.bonus_amount.toLocaleString()} {wb.main.bonus_currency}</strong>
            {' '}after spending <strong>${wb.main.spend_required_usd?.toLocaleString()}</strong>
            {' '}in <strong>{wb.main.spend_window_months}</strong> months
          </p>
          {wb.is_elevated && wb.baseline_bonus_amount ? (
            <p className="mt-1 font-body text-sm text-[var(--color-accent-hover)]">
              ⬆ <strong>Elevated offer</strong> — baseline is {wb.baseline_bonus_amount.toLocaleString()} {wb.main.bonus_currency}
              {' '}({((wb.main.bonus_amount / wb.baseline_bonus_amount - 1) * 100).toFixed(0)}% above standard)
            </p>
          ) : wb.baseline_bonus_amount && wb.baseline_bonus_amount === wb.main.bonus_amount ? (
            <p className="mt-1 font-body text-xs text-[var(--color-text-secondary)]">
              Standard offer (baseline matches current — no elevation)
            </p>
          ) : null}
          {wb.tiered && wb.tiered.length > 0 ? (
            <ul className="mt-2 list-disc pl-5 font-body text-sm">
              {wb.tiered.map((t, i) => (
                <li key={i}>
                  + <strong>{t.bonus_amount.toLocaleString()}</strong> more after total spend of <strong>${t.spend_usd.toLocaleString()}</strong>
                  {t.timeline_months ? ` in ${t.timeline_months} months` : ''}
                  {t.note ? ` (${t.note})` : ''}
                </li>
              ))}
            </ul>
          ) : null}
          {wb.extras ? <p className="mt-2 font-body text-sm italic text-[var(--color-text-secondary)]">{wb.extras}</p> : null}
          {wb.source_quote ? <SourceQuote quote={wb.source_quote} /> : null}
        </div>
      ) : (
        <p className="mt-2 font-body text-sm text-[var(--color-text-secondary)]">No welcome bonus extracted.</p>
      )}

      {/* Earn rates */}
      <h3 className="mt-6 font-display text-lg font-semibold text-[var(--color-primary)]">
        Earn rates ({extraction.earn_rates?.length ?? 0})
      </h3>
      <div className="mt-2 overflow-x-auto rg-table-scroll">
        <table className="w-full text-left font-body text-sm">
          <thead className="border-b border-[var(--color-border-soft)] font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
            <tr>
              <th className="py-2 pr-3">Category</th>
              <th className="py-2 pr-3">Multiplier</th>
              <th className="py-2 pr-3">Channel</th>
              <th className="py-2 pr-3">Cap</th>
              <th className="py-2 pr-3">Source quote</th>
            </tr>
          </thead>
          <tbody>
            {(extraction.earn_rates ?? []).map((r, i) => (
              <tr key={i} className="border-b border-[var(--color-border-soft)] align-top">
                <td className="py-2 pr-3 font-medium">{formatEarnCategory(r.category)}</td>
                <td className="py-2 pr-3">{r.multiplier}x</td>
                <td className="py-2 pr-3">{r.booking_channel}</td>
                <td className="py-2 pr-3">{r.cap_amount_usd != null ? `$${r.cap_amount_usd.toLocaleString()}/${r.cap_period}` : '—'}</td>
                <td className="py-2 pr-3 italic text-[var(--color-text-secondary)]">{r.source_quote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Benefits */}
      <h3 className="mt-6 font-display text-lg font-semibold text-[var(--color-primary)]">
        Benefits ({extraction.benefits?.length ?? 0})
      </h3>
      <div className="mt-2 grid gap-3">
        {(extraction.benefits ?? []).map((b, i) => {
          const isEstimated = b.metadata && (b.metadata as Record<string, unknown>).value_is_estimated === true
          const valueBasis = b.metadata && (b.metadata as Record<string, unknown>).value_basis as string | undefined
          const fromReview = b.metadata && (b.metadata as Record<string, unknown>).from_review_pass === true
          return (
          <div key={i} className={`rounded-[var(--radius-ui)] border p-3 ${fromReview ? 'border-emerald-300 bg-emerald-50/30' : 'border-[var(--color-border-soft)]'}`}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-body text-base">
                <strong>{b.name}</strong>
                {b.value_amount != null ? (
                  <span className={`ml-2 ${isEstimated ? 'text-amber-700 italic' : 'text-[var(--color-text-secondary)]'}`}>
                    {fmtBenefitValue(b)}
                    {isEstimated ? ' ≈est' : ''}
                  </span>
                ) : null}
                {fromReview ? (
                  <span className="ml-2 font-ui text-[10px] uppercase tracking-wide text-emerald-700">
                    + review pass
                  </span>
                ) : null}
              </p>
              <p className="font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                {b.category} · {b.benefit_type} · {b.confidence}
              </p>
            </div>
            {b.description ? <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">{b.description}</p> : null}
            {isEstimated && valueBasis ? (
              <p className="mt-1 font-body text-xs text-amber-700">
                ⚠ Estimated value — not a guaranteed credit. Basis: &ldquo;{valueBasis}&rdquo;
              </p>
            ) : null}
            <SourceQuote quote={b.source_quote} />
          </div>
        )})}
      </div>
    </section>
  )
}

function FactCard({
  label,
  value,
  confidence,
  quote,
  extra,
}: {
  label: string
  value: string
  confidence?: 'high' | 'medium' | 'low'
  quote?: string | null
  extra?: string | null
}) {
  return (
    <div className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] p-3">
      <p className="font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
        {label}
        {confidence ? <span className="ml-2 normal-case">[{confidence}]</span> : null}
      </p>
      <p className="mt-1 font-body text-base">{value}</p>
      {extra ? <p className="font-body text-sm text-[var(--color-text-secondary)]">{extra}</p> : null}
      {quote ? <SourceQuote quote={quote} /> : null}
    </div>
  )
}

function SourceQuote({ quote }: { quote: string }) {
  return (
    <p className="mt-2 border-l-2 border-[var(--color-border-soft)] pl-2 font-body text-xs italic text-[var(--color-text-secondary)]">
      &ldquo;{quote}&rdquo;
    </p>
  )
}

// Earn rate categories are stored as lowercase slugs ('flights', 'hotels_through_portal',
// 'peloton'). The source quote next to them is title-cased marketing copy from the
// scraped page, which makes the admin display look inconsistent. This formatter
// title-cases the slug for visual parity with the source quote.
const CATEGORY_DISPLAY_OVERRIDES: Record<string, string> = {
  travel_through_portal: 'Travel (via portal)',
  flights_through_portal: 'Flights (via portal)',
  hotels_through_portal: 'Hotels (via portal)',
  ev_charging: 'EV Charging',
  car_rentals_through_portal: 'Car Rentals (via portal)',
  online_grocery: 'Online Grocery',
  wholesale_clubs: 'Wholesale Clubs',
  office_supplies: 'Office Supplies',
  drug_stores: 'Drug Stores',
  internet_phone_tv: 'Internet / Phone / TV',
}

function formatEarnCategory(raw: string): string {
  if (!raw) return '—'
  if (CATEGORY_DISPLAY_OVERRIDES[raw]) return CATEGORY_DISPLAY_OVERRIDES[raw]
  // Default: underscore → space + title-case
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function fmtTimestamp(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

/**
 * Auto-verify panel — Sonnet's reconciliation of the extraction against
 * the scraped issuer page. Top-level verdict banner + collapsible
 * per-field verdict table.
 */
function VerificationPanel({ verification }: { verification: CardVerification }) {
  const verdict = verification.verdict
  const corrections = verification.field_verdicts.filter((v) => v.verdict === 'corrected')
  const unverifiable = verification.field_verdicts.filter((v) => v.verdict === 'unverifiable')
  const confirmed = verification.field_verdicts.filter((v) => v.verdict === 'confirmed')

  const styles = {
    confirmed: {
      bg: 'bg-emerald-50/50 border-emerald-300',
      pill: 'bg-emerald-100 text-emerald-900',
      label: '🟢 Confirmed',
      desc: 'Every field Sonnet checked is supported by the source page. Safe to save as-is.',
    },
    corrected: {
      bg: 'bg-amber-50/50 border-amber-300',
      pill: 'bg-amber-100 text-amber-900',
      label: '🟡 Corrected',
      desc: 'Sonnet found at least one mismatch between the extraction and the source. Review the corrections below before saving.',
    },
    unverifiable: {
      bg: 'bg-gray-50/50 border-gray-300',
      pill: 'bg-gray-100 text-gray-800',
      label: '⚪ Unverifiable',
      desc: 'Source page was too thin to verify most claims. Treat extraction with skepticism — manual review recommended.',
    },
    error: {
      bg: 'bg-red-50/50 border-red-300',
      pill: 'bg-red-100 text-red-900',
      label: '🔴 Verify error',
      desc: 'Auto-verify failed. Extraction was saved but unchecked against the source.',
    },
  }[verdict] ?? {
    bg: 'bg-gray-50 border-gray-300',
    pill: 'bg-gray-100 text-gray-800',
    label: verdict,
    desc: '',
  }

  return (
    <div className={`mb-4 rounded-[var(--radius-card)] border-2 p-3 ${styles.bg}`}>
      <div className="mb-2 flex items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 font-ui text-xs font-semibold uppercase tracking-wide ${styles.pill}`}>
          {styles.label}
        </span>
        <span className="font-ui text-[11px] text-[var(--color-text-secondary)]">
          🔍 Auto-verified against source
          {verification.generated_at ? ` · ${fmtTimestamp(verification.generated_at)}` : ''}
        </span>
      </div>
      {verification.notes ? (
        <p className="mb-2 font-body text-sm">{verification.notes}</p>
      ) : (
        <p className="mb-2 font-body text-sm text-[var(--color-text-secondary)]">{styles.desc}</p>
      )}
      {verification.error ? (
        <p className="mb-2 font-body text-xs text-red-700">{verification.error}</p>
      ) : null}
      {verification.field_verdicts.length > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer font-ui text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-primary)]">
            {confirmed.length} confirmed · {corrections.length} corrected · {unverifiable.length} unverifiable
            {' '}— click for details
          </summary>
          <table className="mt-2 w-full font-body text-xs">
            <thead className="border-b border-[var(--color-border-soft)] font-ui text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)]">
              <tr>
                <th className="py-1 pr-2 text-left">Field</th>
                <th className="py-1 pr-2 text-left">Verdict</th>
                <th className="py-1 pr-2 text-left">Extracted</th>
                <th className="py-1 pr-2 text-left">Source says</th>
                <th className="py-1 pr-2 text-left">Corrected</th>
              </tr>
            </thead>
            <tbody>
              {[...corrections, ...unverifiable, ...confirmed].map((v, i) => (
                <tr key={i} className="border-b border-[var(--color-border-soft)] align-top">
                  <td className="py-1 pr-2 font-mono text-[11px]">{v.field}</td>
                  <td className="py-1 pr-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      v.verdict === 'corrected' ? 'bg-amber-100 text-amber-900'
                      : v.verdict === 'unverifiable' ? 'bg-gray-100 text-gray-700'
                      : 'bg-emerald-100 text-emerald-800'
                    }`}>{v.verdict}</span>
                  </td>
                  <td className="py-1 pr-2 max-w-[12rem]">{v.extracted_value}</td>
                  <td className="py-1 pr-2 max-w-[16rem] italic text-[var(--color-text-secondary)]">{v.source_says}</td>
                  <td className="py-1 pr-2 max-w-[12rem]">{v.corrected_value !== v.extracted_value ? v.corrected_value : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 font-body text-[11px] text-[var(--color-text-secondary)]">
            <strong>Heads up:</strong> Corrections aren&apos;t auto-applied — they&apos;re flagged for editor review.
            Use Re-save (top right) only if the extraction is correct as-is. To apply Sonnet&apos;s corrections,
            edit the card row manually under <code>/admin/cards/[slug]/edit</code> for now (per-field Apply button coming next session).
          </p>
        </details>
      ) : null}
    </div>
  )
}

function fmtUsd(v: number | null | undefined): string {
  if (v == null) return '—'
  return `$${v.toLocaleString()}`
}

function fmtBenefitValue(b: { value_amount: number | null; value_unit: string | null; frequency: string | null }): string {
  if (b.value_amount == null) return ''
  const unit = b.value_unit === 'USD' ? `$${b.value_amount.toLocaleString()}` : `${b.value_amount.toLocaleString()} ${b.value_unit ?? ''}`
  return `${unit}${b.frequency ? `/${b.frequency}` : ''}`
}
