'use client'

import { useState, useTransition } from 'react'
import {
  getSourceTextPreviewAction,
  type SourceTextPreview,
} from '@/app/admin/(protected)/content-ideas/actions'

interface Props {
  ideaId: string
}

/**
 * "View source data" panel — shows the exact source_text the fact-checker
 * received for this idea, plus a manifest of which surfaces contributed
 * (alert / intel / programs / cards).
 *
 * Closed by default. Lazy: hits the server action on first expand only,
 * then caches in component state. Avoids running the full source-text
 * build for every idea on every page render.
 *
 * Why this exists: the SourcesUsed pills tell you "your pages contributed
 * 2 claims" but not WHICH pages or what was actually in scope. Editor
 * needs to answer "did fact-check verify against my Bilt page or just
 * the source alert?" — this panel answers that directly.
 */
export default function SourceTextPanel({ ideaId }: Props) {
  const [pending, startTransition] = useTransition()
  const [preview, setPreview] = useState<SourceTextPreview | null>(null)
  const [opened, setOpened] = useState(false)

  function handleToggle(e: React.SyntheticEvent<HTMLDetailsElement>) {
    const open = (e.currentTarget as HTMLDetailsElement).open
    if (open && !opened) {
      // First expand — fetch the data.
      setOpened(true)
      startTransition(async () => {
        const result = await getSourceTextPreviewAction(ideaId)
        setPreview(result)
      })
    }
  }

  return (
    <details
      onToggle={handleToggle}
      style={{ margin: '0 0 0.75rem' }}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontSize: '0.75rem',
          color: 'var(--admin-text-muted)',
          fontFamily: 'var(--font-ui)',
          padding: '0.25rem 0',
        }}
      >
        🔍 View source data sent to fact-checker
      </summary>

      <div style={{ marginTop: '0.5rem' }}>
        {pending && (
          <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', padding: '0.5rem 0' }}>
            Loading source data…
          </div>
        )}

        {preview && !preview.ok && (
          <div
            style={{
              padding: '0.5rem 0.625rem',
              borderRadius: 'var(--admin-radius)',
              border: '1px solid var(--admin-danger)',
              background: 'var(--admin-danger-soft, #fdecea)',
              color: 'var(--admin-danger)',
              fontSize: '0.75rem',
            }}
          >
            {preview.error}
          </div>
        )}

        {preview && preview.ok && (
          <>
            {/* Manifest — what specifically contributed */}
            <div
              style={{
                marginBottom: '0.5rem',
                padding: '0.5rem 0.625rem',
                background: 'var(--admin-surface-alt)',
                border: '1px solid var(--admin-border)',
                borderRadius: 'var(--admin-radius)',
                fontSize: '0.75rem',
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--admin-text-muted)',
                  marginBottom: '0.375rem',
                }}
              >
                Surfaces in scope
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 1.25rem', listStyle: 'disc' }}>
                <li>
                  <strong>Source alert:</strong>{' '}
                  {preview.manifest.sourceAlert
                    ? preview.manifest.sourceAlert.title ?? '(untitled)'
                    : 'none tagged'}
                </li>
                <li>
                  <strong>Source intel:</strong>{' '}
                  {preview.manifest.sourceIntel
                    ? preview.manifest.sourceIntel.hasRawText
                      ? 'present (raw_text included)'
                      : 'present (no raw_text)'
                    : 'none tagged'}
                </li>
                <li>
                  <strong>Program pages ({preview.manifest.programs.length}):</strong>{' '}
                  {preview.manifest.programs.length > 0
                    ? preview.manifest.programs.map((p) => `/programs/${p.slug}`).join(', ')
                    : 'none'}
                </li>
                <li>
                  <strong>Card pages ({preview.manifest.cards.length}):</strong>{' '}
                  {preview.manifest.cards.length > 0
                    ? preview.manifest.cards.map((c) => `/cards/${c.slug}`).join(', ')
                    : 'none'}
                </li>
              </ul>
              {preview.sourceText.length === 0 && (
                <div
                  style={{
                    marginTop: '0.5rem',
                    color: 'var(--admin-warning)',
                    fontWeight: 600,
                  }}
                >
                  ⚠ No source data — fact-check ran in extract-only mode (every claim went to web verify).
                </div>
              )}
            </div>

            {/* Raw source text */}
            {preview.sourceText.length > 0 && (
              <pre
                style={{
                  padding: '0.75rem 0.875rem',
                  background: 'var(--admin-surface-alt)',
                  border: '1px solid var(--admin-border)',
                  borderRadius: 'var(--admin-radius)',
                  fontSize: '0.75rem',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  maxHeight: '20rem',
                  overflowY: 'auto',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {preview.sourceText}
              </pre>
            )}
          </>
        )}
      </div>
    </details>
  )
}
