import type { StructuredSweetSpot } from '@/utils/supabase/queries'

/**
 * Structured sweet-spots render for a program page.
 *
 * Source of truth: the `sweet_spots` TABLE. When a program has any active rows
 * (see getStructuredSweetSpots), the program page renders THIS instead of the
 * free-text `programs.sweet_spots` prose. The two can't drift because only one
 * ever shows for a given program (table wins; prose is the migration fallback).
 *
 * Server component — no interactivity, so every card stays in the DOM and is
 * AI/LLM citable. Royal Glow tokens throughout; mobile-safe at 375px (cards
 * stack, meta wraps). Points render as figures in the program's own currency,
 * never a dollar value (house rule: no foreign-currency / cash valuations).
 */

// value_type → short human tag. Unknown/absent types fall through to a
// title-cased version of the raw value so a new type never renders blank.
const VALUE_TYPE_LABEL: Record<string, string> = {
  first_class: 'First class',
  business: 'Business',
  value: 'High value',
  stopover: 'Free stopover',
  lounge: 'Lounge',
}

function typeLabel(t: string | null): string | null {
  if (!t) return null
  if (VALUE_TYPE_LABEL[t]) return VALUE_TYPE_LABEL[t]
  return t.charAt(0).toUpperCase() + t.slice(1).replace(/_/g, ' ')
}

// Compact points figure: 60000 → "60k", 42500 → "42.5k", 900 → "900".
function fmtPoints(n: number): string {
  if (n >= 1000) {
    const k = n / 1000
    return `${Number.isInteger(k) ? k : k.toFixed(1)}k`
  }
  return String(n)
}

export default function SweetSpotsList({ spots }: { spots: StructuredSweetSpot[] }) {
  return (
    <div style={{ display: 'grid', gap: '0.875rem' }}>
      {spots.map((s) => {
        const tag = typeLabel(s.value_type)
        // cabin + route make the one-line context under the title.
        const contextBits = [s.cabin ? s.cabin.charAt(0).toUpperCase() + s.cabin.slice(1) : null, s.route]
          .filter(Boolean)
          .join(' · ')
        return (
          <article
            key={s.id}
            style={{
              padding: '1.125rem',
              background: '#fff',
              border: '1px solid var(--color-border-soft)',
              borderLeft: '4px solid var(--color-primary)',
              borderRadius: 'var(--radius-card)',
              display: 'grid',
              gap: '0.5rem',
            }}
          >
            {/* Title + points figure. Wraps on narrow screens. */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}
            >
              <h4
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.0625rem',
                  color: 'var(--color-primary)',
                  margin: 0,
                  lineHeight: 1.3,
                  flex: 1,
                  minWidth: '12rem',
                }}
              >
                {s.title}
              </h4>
              {s.points != null && (
                <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '0.25rem', whiteSpace: 'nowrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.375rem',
                      fontWeight: 700,
                      color: 'var(--color-primary)',
                    }}
                  >
                    {fmtPoints(s.points)}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.625rem',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    points
                  </span>
                </span>
              )}
            </div>

            {/* Meta row: value-type tag + cabin/route context. */}
            {(tag || contextBits) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {tag && (
                  <span
                    style={{
                      padding: '0.1875rem 0.5rem',
                      borderRadius: '999px',
                      background: 'var(--color-background-soft)',
                      color: 'var(--color-primary)',
                      fontFamily: 'var(--font-ui)',
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {tag}
                  </span>
                )}
                {contextBits && (
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {contextBits}
                  </span>
                )}
              </div>
            )}

            {/* The why-it-shines narrative. */}
            {s.value_angle && (
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-primary)',
                  margin: 0,
                  lineHeight: 1.55,
                }}
              >
                {s.value_angle}
              </p>
            )}

            {/* Optional secondary detail. */}
            {s.detail && (
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {s.detail}
              </p>
            )}

            {/* Official terms link when we have one. */}
            {s.official_source_url && (
              <a
                href={s.official_source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  alignSelf: 'flex-start',
                }}
              >
                Official terms ↗
              </a>
            )}
          </article>
        )
      })}
    </div>
  )
}
