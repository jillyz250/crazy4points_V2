import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'

export const dynamic = 'force-dynamic'

type UsageRow = {
  created_at: string
  caller: string
  model: string
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
  cost_usd: number
}

function fmtUsd(n: number): string {
  if (n < 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(2)}`
}

function fmtInt(n: number): string {
  return n.toLocaleString()
}

function dayKey(iso: string): string {
  return iso.slice(0, 10)
}

export default async function AiUsagePage() {
  const supabase = createAdminClient()
  const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows, error } = await supabase
    .from('ai_usage_log')
    .select('created_at,caller,model,input_tokens,output_tokens,cache_creation_input_tokens,cache_read_input_tokens,cost_usd')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (error) {
    return (
      <div>
        <PageHeader title="AI Usage" description="Anthropic API spend by day, caller, and model." />
        <EmptyState title="Could not load usage" description={error.message} />
      </div>
    )
  }

  const data = (rows ?? []) as UsageRow[]

  // By day
  const byDay = new Map<string, { cost: number; calls: number; input: number; output: number }>()
  for (const r of data) {
    const k = dayKey(r.created_at)
    const cur = byDay.get(k) ?? { cost: 0, calls: 0, input: 0, output: 0 }
    cur.cost += Number(r.cost_usd) || 0
    cur.calls += 1
    cur.input += r.input_tokens + r.cache_creation_input_tokens + r.cache_read_input_tokens
    cur.output += r.output_tokens
    byDay.set(k, cur)
  }
  const days = Array.from(byDay.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1))

  // By caller (last 7 days)
  const sevenAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const byCaller = new Map<string, { cost: number; calls: number; out: number }>()
  for (const r of data) {
    if (r.created_at < sevenAgo) continue
    const cur = byCaller.get(r.caller) ?? { cost: 0, calls: 0, out: 0 }
    cur.cost += Number(r.cost_usd) || 0
    cur.calls += 1
    cur.out += r.output_tokens
    byCaller.set(r.caller, cur)
  }
  const callers = Array.from(byCaller.entries()).sort((a, b) => b[1].cost - a[1].cost)

  // By model (last 7 days)
  const byModel = new Map<string, { cost: number; calls: number }>()
  for (const r of data) {
    if (r.created_at < sevenAgo) continue
    const cur = byModel.get(r.model) ?? { cost: 0, calls: 0 }
    cur.cost += Number(r.cost_usd) || 0
    cur.calls += 1
    byModel.set(r.model, cur)
  }
  const models = Array.from(byModel.entries()).sort((a, b) => b[1].cost - a[1].cost)

  const total7 = callers.reduce((s, [, v]) => s + v.cost, 0)
  const total30 = days.reduce((s, [, v]) => s + v.cost, 0)

  return (
    <div>
      <PageHeader
        title="AI Usage"
        description="Anthropic API spend by day, caller, and model. Logged on every messages.create."
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Badge tone="info">Last 7d: {fmtUsd(total7)}</Badge>
            <Badge tone="neutral">Last 30d: {fmtUsd(total30)}</Badge>
          </div>
        }
      />

      {data.length === 0 ? (
        <EmptyState title="No usage logged yet" description="Trigger an AI call (publish, brief, scout) and refresh." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <Section title="By day (last 30)">
            <Table
              cols={['Day', 'Calls', 'Input tok', 'Output tok', 'Cost']}
              rows={days.map(([k, v]) => [k, fmtInt(v.calls), fmtInt(v.input), fmtInt(v.output), fmtUsd(v.cost)])}
            />
          </Section>

          <Section title="By caller (last 7d)">
            <Table
              cols={['Caller', 'Calls', 'Output tok', 'Cost', '% of 7d']}
              rows={callers.map(([k, v]) => [
                k,
                fmtInt(v.calls),
                fmtInt(v.out),
                fmtUsd(v.cost),
                total7 > 0 ? `${((v.cost / total7) * 100).toFixed(1)}%` : '-',
              ])}
            />
          </Section>

          <Section title="By model (last 7d)">
            <Table
              cols={['Model', 'Calls', 'Cost']}
              rows={models.map(([k, v]) => [k, fmtInt(v.calls), fmtUsd(v.cost)])}
            />
          </Section>
        </div>
      )}
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

function Table({ cols, rows }: { cols: string[]; rows: (string | number)[][] }) {
  return (
    <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
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
  )
}
