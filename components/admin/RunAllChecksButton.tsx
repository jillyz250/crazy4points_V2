'use client'

import { useState, useTransition } from 'react'
import { runAllChecksAction, type PipelineResult } from '@/app/admin/(protected)/content-ideas/actions'

export default function RunAllChecksButton({ ideaId }: { ideaId: string }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  function run() {
    if (!confirm('Run the full pipeline (write if missing → fact-check + brand + originality)? This takes ~60–90 seconds.')) return
    setMsg(null)
    startTransition(async () => {
      const res: PipelineResult = await runAllChecksAction(ideaId)
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error })
        return
      }
      if (res.ready) {
        setMsg({ kind: 'ok', text: 'Ready to publish ✓' })
        return
      }
      const issues: string[] = []
      if (!res.facts.ran) issues.push(`facts: ${res.facts.error ?? 'failed'}`)
      else if (res.facts.flagged > 0) issues.push(`${res.facts.flagged} flagged`)
      if (!res.voice.ran) issues.push(`voice: ${res.voice.error ?? 'failed'}`)
      else if (!res.voice.pass) issues.push('voice ✗')
      if (!res.originality.ran) issues.push(`originality: ${res.originality.error ?? 'failed'}`)
      else if (!res.originality.pass) issues.push('originality ✗')
      setMsg({ kind: 'err', text: issues.join(' · ') || 'incomplete' })
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={run}
        disabled={isPending}
        title="Runs the full pipeline (write if missing, then 3 checks in parallel)"
        className="admin-btn admin-btn-primary admin-btn-sm"
        style={{
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Running pipeline…' : '⚡ Run all checks'}
      </button>
      {msg && (
        <span
          style={{
            fontSize: '0.75rem',
            fontFamily: 'var(--font-ui)',
            color: msg.kind === 'ok' ? '#166534' : '#c0392b',
            fontWeight: 600,
          }}
        >
          {msg.text}
        </span>
      )}
    </>
  )
}
