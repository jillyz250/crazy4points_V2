'use client'

import { useState, useTransition } from 'react'
import { checkOriginalityAction, type OriginalityActionResult } from '@/app/admin/(protected)/content-ideas/actions'

export default function CheckOriginalityButton({
  ideaId,
  hasBody,
}: {
  ideaId: string
  hasBody: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  function run() {
    if (!hasBody) {
      setMsg({ kind: 'err', text: 'Draft the article first' })
      return
    }
    setMsg(null)
    startTransition(async () => {
      const res: OriginalityActionResult = await checkOriginalityAction(ideaId)
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error })
      } else {
        setMsg({ kind: res.pass ? 'ok' : 'err', text: res.pass ? 'original ✓' : 'originality ✗' })
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={run}
        disabled={isPending || !hasBody}
        title={!hasBody ? 'Draft the article first' : 'Web-search for near-duplicate content'}
        style={{
          padding: '0.375rem 0.875rem',
          borderRadius: 'var(--radius-ui)',
          border: '1px solid var(--color-primary)',
          background: 'white',
          color: 'var(--color-primary)',
          fontSize: '0.75rem',
          fontWeight: 600,
          fontFamily: 'var(--font-ui)',
          cursor: !hasBody ? 'not-allowed' : isPending ? 'wait' : 'pointer',
          opacity: !hasBody || isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Searching…' : 'Run originality check'}
      </button>
      {msg && (
        <span
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-ui)',
            color: msg.kind === 'ok' ? '#166534' : '#c0392b',
          }}
        >
          {msg.text}
        </span>
      )}
    </>
  )
}
