import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Operations view: every card extraction job, newest first.
 *
 * Used to monitor:
 *   - Which cards have failed extractions (need re-run)
 *   - Token + cost spend across the batch
 *   - Time pattern of extraction activity
 *   - Which issuer pages give Firecrawl/Sonnet the most trouble
 */
export default async function CardExtractionsOpsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusFilter } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('credit_card_extractions')
    .select(`
      id, card_id, source_url, model, status, error_message,
      markdown_chars, input_tokens, output_tokens, cost_usd,
      created_at, saved_at,
      card:credit_cards!inner(slug, name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (statusFilter && ['extracted', 'saved', 'rejected', 'failed'].includes(statusFilter)) {
    query = query.eq('status', statusFilter)
  }

  const { data: extractions } = await query

  // Stats
  const allStatus = await supabase
    .from('credit_card_extractions')
    .select('status', { count: 'exact', head: false })
  type StatusRow = { status: string }
  const counts: Record<string, number> = { extracted: 0, saved: 0, rejected: 0, failed: 0 }
  for (const row of (allStatus.data ?? []) as StatusRow[]) {
    counts[row.status] = (counts[row.status] ?? 0) + 1
  }

  const filters: { key: string; label: string }[] = [
    { key: '', label: `All (${allStatus.count ?? 0})` },
    { key: 'saved', label: `Saved (${counts.saved ?? 0})` },
    { key: 'extracted', label: `Extracted (${counts.extracted ?? 0})` },
    { key: 'failed', label: `Failed (${counts.failed ?? 0})` },
    { key: 'rejected', label: `Rejected (${counts.rejected ?? 0})` },
  ]

  return (
    <div className="rg-container px-6 py-8">
      <header className="mb-4">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)]">Card extractions</h1>
        <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
          Recent Firecrawl + Sonnet extraction jobs across all credit cards.
        </p>
      </header>

      {/* Filter chips */}
      <nav aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => {
          const isActive = (statusFilter ?? '') === f.key
          const href = f.key ? `/admin/card-extractions?status=${f.key}` : '/admin/card-extractions'
          return (
            <Link
              key={f.key}
              href={href}
              className={`rounded-full px-3 py-1 font-ui text-xs ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'border border-[var(--color-border-soft)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
              }`}
            >
              {f.label}
            </Link>
          )
        })}
      </nav>

      <div className="overflow-x-auto rg-table-scroll">
        <table className="w-full text-left font-body text-sm">
          <thead className="border-b border-[var(--color-border-soft)] font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
            <tr>
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">Card</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Model</th>
              <th className="py-2 pr-3">In / out tokens</th>
              <th className="py-2 pr-3">Markdown chars</th>
              <th className="py-2 pr-3">Error</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {(extractions ?? []).map((e) => {
              const card = Array.isArray(e.card) ? e.card[0] : (e.card as { slug: string; name: string } | null)
              return (
                <tr key={e.id} className="border-b border-[var(--color-border-soft)] align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                  <td className="py-2 pr-3 font-medium">{card?.name ?? '—'}</td>
                  <td className="py-2 pr-3">
                    <span className={e.status === 'saved' ? 'text-emerald-700' : e.status === 'failed' ? 'text-red-700' : 'text-[var(--color-text-secondary)]'}>
                      {e.status}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{e.model}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{e.input_tokens ?? '—'} / {e.output_tokens ?? '—'}</td>
                  <td className="py-2 pr-3">{e.markdown_chars?.toLocaleString() ?? '—'}</td>
                  <td className="py-2 pr-3 max-w-xs truncate text-xs text-red-700">
                    {e.error_message ?? ''}
                  </td>
                  <td className="py-2 pr-3">
                    {card?.slug ? (
                      <Link href={`/admin/cards/${card.slug}/extract`} className="font-ui text-xs uppercase tracking-wide text-[var(--color-primary)] hover:underline">
                        Open →
                      </Link>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {(extractions ?? []).length === 0 ? (
        <p className="mt-6 font-body text-sm text-[var(--color-text-secondary)]">
          No extractions match the current filter.
        </p>
      ) : null}
    </div>
  )
}
