import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardBody } from '@/components/admin/ui/Card'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { isPresaleListing } from '@/lib/experiences/presale'
import { markReviewed, toggleFeatured } from './actions'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  title: string
  category: string | null
  location: string | null
  program_slug: string | null
  source_platform: string | null
  points_required: number | null
  current_bid: number | null
  close_date: string | null
  detail_url: string | null
  image_url: string | null
  first_seen_at: string | null
  featured: boolean
}

// Same "worth an editorial look" rule as the dashboard card: real points
// experiences, dropping boring card-member presales (concerts/shows/games) —
// EXCEPT Marriott Bonvoy Moments, which are real points experiences.
function reviewable(e: Row): boolean {
  return !isPresaleListing(e.category) || e.program_slug === 'marriott-bonvoy'
}

function priceLabel(e: Row): string | null {
  if (e.points_required != null) return `from ${e.points_required.toLocaleString()} pts`
  if (e.current_bid != null) return `bid ${e.current_bid.toLocaleString()} pts`
  return null
}

function seenLabel(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function AdminExperiencesPage() {
  const supabase = createAdminClient()
  const nowIso = new Date().toISOString()
  const expSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const cols =
    'id, title, category, location, program_slug, source_platform, points_required, current_bid, close_date, detail_url, image_url, first_seen_at, featured'

  const [newRes, featuredRes] = await Promise.all([
    // New this week, not yet reviewed — the queue that feeds the dashboard card.
    supabase
      .from('experience_listings')
      .select(cols)
      .eq('status', 'active')
      .is('editorial_reviewed_at', null)
      .gte('first_seen_at', expSince)
      .or(`close_date.is.null,close_date.gte.${nowIso}`)
      .order('first_seen_at', { ascending: false }),
    // Everything currently featured on the public page (so Jill can un-feature).
    supabase
      .from('experience_listings')
      .select(cols)
      .eq('status', 'active')
      .eq('featured', true)
      .or(`close_date.is.null,close_date.gte.${nowIso}`)
      .order('featured_at', { ascending: false }),
  ])

  const toReview = ((newRes.data ?? []) as Row[]).filter(reviewable)
  const featured = (featuredRes.data ?? []) as Row[]

  return (
    <div>
      <PageHeader
        title="Experiences review"
        description="New listings from the last 7 days. Mark reviewed to clear them, or ⭐ Feature the genuinely special ones — featured picks lead the galleries on /experiences."
        actions={
          <Link href="/experiences" className="admin-btn admin-btn-ghost" target="_blank">
            View public page ↗
          </Link>
        }
      />

      <h2 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>
        New this week to review{' '}
        <span style={{ fontSize: '0.875rem', fontWeight: 400, opacity: 0.6 }}>({toReview.length})</span>
      </h2>
      {toReview.length === 0 ? (
        <EmptyState title="Nothing new to review" description="No new experience listings in the last 7 days." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {toReview.map((e) => (
            <ExperienceRow key={e.id} e={e} />
          ))}
        </div>
      )}

      {featured.length > 0 && (
        <>
          <h2 style={{ fontSize: '1rem', margin: '2rem 0 0.75rem' }}>
            Currently featured{' '}
            <span style={{ fontSize: '0.875rem', fontWeight: 400, opacity: 0.6 }}>({featured.length})</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {featured.map((e) => (
              <ExperienceRow key={e.id} e={e} featuredSection />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ExperienceRow({ e, featuredSection = false }: { e: Row; featuredSection?: boolean }) {
  const price = priceLabel(e)
  const program = e.program_slug ?? e.source_platform ?? '—'
  return (
    <Card>
      <CardBody padding="0.875rem 1rem">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {e.featured && <span title="Featured" style={{ fontSize: '0.9rem' }}>⭐</span>}
              <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                {e.detail_url ? (
                  <a href={e.detail_url} target="_blank" rel="noopener noreferrer">
                    {e.title}
                  </a>
                ) : (
                  e.title
                )}
              </span>
            </div>
            <div style={{ fontSize: '0.8125rem', opacity: 0.7, marginTop: '0.1875rem' }}>
              {program}
              {e.location ? ` · ${e.location}` : ''}
              {price ? ` · ${price}` : ''}
              {e.image_url ? '' : ' · no image'}
              {e.first_seen_at ? ` · seen ${seenLabel(e.first_seen_at)}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
            <form action={toggleFeatured}>
              <input type="hidden" name="id" value={e.id} />
              <input type="hidden" name="next" value={e.featured ? 'false' : 'true'} />
              <button
                type="submit"
                className={`admin-btn ${e.featured ? 'admin-btn-ghost' : 'admin-btn-primary'}`}
                style={{ fontSize: '0.8125rem' }}
              >
                {e.featured ? '★ Unfeature' : '⭐ Feature'}
              </button>
            </form>
            {!featuredSection && (
              <form action={markReviewed}>
                <input type="hidden" name="id" value={e.id} />
                <button type="submit" className="admin-btn admin-btn-ghost" style={{ fontSize: '0.8125rem' }}>
                  ✓ Reviewed
                </button>
              </form>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
