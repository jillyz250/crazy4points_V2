import Link from 'next/link'
import type { TransferPartnerRow } from '@/utils/supabase/queries'

/**
 * Renders the structured transfer_partners JSONB as a clean responsive table.
 * Falls back to slug if the from_slug isn't in the lookup map (e.g. partner
 * exists but program row not seeded).
 */
// Fallback when programNameBySlug lookup fails — converts the slug to
// human-readable title case. Special-cases known multi-part program slugs
// where simple title-casing isn't enough.
const SLUG_OVERRIDES: Record<string, string> = {
  ba_avios: 'British Airways Avios',
  aa: 'American Airlines AAdvantage',
  flying_blue: 'Flying Blue (Air France/KLM)',
  miles_and_more: 'Lufthansa Miles & More',
  air_france: 'Air France',
  ihg_one_rewards: 'IHG One Rewards',
  'ihg-one-rewards': 'IHG One Rewards',
  wyndham_rewards: 'Wyndham Rewards',
  'wyndham-rewards': 'Wyndham Rewards',
  eva_air: 'EVA Air',
  ana: 'ANA Mileage Club',
  jal: 'JAL Mileage Bank',
  tap: 'TAP Miles&Go',
}

function titleCaseSlug(slug: string): string {
  if (SLUG_OVERRIDES[slug]) return SLUG_OVERRIDES[slug]
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Direction controls the first-column label:
 *   - 'inbound' (default): rows describe programs that transfer INTO the
 *     subject — column header is "From".
 *   - 'outbound': rows describe destinations the subject transfers TO —
 *     column header is "To".
 * The underlying TransferPartnerRow shape uses `from_slug` regardless; for
 * outbound rows, the slug is the destination program (legacy field name
 * kept for backward compat — the structural meaning depends on which
 * JSONB column the rows came from).
 */
export default function TransferPartnersTable({
  rows,
  programNameBySlug,
  direction = 'inbound',
}: {
  rows: TransferPartnerRow[]
  programNameBySlug: Map<string, string>
  direction?: 'inbound' | 'outbound'
}) {
  if (rows.length === 0) return null
  const partnerColumnLabel = direction === 'outbound' ? 'To' : 'From'

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <table
        style={{
          width: '100%',
          // 36rem floor (~576px) so the partner-name column never gets squeezed
          // below readable width. On narrower viewports the wrapper scrolls
          // horizontally — much better than the previous behavior where
          // tableLayout:'fixed' + wordBreak:'break-word' split "Chase Ultimate
          // Rewards" character-by-character on mobile.
          minWidth: '36rem',
          tableLayout: 'fixed',
          borderCollapse: 'collapse',
          fontFamily: 'var(--font-body)',
          fontSize: '0.9375rem',
        }}
      >
        <colgroup>
          <col style={{ width: '28%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '54%' }} />
        </colgroup>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
            <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
              {partnerColumnLabel}
            </th>
            <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
              Ratio
            </th>
            <th style={{ textAlign: 'left', padding: '0.625rem 0.75rem', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-secondary)' }}>
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const name = programNameBySlug.get(row.from_slug) ?? titleCaseSlug(row.from_slug)
            return (
              <tr
                key={`${row.from_slug}-${i}`}
                style={{
                  borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--color-border-soft)',
                  background: row.bonus_active ? 'rgba(212, 175, 55, 0.08)' : 'transparent',
                }}
              >
                <td style={{ padding: '0.75rem', fontWeight: 500, verticalAlign: 'top', wordBreak: 'break-word' }}>
                  <Link
                    href={`/programs/${row.from_slug}`}
                    style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}
                  >
                    {name}
                  </Link>
                  {row.bonus_active && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-ui)',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        background: 'var(--color-accent)',
                        color: '#fff',
                        display: 'inline-block',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      BONUS
                    </span>
                  )}
                </td>
                <td style={{ padding: '0.75rem', fontFamily: 'var(--font-ui)', fontWeight: 600, verticalAlign: 'top', wordBreak: 'break-word' }}>
                  {row.ratio}
                </td>
                <td style={{ padding: '0.75rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem', verticalAlign: 'top' }}>
                  {row.notes ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
