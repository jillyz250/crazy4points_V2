'use client'

import { useMemo, useState } from 'react'

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
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function endsLabel(ends: string | null): string | null {
  if (!ends) return null
  const m = ends.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const month = MONTHS[parseInt(m[2], 10) - 1]
  if (!month) return null
  return `Ends ${month} ${parseInt(m[3], 10)}`
}

// A real, followable link: prefer the entry page, fall back to the source page.
// A bare "#" or non-http value is not a link.
function enterHref(row: SweepRow): string | null {
  const entry = (row.entry_url ?? '').trim()
  if (/^https?:\/\//i.test(entry) && !entry.endsWith('#')) return entry
  const source = (row.source_url ?? '').trim()
  if (/^https?:\/\//i.test(source)) return source
  return null
}

function mechanicLabel(m: string | null): string | null {
  if (m === 'daily_entry') return 'Enter daily'
  if (m === 'one_time') return 'One-time entry'
  return null
}

type SortKey = 'ending' | 'newest' | 'program'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'ending', label: 'Ending soonest' },
  { key: 'newest', label: 'Recently added' },
  { key: 'program', label: 'Program A–Z' },
]

export default function SweepstakesBrowser({ sweeps }: { sweeps: SweepRow[] }) {
  const [sort, setSort] = useState<SortKey>('ending')

  const sorted = useMemo(() => {
    const arr = [...sweeps]
    if (sort === 'ending') {
      // Soonest deadline first; undated sweeps sink to the bottom.
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
  }, [sweeps, sort])

  return (
    <>
      <div className="mt-8 mb-5 flex items-center gap-2">
        <label
          htmlFor="sweep-sort"
          className="font-ui text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
        >
          Sort by
        </label>
        <select
          id="sweep-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-3 py-2 font-ui text-[var(--color-text-primary)]"
          style={{ fontSize: '1rem' }}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 20rem), 1fr))' }}
      >
        {sorted.map((s) => {
          const href = enterHref(s)
          const ends = endsLabel(s.ends_at)
          const mech = mechanicLabel(s.mechanic)
          return (
            <div
              key={s.id}
              className="flex flex-col rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-5"
              style={{ boxShadow: 'var(--shadow-soft)' }}
            >
              <p className="mb-1.5 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">
                {s.program}
              </p>
              <h2 className="mb-2 font-display text-xl leading-snug text-[var(--color-text-primary)]">
                {s.title}
              </h2>
              {s.prize ? (
                <p className="mb-3 font-body text-sm text-[var(--color-text-secondary)]">
                  Win <span className="font-bold text-[var(--color-accent)]">{s.prize}</span>
                </p>
              ) : null}
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                {ends ? (
                  <span className="inline-block rounded-full bg-[var(--color-accent)]/20 px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-wide text-[var(--color-primary)]">
                    {ends}
                  </span>
                ) : null}
                {mech ? (
                  <span className="font-ui text-[0.6875rem] uppercase tracking-wide text-[var(--color-text-secondary)]">
                    {mech}
                  </span>
                ) : null}
              </div>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rg-btn-primary mt-4 text-center"
                >
                  Enter now
                </a>
              ) : null}
            </div>
          )
        })}
      </div>
    </>
  )
}
