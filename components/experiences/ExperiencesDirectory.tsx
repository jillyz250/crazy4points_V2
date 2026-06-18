'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Experience } from '@/utils/supabase/queries'

// Client-side filter/sort over the experiences directory. Data is small (~26
// rows) so everything runs in-memory; no server round-trips on filter change.

const MODE_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'redeem', label: 'Redeem points' },
  { key: 'access', label: 'Access & presales' },
  { key: 'both', label: 'Both' },
] as const

const PARENT_TYPE_LABEL: Record<string, string> = {
  hotel: 'Hotels',
  airline: 'Airlines',
  bank_currency: 'Banks & currencies',
  card_network: 'Card networks',
}

const TYPE_LABEL: Record<string, string> = {
  concert: 'Concerts',
  sports: 'Sports',
  culinary: 'Dining',
  theater: 'Theater',
  wellness: 'Wellness',
  travel: 'Travel',
  festival: 'Festivals',
  motorsports: 'Motorsports',
  family: 'Family',
  celebrity: 'Celebrity',
  luxury: 'Luxury',
  money_cant_buy: "Money-can't-buy",
}

const SORTS = [
  { key: 'az', label: 'A–Z' },
  { key: 'entry', label: 'Lowest entry point' },
  { key: 'type', label: 'Program type' },
] as const

type ModeKey = (typeof MODE_FILTERS)[number]['key']
type SortKey = (typeof SORTS)[number]['key']

function modeBadge(mode: string): { label: string; cls: string } {
  if (mode === 'redeem') return { label: 'Redeem points', cls: 'bg-[var(--color-background-soft)] text-[var(--color-primary)]' }
  if (mode === 'access') return { label: 'Access & presales', cls: 'bg-[var(--color-background-soft)] text-[var(--color-text-secondary)]' }
  return { label: 'Redeem + access', cls: 'bg-[var(--color-accent)]/15 text-[var(--color-text-primary)]' }
}

export default function ExperiencesDirectory({ experiences }: { experiences: Experience[] }) {
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<ModeKey>('all')
  const [parentType, setParentType] = useState<string>('all')
  const [expType, setExpType] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('az')

  // Facet option lists derived from the data.
  const parentTypes = useMemo(
    () => Array.from(new Set(experiences.map((e) => e.parent_type))),
    [experiences],
  )
  const expTypes = useMemo(
    () => Array.from(new Set(experiences.flatMap((e) => e.experience_types))).sort(),
    [experiences],
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let rows = experiences.filter((e) => {
      if (mode !== 'all') {
        if (mode === 'both' && e.mode !== 'both') return false
        if (mode === 'redeem' && !(e.mode === 'redeem' || e.mode === 'both')) return false
        if (mode === 'access' && !(e.mode === 'access' || e.mode === 'both')) return false
      }
      if (parentType !== 'all' && e.parent_type !== parentType) return false
      if (expType !== 'all' && !e.experience_types.includes(expType)) return false
      if (needle && !`${e.name} ${e.parent_program_label} ${e.currency}`.toLowerCase().includes(needle)) return false
      return true
    })
    rows = [...rows].sort((a, b) => {
      if (sort === 'az') return a.name.localeCompare(b.name)
      if (sort === 'type') return a.parent_type.localeCompare(b.parent_type) || a.name.localeCompare(b.name)
      // entry: lowest min_points first, NULLs last
      const am = a.min_points ?? Number.POSITIVE_INFINITY
      const bm = b.min_points ?? Number.POSITIVE_INFINITY
      return am - bm || a.name.localeCompare(b.name)
    })
    return rows
  }, [experiences, q, mode, parentType, expType, sort])

  const selectCls =
    'rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-2 font-ui text-base md:text-sm text-[var(--color-text-primary)]'

  return (
    <div>
      {/* Controls */}
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search programs…"
          className={`${selectCls} w-full md:w-64`}
          style={{ fontSize: '1rem' }}
        />
        <select value={parentType} onChange={(e) => setParentType(e.target.value)} className={selectCls} aria-label="Program type">
          <option value="all">All program types</option>
          {parentTypes.map((t) => (
            <option key={t} value={t}>{PARENT_TYPE_LABEL[t] ?? t}</option>
          ))}
        </select>
        <select value={expType} onChange={(e) => setExpType(e.target.value)} className={selectCls} aria-label="Experience type">
          <option value="all">All experience types</option>
          {expTypes.map((t) => (
            <option key={t} value={t}>{TYPE_LABEL[t] ?? t}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectCls} aria-label="Sort by">
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>Sort: {s.label}</option>
          ))}
        </select>
      </div>

      {/* Mode chips */}
      <div className="mb-8 flex flex-wrap gap-2">
        {MODE_FILTERS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`rg-tap-target rounded-full px-4 py-1.5 font-ui text-xs font-medium uppercase tracking-wide transition-colors ${
              mode === m.key
                ? 'bg-[var(--color-primary)] text-white'
                : 'border border-[var(--color-border-soft)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <p className="mb-4 font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
        {filtered.length} {filtered.length === 1 ? 'program' : 'programs'}
      </p>

      {/* Grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 20rem), 1fr))' }}>
        {filtered.map((e) => {
          const badge = modeBadge(e.mode)
          return (
            <Link
              key={e.slug}
              href={`/experiences/${e.slug}`}
              className="flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] transition-colors hover:border-[var(--color-primary)]"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="font-display text-lg leading-tight text-[var(--color-primary)]">{e.name}</h3>
              </div>
              <p className="mb-3 font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                {e.parent_program_label}
              </p>
              <div className="mb-3 flex flex-wrap gap-1.5">
                <span className={`rounded px-2 py-0.5 font-ui text-[11px] font-medium ${badge.cls}`}>{badge.label}</span>
                {e.entry_point_label && (
                  <span className="rounded bg-[var(--color-background-soft)] px-2 py-0.5 font-ui text-[11px] text-[var(--color-text-secondary)]">
                    {e.entry_point_label}
                  </span>
                )}
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-1.5">
                {e.experience_types.slice(0, 4).map((t, i) => (
                  <span key={t} className="font-ui text-[11px] text-[var(--color-text-secondary)]">
                    {i > 0 && <span className="mr-1.5 text-[var(--color-border-soft)]">·</span>}
                    {TYPE_LABEL[t] ?? t}
                  </span>
                ))}
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <p className="py-12 text-center font-body text-[var(--color-text-secondary)]">
          No programs match those filters. Try widening your search.
        </p>
      )}
    </div>
  )
}
