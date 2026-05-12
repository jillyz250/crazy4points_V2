'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ActiveTransferBonus } from '@/utils/supabase/transferBonusQueries'
import HowToBookDisclosure from '@/components/hub/HowToBookDisclosure'
import { displayCarrierName } from '@/lib/carrierDisplay'

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
  const { alert, destinationProgram, warnings, examples } = bonus
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

      {examples.length > 0 && (() => {
        const top = examples[0]
        const isMarquee = top.is_marquee
        return (
          <div
            style={{
              position: 'relative',
              padding: 0,
              background: isMarquee
                ? 'linear-gradient(155deg, #FFFCF1 0%, #FFFFFF 55%, #FFF7E0 100%)'
                : 'linear-gradient(135deg, #F8F5FB 0%, #FFFFFF 100%)',
              border: isMarquee
                ? '2px solid var(--color-accent)'
                : '1px solid var(--color-border-soft)',
              borderLeft: isMarquee
                ? '2px solid var(--color-accent)'
                : '4px solid var(--color-accent)',
              borderRadius: 'var(--radius-card)',
              boxShadow: isMarquee
                ? '0 8px 24px rgba(212, 175, 55, 0.18), 0 2px 6px rgba(26, 26, 26, 0.06)'
                : 'var(--shadow-soft)',
              overflow: 'hidden',
              display: 'grid',
              gap: 0,
            }}
          >
            {/* Header ribbon — gold fill for marquee, subtle for fallback */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: isMarquee ? '0.5rem 1rem' : '0 1.25rem',
                background: isMarquee
                  ? 'linear-gradient(90deg, var(--color-accent) 0%, #E5C254 100%)'
                  : 'transparent',
                fontFamily: 'var(--font-ui)',
                fontSize: isMarquee ? '0.75rem' : '0.6875rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: isMarquee ? '#3D2A00' : '#92400E',
                marginTop: isMarquee ? 0 : '1rem',
              }}
            >
              <span aria-hidden style={{ fontSize: isMarquee ? '1rem' : '0.875rem' }}>
                {isMarquee ? '★' : '⭐'}
              </span>
              <span>
                {isMarquee ? 'Editor’s pick' : 'Top sweet spot'}
              </span>
              {isMarquee && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '0.625rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    opacity: 0.75,
                  }}
                >
                  the famous one
                </span>
              )}
            </div>

            <div
              style={{
                padding: isMarquee
                  ? '1.25rem 1.25rem 1.125rem'
                  : '0 1.25rem 1rem',
                display: 'grid',
                gap: isMarquee ? '0.75rem' : '0.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: isMarquee ? '1.375rem' : '1.0625rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    lineHeight: 1.2,
                    flex: 1,
                    minWidth: '12rem',
                  }}
                >
                  {top.cabin}
                  {top.operating_carrier
                    ? ` on ${displayCarrierName(top.operating_carrier)}`
                    : ''}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: isMarquee ? '2.5rem' : '1.625rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    gap: '0.3125rem',
                  }}
                >
                  {(() => {
                    // Phase 3.2: prefer chart-computed when available
                    const computed = top.computed_cost
                    let low: number | null
                    let high: number | null
                    if (computed) {
                      if (typeof computed.miles === 'object') {
                        low = computed.miles.low
                        high = computed.miles.high
                      } else {
                        low = computed.miles as number
                        high = null
                      }
                    } else {
                      low = top.cost_miles_low
                      high = top.cost_miles_high
                    }
                    const isRange = low != null && high != null && high > low
                    return (
                      <>
                        {isRange && (
                          <span
                            style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: '0.6875rem',
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: 'var(--color-text-secondary)',
                            }}
                          >
                            From
                          </span>
                        )}
                        <span>{fmtKilo(low ?? high ?? 0)}</span>
                        <span
                          style={{
                            fontFamily: 'var(--font-ui)',
                            fontSize: isMarquee ? '0.75rem' : '0.6875rem',
                            fontWeight: 600,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color: 'var(--color-text-secondary)',
                          }}
                        >
                          miles
                        </span>
                      </>
                    )
                  })()}
                </div>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: isMarquee ? '0.9375rem' : '0.875rem',
                  fontWeight: isMarquee ? 500 : 400,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.4,
                }}
              >
                {top.region_or_route}
              </div>

              {/* Marquee pitch — the "why this one" sentence */}
              {isMarquee && top.marquee_pitch && (
                <div
                  style={{
                    padding: '0.625rem 0.875rem',
                    background: 'rgba(212, 175, 55, 0.12)',
                    borderLeft: '3px solid var(--color-accent)',
                    borderRadius: '0.25rem',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.875rem',
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.5,
                  }}
                >
                  {top.marquee_pitch}
                </div>
              )}

              {top.teach_caption && (
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.8125rem',
                    color: 'var(--color-text-secondary)',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}
                >
                  {top.teach_caption}
                </div>
              )}

              <HowToBookDisclosure
              r={{
                booking_channel: top.booking_channel,
                bookable_online: top.bookable_online,
                routing_rules: top.routing_rules,
                non_saver_fallback: top.non_saver_fallback,
                what_breaks_this: top.what_breaks_this,
                fuel_surcharges: top.fuel_surcharges,
                cash_fee_low: top.cash_fee_low,
                cash_fee_high: top.cash_fee_high,
                fees_note: top.fees_note,
                requires_saver_space: top.requires_saver_space,
                availability_reality: top.availability_reality,
                currency_program: top.currency_program,
                operating_carrier: top.operating_carrier,
              }}
            />
            </div>
          </div>
        )
      })()}

      {destinationProgram?.slug && (
        <div
          style={{
            borderTop: '1px solid var(--color-border-soft)',
            paddingTop: '0.875rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem 1.25rem',
          }}
        >
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
            More on {destinationProgram.name} →
          </Link>
          <Link
            href="/hub/dont-sleep"
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
            More sweet spots →
          </Link>
        </div>
      )}
    </article>
  )
}

function formatMiles(low: number | null, high: number | null): string {
  if (low == null && high == null) return '—'
  if (low != null && high != null && high > low)
    return `${fmtKilo(low)}–${fmtKilo(high)}`
  return fmtKilo((low ?? high) as number)
}

function fmtKilo(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n)
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
