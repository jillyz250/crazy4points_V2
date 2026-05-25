'use client'

import { useState } from 'react'

export default function CopySqlButton({ sql }: { sql: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(sql)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          // Older browsers — fallback selection
          const ta = document.createElement('textarea')
          ta.value = sql
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }
      }}
      className="rg-btn-secondary"
      style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
    >
      {copied ? 'Copied ✓' : 'Copy SQL'}
    </button>
  )
}
