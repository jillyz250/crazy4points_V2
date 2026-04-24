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
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--admin-accent)',
            marginTop: '0.5rem',
            fontWeight: 600,
          }}
        >
          {selected.size} program{selected.size !== 1 ? 's' : ''} tagged
        </p>
      )}
    </div>
  )
}
