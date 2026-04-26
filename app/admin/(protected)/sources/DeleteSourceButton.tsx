'use client'

import { useTransition } from 'react'
import { deleteSourceAction } from './actions'

export default function DeleteSourceButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition()

  function onClick() {
    if (!confirm(`Delete source "${name}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteSourceAction(id)
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className="admin-btn admin-btn-ghost admin-btn-sm"
      style={{ color: 'var(--admin-danger, #b91c1c)' }}
      title="Delete source"
      aria-label={`Delete source ${name}`}
    >
      {isPending ? '…' : '×'}
    </button>
  )
}
