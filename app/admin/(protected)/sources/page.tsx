import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getSources } from '@/utils/supabase/queries'
import type { SourceType } from '@/utils/supabase/queries'
import { toggleSourceAction } from './actions'

const TIER_BADGE: Record<number, { bg: string; color: string }> = {
  1: { bg: '#f0e6fa', color: '#6B2D8F' },
  2: { bg: '#e6f4ea', color: '#1e7e34' },
  3: { bg: '#fff8e1', color: '#b45309' },
  4: { bg: '#fdecea', color: '#c0392b' },
  5: { bg: '#f0f0f0', color: '#555555' },
}

const TYPE_LABEL: Record<SourceType, string> = {
  official_partner: 'Official Partner',
  blog: 'Blog',
  community: 'Community',
  social: 'Social',
  email: 'Email',
}

export default async function AdminSourcesPage() {
  const supabase = createAdminClient()
  const sources = await getSources(supabase)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1>Sources</h1>
        <Link href="/admin/sources/new" className="rg-btn-primary">
          + Add Source
        </Link>
      </div>

      {sources.length === 0 ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>No sources yet.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-soft)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}>Tier</th>
                <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}>Name</th>
                <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}>Type</th>
                <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}>Feeds</th>
                <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}>Active</th>
                <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}>Last Scraped</th>
                <th style={{ padding: '0.5rem 0.75rem', color: 'var(--color-text-secondary)' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => {
                const tierStyle = TIER_BADGE[source.tier] ?? TIER_BADGE[5]
                return (
                  <tr key={source.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.55rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-ui)',
                        background: tierStyle.bg,
                        color: tierStyle.color,
                        minWidth: '1.75rem',
                        textAlign: 'center',
                      }}>
                        {source.tier}
                      </span>
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                      >
                        {source.name}
                      </a>
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>
                      {TYPE_LABEL[source.type] ?? source.type.replace(/_/g, ' ')}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                      {source.feed_count}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem' }}>
                      <form action={toggleSourceAction.bind(null, source.id, !source.is_active)}>
                        <button
                          type="submit"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            fontSize: '0.8125rem',
                            fontFamily: 'var(--font-body)',
                            color: source.is_active ? '#1e7e34' : 'var(--color-text-secondary)',
                            textDecoration: 'underline',
                          }}
                        >
                          {source.is_active ? 'Active' : 'Inactive'}
                        </button>
                      </form>
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)' }}>
                      {source.last_scraped_at
                        ? new Date(source.last_scraped_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td style={{ padding: '0.625rem 0.75rem', color: 'var(--color-text-secondary)', maxWidth: '16rem' }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {source.notes ?? '—'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
