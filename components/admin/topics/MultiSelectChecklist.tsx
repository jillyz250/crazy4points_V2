'use client'

import { useMemo, useState } from 'react'

export type MultiSelectOption = {
  slug: string
  name: string
  group?: string | null
}

/**
 * Searchable multi-select. Renders one hidden <input name={name}> per
 * selected option so it serializes naturally into a server-action FormData
 * (use formData.getAll(name) on the server).
 */
export function MultiSelectChecklist({
  name,
  options,
  initialSelected = [],
  placeholder = 'Search...',
  emptyMessage = 'No matches',
}: {
  name: string
  options: MultiSelectOption[]
  initialSelected?: string[]
  placeholder?: string
  emptyMessage?: string
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected))
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter(
      (o) =>
        o.slug.toLowerCase().includes(q) ||
        o.name.toLowerCase().includes(q) ||
        (o.group ?? '').toLowerCase().includes(q),
    )
  }, [options, query])

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  return (
    <div
      style={{
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-ui)',
        padding: '0.5rem',
        background: '#fff',
      }}
    >
      {/* Hidden inputs that serialize into FormData */}
      {Array.from(selected).map((slug) => (
        <input key={slug} type="hidden" name={name} value={slug} />
      ))}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '0.5rem',
          fontSize: '1rem',
          border: '1px solid var(--color-border-soft)',
          borderRadius: 'var(--radius-ui)',
          marginBottom: '0.5rem',
        }}
      />

      {selected.size > 0 && (
        <div
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            marginBottom: '0.375rem',
          }}
        >
          {selected.size} selected
        </div>
      )}

      <div
        style={{
          maxHeight: '14rem',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.125rem',
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              padding: '0.5rem',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          filtered.slice(0, 200).map((o) => {
            const checked = selected.has(o.slug)
            return (
              <label
                key={o.slug}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.25rem 0.375rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  background: checked ? 'var(--color-background-soft)' : undefined,
                  borderRadius: 'var(--radius-ui)',
                }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(o.slug)}
                />
                <span style={{ flex: 1 }}>{o.name}</span>
                <code
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {o.slug}
                </code>
              </label>
            )
          })
        )}
        {filtered.length > 200 && (
          <div
            style={{
              padding: '0.375rem',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            Showing first 200 of {filtered.length} — refine your search.
          </div>
        )}
      </div>
    </div>
  )
}
