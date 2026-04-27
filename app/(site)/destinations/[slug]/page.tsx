import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'

type Weather = Record<string, 'great' | 'good' | 'mixed' | 'poor'>

type Destination = {
  slug: string
  title: string
  country: string | null
  region: string | null
  continent: string | null
  summary_short: string | null
  summary_long: string | null
  vibe: string[] | null
  trip_length: string[] | null
  who_is_going: string[] | null
  weather_by_month: Weather | null
  is_unesco: boolean | null
  image_url: string | null
}

const CONTINENT_LABELS: Record<string, string> = {
  north_america: 'North America', central_america: 'Central America',
  south_america: 'South America', caribbean: 'Caribbean',
  europe: 'Europe', asia: 'Asia', middle_east: 'Middle East',
  africa: 'Africa', south_pacific: 'South Pacific',
}
const VIBE_LABELS: Record<string, string> = {
  beach: 'Beach', city: 'City', history: 'History', nature: 'Nature',
  adventure: 'Adventure', luxury: 'Luxury', family: 'Family',
}
const WHO_LABELS: Record<string, string> = {
  solo: 'Solo', couple: 'Couple', family: 'Family', group: 'Group',
}
const TRIP_LABELS: Record<string, string> = {
  short: 'Short (2–4 days)', medium: 'Medium (5–7 days)', long: 'Long (8+ days)',
}
const MONTH_ORDER = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
const MONTH_SHORT: Record<string, string> = {
  jan:'Jan', feb:'Feb', mar:'Mar', apr:'Apr', may:'May', jun:'Jun',
  jul:'Jul', aug:'Aug', sep:'Sep', oct:'Oct', nov:'Nov', dec:'Dec',
}

async function getDestination(slug: string): Promise<Destination | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('destinations')
    .select('slug, title, country, region, continent, summary_short, summary_long, vibe, trip_length, who_is_going, weather_by_month, is_unesco, image_url')
    .eq('slug', slug)
    .maybeSingle()
  if (error) {
    console.error('[destinations/[slug]] query failed:', error)
    return null
  }
  return data as Destination | null
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const dest = await getDestination(slug)
  if (!dest) return { title: 'Destination not found' }
  return {
    title: `${dest.title} — crazy4points`,
    description: dest.summary_short ?? 'Award travel destination guide.',
  }
}

