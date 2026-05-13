'use client'

import { useFormStatus } from 'react-dom'

/**
 * Submit button that knows when the form action is pending.
 *
 * Server actions can take 30-60 seconds (Firecrawl + Sonnet). Without a
 * loading state the editor has no idea if anything is happening. This
 * uses useFormStatus to:
 *   - Disable the button while pending (prevents double-submit)
 *   - Swap the label to "Extracting…"
 *   - Render an animated spinner glyph
 *   - Show an inline status line below the button so the editor knows
 *     the click registered
 */
export default function RunExtractionButton() {
  const { pending } = useFormStatus()
  return (
    <div className="flex flex-col gap-1">
      <button
        type="submit"
        disabled={pending}
        className="rg-btn-primary disabled:cursor-not-allowed disabled:opacity-60"
        aria-busy={pending}
      >
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner />
            Extracting…
          </span>
        ) : (
          'Run extraction'
        )}
      </button>
      {pending ? (
        <p className="font-body text-xs text-[var(--color-text-secondary)]">
          Scraping the page, running Sonnet, saving to the database. This takes 30–60 seconds — don&rsquo;t leave the page.
        </p>
      ) : null}
    </div>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
    />
  )
}
