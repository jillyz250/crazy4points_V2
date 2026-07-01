import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

type EditorialPlan = {
  approve?: Array<{ headline: string; why_publish?: string }>
  top_move?: string
}

export default async function BriefPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('daily_briefs')
    .select('id, brief_date, brief_html, intel_count, editorial_plan')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) notFound()
  const brief = data as {
    id: string
    brief_date: string
    brief_html: string | null
    intel_count: number | null
    editorial_plan: EditorialPlan | null
  }

  // "Publish from the brief": each approved item links straight to its editable
  // draft, matched by title to the pending_review alert. The draft editor lives
  // at /admin/alerts/<alert_id>/edit (same link the drafts list uses). Items with
  // no site draft (e.g. newsletter-only) show without a link. You still review +
  // edit on the draft page before publishing — this only skips the hunt.
  const approve = brief.editorial_plan?.approve ?? []
  const alertIdByTitle = new Map<string, string>()
  if (approve.length) {
    const { data: alerts } = await supabase
      .from('alerts')
      .select('id, title')
      .eq('status', 'pending_review')
      .in('title', approve.map((a) => a.headline))
    for (const a of (alerts ?? []) as Array<{ id: string; title: string }>) alertIdByTitle.set(a.title, a.id)
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '1rem',
        }}
      >
        <div>
          <Link
            href="/admin/briefs"
            style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-ui)', color: 'var(--color-text-secondary)' }}
          >
            ← All briefs
          </Link>
          <h1 style={{ margin: '0.25rem 0 0' }}>{formatDate(brief.brief_date)}</h1>
          <p style={{ margin: '0.25rem 0 0', fontFamily: 'var(--font-ui)', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            {brief.intel_count ?? 0} intel items
          </p>
        </div>
      </div>

      {approve.length > 0 && (
        <div
          style={{
            border: '1px solid var(--color-border-soft)',
            borderLeft: '3px solid var(--color-primary, #6B2D8F)',
            borderRadius: 'var(--radius-card)',
            padding: '1rem 1.25rem',
            marginBottom: '1.25rem',
            background: 'var(--color-background-soft, #F8F5FB)',
          }}
        >
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>
            Ready to publish ({approve.length}) · review + edit, then publish
          </div>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {approve.map((a, i) => {
              const alertId = alertIdByTitle.get(a.headline)
              return (
                <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: '#fff', border: '1px solid var(--color-border-soft)', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '0.0625rem' }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.625rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem', fontFamily: 'var(--font-body)' }}>{a.headline}</span>
                      {alertId ? (
                        <Link href={`/admin/alerts/${alertId}/edit`} style={{ fontSize: '0.8125rem', fontWeight: 600, marginLeft: 'auto', color: 'var(--color-primary, #6B2D8F)' }}>
                          Edit &amp; publish →
                        </Link>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>newsletter only — no site draft</span>
                      )}
                    </div>
                    {a.why_publish && (
                      <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', lineHeight: 1.45, color: 'var(--color-text-secondary)', fontFamily: 'var(--font-body)' }}>
                        {a.why_publish}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {brief.brief_html ? (
        <iframe
          srcDoc={brief.brief_html}
          sandbox="allow-same-origin allow-popups allow-top-navigation-by-user-activation"
          style={{
            width: '100%',
            height: 'calc(100dvh - 220px)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
            background: '#FAF9F6',
          }}
        />
      ) : (
        <p style={{ fontFamily: 'var(--font-body)', color: 'var(--color-text-secondary)' }}>
          This brief was generated before HTML was being persisted. Re-run the brief to capture it.
        </p>
      )}
    </div>
  )
}
