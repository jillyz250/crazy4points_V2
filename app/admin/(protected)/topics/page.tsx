import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { listTopics } from '@/utils/supabase/queries'
import type {
  Topic,
  TopicStatus,
  TopicType,
  FactCheckStatus,
} from '@/utils/supabase/queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'

export const dynamic = 'force-dynamic'

const TOPIC_TYPES: TopicType[] = [
  'promo',
  'devaluation',
  'sweet_spot',
  'program_change',
  'partner_change',
  'category_change',
  'earn_rate_change',
  'status_change',
  'policy_change',
  'industry_news',
  'signup_bonus',
  'referral_bonus',
  'retention_offer',
  'shopping_portal_bonus',
  'award_sale',
  'companion_pass',
  'dining_bonus',
  'fee_change',
  'card_refresh',
  'milestone_bonus',
  'card_credit',
  'limited_time_offer',
  'award_availability',
  'status_promo',
  'glitch',
  'transfer_bonus',
  'other',
]

const STATUSES: TopicStatus[] = ['draft', 'active', 'archived']

function statusTone(s: FactCheckStatus): 'neutral' | 'success' | 'warning' | 'danger' {
  switch (s) {
    case 'verified':
      return 'success'
    case 'partially_verified':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'neutral'
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toISOString().slice(0, 10)
  } catch {
    return '—'
  }
}

export default async function TopicsIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; topic_type?: string; program?: string }>
}) {
  const params = await searchParams
  const status = (STATUSES as string[]).includes(params.status ?? '')
    ? (params.status as TopicStatus)
    : undefined
  const topic_type = (TOPIC_TYPES as string[]).includes(params.topic_type ?? '')
    ? (params.topic_type as TopicType)
    : undefined
  const program = params.program?.trim() || undefined

  const supabase = createAdminClient()
  const rows = await listTopics(supabase, { status, topic_type, program })

  return (
    <div>
      <PageHeader
        title={`Topics (${rows.length})`}
        description="Editorial topics — the verified source-of-truth unit that fans out into format-specific variants (alert, blog, newsletter, social). PR 2: CRUD + Haiku fact extraction with anti-fabrication checks."
        actions={
          <Link href="/admin/topics/new" className="rg-btn-primary">
            New topic
          </Link>
        }
      />

      <FilterBar status={status} topic_type={topic_type} program={program} />

      {rows.length === 0 ? (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
            border: '1px dashed var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          No topics yet. Click <strong>New topic</strong> to get started.
        </div>
      ) : (
        <div className="rg-table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border-soft)' }}>
                <th style={th}>Title</th>
                <th style={th}>Slug</th>
                <th style={th}>Type</th>
                <th style={th}>Status</th>
                <th style={th}>Fact-check</th>
                <th style={th}>End date</th>
                <th style={th}>Variants</th>
                <th style={th}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t: Topic & { variant_count: number }) => (
                <tr
                  key={t.id}
                  style={{ borderBottom: '1px solid var(--color-border-soft)' }}
                >
                  <td style={td}>
                    <Link href={`/admin/topics/${t.slug}/edit`}>{t.title}</Link>
                  </td>
                  <td style={td}>
                    <code style={{ fontSize: '0.75rem' }}>{t.slug}</code>
                  </td>
                  <td style={td}>{t.topic_type}</td>
                  <td style={td}>
                    <Badge tone="neutral">{t.status}</Badge>
                  </td>
                  <td style={td}>
                    <Badge tone={statusTone(t.fact_check_status)}>{t.fact_check_status}</Badge>
                  </td>
                  <td style={td}>{formatDate(t.end_date)}</td>
                  <td style={td}>{t.variant_count}</td>
                  <td style={td}>{formatDate(t.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const th: React.CSSProperties = { padding: '0.5rem 0.625rem', fontWeight: 600 }
const td: React.CSSProperties = { padding: '0.5rem 0.625rem', verticalAlign: 'top' }

function FilterBar({
  status,
  topic_type,
  program,
}: {
  status?: TopicStatus
  topic_type?: TopicType
  program?: string
}) {
  return (
    <form
      method="get"
      style={{
        display: 'flex',
        gap: '0.5rem',
        flexWrap: 'wrap',
        marginBottom: '1rem',
        alignItems: 'flex-end',
      }}
    >
      <label style={labelStyle}>
        <span>Status</span>
        <select name="status" defaultValue={status ?? ''} style={inputStyle}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label style={labelStyle}>
        <span>Topic type</span>
        <select name="topic_type" defaultValue={topic_type ?? ''} style={inputStyle}>
          <option value="">All</option>
          {TOPIC_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <label style={labelStyle}>
        <span>Program slug</span>
        <input
          name="program"
          defaultValue={program ?? ''}
          placeholder="e.g. chase-ultimate-rewards"
          style={inputStyle}
        />
      </label>
      <button type="submit" className="rg-btn-secondary">
        Filter
      </button>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  fontSize: '0.75rem',
  color: 'var(--color-text-secondary)',
}
const inputStyle: React.CSSProperties = {
  padding: '0.4rem 0.5rem',
  fontSize: '1rem',
  border: '1px solid var(--color-border-soft)',
  borderRadius: 'var(--radius-ui)',
}
