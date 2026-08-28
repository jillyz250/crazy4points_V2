import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardBody } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import CopyButton from '@/components/admin/CopyButton'
import { createShortLink, deleteShortLink } from './actions'

export const dynamic = 'force-dynamic'

const BASE = 'https://www.crazy4points.com'

type ShortLink = {
  id: string
  slug: string
  target_url: string
  label: string | null
  clicks: number
  created_at: string
}

export default async function ShortLinksPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('short_links')
    .select('*')
    .order('created_at', { ascending: false })
  const links = (data ?? []) as ShortLink[]
  const totalClicks = links.reduce((n, l) => n + (l.clicks ?? 0), 0)

  return (
    <div>
      <PageHeader
        title="Short links"
        description="Branded short links for social posts: crazy4points.com/s/<slug> redirects to a full tracked URL. Public link stays short and clean; the redirect keeps the UTMs, so analytics still attributes the click."
      />

      <Card>
        <CardBody>
          <form action={createShortLink} style={{ display: 'grid', gap: '0.6rem' }}>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <label style={{ fontSize: '0.8125rem', flex: '1 1 160px' }}>
                Slug (the /s/ part)
                <input name="slug" required placeholder="nd-cfb" style={{ width: '100%', fontSize: '1rem', padding: '0.5rem', border: '1px solid var(--color-border-soft, #E6DEEE)', borderRadius: '0.375rem' }} />
              </label>
              <label style={{ fontSize: '0.8125rem', flex: '2 1 260px' }}>
                Label (optional note)
                <input name="label" placeholder="ND vs UNC — organic FB post" style={{ width: '100%', fontSize: '1rem', padding: '0.5rem', border: '1px solid var(--color-border-soft, #E6DEEE)', borderRadius: '0.375rem' }} />
              </label>
            </div>
            <label style={{ fontSize: '0.8125rem' }}>
              Target URL (with UTMs)
              <input name="target_url" required type="url" placeholder="https://www.crazy4points.com/go/...?utm_source=facebook&utm_medium=social&utm_campaign=..." style={{ width: '100%', fontSize: '1rem', padding: '0.5rem', border: '1px solid var(--color-border-soft, #E6DEEE)', borderRadius: '0.375rem' }} />
            </label>
            <div>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ fontSize: '0.8125rem' }}>Create short link</button>
            </div>
          </form>
        </CardBody>
      </Card>

      <div style={{ margin: '1rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-primary, #6B2D8F)' }}>
        {links.length} link{links.length === 1 ? '' : 's'} · {totalClicks} total click{totalClicks === 1 ? '' : 's'}
      </div>

      {links.length === 0 ? (
        <EmptyState title="No short links yet" description="Create one above for your next social post." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {links.map((l) => {
            const shortUrl = `${BASE}/s/${l.slug}`
            return (
              <Card key={l.id}>
                <CardBody>
                  <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                    <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: 'var(--color-primary, #6B2D8F)' }}>{`/s/${l.slug}`}</a>
                    <Badge tone="neutral">{l.clicks} click{l.clicks === 1 ? '' : 's'}</Badge>
                    {l.label && <span style={{ fontSize: '0.8125rem', color: 'var(--admin-muted, #4a4a4a)' }}>{l.label}</span>}
                    <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto' }}>
                      <CopyButton text={shortUrl} label="Copy short link" />
                      <form action={deleteShortLink}>
                        <input type="hidden" name="id" value={l.id} />
                        <button type="submit" className="admin-btn admin-btn-ghost" style={{ fontSize: '0.8125rem' }}>Delete</button>
                      </form>
                    </div>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--admin-muted, #4a4a4a)', wordBreak: 'break-all' }}>→ {l.target_url}</p>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
