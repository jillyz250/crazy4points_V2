'use client'

import { useState } from 'react'

/** Generic copy-to-clipboard button for the admin. */
export default function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="admin-btn admin-btn-ghost"
      style={{ fontSize: '0.8125rem' }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        } catch {
          setCopied(false)
        }
      }}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}
