'use client'

import { useState, useTransition } from 'react'
import { updateProgramFaqUrlAction } from './actions'

export default function FaqUrlCell({
  programId,
  initialUrl,
}: {
  programId: string
  initialUrl: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState(initialUrl ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {initialUrl ? (
          <a
            href={initialUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.8125rem' }}
          >
            FAQ ↗
          </a>
        ) : (
          <span style={{ color: 'var(--admin-text-subtle)' }}>—</span>
        )}
        <button
          type="button"
          onClick={() => { setEditing(true); setError(null) }}
          className="admin-btn admin-btn-ghost admin-btn-sm"
        >
          {initialUrl ? 'Edit' : 'Set'}
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        setError(null)
        startTransition(async () => {
          const r = await updateProgramFaqUrlAction(programId, url)
          if (r.error) setError(r.error)
          else setEditing(false)
        })
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
    >
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…/faq"
          className="admin-input"
          style={{ minWidth: '18rem', fontSize: '0.8125rem' }}
          autoFocus
        />
        <button
          type="submit"
          disabled={isPending}
          className="admin-btn admin-btn-primary admin-btn-sm"
        >
          {isPending ? '…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setUrl(initialUrl ?? ''); setError(null) }}
          disabled={isPending}
          className="admin-btn admin-btn-ghost admin-btn-sm"
        >
          Cancel
        </button>
      </div>
      {error && (
        <span style={{ color: 'var(--admin-danger)', fontSize: '0.75rem' }}>{error}</span>
      )}
    </form>
  )
}
