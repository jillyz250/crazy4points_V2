'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  saveAndRunAllChecksAction,
  saveTermsAndRegenerateAction,
  factCheckAlertAction,
  voiceCheckAlertAction,
  originalityCheckAlertAction,
  type AlertPipelineResult,
} from '@/app/admin/(protected)/alerts/actions'

interface Props {
  alertId: string
}

type Status = { kind: 'ok' | 'err'; text: string } | null

/**
 * Pipeline actions for the alert edit page. Four explicit buttons covering
 * every common need so the workflow isn't a guessing game:
 *
 *   1. ⚡ Save & run full pipeline — saves T&Cs + waiver fields, then
 *      regenerates writer, fact-check, voice, originality. The kitchen sink.
 *      Use after pasting/editing T&Cs for the first time.
 *
 *   2. ↻ Save & regenerate — saves T&Cs + waiver fields, then regenerates
 *      writer + fact-check only. Skips voice + originality. Use for a quick
 *      re-write after a tweak.
 *
 *   3. 🎤 Voice check — runs only the voice gate on the current draft.
 *
 *   4. 🔍 Originality — runs only the originality check on the current draft.
 *
 * Each button reads the verified_terms + terms_waived_reason textareas from
 * the surrounding form before firing so unsaved field changes don't get
 * dropped on the floor.
 */
