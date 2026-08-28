import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardBody } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import CopyPromptButton from '@/components/admin/CopyPromptButton'

export const dynamic = 'force-dynamic'

type Creative = {
  id: string
  name: string
  event: string | null
  category: string | null
  color_scheme: string | null
  prompt: string | null
  image_url: string
  used_on: string | null
  source: string
  created_at: string
}

export default async function CreativesPage() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('campaign_creatives')
    .select('*')
    .order('created_at', { ascending: false })
  const creatives = (data ?? []) as Creative[]

  return (
    <div>
      <PageHeader
        title="Creative library"
        description="Reusable ad creatives. Each keeps the exact prompt that made it — for a similar experience, Copy prompt, swap the team colors + details, and regenerate in Copilot. Team colors are brand-safe (only logos are trademarks); never use a real team logo."
      />

      {creatives.length === 0 ? (
        <EmptyState title="No creatives yet" description="Create one in the daily ritual's Creative phase, or after a campaign, and it'll appear here." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {creatives.map((c) => (
            <Card key={c.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image_url}
                alt={c.name}
                style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', display: 'block', borderTopLeftRadius: 'inherit', borderTopRightRadius: 'inherit' }}
              />
              <CardBody>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {c.category && <Badge tone="neutral">{c.category}</Badge>}
                  <Badge tone="neutral">{c.source}</Badge>
                </div>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>{c.name}</p>
                {c.event && (
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.8125rem', color: 'var(--admin-muted, #4a4a4a)' }}>{c.event}</p>
                )}
                {c.color_scheme && (
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--admin-muted, #4a4a4a)' }}>
                    Colors: {c.color_scheme}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  {c.prompt && <CopyPromptButton prompt={c.prompt} />}
                  {c.used_on && (
                    <a href={c.used_on} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8125rem', color: 'var(--color-primary, #6B2D8F)', fontWeight: 600 }}>
                      Used on ↗
                    </a>
                  )}
                </div>
                {c.prompt && (
                  <details style={{ marginTop: '0.6rem' }}>
                    <summary style={{ cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-primary, #6B2D8F)', fontWeight: 600 }}>
                      Show prompt
                    </summary>
                    <p style={{ marginTop: '0.4rem', fontSize: '0.75rem', lineHeight: 1.45, color: 'var(--admin-muted, #4a4a4a)', whiteSpace: 'pre-wrap' }}>
                      {c.prompt}
                    </p>
                  </details>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
