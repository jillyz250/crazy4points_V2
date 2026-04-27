'use client'

import { useMemo, useState } from 'react'
import type { HotelProperty } from '@/utils/supabase/queries'
import {
  HYATT_REGION_LABELS,
  HYATT_REGION_ORDER,
  hyattRegionForCountry,
  isComingSoon,
  type HyattRegion,
} from './hyattRegions'

type SortKey = 'name' | 'category' | 'points'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 50

function compareCategory(a: string | null, b: string | null): number {
  if (a === b) return 0
  if (a === null) return 1
  if (b === null) return -1
  const aNum = /^\d+$/.test(a)
  const bNum = /^\d+$/.test(b)
  if (aNum && bNum) return Number(a) - Number(b)
  if (aNum && !bNum) return -1
  if (!aNum && bNum) return 1
  return a.localeCompare(b)
}

function bestPointsValue(p: HotelProperty): number {
  return p.standard_points ?? p.off_peak_points ?? p.peak_points ?? Number.POSITIVE_INFINITY
}

export default function PropertiesTable({
  properties,
  programName,
}: {
  properties: HotelProperty[]
  programName: string
}) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [regionFilter, setRegionFilter] = useState<string>('all')
  const [aiOnly, setAiOnly] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)

  // Decorate each property with its derived Hyatt region, coming-soon flag,
  // and pending-change flag once, up front. Saves recomputing on every keystroke.
  const todayIso = new Date().toISOString().slice(0, 10)
  const decorated = useMemo(
    () =>
      properties.map((p) => ({
        ...p,
        _hyattRegion: hyattRegionForCountry(p.country),
        _comingSoon: isComingSoon(p.notes),
        _pendingChange:
          p.category_next && p.category_changes_at && p.category_changes_at >= todayIso
            ? { from: p.category, to: p.category_next, when: p.category_changes_at }
            : null,
      })),
    [properties, todayIso]
  )

  const openCount = useMemo(
    () => decorated.filter((p) => !p._comingSoon).length,
    [decorated]
  )
  const comingSoonCount = decorated.length - openCount

  const pendingChanges = useMemo(() => {
    const rows = decorated.filter((p) => p._pendingChange && !p._comingSoon)
    let up = 0
    let down = 0
    let when: string | null = null
    for (const r of rows) {
      const c = r._pendingChange!
      if (c.from && c.to) {
        // Numeric categories: 1-8. Letter categories: A-D. Compare lexicographically;
        // both shapes are monotonically increasing in their domains.
        if (c.to > c.from) up++
        else if (c.to < c.from) down++
      }
      if (!when || c.when < when) when = c.when
    }
    return { count: rows.length, up, down, when }
  }, [decorated])

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of decorated) {
      if (p.category) set.add(p.category)
    }
    return [...set].sort(compareCategory)
  }, [decorated])

  const regions = useMemo(() => {
    const set = new Set<HyattRegion>()
    for (const p of decorated) {
      if (p._hyattRegion) set.add(p._hyattRegion)
    }
    return HYATT_REGION_ORDER.filter((r) => set.has(r))
  }, [decorated])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return decorated.filter((p) => {
      if (!showComingSoon && p._comingSoon) return false
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (regionFilter !== 'all' && p._hyattRegion !== regionFilter) return false
      if (aiOnly && !p.all_inclusive) return false
      if (q) {
        const hay = [p.name, p.brand, p.city, p.country, p.notes]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [decorated, search, categoryFilter, regionFilter, aiOnly, showComingSoon])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    const dir = sortDir === 'asc' ? 1 : -1
    arr.sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name) * dir
      if (sortKey === 'category') return compareCategory(a.category, b.category) * dir
      return (bestPointsValue(a) - bestPointsValue(b)) * dir
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }

  function resetFilters() {
    setSearch('')
    setCategoryFilter('all')
    setRegionFilter('all')
    setAiOnly(false)
    setShowComingSoon(false)
    setPage(0)
  }

  const hasActiveFilters =
    search.trim().length > 0 ||
    categoryFilter !== 'all' ||
    regionFilter !== 'all' ||
    aiOnly ||
    showComingSoon

  const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-ui)',
    fontSize: '0.875rem',
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--color-border-soft)',
    borderRadius: 'var(--radius-ui)',
    background: 'var(--color-background)',
    color: 'var(--color-text-primary)',
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '0.625rem 0.75rem',
    fontFamily: 'var(--font-ui)',
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    userSelect: 'none',
  }

  const tdStyle: React.CSSProperties = {
    padding: '0.625rem 0.75rem',
    fontFamily: 'var(--font-body)',
    fontSize: '0.875rem',
    color: 'var(--color-text-primary)',
    verticalAlign: 'top',
    borderBottom: '1px solid var(--color-border-soft)',
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey !== key) return ''
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  function fmtPoints(n: number | null): string {
    if (!n) return '—'
    return n.toLocaleString()
  }

  function formatChangeDate(iso: string | null): string {
    if (!iso) return ''
    const d = new Date(`${iso}T00:00:00`)
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return (
    <div>
      {pendingChanges.count > 0 && (
        <div
          style={{
            background: 'var(--color-background-soft)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
            padding: '0.75rem 1rem',
            marginBottom: '0.875rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '0.6875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 700,
              color: 'var(--color-primary)',
              background: '#fff',
              padding: '0.1875rem 0.5rem',
              borderRadius: '9999px',
              border: '1px solid var(--color-border-soft)',
            }}
          >
            Heads up
          </span>
          <span>
            <strong>{pendingChanges.count}</strong> {programName} {pendingChanges.count === 1 ? 'property is' : 'properties are'} changing category on{' '}
            <strong>{formatChangeDate(pendingChanges.when)}</strong>
            {' — '}
            <span style={{ color: '#92400e' }}>{pendingChanges.up} moving up</span>
            {', '}
            <span style={{ color: '#166534' }}>{pendingChanges.down} moving down</span>
            . Look for the <strong>→</strong> indicator in the Cat column below.
          </span>
        </div>
      )}

      {/* Prominent search — full width, larger, above filters */}
      <input
        type="search"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(0)
        }}
        placeholder={`Search ${programName} hotels by name, brand, city, country…`}
        style={{
          ...inputStyle,
          width: '100%',
          fontSize: '1rem',
          padding: '0.75rem 1rem',
          marginBottom: '0.625rem',
        }}
        aria-label="Search properties"
      />

      {/* Filter row — compact controls under the search */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '0.75rem',
        }}
      >
        <select
          value={regionFilter}
          onChange={(e) => {
            setRegionFilter(e.target.value)
            setPage(0)
          }}
          style={inputStyle}
          aria-label="Filter by region"
        >
          <option value="all">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>{HYATT_REGION_LABELS[r]}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value)
            setPage(0)
          }}
          style={inputStyle}
          aria-label="Filter by category"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{`Cat ${c}`}</option>
          ))}
        </select>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={aiOnly}
            onChange={(e) => {
              setAiOnly(e.target.checked)
              setPage(0)
            }}
          />
          All-inclusive only
        </label>
        {comingSoonCount > 0 && (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={showComingSoon}
              onChange={(e) => {
                setShowComingSoon(e.target.checked)
                setPage(0)
              }}
            />
            Show {comingSoonCount} coming soon
          </label>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '0.625rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <span>
          {sorted.length === 0 ? (
            'No matching properties'
          ) : (
            <>
              Showing <strong>{safePage * PAGE_SIZE + 1}-
              {Math.min((safePage + 1) * PAGE_SIZE, sorted.length)}</strong> of{' '}
              <strong>{sorted.length.toLocaleString()}</strong>{' '}
              {sorted.length === 1 ? 'property' : 'properties'}
              {hasActiveFilters && ` (of ${openCount.toLocaleString()} bookable today)`}
            </>
          )}
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.8125rem',
              padding: 0,
              textDecoration: 'underline',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border-soft)' }}>
              <th style={thStyle} onClick={() => toggleSort('name')}>
                Property{sortIndicator('name')}
              </th>
              <th style={thStyle}>Brand</th>
              <th style={thStyle}>Location</th>
              <th
                style={{ ...thStyle, textAlign: 'center' }}
                onClick={() => toggleSort('category')}
              >
                Cat{sortIndicator('category')}
              </th>
              <th
                style={{ ...thStyle, textAlign: 'right' }}
                onClick={() => toggleSort('points')}
              >
                Points (off / std / peak){sortIndicator('points')}
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr key={p.id}>
                <td style={{ ...tdStyle, fontWeight: 500 }}>
                  {p.hotel_url ? (
                    <a
                      href={p.hotel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}
                    >
                      {p.name}
                    </a>
                  ) : (
                    p.name
                  )}
                  {p.all_inclusive && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-ui)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: 'var(--color-accent)',
                        fontWeight: 600,
                      }}
                    >
                      All-inclusive
                    </span>
                  )}
                  {p._comingSoon && (
                    <span
                      style={{
                        marginLeft: '0.5rem',
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-ui)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        color: '#92400e',
                        background: '#fef3c7',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '9999px',
                        fontWeight: 600,
                      }}
                    >
                      Coming soon
                    </span>
                  )}
                </td>
                <td style={{ ...tdStyle, color: 'var(--color-text-secondary)' }}>
                  {p.brand ?? '—'}
                </td>
                <td style={{ ...tdStyle, color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                  {p.city ?? '—'}
                  {p.country ? `, ${p.country}` : ''}
                </td>
                <td
                  style={{
                    ...tdStyle,
                    textAlign: 'center',
                    fontFamily: 'var(--font-ui)',
                    fontWeight: 600,
                  }}
                >
                  {p.category ?? '—'}
                  {p._pendingChange && (
                    <div
                      title={`Changes to Cat ${p._pendingChange.to} on ${formatChangeDate(p._pendingChange.when)}`}
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: (p._pendingChange.to > p._pendingChange.from!) ? '#92400e' : '#166534',
                        marginTop: '0.125rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      → {p._pendingChange.to} {formatChangeDate(p._pendingChange.when).split(',')[0]}
                    </div>
                  )}
                </td>
                <td
                  style={{
                    ...tdStyle,
                    textAlign: 'right',
                    fontFamily: 'var(--font-ui)',
                    fontVariantNumeric: 'tabular-nums',
                    fontSize: '0.8125rem',
                  }}
                >
                  {p.standard_points || p.off_peak_points || p.peak_points
                    ? `${fmtPoints(p.off_peak_points)} / ${fmtPoints(p.standard_points)} / ${fmtPoints(p.peak_points)}`
                    : '—'}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    ...tdStyle,
                    textAlign: 'center',
                    padding: '2rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  No properties match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '1rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
          }}
        >
          <button
            type="button"
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            style={{
              ...inputStyle,
              cursor: safePage === 0 ? 'not-allowed' : 'pointer',
              opacity: safePage === 0 ? 0.4 : 1,
            }}
          >
            ← Prev
          </button>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}
            disabled={safePage >= pageCount - 1}
            style={{
              ...inputStyle,
              cursor: safePage >= pageCount - 1 ? 'not-allowed' : 'pointer',
              opacity: safePage >= pageCount - 1 ? 0.4 : 1,
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
