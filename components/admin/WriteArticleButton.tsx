'use client'

import { useState, useTransition } from 'react'
import { writeArticleAction, type WriteArticleResult } from '@/app/admin/(protected)/content-ideas/actions'

export default function WriteArticleButton({
  ideaId,
  hasBody,
}: {
  ideaId: string
  hasBody: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [lastError, setLastError] = useState<string | null>(null)

  function run() {
    const prompt = hasBody
      ? 'Rewrite this article? The existing body and verification stamps will be replaced.'
      : 'Draft this article now?'
    if (!confirm(prompt)) return
    setLastError(null)
    startTransition(async () => {
      const res: WriteArticleResult = await writeArticleAction(ideaId)
      if (!res.ok) setLastError(res.error)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={run}
        disabled={isPending}
        style={{
          padding: '0.375rem 0.875rem',
          borderRadius: 'var(--radius-ui)',
          border: '1px solid var(--color-primary)',
          background: hasBody ? 'white' : 'var(--color-primary)',
          color: hasBody ? 'var(--color-primary)' : 'white',
          fontSize: '0.75rem',
          fontWeight: 600,
          fontFamily: 'var(--font-ui)',
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Writing…' : hasBody ? 'Rewrite draft' : 'Write draft'}
      </button>
      {lastError && (
        <span style={{ fontSize: '0.75rem', color: '#c0392b', fontFamily: 'var(--font-ui)' }}>
          {lastError}
        </span>
      )}
    </>
  )
}
