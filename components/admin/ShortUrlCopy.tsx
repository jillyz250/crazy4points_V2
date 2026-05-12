'use client'

import { useState } from 'react'

/**
 * Tiny copy-to-clipboard pill for the alert's shareable short URL.
 * Renders inline on the admin edit page so the author can grab the URL
 * for social posts without hand-assembling it from the slug.
 */
export default function ShortUrlCopy({ shortSlug }: { shortSlug: string | null }) {
  const [copied, setCopied] = useState(false)
  if (!shortSlug) return null
  const url = `https://www.crazy4points.com/a/${shortSlug}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: open prompt
      window.prompt('Copy this URL:', url)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        padding: '0.5rem 0.75rem',
        background: 'var(--color-background-soft)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-ui)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
        }}
      >
        Share URL
      </span>
      <code
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: '0.8125rem',
          color: 'var(--color-text-primary)',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {url}
      </code>
      <button
        type="button"
        onClick={copy}
        className="admin-btn admin-btn-sm"
        style={{
          padding: '0.25rem 0.625rem',
          fontSize: '0.75rem',
          background: copied ? '#D1FAE5' : '#fff',
          color: copied ? '#065F46' : 'var(--color-primary)',
          border: `1px solid ${copied ? '#A7F3D0' : 'var(--color-border-soft)'}`,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
    </div>
  )
}
