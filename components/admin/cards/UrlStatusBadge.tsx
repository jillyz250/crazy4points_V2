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
 * Inline "Test URL" button. Reads the sibling `<input name={inputName}>` or
 * `<textarea name={inputName}>` from the same form (or any nearby form) at
 * click-time, runs the server action, and shows a badge with the result.
 *
 * For textareas, splits by newline and validates each URL — aggregate result
 * surfaces a per-URL pass/fail count so multi-URL fields get a real signal,
 * not just "the first one works."
 *
 * No page reload — saves the 5–15 min round-trip of submitting an extraction
 * against a 404.
 */
export function TestUrlButton({
  inputName,
  action,
}: {
  inputName: string
  action: (formData: FormData) => Promise<UrlCheckResult>
}) {
  const [result, setResult] = useState<UrlCheckResult | null>(null)
  const [aggregate, setAggregate] = useState<{ ok: number; fail: number; total: number } | null>(null)
  const [pending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const button = e.currentTarget
    const form = button.closest('form')
    const input = form?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `input[name="${inputName}"], textarea[name="${inputName}"]`,
    )
    const raw = input?.value?.trim() ?? ''
    if (!raw) {
      setResult({ ok: false, status: 0, reason: 'unreachable' })
      setAggregate(null)
      return
    }

    // Split on newlines for textareas; single-URL inputs become a one-item list.
    const urls = raw.split(/\n+/).map((u) => u.trim()).filter((u) => u.length > 0)

    startTransition(async () => {
      if (urls.length === 1) {
        const fd = new FormData()
        fd.set('url', urls[0])
        try {
          setResult(await action(fd))
          setAggregate(null)
        } catch {
          setResult({ ok: false, status: 0, reason: 'unreachable' })
        }
        return
      }

      // Multi-URL: run all in parallel, aggregate counts.
      const results = await Promise.all(
        urls.map(async (u) => {
          const fd = new FormData()
          fd.set('url', u)
          try {
            return await action(fd)
          } catch {
            return { ok: false as const, status: 0, reason: 'unreachable' as const }
          }
        }),
      )
      const ok = results.filter((r) => r.ok).length
      const fail = results.length - ok
      setAggregate({ ok, fail, total: results.length })
      setResult(null)
    })
  }

  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-white px-3 py-1.5 font-ui text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-background-soft)] disabled:opacity-50"
        style={{ minHeight: '44px' }}
      >
        {pending ? 'Testing…' : 'Test URL'}
      </button>
      {aggregate ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-ui text-[10px] font-semibold ${
            aggregate.fail === 0
              ? 'bg-emerald-100 text-emerald-900'
              : aggregate.ok === 0
                ? 'bg-red-100 text-red-900'
                : 'bg-amber-100 text-amber-900'
          }`}
          title={`${aggregate.ok}/${aggregate.total} URL(s) reachable`}
        >
          {aggregate.fail === 0
            ? `✅ ${aggregate.ok}/${aggregate.total} OK`
            : `${aggregate.ok}/${aggregate.total} OK · ${aggregate.fail} failed`}
        </span>
      ) : (
        <UrlStatusBadgeView result={result} />
      )}
    </span>
  )
}
