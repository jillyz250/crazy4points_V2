/**
 * Server component — shows EXACTLY what Sonnet will see on the next regenerate.
 *
 * Why this exists: the editor used to have no visibility into what content was
 * being fed in, so when a draft missed a big story (e.g. Spirit shutdown),
 * there was no way to know whether the alert was missing, low-impact, or just
 * out-ranked. This panel surfaces the inputs so you can fix the upstream
 * (publish a missing alert, bump impact_score) BEFORE clicking Run Now.
 */
import Link from 'next/link'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { getNewsletterInputs } from '@/utils/ai/runBuildNewsletter'

const HEADS_UP_TYPES = new Set([
  'devaluation',
  'program_change',
  'policy_change',
  'fee_change',
  'partner_change',
  'category_change',
  'earn_rate_change',
])

function impactTone(score: number | null): 'success' | 'accent' | 'danger' {
  if (score === null) return 'accent'
  if (score >= 8) return 'danger'
  if (score >= 6) return 'success'
  return 'accent'
}

function endsSoon(endDate: string | null): boolean {
  if (!endDate) return false
  const ms = new Date(endDate).getTime() - Date.now()
  return ms > 0 && ms < 14 * 24 * 60 * 60 * 1000
}

export default async function InputsPreview() {
  const inputs = await getNewsletterInputs()
  const headlineCandidate = inputs.alerts[0] ?? null
  const headsUpCandidates = inputs.alerts.filter(
    (a) => endsSoon(a.end_date) || (a.alert_type ? HEADS_UP_TYPES.has(a.alert_type) : false),
  )

  const hasAny =
    inputs.alerts.length > 0 ||
    inputs.newsletter_ideas.length > 0 ||
    inputs.blog_ideas.length > 0 ||
    inputs.radar_signals.length > 0

  return (
    <details
      style={{
        marginTop: '1rem',
        marginBottom: '1.5rem',
        background: 'var(--admin-surface-alt)',
        border: '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius-lg)',
        fontSize: '0.875rem',
      }}
    >
      <summary
        style={{
          padding: '0.75rem 1rem',
          cursor: 'pointer',
          fontWeight: 600,
          listStyle: 'none',
        }}
      >
        🔍 What this newsletter will use ({inputs.alerts.length} alerts · {inputs.newsletter_ideas.length + inputs.blog_ideas.length} ideas · {inputs.radar_signals.length} radar signals)
        <span style={{ marginLeft: '0.5rem', fontWeight: 400, color: 'var(--admin-text-muted)' }}>
          — open before clicking Run Now
        </span>
      </summary>

      <div style={{ padding: '0 1rem 1rem' }}>
        {!hasAny && (
          <p style={{ color: 'var(--admin-text-muted)', margin: '0.5rem 0' }}>
            No alerts, ideas, or radar signals from the last 7 days. Run Now will produce a "quiet week" draft.
          </p>
        )}

        {/* ── Alerts that will be ranked for The Headline / Quick Wins / Heads Up ── */}
        {inputs.alerts.length > 0 && (
          <Section
            title="Alerts pool (ranked by impact_score, then recency)"
            note="The top row becomes The Headline. Sonnet picks 2–3 more for Quick Wins. Bump impact_score to push a story up."
          >
            <Card>
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '3rem' }}>#</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th style={{ textAlign: 'right' }}>Impact</th>
                      <th>End date</th>
                      <th>Published</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {inputs.alerts.map((a, i) => {
                      const isHeadline = headlineCandidate?.id === a.id
                      const willHeadsUp = headsUpCandidates.some((h) => h.id === a.id)
                      return (
                        <tr key={a.id} style={{ background: isHeadline ? 'var(--admin-surface)' : undefined }}>
                          <td style={{ color: 'var(--admin-text-muted)', fontVariantNumeric: 'tabular-nums' }}>{i + 1}</td>
                          <td>
                            <span style={{ fontWeight: isHeadline ? 700 : 400 }}>{a.title}</span>
                            {isHeadline && <Badge tone="success">Headline candidate</Badge>}
                            {willHeadsUp && !isHeadline && <Badge tone="accent">Heads Up</Badge>}
                          </td>
                          <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.8125rem' }}>{a.alert_type ?? '—'}</td>
                          <td style={{ textAlign: 'right' }}>
                            <Badge tone={impactTone(a.impact_score)}>{a.impact_score ?? '—'}</Badge>
                          </td>
                          <td style={{ fontSize: '0.8125rem' }}>
                            {a.end_date ? (
                              <span style={{ color: endsSoon(a.end_date) ? 'var(--admin-danger)' : 'var(--admin-text-muted)' }}>
                                {a.end_date}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--admin-text-subtle)' }}>—</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
                            {a.published_at ? new Date(a.published_at).toLocaleDateString() : '—'}
                          </td>
                          <td>
                            <Link href={`/admin/alerts?focus=${a.id}`} style={{ fontWeight: 600 }}>
                              Edit →
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>
        )}

        {/* ── Content ideas that feed Play of the Week ── */}
        {(inputs.blog_ideas.length > 0 || inputs.newsletter_ideas.length > 0) && (
          <Section
            title="Content ideas (feed Play of the Week)"
            note="Sonnet picks ONE for the deep-dive Play of the Week. Blog ideas preferred."
          >
            <Card>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {inputs.blog_ideas.map((i) => (
                  <li key={i.id} style={{ marginBottom: '0.375rem' }}>
                    <strong>{i.title}</strong>
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8125rem' }}>
                      {' '}— blog · priority {i.priority ?? '—'}
                    </span>
                  </li>
                ))}
                {inputs.newsletter_ideas.map((i) => (
                  <li key={i.id} style={{ marginBottom: '0.375rem' }}>
                    <strong>{i.title}</strong>
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8125rem' }}>
                      {' '}— newsletter · priority {i.priority ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>
        )}

        {/* ── Radar signals (low/medium intel) ── */}
        {inputs.radar_signals.length > 0 && (
          <Section
            title="Radar signals (feed On My Radar)"
            note="Low/medium-confidence intel from this week. Sonnet picks up to 2."
          >
            <Card>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                {inputs.radar_signals.map((r, i) => (
                  <li key={i} style={{ marginBottom: '0.375rem' }}>
                    <strong>{r.headline}</strong>
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8125rem' }}>
                      {' '}— {r.source_name ?? 'unknown'} · confidence {r.confidence ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>
        )}

        <p style={{ marginTop: '1rem', marginBottom: 0, fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
          Don't see a story you expected? Either the alert isn't published, was published more than 7 days ago, or its <code>impact_score</code> is too low to make the top 12.
        </p>
      </div>
    </details>
  )
}

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: '1rem' }}>
      <h3 style={{ fontSize: '0.875rem', margin: '0 0 0.125rem' }}>{title}</h3>
      <p style={{ margin: '0 0 0.5rem', color: 'var(--admin-text-muted)', fontSize: '0.8125rem' }}>{note}</p>
      {children}
    </div>
  )
}
