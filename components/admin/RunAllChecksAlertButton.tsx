'use client'

import { useState, useTransition } from 'react'
import {
  saveAndRunAllChecksAction,
  type AlertPipelineResult,
} from '@/app/admin/(protected)/alerts/actions'

/**
 * Run the full alert pipeline (regenerate → fact-check → brand voice →
 * originality). Reads the current Verified Terms textarea value from the
 * surrounding form FIRST and persists it, so admins don't have to click
 * "Save Changes" before "Run all checks" — the previous flow silently
 * regenerated from the old DB value when they pasted new terms and clicked.
 */
export default function RunAllChecksAlertButton({ alertId }: { alertId: string }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  function run() {
    if (
      !confirm(
        'Save the form\'s Verified Terms field, then run the full pipeline (regenerate writer + fact-check + brand + originality)? Takes ~60-90 seconds.',
      )
    )
      return

    // Pull the current verified_terms value from the form. If the user
    // pasted T&Cs but hasn't clicked "Save Changes" yet, this captures them
    // so the regenerate step actually sees them as ground truth.
    const textarea = document.querySelector<HTMLTextAreaElement>(
      'textarea[name="verified_terms"]',
    )
    const verifiedTerms = textarea?.value ?? ''

    setMsg(null)
    startTransition(async () => {
      const res: AlertPipelineResult = await saveAndRunAllChecksAction(
        alertId,
        verifiedTerms,
      )
      if (!res.ok) {
        setMsg({ kind: 'err', text: res.error })
        return
      }
      if (res.ready) {
        setMsg({ kind: 'ok', text: 'Ready to publish ✓' })
        return
      }
      const issues: string[] = []
      if (res.facts.flagged > 0)
        issues.push(
          `${res.facts.flagged} likely-wrong claim${res.facts.flagged === 1 ? '' : 's'}`,
        )
      if (!res.voice.ran) issues.push(`voice: ${res.voice.error ?? 'failed'}`)
      else if (!res.voice.pass) issues.push('voice ✗')
      if (!res.originality.ran)
        issues.push(`originality: ${res.originality.error ?? 'failed'}`)
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
        title="Save the verified terms field, then regenerate + fact-check + brand + originality in one pass"
        className="admin-btn admin-btn-primary admin-btn-sm"
        style={{
          cursor: isPending ? 'wait' : 'pointer',
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? 'Saving terms + running pipeline…' : '⚡ Save terms & run all checks'}
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
