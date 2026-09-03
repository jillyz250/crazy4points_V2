import Link from 'next/link'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { isGa4Configured } from '@/utils/ga4/client'
import { fetchAnalyticsDashboard, type DateRange } from '@/utils/ga4/queries'
import { createAdminClient } from '@/utils/supabase/server'

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

const FRIENDS_LABEL = 'Friends & family / direct'
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

type SourceRow = { label: string; count: number; pct: number }
type MonthRow = { month: string; count: number }

/**
 * Reads the subscribers table (service role, small table) and computes the two
 * "what's driving signups" aggregates in-process:
 *  - by signup_source, NULL/empty rolled up to "Friends & family / direct"
 *  - by subscribed_at month, as a continuous series (0-fill gaps up to this month)
 */
async function fetchSignupBreakdown(): Promise<{
  total: number
  sources: SourceRow[]
  months: MonthRow[]
} | null> {
  const { data, error } = await createAdminClient()
    .from('subscribers')
    .select('signup_source, subscribed_at')
  if (error || !data) return null

  const total = data.length

  const srcCounts = new Map<string, number>()
  for (const r of data) {
    const raw = (r.signup_source ?? '').trim()
    const label = raw === '' ? FRIENDS_LABEL : raw
    srcCounts.set(label, (srcCounts.get(label) ?? 0) + 1)
  }
  const sources: SourceRow[] = [...srcCounts.entries()]
    .map(([label, count]) => ({ label, count, pct: total > 0 ? count / total : 0 }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))

  const monthCounts = new Map<string, number>()
  for (const r of data) {
    const m = (r.subscribed_at ?? '').slice(0, 7)
    if (m.length === 7) monthCounts.set(m, (monthCounts.get(m) ?? 0) + 1)
  }
  const months = buildMonthlySeries(monthCounts)

  return { total, sources, months }
}

/** Continuous YYYY-MM series from the earliest signup through the current month, 0-filled. */
function buildMonthlySeries(counts: Map<string, number>): MonthRow[] {
  const keys = [...counts.keys()].sort()
  if (keys.length === 0) return []
  const [startY, startM] = keys[0].split('-').map(Number)
  const now = new Date()
  const endY = now.getUTCFullYear()
  const endM = now.getUTCMonth() + 1
  const out: MonthRow[] = []
  let y = startY
  let mo = startM
  // guard against a runaway loop on unexpected data
  for (let i = 0; i < 240 && (y < endY || (y === endY && mo <= endM)); i++) {
    const key = `${y}-${String(mo).padStart(2, '0')}`
    out.push({ month: key, count: counts.get(key) ?? 0 })
    mo++
    if (mo > 12) {
      mo = 1
      y++
    }
  }
  return out
}

function monthLabel(yyyymm: string): string {
  const [, m] = yyyymm.split('-').map(Number)
  return MONTH_ABBR[(m ?? 1) - 1] ?? yyyymm
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const params = await searchParams
  const { range, key, days } = rangeFromKey(params.range)

  // Signup drivers come from the subscribers table and are independent of GA4,
  // so they render even when GA4 isn't configured.
  const signups = await fetchSignupBreakdown()

  if (!isGa4Configured()) {
    return (
      <div>
        <PageHeader title="Analytics" description="Site analytics from GA4 (Google Analytics 4 Data API)." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <SignupsSection signups={signups} />
          <EmptyState
            title="GA4 not configured"
            description="Set GA4_PROPERTY_ID, GA4_SERVICE_ACCOUNT_EMAIL, and GA4_SERVICE_ACCOUNT_KEY env vars and grant the service-account email Viewer access on the GA4 property."
          />
        </div>
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

        {/* Signup drivers — sourced from the subscribers table, independent of GA4 */}
        <SignupsSection signups={signups} />

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

/** "What's driving signups" — source breakdown + monthly trend, side by side (stacks on narrow). */
function SignupsSection({
  signups,
}: {
  signups: { total: number; sources: SourceRow[]; months: MonthRow[] } | null
}) {
  return (
    <Section title="What's driving signups">
      {!signups || signups.total === 0 ? (
        <EmptyState
          title="No subscribers yet"
          description="Signup source and monthly trend appear once the subscribers table has rows."
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            alignItems: 'start',
          }}
        >
          <SourceBreakdown sources={signups.sources} total={signups.total} />
          <MonthlyTrend months={signups.months} />
        </div>
      )}
    </Section>
  )
}

/** Horizontal magnitude bars — one series (signups), so no legend; direct count + share labels. */
function SourceBreakdown({ sources, total }: { sources: SourceRow[]; total: number }) {
  const max = Math.max(...sources.map((s) => s.count), 1)
  return (
    <div className="admin-card" style={{ padding: '1rem 1.25rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '0.5rem',
          marginBottom: '0.85rem',
        }}
      >
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>Signup sources</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {fmtInt(total)} subscribers
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {sources.map((s) => (
          <div
            key={s.label}
            title={`${s.label}: ${s.count} (${fmtPct(s.pct)})`}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(96px, 34%) 1fr auto',
              gap: '0.6rem',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--admin-text)',
                lineHeight: 1.25,
                wordBreak: 'break-word',
              }}
            >
              {s.label}
            </span>
            <div
              style={{
                background: 'var(--admin-surface-alt)',
                borderRadius: 4,
                height: 10,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(3, Math.round((s.count / max) * 100))}%`,
                  background: 'var(--admin-accent)',
                  height: '100%',
                  borderRadius: 4,
                }}
              />
            </div>
            <span
              style={{
                fontSize: '0.78rem',
                color: 'var(--admin-text-muted)',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
              }}
            >
              {fmtInt(s.count)} · {fmtPct(s.pct)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Small column trend of signups per month — the shape (campaign spikes) is the story. */
function MonthlyTrend({ months }: { months: MonthRow[] }) {
  const max = Math.max(...months.map((m) => m.count), 1)
  const peak = months.reduce((a, m) => (m.count > a ? m.count : a), 0)
  return (
    <div className="admin-card" style={{ padding: '1rem 1.25rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '0.5rem',
          marginBottom: '0.85rem',
        }}
      >
        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>Signups by month</h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
          peak {fmtInt(peak)}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', height: 132 }}>
        {months.map((m) => {
          const h = Math.round((m.count / max) * 100)
          return (
            <div
              key={m.month}
              title={`${m.month}: ${m.count} signups`}
              style={{
                flex: '1 1 0',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.3rem',
                height: '100%',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--admin-text-muted)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {m.count}
              </span>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end' }}>
                <div
                  style={{
                    width: '100%',
                    height: m.count > 0 ? `${Math.max(4, h)}%` : 0,
                    background: 'var(--admin-accent)',
                    borderRadius: '4px 4px 0 0',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--admin-text-subtle)', whiteSpace: 'nowrap' }}>
                {monthLabel(m.month)}
              </span>
            </div>
          )
        })}
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
