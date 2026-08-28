import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardBody } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { isTimeshareSweep } from '@/lib/sweepstakes/categories'
import { togglePosted, endSweep, draftSweepstakesPostAction, clearSweepstakesDraftAction, toggleSweepFeatured } from './actions'

export const dynamic = 'force-dynamic'

type Sweep = {
  id: string
  program: string
  title: string
  prize: string | null
  entry_url: string | null
  source_url: string | null
  mechanic: string | null
  ends_at: string | null
  status: string
  posted_social: boolean
  social_draft: string | null
  featured: boolean | null
  first_seen: string
  last_seen: string
}

const MECHANIC_LABEL: Record<string, string> = {
  daily_entry: 'enter daily',
  one_time: 'one-time entry',
  unknown: '',
}

function endsLabel(ends: string | null): string | null {
  if (!ends) return null
  // Stored as YYYY-MM-DD text. Show it human-friendly; flag if already past.
  const d = new Date(`${ends}T23:59:59`)
  if (Number.isNaN(d.getTime())) return `ends ${ends}`
  const nice = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return d.getTime() < Date.now() ? `ended ${nice}?` : `ends ${nice}`
}

export default async function SweepstakesPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sweepstakes')
    .select('*')
    .eq('status', 'running')
    // Needs-a-post first, then soonest deadline, then newest.
    .order('posted_social', { ascending: true })
    .order('ends_at', { ascending: true, nullsFirst: false })
    .order('first_seen', { ascending: false })
  const sweeps = (data ?? []) as Sweep[]
  const needPost = sweeps.filter((s) => !s.posted_social).length

  return (
    <div>
      <PageHeader
        title="Sweepstakes"
        description="Live points/miles sweepstakes the daily watcher (/api/cron/sweepstakes-watch) is tracking. Each running one is a Facebook-post opportunity — the Wyndham giveaway was our best post ever. Say “facebook post” and Claude drafts it (point the ad at a c4p landing page). Mark it posted once it's live."
      />

      {needPost > 0 && (
        <div style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary, #6B2D8F)' }}>
          {needPost} {needPost === 1 ? 'sweepstakes needs' : 'sweepstakes need'} a social post.
        </div>
      )}

      {sweeps.length === 0 ? (
        <EmptyState title="No live sweepstakes" description="The watcher hasn't found any running sweepstakes yet. It scrapes the configured source pages daily." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sweeps.map((s) => {
            const ends = endsLabel(s.ends_at)
            const mech = s.mechanic ? MECHANIC_LABEL[s.mechanic] ?? '' : ''
            return (
              <Card key={s.id}>
                <CardBody>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <Badge tone="neutral">{s.program}</Badge>
                    {isTimeshareSweep(s.program, s.prize, s.title) && <Badge tone="warning">⚠ Timeshare</Badge>}
                    {mech && <Badge tone="neutral">{mech}</Badge>}
                    {ends && <Badge tone="warning">{ends}</Badge>}
                    {s.posted_social ? (
                      <Badge tone="success">posted</Badge>
                    ) : (
                      <Badge tone="accent">needs a post</Badge>
                    )}
                  </div>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>{s.title}</p>
                  {s.prize && (
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--admin-muted, #4a4a4a)' }}>
                      Prize: {s.prize}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                    {s.entry_url && (
                      <a href={s.entry_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary, #6B2D8F)', fontWeight: 600 }}>
                        Entry page ↗
                      </a>
                    )}
                    {s.source_url && (
                      <a href={s.source_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-muted, #4a4a4a)' }}>
                        Source ↗
                      </a>
                    )}
                    <span style={{ color: 'var(--admin-muted, #4a4a4a)' }}>
                      seen {new Date(s.last_seen).toLocaleDateString()}
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                      <form action={toggleSweepFeatured}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="next" value={(!s.featured).toString()} />
                        <button type="submit" className={`admin-btn ${s.featured ? 'admin-btn-ghost' : 'admin-btn-primary'}`} style={{ fontSize: '0.8125rem' }}>
                          {s.featured ? '★ Unfeature' : '⭐ Feature'}
                        </button>
                      </form>
                      <form action={draftSweepstakesPostAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className="admin-btn admin-btn-primary" style={{ fontSize: '0.8125rem' }}>
                          {s.social_draft ? 'Regenerate FB draft' : 'Draft FB post'}
                        </button>
                      </form>
                      <form action={togglePosted}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="posted" value={(!s.posted_social).toString()} />
                        <button type="submit" className="admin-btn admin-btn-ghost" style={{ fontSize: '0.8125rem' }}>
                          {s.posted_social ? 'Mark not posted' : 'Mark posted'}
                        </button>
                      </form>
                      <form action={endSweep}>
                        <input type="hidden" name="id" value={s.id} />
                        <button type="submit" className="admin-btn admin-btn-ghost" style={{ fontSize: '0.8125rem' }}>
                          End
                        </button>
                      </form>
                    </div>
                  </div>
                  {s.social_draft && (
                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--color-border-soft, #E6DEEE)', paddingTop: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--color-primary, #6B2D8F)' }}>
                          Facebook draft
                        </span>
                        <form action={clearSweepstakesDraftAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <button type="submit" className="admin-btn admin-btn-ghost" style={{ fontSize: '0.75rem' }}>
                            Clear
                          </button>
                        </form>
                      </div>
                      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0, background: 'var(--color-background-soft, #F8F5FB)', border: '1px solid var(--color-border-soft, #E6DEEE)', borderRadius: '0.5rem', padding: '0.75rem' }}>
                        {s.social_draft}
                      </pre>
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
