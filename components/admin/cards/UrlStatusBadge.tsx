'use client'

import { useState, useTransition } from 'react'
import type { UrlCheckResult } from '@/utils/admin/checkUrl'

/**
 * Pure-presentational badge used inline next to a configured URL on the
 * extract page. Keeps the visual vocabulary consistent across server-rendered
 * status (Configured URLs summary) and client-rendered status (Test URL
 * button result).
 */
export function UrlStatusBadgeView({ result }: { result: UrlCheckResult | null }) {
  if (!result) return null

  if (result.ok && 'redirectedTo' in result) {
    return (
      <span
        className="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-ui text-[10px] font-semibold text-amber-900"
        title={`Redirected to ${result.redirectedTo}`}
      >
        ⚠️ {result.status} redirected
      </span>
    )
  }

  if (result.ok) {
    return (
      <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-ui text-[10px] font-semibold text-emerald-900">
        ✅ {result.status} OK
      </span>
    )
  }

  const label =
    result.reason === 'not_found'
      ? `${result.status || '404'} not found`
      : result.reason === 'forbidden'
        ? `${result.status} blocked`
        : result.reason === 'server_error'
          ? `${result.status} server error`
          : result.reason === 'timeout'
            ? 'timed out'
            : 'unreachable'

  return (
    <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-ui text-[10px] font-semibold text-red-900">
      ❌ {label}
    </span>
  )
}

/**
 * Inline "Test URL" button. Reads the sibling `<input name={inputName}>` from
 * the same form (or any nearby form) at click-time, runs the server action,
 * and shows a badge with the result. No page reload — saves the 5–15 min
 * round-trip of submitting an extraction against a 404.
 */
export function TestUrlButton({
  inputName,
  action,
}: {
  inputName: string
  action: (formData: FormData) => Promise<UrlCheckResult>
}) {
  const [result, setResult] = useState<UrlCheckResult | null>(null)
  const [pending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const button = e.currentTarget
    const form = button.closest('form')
    const input = form?.querySelector<HTMLInputElement>(`input[name="${inputName}"]`)
    const url = input?.value?.trim() ?? ''
    if (!url) {
      setResult({ ok: false, status: 0, reason: 'unreachable' })
      return
    }
    const fd = new FormData()
    fd.set('url', url)
    startTransition(async () => {
      try {
        const r = await action(fd)
        setResult(r)
      } catch {
        setResult({ ok: false, status: 0, reason: 'unreachable' })
      }
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-3 py-1.5 font-ui text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-background-soft)] disabled:opacity-50"
        style={{ minHeight: '44px' }}
      >
        {pending ? 'Testing…' : 'Test URL'}
      </button>
      <UrlStatusBadgeView result={result} />
    </span>
  )
}
