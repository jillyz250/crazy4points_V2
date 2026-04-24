import { createAdminClient } from '@/utils/supabase/server'
import { countUnresolvedSystemErrors } from '@/utils/supabase/queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { LinkButton } from '@/components/admin/ui/Button'
import { Badge } from '@/components/admin/ui/Badge'

type Tile = {
  title: string
  description: string
  href: string
  cta?: string
}

const TILES: Tile[] = [
  { title: 'Alerts', description: 'Draft, approve, and publish alerts. Review Scout-generated drafts.', href: '/admin/alerts', cta: 'Manage' },
  { title: 'Sources', description: 'Intelligence sources scraped by Claude Scout.', href: '/admin/sources', cta: 'Manage' },
  { title: 'Intel', description: 'Raw findings from Claude Scout. Filter and reject noise.', href: '/admin/intel', cta: 'View' },
  { title: 'Programs', description: 'Loyalty programs that alerts can be tagged against.', href: '/admin/programs', cta: 'Manage' },
  { title: 'Content Ideas', description: 'Long-form ideas generated during the daily brief.', href: '/admin/content-ideas', cta: 'View' },
  { title: 'Newsletter', description: 'Compose and send weekly newsletter.', href: '/admin/newsletter', cta: 'Open' },
  { title: 'Subscribers', description: 'Newsletter subscribers. Active/inactive counts.', href: '/admin/subscribers', cta: 'Manage' },
  { title: 'Daily Briefs', description: 'Preview past daily briefs in-app.', href: '/admin/briefs', cta: 'View' },
  { title: 'Jobs', description: 'Manually trigger scout or brief runs.', href: '/admin/jobs', cta: 'Run' },
  { title: 'Fact Checks', description: 'Claim-level drill-down and flag-rate stats.', href: '/admin/fact-checks', cta: 'View' },
  { title: 'Errors', description: 'Background-job failures. Resolve after investigating.', href: '/admin/errors', cta: 'View' },
]

export default async function AdminDashboard() {
  const supabase = createAdminClient()
  const unresolvedErrors = await countUnresolvedSystemErrors(supabase)

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Manage alerts, sources, programs, subscribers, and the content pipeline."
      />

      {unresolvedErrors > 0 && (
        <Card className="admin-card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Badge tone="danger">{unresolvedErrors}</Badge>
            <span style={{ fontSize: '0.875rem', color: 'var(--admin-text)' }}>
              unresolved background error{unresolvedErrors === 1 ? '' : 's'}
            </span>
            <LinkButton href="/admin/errors" variant="secondary" size="sm" style={{ marginLeft: 'auto' }}>
              Investigate →
            </LinkButton>
          </div>
        </Card>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '0.875rem',
        }}
      >
        {TILES.map((tile) => (
          <Card key={tile.href}>
            <div style={{ padding: '1rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
              <h2 style={{ margin: 0, fontSize: '1rem' }}>{tile.title}</h2>
              <p style={{ margin: 0, fontSize: '0.8125rem', lineHeight: 1.5, flex: 1 }}>
                {tile.description}
              </p>
              <div style={{ marginTop: '0.25rem' }}>
                <LinkButton href={tile.href} variant="secondary" size="sm">
                  {tile.cta ?? 'Open'} →
                </LinkButton>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
