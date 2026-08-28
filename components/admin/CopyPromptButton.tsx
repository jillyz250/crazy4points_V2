'use client'

import { useState } from 'react'

/** Copy a creative's Copilot prompt to the clipboard, so reusing it for the next
 *  experience is one click (then swap the team colors + details). */
export default function CopyPromptButton({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="admin-btn admin-btn-ghost"
      style={{ fontSize: '0.8125rem' }}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(prompt)
          setCopied(true)
          setTimeout(() => setCopied(false), 1600)
        } catch {
          setCopied(false)
        }
      }}
    >
      {copied ? '✓ Copied' : 'Copy prompt'}
    </button>
  )
}
