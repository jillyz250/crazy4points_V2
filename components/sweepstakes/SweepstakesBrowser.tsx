'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import { sweepCategory, SWEEP_CATEGORY_PILLS } from '@/lib/sweepstakes/categories'
import SweepCard from './SweepCard'

export type SweepRow = {
  id: string
  program: string
  title: string
  prize: string | null
  entry_url: string | null
  source_url: string | null
  mechanic: string | null
  ends_at: string | null
  first_seen: string | null
  image_url: string | null
  featured?: boolean | null
}

type SortKey = 'ending' | 'newest' | 'program'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'ending', label: 'Ending soonest' },
  { key: 'newest', label: 'Recently added' },
  { key: 'program', label: 'Program A–Z' },
]

export default function SweepstakesBrowser({ sweeps, initialCats }: { sweeps: SweepRow[]; initialCats?: string[] }) {
  const [sort, setSort] = useState<SortKey>('ending')
  const [selectedCats, setSelectedCats] = useState<string[]>(initialCats ?? [])
  const [q, setQ] = useState('')
  const toggleCat = (key: string) =>
    setSelectedCats((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))

  // Only show category pills that actually have sweeps behind them, with a count.
  const catCounts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const s of sweeps) m[sweepCategory(s.prize, s.title).key] = (m[sweepCategory(s.prize, s.title).key] ?? 0) + 1
    return m
  }, [sweeps])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const arr = sweeps.filter((s) => {
      if (selectedCats.length > 0 && !selectedCats.includes(sweepCategory(s.prize, s.title).key)) return false
      if (needle && !`${s.title} ${s.prize ?? ''} ${s.program}`.toLowerCase().includes(needle)) return false
      return true
    })
    if (sort === 'ending') {
      arr.sort((a, b) => {
        if (!a.ends_at && !b.ends_at) return 0
        if (!a.ends_at) return 1
        if (!b.ends_at) return -1
        return a.ends_at.localeCompare(b.ends_at)
      })
    } else if (sort === 'newest') {
      arr.sort((a, b) => (b.first_seen ?? '').localeCompare(a.first_seen ?? ''))
    } else {
      arr.sort((a, b) => a.program.localeCompare(b.program) || a.title.localeCompare(b.title))
    }
    return arr
  }, [sweeps, selectedCats, q, sort])

  // Soft-purple pill (light tint + purple border + purple text), never a dark fill.
  const softPurple: CSSProperties = { background: 'color-mix(in srgb, var(--color-primary) 12%, white)' }
  const catPill = (color: string, active: boolean): { className: string; style: CSSProperties } => ({
    className:
      'rg-tap-target inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 font-ui text-sm font-semibold shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md',
    style: active
      ? { background: color, borderColor: color, color: '#fff', boxShadow: `0 6px 16px -3px ${color}80` }
      : { background: `${color}14`, borderColor: `${color}80`, color, boxShadow: `0 2px 6px ${color}22` },
  })

  return (
    <div>
      {/* Category filter pills + search + sort */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {SWEEP_CATEGORY_PILLS.filter((c) => (catCounts[c.key] ?? 0) > 0).map((c) => {
          const active = selectedCats.includes(c.key)
          const p = catPill(c.color, active)
          return (
            <button key={c.key} type="button" className={p.className} style={p.style} aria-pressed={active} onClick={() => toggleCat(c.key)}>
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: active ? '#fff' : c.color }} aria-hidden />
              {c.label}
              <span style={{ opacity: 0.7 }}>{catCounts[c.key]}</span>
            </button>
          )
        })}
        {selectedCats.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedCats([])}
            className="font-ui text-sm text-[var(--color-text-secondary)] underline hover:text-[var(--color-primary)]"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search prizes, programs…"
          className="min-w-[12rem] flex-1 rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-2 font-body text-base"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort sweepstakes"
          className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-3 py-2 font-ui text-base"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              Sort: {s.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-3 font-ui text-sm text-[var(--color-text-secondary)]">
        {filtered.length} sweepstake{filtered.length === 1 ? '' : 's'}
      </p>

      {filtered.length === 0 ? (
        <p className="rg-sub-section text-center font-body text-[var(--color-text-secondary)]">
          No sweepstakes match those filters. Try clearing the search or a different category.
        </p>
      ) : (
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 20rem), 1fr))' }}>
          {filtered.map((s) => (
            <SweepCard key={s.id} sweep={s} />
          ))}
        </div>
      )}
    </div>
  )
}
