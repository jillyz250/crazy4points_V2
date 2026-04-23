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

export default async function BriefPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('daily_briefs')
    .select('id, brief_date, brief_html, intel_count')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) notFound()
  const brief = data as { id: string; brief_date: string; brief_html: string | null; intel_count: number | null }

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
            style={{
              fontSize: '0.8125rem',
              fontFamily: 'var(--font-ui)',
              color: 'var(--color-text-secondary)',
            }}
          >
            ← All briefs
          </Link>
          <h1 style={{ margin: '0.25rem 0 0' }}>{formatDate(brief.brief_date)}</h1>
          <p
            style={{
              margin: '0.25rem 0 0',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            {brief.intel_count ?? 0} intel items
          </p>
        </div>
      </div>

      {brief.brief_html ? (
        <iframe
          srcDoc={brief.brief_html}
          sandbox="allow-same-origin allow-popups allow-top-navigation-by-user-activation"
          style={{
            width: '100%',
            height: 'calc(100vh - 220px)',
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
