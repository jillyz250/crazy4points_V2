/**
 * Manual welcome bonus entry. Surfaced when extraction returned null
 * bonus_amount (issuer hides the points value behind the apply flow —
 * common with Citi product pages).
 *
 * Server-component form — submits to saveManualWelcomeBonus action.
 */

export default function ManualWelcomeBonusForm({
  cardSlug,
  sourceUrl,
  saveAction,
  defaultCurrency,
  defaultSpendUsd,
  defaultWindowMonths,
}: {
  cardSlug: string
  sourceUrl: string | null
  saveAction: (formData: FormData) => Promise<void>
  /** Pre-fill the currency when we know it (e.g., Citi → ThankYou Points). */
  defaultCurrency?: string
  /** Sonnet may have extracted the spend req even when missing the bonus amount. */
  defaultSpendUsd?: number | null
  defaultWindowMonths?: number | null
}) {
  return (
    <section className="mt-6 rounded-[var(--radius-card)] border-l-4 border-l-amber-500 bg-amber-50/40 p-5">
      <h3 className="font-display text-lg font-semibold text-amber-900">
        ⚠ Welcome bonus needs manual entry
      </h3>
      <p className="mt-1 font-body text-sm text-amber-900">
        The extraction didn&rsquo;t find a bonus amount on this page (issuer often hides it behind the apply flow).
        Look up the current public offer (NerdWallet, TPG, Citi&rsquo;s offer comparison page) and enter it here.
      </p>

      <form action={saveAction} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input type="hidden" name="slug" value={cardSlug} />
        <input type="hidden" name="source_url" value={sourceUrl ?? ''} />

        <label className="flex flex-col">
          <span className="mb-1 font-ui text-[10px] uppercase tracking-wide text-amber-900">Bonus amount (points)</span>
          <input
            name="bonus_amount"
            type="number"
            min="0"
            required
            placeholder="60000"
            className="rounded-[var(--radius-ui)] border border-amber-300 bg-white px-3 py-2 font-body text-base"
            style={{ fontSize: '1rem' }}
          />
        </label>

        <label className="flex flex-col">
          <span className="mb-1 font-ui text-[10px] uppercase tracking-wide text-amber-900">Currency</span>
          <input
            name="bonus_currency"
            type="text"
            required
            defaultValue={defaultCurrency ?? ''}
            placeholder="ThankYou Points"
            className="rounded-[var(--radius-ui)] border border-amber-300 bg-white px-3 py-2 font-body text-base"
            style={{ fontSize: '1rem' }}
          />
        </label>

        <label className="flex flex-col">
          <span className="mb-1 font-ui text-[10px] uppercase tracking-wide text-amber-900">Spend required (USD)</span>
          <input
            name="spend_required_usd"
            type="number"
            min="0"
            required
            defaultValue={defaultSpendUsd ?? ''}
            placeholder="4000"
            className="rounded-[var(--radius-ui)] border border-amber-300 bg-white px-3 py-2 font-body text-base"
            style={{ fontSize: '1rem' }}
          />
        </label>

        <label className="flex flex-col">
          <span className="mb-1 font-ui text-[10px] uppercase tracking-wide text-amber-900">Spend window (months)</span>
          <input
            name="spend_window_months"
            type="number"
            min="1"
            required
            defaultValue={defaultWindowMonths ?? ''}
            placeholder="3"
            className="rounded-[var(--radius-ui)] border border-amber-300 bg-white px-3 py-2 font-body text-base"
            style={{ fontSize: '1rem' }}
          />
        </label>

        <label className="flex flex-col">
          <span className="mb-1 font-ui text-[10px] uppercase tracking-wide text-amber-900">
            Baseline (optional)
          </span>
          <input
            name="baseline_bonus_amount"
            type="number"
            min="0"
            placeholder="Same as bonus if no elevation"
            className="rounded-[var(--radius-ui)] border border-amber-300 bg-white px-3 py-2 font-body text-base"
            style={{ fontSize: '1rem' }}
          />
          <span className="mt-1 font-body text-xs text-amber-800">
            The card&rsquo;s standard offer when not elevated. Leave blank if this IS the standard offer.
          </span>
        </label>

        <label className="flex flex-col sm:col-span-2 lg:col-span-3">
          <span className="mb-1 font-ui text-[10px] uppercase tracking-wide text-amber-900">Notes (optional)</span>
          <input
            name="notes"
            type="text"
            placeholder="e.g., 'NerdWallet shows 75K offer through Dec 2026'"
            className="rounded-[var(--radius-ui)] border border-amber-300 bg-white px-3 py-2 font-body text-base"
            style={{ fontSize: '1rem' }}
          />
        </label>

        <div className="sm:col-span-2 lg:col-span-3">
          <button type="submit" className="rg-btn-primary">
            Save welcome bonus
          </button>
        </div>
      </form>
    </section>
  )
}
