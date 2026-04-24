'use client'

import { useState, useTransition } from 'react'
import { updateProgramFaqContentAction } from './actions'

const STALE_DAYS = 30

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function freshnessLabel(days: number | null): { text: string; stale: boolean } {
  if (days === null) return { text: 'Never', stale: true }
  if (days === 0) return { text: 'Today', stale: false }
  if (days === 1) return { text: '1 day ago', stale: false }
  return { text: `${days} days ago`, stale: days > STALE_DAYS }
}

export default function FaqContentEditor({
  programId,
  programName,
  initialContent,
  initialUpdatedAt,
}: {
  programId: string
  programName: string
  initialContent: string | null
  initialUpdatedAt: string | null
}) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState(initialContent ?? '')
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const fresh = freshnessLabel(daysSince(updatedAt))
  const hasContent = (initialContent ?? '').trim().length > 0

  function save() {
    setError(null)
    const next = content.trim() ? content : null
    startTransition(async () => {
      const res = await updateProgramFaqContentAction(programId, next)
      if (res?.error) {
        setError(res.error)
        return
      }
      setUpdatedAt(next ? new Date().toISOString() : null)
      setOpen(false)
    })
  }

  function cancel() {
    setContent(initialContent ?? '')
    setError(null)
    setOpen(false)
  }

  if (!open) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
        <span
          style={{
            padding: '0.125rem 0.5rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            background: fresh.stale ? 'var(--admin-warning-bg, #fef3c7)' : 'var(--admin-bg-subtle, #f3f4f6)',
            color: fresh.stale ? 'var(--admin-warning, #92400e)' : 'var(--admin-text-muted)',
            fontWeight: 500,
          }}
          title={hasContent ? `FAQ content last updated ${fresh.text}` : 'No FAQ content pasted yet'}
        >
          {fresh.stale ? '⚠ ' : ''}{fresh.text}
        </span>
        <button
          type="button"
          className="admin-btn admin-btn-ghost admin-btn-sm"
          onClick={() => setOpen(true)}
        >
          {hasContent ? 'Edit' : 'Add'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '20rem' }}>
      <label style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
        FAQ / terms content for {programName}
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        placeholder="Paste curated fee tables, tier rules, exclusions, etc. The writer treats this as authoritative when drafting alerts."
        className="admin-input"
        style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: '0.8125rem' }}
      />
      {error && (
        <div style={{ color: 'var(--admin-danger)', fontSize: '0.8125rem' }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          type="button"
          onClick={save}
          disabled={isPending}
          className="admin-btn admin-btn-primary admin-btn-sm"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={cancel}
          disabled={isPending}
          className="admin-btn admin-btn-ghost admin-btn-sm"
        >
          Cancel
        </button>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--admin-text-muted)', alignSelf: 'center' }}>
          {content.length.toLocaleString()} chars
        </span>
      </div>
    </div>
  )
}
