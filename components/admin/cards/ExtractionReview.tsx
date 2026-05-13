import type { CardExtraction } from '@/utils/cards/cardExtractionSchema'

/**
 * Server component that renders an extracted card payload in a scannable
 * format with source quotes inline, plus Re-save / Reject action buttons.
 *
 * In auto-approve mode the data is already in the DB; this view exists for
 * audit + manual recovery.
 */
export default function ExtractionReview({
  extractionId,
  sourceUrl,
  status,
  extraction,
  createdAt,
  savedAt,
  resaveAction,
  rejectAction,
}: {
  extractionId: string
  sourceUrl: string
  status: string
  extraction: CardExtraction
  createdAt: string
  savedAt: string | null
  resaveAction: (formData: FormData) => Promise<void>
  rejectAction: (formData: FormData) => Promise<void>
}) {
  const wb = extraction.welcome_bonus

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
          <form action={resaveAction}>
            <input type="hidden" name="extraction_id" value={extractionId} />
            <button type="submit" className="rg-btn-secondary text-xs">Re-save</button>
          </form>
          <form action={rejectAction}>
            <input type="hidden" name="extraction_id" value={extractionId} />
            <button type="submit" className="rounded-[var(--radius-ui)] border border-red-200 px-3 py-2 font-ui text-xs uppercase tracking-wide text-red-600 hover:bg-red-50">
              Reject
            </button>
          </form>
        </div>
      </header>

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
                <td className="py-2 pr-3 font-medium">{r.category}</td>
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
        {(extraction.benefits ?? []).map((b, i) => (
          <div key={i} className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] p-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-body text-base">
                <strong>{b.name}</strong>
                {b.value_amount != null ? <span className="ml-2 text-[var(--color-text-secondary)]">{fmtBenefitValue(b)}</span> : null}
              </p>
              <p className="font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                {b.category} · {b.benefit_type} · {b.confidence}
              </p>
            </div>
            {b.description ? <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">{b.description}</p> : null}
            <SourceQuote quote={b.source_quote} />
          </div>
        ))}
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

function fmtUsd(v: number | null | undefined): string {
  if (v == null) return '—'
  return `$${v.toLocaleString()}`
}

function fmtBenefitValue(b: { value_amount: number | null; value_unit: string | null; frequency: string | null }): string {
  if (b.value_amount == null) return ''
  const unit = b.value_unit === 'USD' ? `$${b.value_amount.toLocaleString()}` : `${b.value_amount.toLocaleString()} ${b.value_unit ?? ''}`
  return `${unit}${b.frequency ? `/${b.frequency}` : ''}`
}
