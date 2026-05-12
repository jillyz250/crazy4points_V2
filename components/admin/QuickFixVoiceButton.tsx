'use client'

import { useState, useTransition } from 'react'
import {
  quickFixVoiceAlertAction,
  type AlertQuickFixVoiceResult,
} from '@/app/admin/(protected)/alerts/actions'

/**
 * "Quick fix" button shown inline beside a voice-check failure note.
 * Calls the AI utility that applies the failure feedback as surgical
 * edits to the existing description, saves the revision, and re-runs
 * voice check. Avoids re-running the full pipeline when only a few
 * sentences need a tonal tweak.
 */
export default function QuickFixVoiceButton({ alertId }: { alertId: string }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  function run() {
    setMsg(null)
    startTransition(async () => {
      const res: AlertQuickFixVoiceResult = await quickFixVoiceAlertAction(alertId)
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error })
        return
      }
      if (res.pass) {
        setMsg({ kind: 'ok', text: 'Voice fixed ✓' })
      } else {
        setMsg({ kind: 'err', text: 'Still failing — check the new notes' })
      }
    })
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
      <button
        type="button"
        onClick={run}
        disabled={isPending}
        title="Apply the failure note's edits via AI and re-run voice check (no full pipeline)"
        className="admin-btn admin-btn-sm"
        style={{
          background: '#fff',
          border: '1px solid #FCA5A5',
          color: '#7F1D1D',
          fontWeight: 600,
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.7 : 1,
          padding: '0.25rem 0.5rem',
          borderRadius: 'var(--radius-ui)',
          fontSize: '0.75rem',
        }}
      >
        {isPending ? 'Fixing…' : '✨ Quick fix'}
      </button>
      {msg && (
        <span
          style={{
            fontSize: '0.7rem',
            fontFamily: 'var(--font-ui)',
            color: msg.kind === 'ok' ? '#166534' : '#c0392b',
            fontWeight: 600,
          }}
        >
          {msg.text}
        </span>
      )}
    </span>
  )
}
