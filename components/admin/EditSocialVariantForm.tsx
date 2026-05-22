'use client'

import { useState, useTransition } from 'react'
import { regenerateSocialVariantAction } from '@/app/admin/(protected)/social/actions'

const CHAR_CAPS: Record<string, number> = {
  facebook: 63206,
  instagram: 2200,
  linkedin: 3000,
  x: 280,
}

const PLATFORM_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
}

interface Props {
  variantId: string
  format: string
  initialBody: string
  hashtags: string[]
  generationGroupId: string | null
  status: string
}

export default function EditSocialVariantForm({
  variantId,
  format,
  initialBody,
  hashtags,
  generationGroupId,
  status,
}: Props) {
  const [body, setBody] = useState(initialBody)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const cap = CHAR_CAPS[format] ?? 280
  const charCount = body.length
  const overCap = charCount > cap
  const tightWarning = format === 'x' && charCount > cap - 20 && !overCap

  async function copyToClipboard() {
    setError(null)
    // 1. Modern path — navigator.clipboard. Requires secure context + user gesture.
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(body)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
        return
      } catch (err) {
        // Fall through to legacy path if the modern one rejects
        // (some browsers block on focus issues or permission policy).
        console.warn('[copyToClipboard] navigator.clipboard failed, trying execCommand:', err)
      }
    }
    // 2. Legacy fallback — select the existing textarea + document.execCommand.
    try {
      const ta = document.getElementById('variant-body') as HTMLTextAreaElement | null
      if (!ta) throw new Error('textarea not found')
      ta.focus()
      ta.select()
      ta.setSelectionRange(0, ta.value.length)
      const ok = document.execCommand('copy')
      if (!ok) throw new Error('execCommand returned false')
      ta.blur()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      setError(`Clipboard copy failed — select the text manually. (${err instanceof Error ? err.message : 'unknown'})`)
    }
  }

  function regenerate() {
    setError(null)
    startTransition(async () => {
      const res = await regenerateSocialVariantAction(variantId)
      if (res.ok) {
        // Reload to fetch the new body from the server.
        window.location.reload()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div style={{ maxWidth: '720px', display: 'grid', gap: '1.25rem' }}>
      {/* Header strip — platform + status + group context */}
      <div
        style={{
          padding: '0.75rem 1rem',
          background: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--radius-ui)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--admin-text)' }}>
            {PLATFORM_LABELS[format] ?? format}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            status: {status}
            {generationGroupId && ` · group: ${generationGroupId.slice(0, 8)}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={copyToClipboard}
            className="admin-btn admin-btn-secondary admin-btn-sm"
            disabled={!body.trim()}
          >
            {copied ? '✓ Copied' : 'Copy to clipboard'}
          </button>
          <button
            type="button"
            onClick={regenerate}
            disabled={pending}
            className="admin-btn admin-btn-ghost admin-btn-sm"
          >
            {pending ? 'Regenerating…' : '↻ Regenerate'}
          </button>
        </div>
      </div>

      {/* Body editor */}
      <div>
        <label
          htmlFor="variant-body"
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--admin-text-muted)',
            marginBottom: '0.375rem',
          }}
        >
          Variant body
        </label>
        <textarea
          id="variant-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={format === 'x' ? 6 : format === 'linkedin' ? 18 : 12}
          style={{
            width: '100%',
            padding: '0.75rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            lineHeight: 1.5,
            border: `1px solid ${overCap ? 'var(--admin-danger, #dc2626)' : 'var(--admin-border)'}`,
            borderRadius: 'var(--radius-ui)',
            background: 'var(--admin-bg)',
            color: 'var(--admin-text)',
            resize: 'vertical',
          }}
        />
        <div
          style={{
            marginTop: '0.375rem',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: overCap ? 'var(--admin-danger, #dc2626)' : tightWarning ? 'var(--admin-warning, #b45309)' : 'var(--admin-text-muted)',
          }}
        >
          <span>
            {charCount.toLocaleString()} / {cap.toLocaleString()} chars
            {overCap && ' — OVER LIMIT'}
            {tightWarning && ' — getting tight'}
          </span>
          {hashtags.length > 0 && (
            <span>
              {hashtags.length} hashtag{hashtags.length === 1 ? '' : 's'}: {hashtags.slice(0, 4).join(' ')}
              {hashtags.length > 4 && ` +${hashtags.length - 4}`}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--admin-danger, #dc2626)' }}>
          ✗ {error}
        </p>
      )}

      <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontStyle: 'italic' }}>
        Note: editing the body here doesn&apos;t persist yet — copy to clipboard and paste to
        the platform. Body persistence + voice-check will land in a follow-up. Regenerate
        rewrites this variant via Sonnet, keeping the bundle&apos;s narrative spine intact.
      </p>
    </div>
  )
}
