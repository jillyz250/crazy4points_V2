'use client'

import type { AlertGap } from '@/utils/supabase/queries'

const FIELD_LABELS: Record<string, string> = {
  // Standard promo fields
  earning_window:             'Earning window (book-by date)',
  booking_window:             'Booking window',
  travel_window:              'Travel / stay-completion window',
  min_spend:                  'Minimum spend',
  min_nights_or_transactions: 'Minimum nights or transactions',
  status_tier:                'Status tier requirement',
  registration:               'Registration required (yes/no + link)',
  exclusions:                 'Excluded brands / fares / properties',
  // Buy-miles fields
  bonus_tier_structure:       'Bonus tier structure',
  min_purchase:               'Minimum purchase',
  annual_cap:                 'Annual cap',
  sub_period_cap:             '90-day / sub-period cap',
  purchase_window:            'Purchase window',
  posting_timeline:           'Posting timeline (instant / 48–72hr)',
  targeted_vs_public:         'Targeted vs public',
  cpm_math:                   'CPM (label as pre-tax or all-in)',
  refundability:              'Refundability',
  historical_context:         'Historical context (last sale, best ever)',
  payment_routing:            'Payment routing',
  // Common free-form fields seen in practice
  fare_classes:               'Eligible fare classes',
  eligible_fare_classes:      'Eligible fare classes',
}

function labelFor(field: string): string {
  return FIELD_LABELS[field] ?? field.replace(/_/g, ' ')
}

/**
 * Banner that surfaces writer-flagged unknown fields and lets the admin
 * fill any they have data for. Inputs are plain <textarea name="gap__<field>">
 * elements rendered inside the parent <form>. The parent's server action
 * pulls them off FormData. Unfilled gaps stay out of the published article
 * (only-verified-ships rule).
 */
export default function AlertGapsBanner({ gaps }: { gaps: AlertGap[] | null | undefined }) {
  const list = (gaps ?? []).filter((g) => g && typeof g.field === 'string')
  if (list.length === 0) return null

  return (
    <div
      style={{
        marginBottom: '1.25rem',
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: 'var(--radius-ui)',
        padding: '0.75rem 1rem',
        color: '#7a4a0a',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            padding: '0.1rem 0.4rem',
            background: '#7a4a0a',
            color: '#fff',
            borderRadius: '3px',
          }}
        >
          ⚠ writer flagged {list.length} unknown field{list.length === 1 ? '' : 's'}
        </span>
        <span style={{ fontWeight: 500, fontSize: '0.85rem' }}>
          Fill what you can verify. Leave blank to keep out of the published article.
        </span>
      </div>
      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.75rem', fontStyle: 'italic' }}>
        Filled values feed back into the writer on the next regenerate as verified data. Unfilled
        fields are dropped from the published description — only verified data ships.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {list.map((g) => (
          <label key={g.field} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600 }}>
              {labelFor(g.field)}
            </span>
            <textarea
              name={`gap__${g.field}`}
              defaultValue={g.filled ?? ''}
              rows={2}
              placeholder="Paste the verified value, or leave blank to drop"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                padding: '0.4rem 0.5rem',
                border: '1px solid #f59e0b',
                borderRadius: '4px',
                background: '#fff',
                color: '#1A1A1A',
                resize: 'vertical',
              }}
            />
          </label>
        ))}
      </div>
    </div>
  )
}
