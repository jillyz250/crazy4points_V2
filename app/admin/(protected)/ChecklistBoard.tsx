'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export type ChecklistStepData = {
  id: string
  title: string
  time?: string
  hint: string
  href?: string
  cta?: string
  count?: number
  muted?: boolean
}
export type ChecklistGroupData = { label: string; note?: string; numbered: boolean; steps: ChecklistStepData[] }

/**
 * Interactive daily checklist. Click the circled marker to mark a step done —
 * it turns green with a ✓ and the row fades. State is stored in the browser
 * (localStorage), keyed by the day, so it survives a refresh and auto-resets
 * each morning. One-device by design — no backend.
 */
export default function ChecklistBoard({
  groups,
  dateLabel,
  dayKey,
}: {
  groups: ChecklistGroupData[]
  dateLabel: string
  dayKey: string
}) {
  const [done, setDone] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(dayKey)
      if (raw) setDone(new Set(JSON.parse(raw) as string[]))
    } catch {}
    setLoaded(true)
  }, [dayKey])

  function toggle(id: string) {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem(dayKey, JSON.stringify([...next]))
      } catch {}
      return next
    })
  }

  const totalCheckable = groups.reduce((n, g) => n + g.steps.length, 0)
  const doneCount = [...done].filter((id) => groups.some((g) => g.steps.some((s) => s.id === id))).length
  let n = 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1rem' }}>Your day</h2>
        <span style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>{dateLabel}</span>
        {loaded && doneCount > 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--admin-success, #1D9E75)', marginLeft: 'auto', fontWeight: 600 }}>
            {doneCount}/{totalCheckable} done
          </span>
        )}
      </div>

      {groups.map((g) => (
        <div key={g.label} style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: '0.5rem' }}>
            {g.label}{g.note ? ` · ${g.note}` : ''}
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {g.steps.map((s) => {
              const label = g.numbered ? ++n : '·'
              const isDone = done.has(s.id)
              return (
                <li key={s.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', opacity: isDone ? 0.55 : s.muted ? 0.72 : 1 }}>
                  <button
                    type="button"
                    onClick={() => toggle(s.id)}
                    aria-pressed={isDone}
                    aria-label={isDone ? `Mark "${s.title}" not done` : `Mark "${s.title}" done`}
                    style={{
                      flexShrink: 0, width: '1.5rem', height: '1.5rem', borderRadius: '50%',
                      background: isDone ? 'var(--admin-success, #1D9E75)' : 'var(--admin-bg-subtle, #F1EFE8)',
                      color: isDone ? '#fff' : 'var(--admin-text)',
                      border: isDone ? 'none' : '1px solid var(--admin-border, #D3D1C7)',
                      fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: '0.0625rem', cursor: 'pointer', padding: 0,
                    }}
                  >
                    {isDone ? '✓' : label}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9375rem', textDecoration: isDone ? 'line-through' : 'none' }}>{s.title}</span>
                      {typeof s.count === 'number' && (
                        <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0.0625rem 0.375rem', borderRadius: '999px', background: s.count > 0 ? 'var(--admin-warning-bg, #FAEEDA)' : 'var(--admin-bg-subtle, #F1EFE8)', color: s.count > 0 ? 'var(--admin-warning, #854F0B)' : 'var(--admin-text-muted)' }}>
                          {s.count} new
                        </span>
                      )}
                      {s.time && <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{s.time}</span>}
                      {s.href && (
                        <Link href={s.href} style={{ fontSize: '0.8125rem', marginLeft: 'auto', fontWeight: 500 }}>
                          {s.cta ?? 'Open'} →
                        </Link>
                      )}
                    </div>
                    <p style={{ margin: '0.125rem 0 0', fontSize: '0.8125rem', color: 'var(--admin-text-muted)', lineHeight: 1.45 }}>{s.hint}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
