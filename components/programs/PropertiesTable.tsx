'use client'

import { useMemo, useState } from 'react'
import type { HotelProperty } from '@/utils/supabase/queries'

type SortKey = 'name' | 'category' | 'points'
type SortDir = 'asc' | 'desc'

const REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  europe: 'Europe',
  asia_pacific: 'Asia Pacific',
  middle_east_africa: 'Middle East & Africa',
}

const PAGE_SIZE = 50

/**
 * Compares two properties by sort key. Categories are stringly typed (Hyatt
 * uses "1"-"8" for hotels, "A"-"F" for all-inclusives) — sort numerics
 * naturally and letters alphabetically, and put numerics before letters.
 */
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
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of properties) {
      if (p.category) set.add(p.category)
    }
    return [...set].sort(compareCategory)
  }, [properties])

  const regions = useMemo(() => {
    const set = new Set<string>()
    for (const p of properties) {
      if (p.region) set.add(p.region)
    }
    return [...set]
  }, [properties])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return properties.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (regionFilter !== 'all' && p.region !== regionFilter) return false
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
  }, [properties, search, categoryFilter, regionFilter, aiOnly])

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
    setPage(0)
  }

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

  return (
    <div>
      <div
        style={{
          display: 'flex',
          gap: '0.625rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '0.875rem',
        }}
      >
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(0)
          }}
          placeholder={`Search ${programName} properties — name, brand, city, country…`}
          style={{ ...inputStyle, flex: '1 1 18rem', minWidth: '14rem' }}
          aria-label="Search properties"
        />
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
            <option key={r} value={r}>{REGION_LABELS[r] ?? r}</option>
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
      </div>

      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '0.75rem',
        }}
      >
        Showing <strong>{sorted.length === 0 ? 0 : safePage * PAGE_SIZE + 1}-
        {Math.min((safePage + 1) * PAGE_SIZE, sorted.length)}</strong> of{' '}
        <strong>{sorted.length.toLocaleString()}</strong> matching{' '}
        {sorted.length === 1 ? 'property' : 'properties'}
        {sorted.length !== properties.length && (
          <>
            {' '}(of {properties.length.toLocaleString()} total){' '}
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
              clear filters
            </button>
          </>
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
                  {p.notes && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-secondary)',
                        marginTop: '0.125rem',
                      }}
                    >
                      {p.notes}
                    </div>
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
