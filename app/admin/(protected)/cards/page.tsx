import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

type CardRow = {
  id: string
  slug: string
  name: string
  card_type: string
  card_tier: string | null
  status: string
  annual_fee_usd: number | null
  official_url: string | null
  last_verified: string | null
  issuer_slug: string
  issuer_name: string
}

type Latest = { status: string; created_at: string }

type SortKey = 'name' | 'issuer' | 'tier' | 'af' | 'status' | 'extract'
type SortDir = 'asc' | 'desc'

const SORT_LABELS: Record<SortKey, string> = {
  name: 'Card',
  issuer: 'Issuer',
  tier: 'Tier',
  af: 'AF',
  status: 'Status',
  extract: 'Latest extract',
}

// Tier ranking for sortable order (premium → starter).
const TIER_RANK: Record<string, number> = {
  premium: 1,
  business: 2,
  hotel_cobrand: 3,
  airline_cobrand: 4,
  mid: 5,
  starter: 6,
  secured: 7,
  charge: 8,
}

// Extraction state ranking (failed worst → saved best for "needs attention" sort).
const EXTRACT_RANK: Record<string, number> = {
  failed: 1,
  never: 2,
  extracted: 3,
  rejected: 4,
  saved: 5,
}

/**
 * Credit cards admin index — sortable, filterable, searchable.
 *
 * Filters (URL query params): issuer, status, extract, q
 * Sort:   sort, dir
 *
 * 108 rows max — small enough to pull all and filter/sort in JS.
 */