export default function PipelineActionsPanel({ alertId }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState<'full' | 'regen' | 'facts' | 'voice' | 'orig' | null>(null)
  const [status, setStatus] = useState<Status>(null)
  const [, startTransition] = useTransition()

  // After any pipeline action that mutates the alert, the form fields would
  // show stale values until the user manually refreshes. The edit form uses
  // uncontrolled inputs (defaultValue), so router.refresh() alone re-fetches
  // server data but the form fields don't pick it up. A full page reload is
  // the simplest fix that does what users expect: action completes → page
  // shows the new draft.
  function reloadAfterMutation() {
    router.refresh()
    // Brief delay so the success toast text renders before the reload kicks in
    setTimeout(() => window.location.reload(), 300)
  }

  function readTermsFromForm(): { verifiedTerms: string; waiverReason: string } {
    const vt = document.querySelector<HTMLTextAreaElement>(
      'textarea[name="verified_terms"]',
    )
    const wr = document.querySelector<HTMLTextAreaElement>(
      'textarea[name="terms_waived_reason"]',
    )
    return {
      verifiedTerms: vt?.value ?? '',
      waiverReason: wr?.value ?? '',
    }
  }

  function summarisePipeline(res: AlertPipelineResult): Status {
    if (!res.ok) return { kind: 'err', text: res.error }
    if (res.ready) return { kind: 'ok', text: 'Ready to publish ✓' }
    const issues: string[] = []
    if (res.facts.flagged > 0)
      issues.push(`${res.facts.flagged} likely-wrong claim${res.facts.flagged === 1 ? '' : 's'}`)
    if (!res.voice.ran) issues.push(`voice: ${res.voice.error ?? 'failed'}`)
    else if (!res.voice.pass) issues.push('voice ✗')
    if (!res.originality.ran) issues.push(`originality: ${res.originality.error ?? 'failed'}`)
    else if (!res.originality.pass) issues.push('originality ✗')
    return { kind: 'err', text: issues.join(' · ') || 'incomplete' }
  }

  function runFullPipeline() {
    if (!confirm(
      'Save terms, then regenerate writer + fact-check + voice + originality. Takes ~60-90s.',
    )) return
    setStatus(null)
    setBusy('full')
    startTransition(async () => {
      const { verifiedTerms, waiverReason } = readTermsFromForm()
      const res = await saveAndRunAllChecksAction(alertId, verifiedTerms, waiverReason)
      setStatus(summarisePipeline(res))
      setBusy(null)
      if (res.ok) reloadAfterMutation()
    })
  }

  function runRegenerate() {
    if (!confirm(
      'Save terms, then regenerate the writer (writer + fact-check only — skips voice + originality). Takes ~30-45s.',
    )) return
    setStatus(null)
    setBusy('regen')
    startTransition(async () => {
      const { verifiedTerms, waiverReason } = readTermsFromForm()
      const res = await saveTermsAndRegenerateAction(alertId, verifiedTerms, waiverReason)
      setStatus(res.ok ? { kind: 'ok', text: 'Regenerated ✓' } : { kind: 'err', text: res.error ?? 'failed' })
      setBusy(null)
      if (res.ok) reloadAfterMutation()
    })
  }

  function runFactCheck() {
    setStatus(null)
    setBusy('facts')
    startTransition(async () => {
      const res = await factCheckAlertAction(alertId)
      if (!res.ok) setStatus({ kind: 'err', text: res.error })
      else {
        setStatus({
          kind: res.flagged === 0 ? 'ok' : 'err',
          text: res.flagged === 0
            ? 'Fact-check ✓'
            : `${res.flagged} flagged of ${res.total}`,
        })
      }
      setBusy(null)
      if (res.ok) reloadAfterMutation()
    })
  }

  function runVoiceCheck() {
    setStatus(null)
    setBusy('voice')
    startTransition(async () => {
      const res = await voiceCheckAlertAction(alertId)
      if (!res.ok) setStatus({ kind: 'err', text: res.error })
      else setStatus({ kind: res.pass ? 'ok' : 'err', text: res.pass ? 'Voice ✓' : 'Voice ✗' })
      setBusy(null)
      if (res.ok) reloadAfterMutation()
    })
  }

  function runOriginality() {
    setStatus(null)
    setBusy('orig')
    startTransition(async () => {
      const res = await originalityCheckAlertAction(alertId)
      if (!res.ok) setStatus({ kind: 'err', text: res.error })
      else setStatus({ kind: res.pass ? 'ok' : 'err', text: res.pass ? 'Original ✓' : 'Originality ✗' })
      setBusy(null)
      if (res.ok) reloadAfterMutation()
    })
  }

  const anyBusy = busy !== null

  return (
    <div
      style={{
        marginBottom: '1.25rem',
        padding: '0.875rem 1rem',
        background: 'var(--admin-surface-alt, #F9FAFB)',
        border: '1px solid var(--admin-border, #E5E7EB)',
        borderRadius: 'var(--radius-ui)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--admin-text-muted)',
          marginBottom: '0.625rem',
        }}
      >
        Pipeline actions
      </div>

      <div style={{ marginBottom: '0.625rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--admin-text-muted)',
            marginBottom: '0.375rem',
          }}
        >
          Recommended after pasting T&Cs:
        </div>
        <button
          type="button"
          onClick={runFullPipeline}
          disabled={anyBusy}
          title="Save the verified_terms + waiver fields, then regenerate writer + fact-check + voice + originality."
          className="admin-btn admin-btn-primary admin-btn-sm"
          style={{ cursor: anyBusy ? 'wait' : 'pointer' }}
        >
          {busy === 'full' ? 'Saving terms + running pipeline…' : '⚡ Save & run full pipeline'}
        </button>
      </div>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.75rem',
            color: 'var(--admin-text-muted)',
            marginBottom: '0.375rem',
          }}
        >
          Or run a single step:
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={runRegenerate}
            disabled={anyBusy}
            title="Save terms then regenerate writer + fact-check only (no voice / originality)."
            className="admin-btn admin-btn-ghost admin-btn-sm"
          >
            {busy === 'regen' ? 'Regenerating…' : '↻ Save & regenerate'}
          </button>
          <button
            type="button"
            onClick={runFactCheck}
            disabled={anyBusy}
            title="Re-verify the current saved draft against raw_text + verified_terms + extra_context. Use after hand-editing description."
            className="admin-btn admin-btn-ghost admin-btn-sm"
          >
            {busy === 'facts' ? 'Fact-checking…' : '✓ Fact-check'}
          </button>
          <button
            type="button"
            onClick={runVoiceCheck}
            disabled={anyBusy}
            title="Run only the voice check (Haiku) on the current draft."
            className="admin-btn admin-btn-ghost admin-btn-sm"
          >
            {busy === 'voice' ? 'Voice checking…' : '🎤 Voice check'}
          </button>
          <button
            type="button"
            onClick={runOriginality}
            disabled={anyBusy}
            title="Run only the originality check against the source article."
            className="admin-btn admin-btn-ghost admin-btn-sm"
          >
            {busy === 'orig' ? 'Checking…' : '🔍 Originality'}
          </button>
          {status && (
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: status.kind === 'ok' ? '#166534' : '#c0392b',
                marginLeft: '0.25rem',
              }}
            >
              {status.text}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
