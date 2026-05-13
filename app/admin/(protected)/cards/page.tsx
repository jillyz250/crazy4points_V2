import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * Admin index of all credit_cards. Groups by issuer, shows extraction state,
 * provides Extract / View links per row.
 *
 * Surfaces:
 *   - Has the card been extracted? (any non-failed credit_card_extractions row)
 *   - When was it last extracted?
 *   - Direct link to /admin/cards/[slug]/extract for re-running
 *   - Direct link to /cards/[slug] (public) for spot-checking the render
 */
export default async function AdminCardsListPage() {
  const supabase = createAdminClient()

  // Pull all cards with issuer name. Cast to handle the typed join shape.
  const { data: cards } = await supabase
    .from('credit_cards')
    .select(`
      id, slug, name, card_type, card_tier, status,
      annual_fee_usd, official_url, last_verified,
      issuer:issuers(slug, name)
    `)
    .order('slug')

  // Latest extraction per card (status + timestamp).
  const { data: extractions } = await supabase
    .from('credit_card_extractions')
    .select('card_id, status, created_at')
    .order('created_at', { ascending: false })

  type Latest = { status: string; created_at: string }
  const latestByCard = new Map<string, Latest>()
  for (const ex of extractions ?? []) {
    if (!latestByCard.has(ex.card_id)) {
      latestByCard.set(ex.card_id, { status: ex.status, created_at: ex.created_at })
    }
  }

  // Group by issuer name
  type Card = NonNullable<typeof cards>[number]
  const issuerOf = (c: Card) => (Array.isArray(c.issuer) ? c.issuer[0]?.name : (c.issuer as { name?: string } | null)?.name) ?? 'Unknown'

  const grouped = new Map<string, Card[]>()
  for (const c of cards ?? []) {
    const name = issuerOf(c)
    const arr = grouped.get(name) ?? []
    arr.push(c)
    grouped.set(name, arr)
  }
  // Sort issuers by total card count desc
  const sortedIssuers = Array.from(grouped.entries()).sort((a, b) => b[1].length - a[1].length)

  const totalCards = cards?.length ?? 0
  const totalSaved = Array.from(latestByCard.values()).filter((v) => v.status === 'saved').length
  const totalFailed = Array.from(latestByCard.values()).filter((v) => v.status === 'failed').length

  return (
    <div className="rg-container px-6 py-8">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)]">Credit cards</h1>
        <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
          {totalCards} cards · {totalSaved} fully extracted · {totalFailed} with failed extractions ·{' '}
          {totalCards - totalSaved - totalFailed} not yet extracted
        </p>
      </header>

      <div className="space-y-8">
        {sortedIssuers.map(([issuerName, issuerCards]) => (
          <section key={issuerName}>
            <h2 className="mb-3 font-display text-xl font-semibold text-[var(--color-primary)]">
              {issuerName} <span className="font-body text-base text-[var(--color-text-secondary)]">({issuerCards.length})</span>
            </h2>
            <div className="overflow-x-auto rg-table-scroll">
              <table className="w-full text-left font-body text-sm">
                <thead className="border-b border-[var(--color-border-soft)] font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                  <tr>
                    <th className="py-2 pr-3">Card</th>
                    <th className="py-2 pr-3">Tier</th>
                    <th className="py-2 pr-3">AF</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Latest extract</th>
                    <th className="py-2 pr-3">URL</th>
                    <th className="py-2 pr-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {issuerCards.map((c) => {
                    const latest = latestByCard.get(c.id)
                    return (
                      <tr key={c.id} className="border-b border-[var(--color-border-soft)]">
                        <td className="py-2 pr-3 font-medium">{c.name}</td>
                        <td className="py-2 pr-3 text-[var(--color-text-secondary)]">{c.card_tier ?? '—'}</td>
                        <td className="py-2 pr-3">{c.annual_fee_usd != null ? `$${c.annual_fee_usd}` : '—'}</td>
                        <td className="py-2 pr-3">
                          <span className={c.status === 'active' ? '' : 'text-amber-700'}>{c.status}</span>
                        </td>
                        <td className="py-2 pr-3">
                          {latest ? (
                            <span className={latest.status === 'saved' ? 'text-emerald-700' : latest.status === 'failed' ? 'text-red-700' : 'text-[var(--color-text-secondary)]'}>
                              {latest.status} · {new Date(latest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-[var(--color-text-secondary)]">never</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {c.official_url ? <span className="text-emerald-700">✓</span> : <span className="text-amber-700">—</span>}
                        </td>
                        <td className="py-2 pr-3">
                          <Link href={`/admin/cards/${c.slug}/extract`} className="font-ui text-xs uppercase tracking-wide text-[var(--color-primary)] hover:underline">
                            Extract →
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
