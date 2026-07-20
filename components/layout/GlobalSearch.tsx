'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SearchDoc, SearchDocType } from '@/app/api/search-index/route'

/**
 * Sitewide search.
 *
 * The corpus is ~310 items, so the whole index is fetched once (lazily, the
 * first time search opens) and filtered in memory. Results are instant with no
 * per-keystroke network or database work.
 *
 * Accessibility: the dialog is a labelled modal; the input is a combobox with
 * aria-activedescendant tracking the highlighted option, so screen readers
 * announce the selection as the reader arrows through. Escape closes, focus
 * returns to the trigger.
 */

const TYPE_LABEL: Record<SearchDocType, string> = {
  program: 'Programs',
  card: 'Cards',
  alert: 'Alerts',
  guide: 'Guides',
  experience: 'Experiences',
  blog: 'Articles',
}

// Group display order — what a reader is most likely hunting for first.
const TYPE_ORDER: SearchDocType[] = ['program', 'card', 'guide', 'alert', 'experience', 'blog']

const MAX_RESULTS = 30

/**
 * Score a document against the query. Higher is better; 0 means no match.
 * Prefers whole-title matches, then word-start matches, then substrings, so
 * typing "hyatt" puts "World of Hyatt" above an article merely mentioning it.
 */
function score(doc: SearchDoc, q: string): number {
  const name = doc.n.toLowerCase()
  const sub = (doc.s ?? '').toLowerCase()
  if (name === q) return 1000
  if (name.startsWith(q)) return 800 - name.length
  // Word-start match, e.g. "hyatt" in "World of Hyatt".
  if (new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(name)) return 600 - name.length
  if (name.includes(q)) return 400 - name.length
  if (sub.includes(q)) return 200
  return 0
}

export default function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [docs, setDocs] = useState<SearchDoc[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Fetch the index once, on first open.
  const loadIndex = useCallback(async () => {
    if (docs || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/search-index')
      const json = await res.json()
      setDocs(json.docs ?? [])
    } catch {
      setDocs([])
    } finally {
      setLoading(false)
    }
  }, [docs, loading])

  const openSearch = useCallback(() => {
    setOpen(true)
    void loadIndex()
  }, [loadIndex])

  const closeSearch = useCallback(() => {
    setOpen(false)
    setQuery('')
    setHighlight(0)
    triggerRef.current?.focus()
  }, [])

  // Cmd/Ctrl+K opens from anywhere; "/" is a common shortcut too but would
  // hijack typing in other inputs, so we deliberately only bind the modifier.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        openSearch()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openSearch])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q || !docs) return []
    return docs
      .map((d) => ({ d, sc: score(d, q) }))
      .filter((r) => r.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, MAX_RESULTS)
      .map((r) => r.d)
  }, [docs, query])

  // Grouped for display, but `flat` preserves the keyboard order so arrowing
  // moves through what's actually rendered.
  const grouped = useMemo(() => {
    const byType = new Map<SearchDocType, SearchDoc[]>()
    for (const d of results) {
      const arr = byType.get(d.t) ?? []
      arr.push(d)
      byType.set(d.t, arr)
    }
    return TYPE_ORDER.filter((t) => byType.has(t)).map((t) => ({ type: t, items: byType.get(t)! }))
  }, [results])

  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped])

  useEffect(() => {
    setHighlight(0)
  }, [query])

  const go = useCallback(
    (doc: SearchDoc) => {
      closeSearch()
      router.push(doc.u)
    },
    [closeSearch, router],
  )

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeSearch()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (flat.length ? (h + 1) % flat.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (flat.length ? (h - 1 + flat.length) % flat.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const doc = flat[highlight]
      if (doc) go(doc)
    }
  }

  // Keep the highlighted row scrolled into view as the reader arrows down.
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${highlight}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlight, open])

  let idx = -1

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openSearch}
        aria-label="Search the site"
        className="rg-tap-target inline-flex items-center justify-center rounded-lg border border-[var(--color-border-soft)] px-2.5 text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-[rgba(26,26,26,0.45)] px-4 pt-[12vh]"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeSearch()
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search Crazy4Points"
            className="w-full max-w-xl overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] shadow-[var(--shadow-elevated)]"
          >
            <div className="flex items-center gap-2 border-b border-[var(--color-border-soft)] px-4">
              <svg className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={flat.length > 0}
                aria-controls="global-search-results"
                aria-autocomplete="list"
                aria-activedescendant={flat.length ? `search-opt-${highlight}` : undefined}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search cards, programs, guides, alerts..."
                aria-label="Search cards, programs, guides and alerts"
                className="w-full bg-transparent py-4 font-body text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none"
                style={{ fontSize: '1rem' }}
              />
              <button
                type="button"
                onClick={closeSearch}
                aria-label="Close search"
                className="rg-tap-target shrink-0 px-2 font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
              >
                Esc
              </button>
            </div>

            <div id="global-search-results" ref={listRef} role="listbox" aria-label="Search results" className="max-h-[55vh] overflow-y-auto">
              {loading && (
                <p className="px-4 py-6 text-center font-body text-sm text-[var(--color-text-secondary)]">Loading…</p>
              )}

              {!loading && query.trim() === '' && (
                <p className="px-4 py-6 text-center font-body text-sm text-[var(--color-text-secondary)]">
                  Search every card, program, guide, and alert on the site.
                </p>
              )}

              {!loading && query.trim() !== '' && flat.length === 0 && (
                <p className="px-4 py-6 text-center font-body text-sm text-[var(--color-text-secondary)]">
                  Nothing matched &ldquo;{query.trim()}&rdquo;. Try a program or card name.
                </p>
              )}

              {grouped.map((g) => (
                <div key={g.type}>
                  <div className="sticky top-0 bg-[var(--color-background-soft)] px-4 py-1.5 font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
                    {TYPE_LABEL[g.type]}
                  </div>
                  {g.items.map((doc) => {
                    idx += 1
                    const i = idx
                    return (
                      <button
                        key={doc.u}
                        id={`search-opt-${i}`}
                        data-idx={i}
                        role="option"
                        aria-selected={i === highlight}
                        type="button"
                        onMouseEnter={() => setHighlight(i)}
                        onClick={() => go(doc)}
                        className={`flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left transition-colors ${
                          i === highlight ? 'bg-[var(--color-background-soft)]' : ''
                        }`}
                      >
                        <span className="font-body text-sm text-[var(--color-text-primary)]">{doc.n}</span>
                        {doc.s && (
                          <span className="shrink-0 font-ui text-[11px] text-[var(--color-text-secondary)]">{doc.s}</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
