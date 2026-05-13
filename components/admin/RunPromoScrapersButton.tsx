'use client'

import { useState, useTransition } from 'react'
import type { ScrapeBatchResult } from '@/utils/scraper/runAllScrapers'

/**
 * "Run scrapers now" button for /admin/promos. Triggers the same
 * shared runner that the daily cron uses; renders a result summary
 * inline once finished.
 *
 * The action is server-side; this component just orchestrates the
 * spinner + result display.
 */
export default function RunPromoScrapersButton({
  action,
}: {
  action: () => Promise<ScrapeBatchResult>
}) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<ScrapeBatchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = () => {
    setError(null)
    setResult(null)
    startTransition(async () => {
      try {
        const r = await action()
        setResult(r)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
      <button
        type="button"
        className="admin-btn admin-btn-primary"
        onClick={run}
        disabled={pending}
      >
        {pending ? 'Running scrapers…' : 'Run scrapers now'}
      </button>

      {result && (
        <div
          role="status"
          style={{
            padding: '0.5rem 0.75rem',
            background: result.failed > 0 ? 'var(--admin-warning-soft)' : 'var(--admin-success-soft)',
            color: result.failed > 0 ? 'var(--admin-warning)' : 'var(--admin-success)',
            border: `1px solid ${result.failed > 0 ? 'var(--admin-warning)' : 'var(--admin-success)'}`,
            borderRadius: 'var(--admin-radius)',
            fontSize: '0.8125rem',
          }}
        >
          {result.scraperCount} scraper{result.scraperCount === 1 ? '' : 's'} ran ·{' '}
          {result.results.reduce((a, r) => a + (r.items_new ?? 0), 0)} new ·{' '}
          {result.results.reduce((a, r) => a + (r.items_updated ?? 0), 0)} updated ·{' '}
          {result.failed} failed
          {result.failed > 0 && (
            <ul style={{ margin: '0.25rem 0 0', paddingLeft: '1rem' }}>
              {result.results
                .filter((r) => r.status === 'failed')
                .map((r) => (
                  <li key={r.slug}>
                    <code>{r.slug}</code>: {r.error}
                  </li>
                ))}
            </ul>
          )}
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.6875rem', opacity: 0.7 }}>
            Refresh the page to see new pending rows.
          </p>
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: '0.5rem 0.75rem',
            background: 'var(--admin-danger-soft)',
            color: 'var(--admin-danger)',
            border: '1px solid var(--admin-danger)',
            borderRadius: 'var(--admin-radius)',
            fontSize: '0.8125rem',
          }}
        >
          Failed: {error}
        </div>
      )}
    </div>
  )
}
