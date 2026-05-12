import type { PartnerRedemptionWithPrograms } from '@/utils/supabase/queries'

/**
 * Shared "How to book this →" expandable disclosure for partner_redemption
 * result rows. Surfaces the fields the user needs to actually act on the
 * redemption: where to search, what to call it, the routing rules, what
 * breaks the deal, fuel-surcharge / cash-fee context.
 *
 * Used on:
 *   - Best Way to Book result rows
 *   - Don't Sleep sweet-spot cards
 *   - Where Can I Go ready / one-transfer rows
 *   - Should I Transfer top sweet-spot block
 *
 * The component renders only the bullets that have data. A row with no
 * narrative fields populated renders nothing (caller can choose to skip
 * mounting it in that case).
 */
export default function HowToBookDisclosure({
  r,
}: {
  r: Pick<
    PartnerRedemptionWithPrograms,
    | 'booking_channel'
    | 'bookable_online'
    | 'routing_rules'
    | 'non_saver_fallback'
    | 'what_breaks_this'
    | 'fuel_surcharges'
    | 'cash_fee_low'
    | 'cash_fee_high'
    | 'fees_note'
    | 'requires_saver_space'
    | 'availability_reality'
  > & {
    currency_program?: { slug: string; name: string } | null
    operating_carrier?: { slug: string; name: string } | null
  }
}) {
  const hasContent =
    r.booking_channel ||
    r.bookable_online === false ||
    r.routing_rules ||
    r.non_saver_fallback ||
    r.what_breaks_this ||
    r.fuel_surcharges === 'high' ||
    r.cash_fee_high != null ||
    r.requires_saver_space === true

  if (!hasContent) return null

  const sections: Array<{ label: string; body: React.ReactNode }> = []

  // Where to search
  const carrierName = r.operating_carrier?.name
  const currencyName = r.currency_program?.name
  if (carrierName || currencyName || r.booking_channel) {
    sections.push({
      label: 'Where to search',
      body: (
        <>
          {currencyName && (
            <>
              Search on the <strong>{currencyName}</strong> award engine
              {carrierName ? ` for ${carrierName}-operated flights` : ''}.
              {' '}
            </>
          )}
          {r.bookable_online === false && (
            <>
              <strong>Online booking isn&apos;t available</strong> for this
              combo — you&apos;ll need to call.
            </>
          )}
          {r.bookable_online !== false && r.booking_channel === 'phone' && (
            <>This combo books on the phone, not online.</>
          )}
        </>
      ),
    })
  }

  // Routing rules
  if (r.routing_rules) {
    sections.push({
      label: 'Routing rules',
      body: <>{r.routing_rules}</>,
    })
  }

  // Saver requirement / fallback
  if (r.requires_saver_space === true) {
    sections.push({
      label: 'Inventory requirement',
      body: (
        <>
          Needs <strong>saver-class space</strong> on the operating airline.
          If it&apos;s closed, the redemption isn&apos;t bookable at this rate.
          {r.non_saver_fallback ? <> {r.non_saver_fallback}</> : null}
        </>
      ),
    })
  }

  // What breaks this deal
  if (r.what_breaks_this) {
    sections.push({
      label: 'What breaks this deal',
      body: <>{r.what_breaks_this}</>,
    })
  }

  // Fuel surcharges + cash fees
  const cashStr =
    r.cash_fee_low != null && r.cash_fee_high != null && r.cash_fee_low !== r.cash_fee_high
      ? `$${r.cash_fee_low}–${r.cash_fee_high}`
      : r.cash_fee_low != null
        ? `$${r.cash_fee_low}`
        : r.cash_fee_high != null
          ? `$${r.cash_fee_high}`
          : null
  if (r.fuel_surcharges === 'high' || cashStr || r.fees_note) {
    sections.push({
      label: 'Cash co-pay',
      body: (
        <>
          {r.fuel_surcharges === 'high' && (
            <>
              <strong>High fuel surcharges</strong> on this operating carrier.{' '}
            </>
          )}
          {cashStr && <>Expect roughly {cashStr} in cash fees per direction. </>}
          {r.fees_note && <>{r.fees_note}</>}
        </>
      ),
    })
  }

  // Availability reality (translate scores to plain language)
  if (r.availability_reality === 'rare' || r.availability_reality === 'unicorn') {
    sections.push({
      label: 'Reality check',
      body:
        r.availability_reality === 'unicorn' ? (
          <>
            <strong>Don&apos;t count on it.</strong> Space rarely opens; this
            is a fantasy sweet spot more than a bookable one.
          </>
        ) : (
          <>
            <strong>Rare space.</strong> Set an alert. Booking windows are
            short and inventory dries up fast.
          </>
        ),
    })
  } else if (r.availability_reality === 'mixed') {
    sections.push({
      label: 'Reality check',
      body: (
        <>
          Space is mixed. Worth a search; don&apos;t transfer until you see
          live availability.
        </>
      ),
    })
  }

  if (sections.length === 0) return null

  return (
    <details
      style={{
        marginTop: '0.625rem',
        fontFamily: 'var(--font-body)',
        fontSize: '0.8125rem',
        color: 'var(--color-text-primary)',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          padding: '0.4375rem 0.75rem',
          background: 'var(--color-background-soft)',
          border: '1px solid var(--color-border-soft)',
          borderRadius: 'var(--radius-ui)',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: 'var(--color-primary)',
          listStyle: 'none',
        }}
      >
        How to book this →
      </summary>
      <ul
        style={{
          listStyle: 'none',
          margin: '0.5rem 0 0',
          padding: '0.625rem 0.875rem',
          background: '#fff',
          border: '1px solid var(--color-border-soft)',
          borderRadius: 'var(--radius-ui)',
          display: 'grid',
          gap: '0.5rem',
          lineHeight: 1.5,
        }}
      >
        {sections.map((s, i) => (
          <li key={i} style={{ paddingLeft: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-text-secondary)',
                marginBottom: '0.1875rem',
              }}
            >
              {s.label}
            </div>
            <div>{s.body}</div>
          </li>
        ))}
      </ul>
    </details>
  )
}
