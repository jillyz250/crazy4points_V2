/**
 * /admin/issuers — list of card-issuing banks.
 *
 * Each row links to the per-issuer editor where the editor fills in
 * intro / notes / website / logo. The public surface at /issuers/[slug]
 * is built in Phase 2 (separate PR).
 *
 * Read-only-ish: editing existing rows is allowed, creating new issuers
 * happens via SQL migration (rare event — there are only ~6 banks).
 */
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

export const dynamic = 'force-dynamic'

type IssuerRow = {
  id: string
  slug: string
  name: string
  intro: string | null
  website_url: string | null
  last_verified: string | null
  updated_at: string
}

export default async function AdminIssuersPage() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('issuers')
    .select('id, slug, name, intro, website_url, last_verified, updated_at')
    .order('name', { ascending: true })

  if (error) {
    return (
      <div>
        <PageHeader title="Issuers" description="Card-issuing banks." />
        <Card>
          <p style={{ color: 'var(--admin-danger, #b91c1c)' }}>
            Failed to load issuers: {error.message}
          </p>
        </Card>
      </div>
    )
  }

  const rows = (data ?? []) as IssuerRow[]
  const authored = rows.filter((r) => r.intro && r.intro.trim().length > 0).length

  return (
    <div>
      <PageHeader
        title="Issuers"
        description={
          'Card-issuing banks. Each gets its own /issuers/[slug] hub page that ' +
          'aggregates every card the issuer offers — both flexible-currency cards (MR/UR/TY) ' +
          'and co-brand cards (Hilton/Delta/Marriott/etc.).'
        }
      />

      <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>
        {authored}/{rows.length} authored (has intro content)
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No issuers seeded yet"
          description="Run migration 344_seed_issuers.sql to seed the six core banks."
        />
      ) : (
        <Card>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Issuer</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Last verified</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const hasIntro = !!(r.intro && r.intro.trim().length > 0)
                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>
                      <Link href={`/admin/issuers/${r.slug}`} style={{ color: 'var(--color-primary)' }}>
                        {r.name}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)' }}>
                      <code style={{ fontSize: '0.8125rem' }}>{r.slug}</code>
                    </td>
                    <td>
                      {hasIntro ? (
                        <Badge tone="success">Authored</Badge>
                      ) : (
                        <Badge tone="neutral">Stub</Badge>
                      )}
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)', fontSize: '0.875rem' }}>
                      {r.last_verified
                        ? new Date(r.last_verified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/admin/issuers/${r.slug}`}
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
