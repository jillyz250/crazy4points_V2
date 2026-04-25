'use client'

import { useState, useTransition } from 'react'
import { voiceCheckArticleAction, type VoiceCheckResult } from '@/app/admin/(protected)/content-ideas/actions'

export default function BrandCheckButton({
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
      setMsg({ kind: 'err', text: 'Draft first' })
      return
    }
    setMsg(null)
    startTransition(async () => {
      const res: VoiceCheckResult = await voiceCheckArticleAction(ideaId)
      if (!res.ok) setMsg({ kind: 'err', text: res.error })
      else setMsg({ kind: res.pass ? 'ok' : 'err', text: res.pass ? 'voice ✓' : 'voice ✗' })
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={run}
        disabled={isPending || !hasBody}
        title={!hasBody ? 'Draft the article first' : 'Score body against BRAND_VOICE rules'}
        className="admin-btn admin-btn-secondary admin-btn-sm"
        style={{
          cursor: !hasBody ? 'not-allowed' : isPending ? 'wait' : 'pointer',
          opacity: !hasBody || isPending ? 0.6 : 1,
        }}
      >
        {isPending ? 'Checking…' : 'Run brand check'}
      </button>
      {msg && (
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-ui)', color: msg.kind === 'ok' ? '#166534' : '#c0392b' }}>
          {msg.text}
        </span>
      )}
    </>
  )
}
