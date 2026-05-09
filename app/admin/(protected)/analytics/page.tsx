import Link from 'next/link'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { isGa4Configured } from '@/utils/ga4/client'
import { fetchAnalyticsDashboard, type DateRange } from '@/utils/ga4/queries'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const RANGE_OPTIONS = [
  { key: '7d', label: 'Last 7d', days: 7 },
  { key: '28d', label: 'Last 28d', days: 28 },
  { key: '90d', label: 'Last 90d', days: 90 },
] as const
type RangeKey = (typeof RANGE_OPTIONS)[number]['key']

function rangeFromKey(key: string | undefined): { range: DateRange; key: RangeKey; days: number } {
  const match = RANGE_OPTIONS.find((r) => r.key === key) ?? RANGE_OPTIONS[1]
  return { range: { startDate: `${match.days}daysAgo`, endDate: 'today' }, key: match.key, days: match.days }
}

function fmtInt(n: number): string {
  return Math.round(n).toLocaleString()
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

function fmtDuration(seconds: number): string {
  if (!seconds || seconds < 1) return '0s'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function fmtDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const params = await searchParams
  const { range, key, days } = rangeFromKey(params.range)

  if (!isGa4Configured()) {
    return (
      <div>
        <PageHeader title="Analytics" description="Site analytics from GA4 (Google Analytics 4 Data API)." />
        <EmptyState
          title="GA4 not configured"
          description="Set GA4_PROPERTY_ID, GA4_SERVICE_ACCOUNT_EMAIL, and GA4_SERVICE_ACCOUNT_KEY env vars and grant the service-account email Viewer access on the GA4 property."
        />
      </div>
    )
  }

  const data = await fetchAnalyticsDashboard(range)
  const peakDay = data.daily.reduce<{ date: string; activeUsers: number } | null>(
    (acc, d) => (!acc || d.activeUsers > acc.activeUsers ? d : acc),
    null,
  )

  return (
    <div>
      <PageHeader
        title="Analytics"
        description={`GA4 data for the last ${days} days. Live pull on every page load.`}
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {RANGE_OPTIONS.map((opt) => (
              <Link
                key={opt.key}
                href={`/admin/analytics?range=${opt.key}`}
                style={{ textDecoration: 'none' }}
              >
                <Badge tone={opt.key === key ? 'accent' : 'neutral'}>{opt.label}</Badge>
              </Link>
            ))}
          </div>
        }
      />

      {data.errors.length > 0 && (
        <div
          className="admin-card"
          style={{ padding: '0.75rem 1rem', marginBottom: '1rem', background: '#fff7ed', borderColor: '#fdba74' }}
        >
          <strong style={{ fontSize: '0.85rem' }}>Some queries failed:</strong>
          <ul style={{ margin: '0.25rem 0 0 1rem', fontSize: '0.8rem' }}>
            {data.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Top KPI cards */}
        <Section title="Overview">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <Stat label="Active users" value={fmtInt(data.totals?.activeUsers ?? 0)} />
            <Stat label="New users" value={fmtInt(data.totals?.newUsers ?? 0)} />
            <Stat label="Sessions" value={fmtInt(data.totals?.sessions ?? 0)} />
            <Stat label="Page views" value={fmtInt(data.totals?.screenPageViews ?? 0)} />
            <Stat
              label="Avg session"
              value={fmtDuration(data.totals?.averageSessionDuration ?? 0)}
            />
            <Stat label="Engagement rate" value={fmtPct(data.totals?.engagementRate ?? 0)} />
          </div>
        </Section>

        {/* Daily active users */}
        <Section title="Active users by day">
          {data.daily.length === 0 ? (
            <EmptyState title="No data" description="No active-user data for this range." />
          ) : (
            <Table
              cols={['Day', 'Active users', '']}
              rows={data.daily
                .slice()
                .reverse()
                .map((d) => [
                  fmtDate(d.date),
                  fmtInt(d.activeUsers),
                  <Bar key={d.date} value={d.activeUsers} max={peakDay?.activeUsers ?? 1} />,
                ])}
            />
          )}
        </Section>

        {/* Key events */}
        <Section title="Key events">
          {data.events.length === 0 ? (
            <EmptyState title="No events" description="No events fired in this range." />
          ) : (
            <Table
              cols={['Event', 'Count', 'Users']}
              rows={data.events.map((e) => [e.eventName, fmtInt(e.eventCount), fmtInt(e.users)])}
            />
          )}
        </Section>

        {/* Cities */}
        <Section title="Top cities">
          {data.cities.length === 0 ? (
            <EmptyState title="No location data" description="GA4 may withhold city data on small samples." />
          ) : (
            <Table
              cols={['City', 'Country', 'Active users']}
              rows={data.cities.map((c) => [c.city || '(not set)', c.country || '—', fmtInt(c.activeUsers)])}
            />
          )}
        </Section>

        {/* Top pages */}
        <Section title="Top pages">
          {data.pages.length === 0 ? (
            <EmptyState title="No page views" description="No page-view data for this range." />
          ) : (
            <Table
              cols={['Path', 'Views', 'Avg engagement']}
              rows={data.pages.map((p) => [p.pagePath, fmtInt(p.views), fmtDuration(p.avgEngagementSeconds)])}
            />
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title}</h2>
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-card" style={{ padding: '0.75rem 1rem' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.4rem', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  )
}

function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ width: '100%', minWidth: '60px', background: 'var(--admin-bg-subtle)', borderRadius: 3, height: 8 }}>
      <div style={{ width: `${pct}%`, background: 'var(--color-primary, #6B2D8F)', height: '100%', borderRadius: 3 }} />
    </div>
  )
}

function Table({ cols, rows }: { cols: string[]; rows: (string | number | React.ReactNode)[][] }) {
  return (
    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ background: 'var(--admin-bg-subtle)' }}>
              {cols.map((c) => (
                <th key={c} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 600 }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderTop: '1px solid var(--admin-border)' }}>
                {row.map((cell, j) => (
                  <td key={j} style={{ padding: '0.5rem 0.75rem', fontVariantNumeric: 'tabular-nums' }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
