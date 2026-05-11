'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ActiveTransferBonus } from '@/utils/supabase/transferBonusQueries'

function daysBetween(endDateIso: string | null): number | null {
  if (!endDateIso) return null
  const end = new Date(endDateIso).getTime()
  const now = Date.now()
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24))
}

/**
 * One-card view of an active transfer bonus. Includes:
 *  - title, end date / days remaining
 *  - interactive math (user enters source amount, we compute output)
 *  - warnings ("what breaks this deal") from destination's partner_redemptions
 *  - verdict chip based on warning severity
 */
export default function TransferBonusCard({ bonus }: { bonus: ActiveTransferBonus }) {
  const { alert, destinationProgram, warnings } = bonus
  const days = daysBetween(alert.end_date)
  const bonusPct = extractBonusPct(alert.title) ?? 0

  const [sourceAmount, setSourceAmount] = useState<number>(50000)
  const outputMiles = useMemo(() => {
    return Math.floor(sourceAmount * (1 + bonusPct / 100))
  }, [sourceAmount, bonusPct])

  const verdict = computeVerdict(warnings.length, bonusPct, days)

  return (
    <article
      style={{
        padding: '1.25rem',
        background: '#fff',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        display: 'grid',
        gap: '0.875rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1875rem',
            color: 'var(--color-primary)',
            margin: 0,
            lineHeight: 1.25,
            flex: 1,
            minWidth: '14rem',
          }}
        >
          {alert.title}
        </h3>
        <VerdictChip verdict={verdict} />
      </div>

      {/* Anti-speculation per-card reminder — short, red, unmissable */}
      <div
        style={{
          padding: '0.5rem 0.75rem',
          background: '#FEF2F2',
          border: '1px solid #FCA5A5',
          borderRadius: 'var(--radius-ui)',
          fontFamily: 'var(--font-body)',
          fontSize: '0.8125rem',
          color: '#7F1D1D',
          lineHeight: 1.45,
        }}
      >
        <strong>Only if you have a redemption in mind.</strong> Confirm award
        space before you transfer — transfers are one-way.
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary)',
        }}
      >
        {bonusPct > 0 && (
          <span
            style={{
              padding: '0.1875rem 0.5rem',
              background: 'var(--color-background-soft)',
              borderRadius: '999px',
              fontWeight: 600,
            }}
          >
            +{bonusPct}% bonus
          </span>
        )}
        {days != null && days >= 0 && (
          <span
            style={{
              padding: '0.1875rem 0.5rem',
              background: days <= 7 ? '#FECACA' : 'var(--color-background-soft)',
              color: days <= 7 ? '#7F1D1D' : 'var(--color-text-secondary)',
              borderRadius: '999px',
              fontWeight: 600,
            }}
          >
            {days === 0
              ? 'Ends today'
              : days === 1
                ? '1 day left'
                : `${days} days left`}
          </span>
        )}
      </div>

      {alert.summary && (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            color: 'var(--color-text-primary)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {alert.summary}
        </p>
      )}

      {bonusPct > 0 && (
        <div
          style={{
            padding: '0.75rem',
            background: 'var(--color-background-soft)',
            borderRadius: 'var(--radius-ui)',
            display: 'grid',
            gap: '0.5rem',
          }}
        >
          <label
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
            }}
          >
            Run the math
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
            }}
          >
            <span>Transfer</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={sourceAmount}
              onChange={(e) =>
                setSourceAmount(Math.max(0, parseInt(e.target.value || '0', 10)))
              }
              style={{
                width: '7rem',
                padding: '0.375rem 0.5rem',
                fontFamily: 'var(--font-body)',
                fontSize: '1rem',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-ui)',
                background: '#fff',
              }}
            />
            <span style={{ color: 'var(--color-text-secondary)' }}>
              = receive
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.25rem',
                color: 'var(--color-primary)',
                fontWeight: 700,
              }}
            >
              {outputMiles.toLocaleString()}
            </span>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              {destinationProgram?.name ?? 'destination'} miles
            </span>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              margin: 0,
            }}
          >
            That&apos;s a bonus of{' '}
            {(outputMiles - sourceAmount).toLocaleString()} extra miles vs. the
            standard 1:1 transfer.
          </p>
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '0.6875rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#7F1D1D',
              marginBottom: '0.375rem',
            }}
          >
            What breaks this deal
          </div>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gap: '0.375rem',
            }}
          >
            {warnings.map((w, i) => (
              <li
                key={i}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.5,
                  paddingLeft: '1.25rem',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '0.125rem',
                    color: '#DC2626',
                  }}
                >
                  ⚠
                </span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {destinationProgram?.slug && (
        <div style={{ borderTop: '1px solid var(--color-border-soft)', paddingTop: '0.875rem' }}>
          <Link
            href={`/programs/${destinationProgram.slug}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-primary)',
              textDecoration: 'none',
            }}
          >
            See {destinationProgram.name} sweet spots →
          </Link>
        </div>
      )}
    </article>
  )
}

function extractBonusPct(title: string): number | null {
  const m = title.match(/(\d{1,3})%/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  if (isNaN(n) || n < 1 || n > 200) return null
  return n
}

type Verdict = 'worth_it' | 'situational' | 'skip' | 'unknown'

function computeVerdict(
  warningCount: number,
  bonusPct: number,
  daysLeft: number | null,
): Verdict {
  if (bonusPct === 0) return 'unknown'
  // High bonus + no warnings = clear win
  if (bonusPct >= 25 && warningCount === 0) return 'worth_it'
  // Low bonus + heavy warnings = skip
  if (bonusPct < 15 && warningCount >= 2) return 'skip'
  // Medium bonus or some warnings = situational
  if (warningCount >= 1) return 'situational'
  if (bonusPct >= 20) return 'worth_it'
  return 'situational'
}

function VerdictChip({ verdict }: { verdict: Verdict }) {
  const styles: Record<Verdict, { label: string; bg: string; fg: string }> = {
    worth_it: { label: 'Worth it', bg: '#D1FAE5', fg: '#065F46' },
    situational: { label: 'Worth it for some', bg: '#FEF3C7', fg: '#78350F' },
    skip: { label: 'Probably skip', bg: '#FECACA', fg: '#7F1D1D' },
    unknown: { label: 'Check the math', bg: 'var(--color-background-soft)', fg: 'var(--color-text-secondary)' },
  }
  const s = styles[verdict]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.625rem',
        borderRadius: '999px',
        background: s.bg,
        color: s.fg,
        fontFamily: 'var(--font-ui)',
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  )
}
