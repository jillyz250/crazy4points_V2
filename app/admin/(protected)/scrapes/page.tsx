import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

export const dynamic = 'force-dynamic'

type Scrape = {
  id: string
  program_slug: string
  url_type: string
  url: string
  scraped_at: string
  content_hash: string
  prev_hash: string | null
  changed: boolean
  fetch_status: string
  diff_summary: string | null
  notes: string | null
  content_md: string
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'success') return 'success'
  if (status === 'empty') return 'warning'
  if (status === 'firecrawl_blocked' || status === 'http_error' || status === 'parse_error') return 'danger'
  return 'neutral'
}

function relTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = ms / (1000 * 60)
  if (m < 1) return 'just now'
  if (m < 60) return `${Math.round(m)}m ago`
  const h = m / 60
  if (h < 24) return `${Math.round(h)}h ago`
  const d = h / 24
  return `${Math.round(d)}d ago`
}

export default async function AdminScrapesPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string; status?: string; changed?: string }>
}) {
  const params = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('scrapes')
    .select('id, program_slug, url_type, url, scraped_at, content_hash, prev_hash, changed, fetch_status, diff_summary, notes, content_md')
    .order('scraped_at', { ascending: false })
    .limit(200)

  if (params.program) query = query.eq('program_slug', params.program)
  if (params.status) query = query.eq('fetch_status', params.status)
  if (params.changed === '1') query = query.eq('changed', true)

  const { data: scrapes } = await query
  const rows = (scrapes ?? []) as Scrape[]

  const programs = Array.from(new Set(rows.map((r) => r.program_slug))).sort()

  return (
    <div>
      <PageHeader
        title="Scrapes"
        description="Auto-refresh history. Each row is one Firecrawl pass against a program URL. Click a row to view the captured markdown."
      />

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', fontSize: '0.875rem' }}>
        <Link href="/admin/scrapes" style={{ textDecoration: 'underline' }}>All</Link>
        <Link href="/admin/scrapes?changed=1" style={{ textDecoration: 'underline' }}>Changed only</Link>
        <Link href="/admin/scrapes?status=success" style={{ textDecoration: 'underline' }}>Success</Link>
        <Link href="/admin/scrapes?status=firecrawl_blocked" style={{ textDecoration: 'underline' }}>Blocked</Link>
        {programs.length > 1 && (
          <span style={{ color: 'var(--color-text-secondary)' }}>
            · Filter by program:{' '}
            {programs.map((p, i) => (
              <span key={p}>
                {i > 0 && ', '}
                <Link href={`/admin/scrapes?program=${p}`} style={{ textDecoration: 'underline' }}>
                  {p}
                </Link>
              </span>
            ))}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No scrapes yet"
          description="Run `node scripts/scrape-all.mjs --program=<slug>` or `--tier=1` to capture a refresh pass."
        />
      ) : (
        <div className="rg-table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border-soft)' }}>
                <th style={{ padding: '0.5rem' }}>When</th>
                <th style={{ padding: '0.5rem' }}>Program</th>
                <th style={{ padding: '0.5rem' }}>URL type</th>
                <th style={{ padding: '0.5rem' }}>URL</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Changed</th>
                <th style={{ padding: '0.5rem' }}>Size</th>
                <th style={{ padding: '0.5rem' }}>Hash</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border-soft)' }}>
                  <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }} title={r.scraped_at}>
                    {relTime(r.scraped_at)}
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Link href={`/admin/scrapes?program=${r.program_slug}`} style={{ textDecoration: 'underline' }}>
                      {r.program_slug}
                    </Link>
                  </td>
                  <td style={{ padding: '0.5rem' }}>{r.url_type}</td>
                  <td style={{ padding: '0.5rem', maxWidth: '24rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <a href={r.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }} title={r.url}>
                      {r.url}
                    </a>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <Badge tone={statusTone(r.fetch_status)}>{r.fetch_status}</Badge>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    {r.changed ? <Badge tone="warning">CHANGED</Badge> : r.prev_hash ? '—' : <Badge tone="neutral">new</Badge>}
                  </td>
                  <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>{(r.content_md?.length ?? 0).toLocaleString()} chars</td>
                  <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.75rem' }} title={r.content_hash}>
                    {r.content_hash.slice(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '1rem', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
        Showing latest 200 rows. To re-run: <code>node scripts/scrape-all.mjs --program=&lt;slug&gt;</code>.
      </p>
    </div>
  )
}
