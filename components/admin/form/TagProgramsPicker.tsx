'use client'

import { useState } from 'react'
import type { Program, ProgramType } from '@/utils/supabase/queries'
import { PROGRAM_TYPE_LABELS, groupProgramsByType } from '@/lib/admin/programTypes'
import { fieldStyle, labelStyle } from './styles'

interface Props {
  programs: Pick<Program, 'id' | 'name' | 'type'>[]
  defaultSelected?: string[]
  name?: string
  label?: string
  hint?: string
}

export default function TagProgramsPicker({
  programs,
  defaultSelected = [],
  name = 'tagged_program_ids',
  label = 'Tag Programs',
  hint = 'Select all programs this alert is relevant to (United, Chase, El Al, etc.)',
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultSelected))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const grouped = groupProgramsByType(programs)

  return (
    <div style={{ ...fieldStyle, marginBottom: '1.5rem' }}>
      <div style={labelStyle}>{label}</div>
      <p
        style={{
          fontSize: '0.75rem',
          color: 'var(--admin-text-muted)',
          marginBottom: '0.625rem',
        }}
      >
        {hint}
      </p>
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <div
        style={{
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--admin-radius)',
          maxHeight: '280px',
          overflowY: 'auto',
          background: 'var(--admin-surface)',
        }}
      >
        {Object.entries(grouped).map(([type, progs]) => (
          <div key={type}>
            <div
              style={{
                padding: '0.375rem 0.625rem',
                fontSize: '0.6875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--admin-text-muted)',
                background: 'var(--admin-surface-alt)',
                borderBottom: '1px solid var(--admin-border)',
              }}
            >
              {PROGRAM_TYPE_LABELS[type as ProgramType] ?? type}
            </div>
            {progs.map((p) => (
              <label
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0.625rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--admin-border)',
                  fontSize: '0.875rem',
                  background: selected.has(p.id) ? 'var(--admin-accent-soft)' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  style={{ accentColor: 'var(--admin-accent)' }}
                />
                {p.name}
              </label>
            ))}
          </div>
        ))}
      </div>
      {selected.size > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--admin-accent)',
              marginBottom: '0.375rem',
              fontWeight: 600,
            }}
          >
            {selected.size} program{selected.size !== 1 ? 's' : ''} tagged
          </p>
          {/* List the currently-checked program names as removable pills so
              the editor can see what's tagged without scrolling the full
              list above. Click the × on a pill to untag. */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
            {programs
              .filter((p) => selected.has(p.id))
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  title="Click to remove this tag"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    padding: '0.25rem 0.5rem 0.25rem 0.625rem',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--color-primary)',
                    background: 'var(--color-background-soft)',
                    border: '1px solid var(--color-primary)',
                    borderRadius: '999px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-ui)',
                  }}
                >
                  {p.name}
                  <span
                    aria-hidden
                    style={{
                      fontSize: '0.875rem',
                      lineHeight: 1,
                      opacity: 0.6,
                    }}
                  >
                    ×
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