export default async function DestinationDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const dest = await getDestination(slug)
  if (!dest) notFound()

  const weather = dest.weather_by_month ?? {}
  const greatMonths = MONTH_ORDER.filter(m => weather[m] === 'great')
  const goodMonths  = MONTH_ORDER.filter(m => weather[m] === 'good')
  const continentLabel = dest.continent ? CONTINENT_LABELS[dest.continent] ?? dest.continent : null
  const locationLine = [dest.country, continentLabel].filter(Boolean).join(' · ')

  const paragraphs = (dest.summary_long ?? dest.summary_short ?? '')
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)

  return (
    <>
      <style>{`
        .destination-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 32px;
        }
        @media (min-width: 900px) {
          .destination-grid {
            grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
            gap: 48px;
          }
        }
        .destination-hero {
          width: 100%;
          height: 280px;
          background: linear-gradient(135deg, #6B2D8F 0%, #D4AF37 100%);
          background-size: cover;
          background-position: center;
          border-bottom: 4px solid var(--color-accent);
        }
        @media (min-width: 900px) {
          .destination-hero { height: 420px; }
        }
      `}</style>

      {dest.image_url && (
        <div
          className="destination-hero"
          style={{ backgroundImage: `url(${dest.image_url})` }}
          role="img"
          aria-label={dest.title}
        />
      )}

      {/* Header */}
      <section
        className="rg-sub-section"
        style={{
          background: 'var(--color-background-soft)',
          borderBottom: '1px solid var(--color-border-soft)',
        }}
      >
        <div className="rg-container">
          <nav
            aria-label="Breadcrumb"
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              fontFamily: 'var(--font-ui)', fontSize: '12px',
              marginBottom: '20px',
            }}
          >
            <Link href="/" style={{ color: 'var(--color-text-secondary)' }}>Home</Link>
            <span style={{ color: 'var(--color-border-soft)' }}>/</span>
            <Link href="/decision-engine" style={{ color: 'var(--color-text-secondary)' }}>
              Decision Engine
            </Link>
            <span style={{ color: 'var(--color-border-soft)' }}>/</span>
            <span style={{ color: 'var(--color-primary)' }}>{dest.title}</span>
          </nav>

          <div style={{
            fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--color-accent)', marginBottom: '10px',
          }}>
            Destination
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: 'var(--color-primary)',
            margin: '0 0 8px 0', lineHeight: 1.1,
          }}>
            {dest.title}
          </h1>

          {locationLine && (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '16px', color: 'var(--color-text-secondary)',
              margin: 0,
            }}>
              {locationLine}
              {dest.is_unesco && (
                <span style={{
                  marginLeft: '12px',
                  fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  background: 'var(--color-accent)', color: 'white',
                  padding: '3px 8px', borderRadius: '4px',
                }}>
                  UNESCO
                </span>
              )}
            </p>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="rg-sub-section" style={{ background: 'var(--color-background)' }}>
        <div className="rg-container destination-grid">
          {/* Main column */}
          <div>
            {paragraphs.map((p, i) => (
              <p
                key={i}
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '17px', lineHeight: 1.75,
                  color: 'var(--color-text-primary)',
                  margin: '0 0 20px 0',
                }}
              >
                {p}
              </p>
            ))}

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link href="/decision-engine" className="rg-btn-primary">
                Spin again
              </Link>
              <Link href="/alerts" className="rg-btn-secondary">
                Browse all deals
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {dest.vibe && dest.vibe.length > 0 && (
              <SidebarBlock label="The Vibe">
                <BadgeRow items={dest.vibe.map(v => VIBE_LABELS[v] ?? v)} tone="gold" />
              </SidebarBlock>
            )}

            {dest.who_is_going && dest.who_is_going.length > 0 && (
              <SidebarBlock label="Perfect For">
                <BadgeRow items={dest.who_is_going.map(w => WHO_LABELS[w] ?? w)} tone="purple" />
              </SidebarBlock>
            )}

            {dest.trip_length && dest.trip_length.length > 0 && (
              <SidebarBlock label="Trip Length">
                <BadgeRow items={dest.trip_length.map(t => TRIP_LABELS[t] ?? t)} tone="purple" />
              </SidebarBlock>
            )}

            {(greatMonths.length > 0 || goodMonths.length > 0) && (
              <SidebarBlock label="Best Months">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '4px',
                }}>
                  {MONTH_ORDER.map(m => {
                    const w = weather[m]
                    // Traffic-light colors — match the Decision Engine
                    // grid so the visual language is consistent site-wide.
                    const bg =
                      w === 'great' ? '#2D8B5F' :
                      w === 'good'  ? '#F4C430' :
                      w === 'mixed' ? '#C9C2D4' :
                      w === 'poor'  ? '#D85C50' :
                                      '#EDE6F2'
                    const color =
                      w === 'great' ? 'white' :
                      w === 'good'  ? '#5A4500' :
                      w === 'mixed' ? '#3F3550' :
                      w === 'poor'  ? 'white' :
                                      'var(--color-text-secondary)'
                    return (
                      <div
                        key={m}
                        style={{
                          background: bg, color,
                          fontFamily: 'var(--font-ui)', fontSize: '10px',
                          fontWeight: 700, letterSpacing: '0.06em',
                          textAlign: 'center', padding: '6px 0',
                          borderRadius: '4px', textTransform: 'uppercase',
                        }}
                      >
                        {MONTH_SHORT[m]}
                      </div>
                    )
                  })}
                </div>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: '10px',
                  marginTop: '10px',
                  fontFamily: 'var(--font-body)', fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                }}>
                  {[
                    ['#2D8B5F', 'Ideal'],
                    ['#F4C430', 'Good'],
                    ['#C9C2D4', 'Mixed'],
                    ['#D85C50', 'Avoid'],
                  ].map(([color, label]) => (
                    <span key={label} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                    }}>
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '2px', background: color,
                      }} />
                      {label}
                    </span>
                  ))}
                </div>
              </SidebarBlock>
            )}
          </aside>
        </div>
      </section>
    </>
  )
}

function SidebarBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--color-background-soft)',
      border: '1px solid var(--color-border-soft)',
      borderRadius: 'var(--radius-card)',
      padding: '18px 20px',
    }}>
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: '10px', fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'var(--color-text-secondary)',
        marginBottom: '12px',
      }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function BadgeRow({ items, tone }: { items: string[]; tone: 'gold' | 'purple' }) {
  const bg = tone === 'gold' ? 'var(--color-accent)' : 'var(--color-primary)'
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {items.map(label => (
        <span
          key={label}
          style={{
            background: bg, color: 'white',
            fontFamily: 'var(--font-ui)', fontSize: '11px', fontWeight: 600,
            padding: '4px 10px', borderRadius: '999px',
            letterSpacing: '0.03em',
          }}
        >
          {label}
        </span>
      ))}
    </div>
  )
}
