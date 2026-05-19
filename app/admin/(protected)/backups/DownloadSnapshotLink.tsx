'use client'

import { useState } from 'react'
import { getSnapshotDownloadUrl } from './actions'

/**
 * Client-side download trigger. Calls the server action to mint a signed URL
 * (5-min TTL), then opens it in a new tab to trigger the download. Avoids
 * baking long-lived signed URLs into the rendered HTML.
 */
export default function DownloadSnapshotLink({ storagePath }: { storagePath: string }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setErr(null)
    try {
      const url = await getSnapshotDownloadUrl(storagePath)
      if (!url) {
        setErr('Failed to generate download link')
        return
      }
      window.open(url, '_blank', 'noopener')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rg-btn-secondary"
        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}
      >
        {loading ? 'Generating...' : '↓ Download'}
      </button>
      {err && (
        <span style={{ fontSize: '0.75rem', color: '#b00020' }}>{err}</span>
      )}
    </div>
  )
}
