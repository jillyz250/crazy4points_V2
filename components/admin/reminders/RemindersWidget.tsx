'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Reminder } from '@/utils/supabase/queries'
import { addReminder, toggleReminderDone, deleteReminder } from '@/app/admin/(protected)/reminders/actions'

/** Today's date as a YYYY-MM-DD string in ET, for due-date comparisons. */
function todayET(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

function daysBetween(fromYmd: string, toYmd: string): number {
  const a = new Date(fromYmd + 'T00:00:00Z').getTime()
  const b = new Date(toYmd + 'T00:00:00Z').getTime()
  return Math.round((b - a) / (1000 * 60 * 60 * 24))
}

type DueState = { tone: string; label: string }

function dueState(due: string | null): DueState | null {
  if (!due) return null
  const today = todayET()
  const delta = daysBetween(today, due) // negative = overdue
  if (delta < 0) return { tone: 'var(--admin-danger)', label: `overdue ${Math.abs(delta)}d` }
  if (delta === 0) return { tone: 'var(--admin-danger)', label: 'due today' }
  if (delta <= 7) return { tone: 'var(--admin-warning)', label: `in ${delta}d` }
  // Show an absolute date for anything further out.
  const d = new Date(due + 'T00:00:00Z')
  return { tone: 'var(--admin-text-muted)', label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) }
}

export default function RemindersWidget({ reminders }: { reminders: Reminder[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [sortMode, setSortMode] = useState<'due' | 'added'>('due')

  const done = reminders.filter((r) => r.status === 'done')
  const open = reminders
    .filter((r) => r.status === 'open')
    .sort((a, b) => {
      if (sortMode === 'added') return a.created_at < b.created_at ? 1 : -1 // newest first
      // by due date: soonest first, undated items last
      if (a.due_date && b.due_date) return a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0
      if (a.due_date) return -1
      if (b.due_date) return 1
      return a.created_at < b.created_at ? 1 : -1
    })

  function submit() {
    const t = title.trim()
    if (!t) return
    startTransition(async () => {
      await addReminder({ title: t, dueDate: due || null })
      setTitle('')
      setDue('')
      router.refresh()
    })
  }

  function toggle(id: string, nowDone: boolean) {
    startTransition(async () => {
      await toggleReminderDone(id, nowDone)
      router.refresh()
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteReminder(id)
      router.refresh()
    })
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, color: 'var(--admin-text-muted)' }}>
          To-do &amp; reminders
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div
            role="group"
            aria-label="Sort reminders"
            style={{ display: 'inline-flex', border: '1px solid var(--admin-border)', borderRadius: '0.375rem', overflow: 'hidden' }}
          >
            {([['due', 'Date'], ['added', 'Added']] as const).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortMode(mode)}
                aria-pressed={sortMode === mode}
                title={mode === 'due' ? 'Sort by due date (soonest first)' : 'Sort by most recently added'}
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  padding: '0.25rem 0.5rem',
                  border: 'none',
                  background: sortMode === mode ? 'var(--admin-accent)' : 'transparent',
                  color: sortMode === mode ? '#fff' : 'var(--admin-text-muted)',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {open.length > 0 && (
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
              {open.length} open
            </span>
          )}
        </div>
      </div>

      {/* Add form */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          placeholder="Add a to-do…"
          aria-label="Reminder text"
          style={{
            flex: '1 1 12rem',
            minWidth: '10rem',
            fontSize: '1rem',
            padding: '0.5rem 0.625rem',
            border: '1px solid var(--admin-border)',
            borderRadius: '0.375rem',
            background: 'var(--admin-bg)',
            color: 'var(--admin-text)',
          }}
        />
        <input
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          aria-label="Due date (optional)"
          title="Due date (optional)"
          style={{
            fontSize: '1rem',
            padding: '0.5rem 0.625rem',
            border: '1px solid var(--admin-border)',
            borderRadius: '0.375rem',
            background: 'var(--admin-bg)',
            color: 'var(--admin-text)',
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={isPending || !title.trim()}
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            padding: '0.5rem 0.875rem',
            border: 'none',
            borderRadius: '0.375rem',
            background: 'var(--admin-accent)',
            color: '#fff',
            cursor: isPending || !title.trim() ? 'default' : 'pointer',
            opacity: isPending || !title.trim() ? 0.6 : 1,
            minHeight: '44px',
          }}
        >
          Add
        </button>
      </div>

      {/* Open items */}
      {open.length === 0 && done.length === 0 ? (
        <div style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)' }}>
          Nothing on the list. Add a to-do above.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
          {open.map((r) => {
            const ds = dueState(r.due_date)
            return (
              <li key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem' }}>
                <button
                  type="button"
                  onClick={() => toggle(r.id, true)}
                  aria-label="Mark done"
                  title="Mark done"
                  style={{
                    flexShrink: 0,
                    width: '1.15rem',
                    height: '1.15rem',
                    borderRadius: '50%',
                    border: '1.5px solid var(--admin-border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
                <span style={{ flex: 1, fontWeight: 500 }}>
                  {r.link ? (
                    <Link href={r.link} style={{ color: 'inherit' }}>{r.title}</Link>
                  ) : (
                    r.title
                  )}
                </span>
                {ds && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: ds.tone, whiteSpace: 'nowrap' }}>
                    {ds.label}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  aria-label="Delete"
                  title="Delete"
                  style={{
                    flexShrink: 0,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--admin-text-muted)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    lineHeight: 1,
                    padding: '0.25rem',
                  }}
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* Done items */}
      {done.length > 0 && (
        <details style={{ marginTop: '0.875rem' }}>
          <summary style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', cursor: 'pointer' }}>
            Done ({done.length})
          </summary>
          <ul style={{ listStyle: 'none', padding: '0.5rem 0 0', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
            {done.map((r) => (
              <li key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.875rem' }}>
                <button
                  type="button"
                  onClick={() => toggle(r.id, false)}
                  aria-label="Mark not done"
                  title="Mark not done"
                  style={{
                    flexShrink: 0,
                    width: '1.15rem',
                    height: '1.15rem',
                    borderRadius: '50%',
                    border: '1.5px solid var(--admin-success)',
                    background: 'var(--admin-success)',
                    color: '#fff',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: '0.75rem',
                    lineHeight: 1,
                  }}
                >
                  ✓
                </button>
                <span style={{ flex: 1, color: 'var(--admin-text-muted)', textDecoration: 'line-through' }}>
                  {r.title}
                </span>
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  aria-label="Delete"
                  title="Delete"
                  style={{
                    flexShrink: 0,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--admin-text-muted)',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    lineHeight: 1,
                    padding: '0.25rem',
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