export default async function AdminCardsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    issuer?: string
    status?: string
    extract?: string
    q?: string
    sort?: string
    dir?: string
  }>
}) {
  const params = await searchParams
  const issuerFilter = params.issuer ?? ''
  const statusFilter = params.status ?? ''
  const extractFilter = params.extract ?? ''
  const search = (params.q ?? '').trim().toLowerCase()
  const sort: SortKey = (params.sort as SortKey) ?? 'issuer'
  const dir: SortDir = params.dir === 'desc' ? 'desc' : 'asc'

  const supabase = createAdminClient()

  const { data: rawCards } = await supabase
    .from('credit_cards')
    .select(`
      id, slug, name, card_type, card_tier, status,
      annual_fee_usd, official_url, last_verified,
      issuer:issuers(slug, name)
    `)

  const { data: extractions } = await supabase
    .from('credit_card_extractions')
    .select('card_id, status, created_at')
    .order('created_at', { ascending: false })

  const latestByCard = new Map<string, Latest>()
  for (const ex of extractions ?? []) {
    if (!latestByCard.has(ex.card_id)) {
      latestByCard.set(ex.card_id, { status: ex.status, created_at: ex.created_at })
    }
  }

  // Normalize to flat shape
  type RawCard = NonNullable<typeof rawCards>[number]
  const cards: CardRow[] = (rawCards ?? []).map((c: RawCard) => {
    const issuer = Array.isArray(c.issuer) ? c.issuer[0] : (c.issuer as { slug?: string; name?: string } | null)
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      card_type: c.card_type,
      card_tier: c.card_tier,
      status: c.status,
      annual_fee_usd: c.annual_fee_usd,
      official_url: c.official_url,
      last_verified: c.last_verified,
      issuer_slug: issuer?.slug ?? '',
      issuer_name: issuer?.name ?? 'Unknown',
    }
  })

  // ── Build issuer + tier + status option sets for dropdowns ─────────────
  const issuerOptions = Array.from(new Set(cards.map((c) => c.issuer_name))).sort()
  const statusOptions = ['active', 'closed_to_new_apps', 'defunct']
  const extractOptions: { key: string; label: string }[] = [
    { key: '', label: 'All extraction states' },
    { key: 'saved', label: 'Saved' },
    { key: 'extracted', label: 'Extracted (unsaved)' },
    { key: 'failed', label: 'Failed' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'never', label: 'Never extracted' },
  ]

  // ── Apply filters ──────────────────────────────────────────────────────
  let filtered = cards
  if (issuerFilter) filtered = filtered.filter((c) => c.issuer_name === issuerFilter)
  if (statusFilter) filtered = filtered.filter((c) => c.status === statusFilter)
  if (extractFilter) {
    filtered = filtered.filter((c) => {
      const latest = latestByCard.get(c.id)
      if (extractFilter === 'never') return !latest && c.status !== 'defunct'
      return latest?.status === extractFilter
    })
  }
  if (search) {
    filtered = filtered.filter((c) =>
      c.name.toLowerCase().includes(search) ||
      c.slug.toLowerCase().includes(search) ||
      c.issuer_name.toLowerCase().includes(search),
    )
  }

  // ── Sort ───────────────────────────────────────────────────────────────
  const sign = dir === 'desc' ? -1 : 1
  filtered = [...filtered].sort((a, b) => {
    const la = latestByCard.get(a.id)
    const lb = latestByCard.get(b.id)
    switch (sort) {
      case 'name':
        return a.name.localeCompare(b.name) * sign
      case 'issuer':
        // Secondary sort by card name when issuer ties — keeps issuer groups readable.
        if (a.issuer_name === b.issuer_name) return a.name.localeCompare(b.name)
        return a.issuer_name.localeCompare(b.issuer_name) * sign
      case 'tier': {
        const ra = a.card_tier ? TIER_RANK[a.card_tier] ?? 99 : 99
        const rb = b.card_tier ? TIER_RANK[b.card_tier] ?? 99 : 99
        if (ra === rb) return a.name.localeCompare(b.name)
        return (ra - rb) * sign
      }
      case 'af': {
        const fa = a.annual_fee_usd ?? -1
        const fb = b.annual_fee_usd ?? -1
        if (fa === fb) return a.name.localeCompare(b.name)
        return (fa - fb) * sign
      }
      case 'status':
        if (a.status === b.status) return a.name.localeCompare(b.name)
        return a.status.localeCompare(b.status) * sign
      case 'extract': {
        const ka = la ? EXTRACT_RANK[la.status] ?? 0 : EXTRACT_RANK.never
        const kb = lb ? EXTRACT_RANK[lb.status] ?? 0 : EXTRACT_RANK.never
        if (ka === kb) {
          const ta = la ? Date.parse(la.created_at) : 0
          const tb = lb ? Date.parse(lb.created_at) : 0
          return (ta - tb) * sign
        }
        return (ka - kb) * sign
      }
      default:
        return 0
    }
  })

  // ── Stats line ─────────────────────────────────────────────────────────
  const totalCards = cards.length
  const savedCount = Array.from(latestByCard.values()).filter((v) => v.status === 'saved').length
  const failedCount = Array.from(latestByCard.values()).filter((v) => v.status === 'failed').length
  // "To author" = active cards with no extraction yet. Defunct and
  // closed-to-new-applicants cards aren't part of the authoring backlog (you
  // won't author a card nobody can get), so exclude both — they were inflating
  // this number. They stay visible in the table via the status filter.
  const defunctCount = cards.filter((c) => c.status === 'defunct').length
  const neverCount = cards.filter(
    (c) => c.status !== 'defunct' && c.status !== 'closed_to_new_apps' && !latestByCard.has(c.id),
  ).length

  // Helper to build URLs preserving other filters
  function buildUrl(overrides: Record<string, string | undefined>): string {
    const merged = { issuer: issuerFilter, status: statusFilter, extract: extractFilter, q: search, sort, dir, ...overrides }
    const usp = new URLSearchParams()
    for (const [k, v] of Object.entries(merged)) {
      if (v) usp.set(k, v)
    }
    const qs = usp.toString()
    return qs ? `/admin/cards?${qs}` : '/admin/cards'
  }

  function sortLink(key: SortKey): string {
    const nextDir: SortDir = sort === key && dir === 'asc' ? 'desc' : 'asc'
    return buildUrl({ sort: key, dir: nextDir })
  }

  function sortIndicator(key: SortKey): string {
    if (sort !== key) return ''
    return dir === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <div className="rg-container px-6 py-8">
      <header className="mb-4">
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)]">Credit cards</h1>
        <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
          {totalCards} total · {savedCount} fully extracted · {failedCount} failed · {neverCount} to author · {defunctCount} defunct
        </p>
      </header>

      {/* Filter bar */}
      <form action="/admin/cards" method="get" className="mb-4 flex flex-wrap items-end gap-3 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-3">
        <label className="flex flex-col">
          <span className="mb-1 font-ui text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)]">Search</span>
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Name, slug, issuer"
            className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-3 py-1.5 font-body text-base"
            style={{ width: '14rem', fontSize: '1rem' }}
          />
        </label>
        <label className="flex flex-col">
          <span className="mb-1 font-ui text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)]">Issuer</span>
          <select name="issuer" defaultValue={issuerFilter} className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-3 py-1.5 font-body text-sm">
            <option value="">All issuers</option>
            {issuerOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="mb-1 font-ui text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)]">Card status</span>
          <select name="status" defaultValue={statusFilter} className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-3 py-1.5 font-body text-sm">
            <option value="">All</option>
            {statusOptions.map((opt) => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
        <label className="flex flex-col">
          <span className="mb-1 font-ui text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)]">Extraction state</span>
          <select name="extract" defaultValue={extractFilter} className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-3 py-1.5 font-body text-sm">
            {extractOptions.map((opt) => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
          </select>
        </label>
        {/* Preserve current sort in form submit */}
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />
        <div className="flex gap-2">
          <button type="submit" className="rg-btn-primary text-xs">Apply</button>
          {(issuerFilter || statusFilter || extractFilter || search) ? (
            <Link href="/admin/cards" className="rg-btn-secondary text-xs">Clear</Link>
          ) : null}
        </div>
      </form>

      <p className="mb-3 font-body text-xs text-[var(--color-text-secondary)]">
        Showing {filtered.length} of {totalCards} · sorted by {SORT_LABELS[sort]} {dir === 'asc' ? '↑' : '↓'}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-8 text-center font-body text-sm text-[var(--color-text-secondary)]">
          No cards match the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto rg-table-scroll">
          <table className="w-full text-left font-body text-sm">
            <thead className="border-b border-[var(--color-border-soft)] font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
              <tr>
                <th className="py-2 pr-3"><Link href={sortLink('name')} className="hover:text-[var(--color-primary)]">Card{sortIndicator('name')}</Link></th>
                <th className="py-2 pr-3"><Link href={sortLink('issuer')} className="hover:text-[var(--color-primary)]">Issuer{sortIndicator('issuer')}</Link></th>
                <th className="py-2 pr-3"><Link href={sortLink('tier')} className="hover:text-[var(--color-primary)]">Tier{sortIndicator('tier')}</Link></th>
                <th className="py-2 pr-3"><Link href={sortLink('af')} className="hover:text-[var(--color-primary)]">AF{sortIndicator('af')}</Link></th>
                <th className="py-2 pr-3"><Link href={sortLink('status')} className="hover:text-[var(--color-primary)]">Status{sortIndicator('status')}</Link></th>
                <th className="py-2 pr-3"><Link href={sortLink('extract')} className="hover:text-[var(--color-primary)]">Latest extract{sortIndicator('extract')}</Link></th>
                <th className="py-2 pr-3">URL</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const latest = latestByCard.get(c.id)
                return (
                  <tr key={c.id} className="border-b border-[var(--color-border-soft)] hover:bg-[var(--color-background-soft)]">
                    <td className="py-2 pr-3 font-medium">{c.name}</td>
                    <td className="py-2 pr-3 text-[var(--color-text-secondary)]">{c.issuer_name}</td>
                    <td className="py-2 pr-3 text-[var(--color-text-secondary)]">{c.card_tier ?? '—'}</td>
                    <td className="py-2 pr-3">{c.annual_fee_usd != null ? `$${c.annual_fee_usd}` : '—'}</td>
                    <td className="py-2 pr-3">
                      <span className={c.status === 'active' ? '' : 'text-amber-700'}>{c.status.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap">
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
      )}
    </div>
  )
}
