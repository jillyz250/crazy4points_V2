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
          fontSize: '0.8125rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '0.75rem',
          fontFamily: 'var(--font-body)',
        }}
      >
        {hint}
      </p>
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <div
        style={{
          border: '1px solid var(--color-border-soft)',
          borderRadius: 'var(--radius-card)',
          maxHeight: '280px',
          overflowY: 'auto',
          background: 'var(--color-background)',
        }}
      >
        {Object.entries(grouped).map(([type, progs]) => (
          <div key={type}>
            <div
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                fontFamily: 'var(--font-ui)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--color-text-secondary)',
                background: 'var(--color-background-soft)',
                borderBottom: '1px solid var(--color-border-soft)',
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
                  padding: '0.375rem 0.75rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--color-border-soft)',
                  fontSize: '0.9rem',
                  fontFamily: 'var(--font-body)',
                  background: selected.has(p.id) ? '#f5eeff' : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  style={{ accentColor: 'var(--color-primary)' }}
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
            fontSize: '0.8125rem',
            color: 'var(--color-primary)',
            marginTop: '0.5rem',
            fontFamily: 'var(--font-body)',
          }}
        >
          {selected.size} program{selected.size !== 1 ? 's' : ''} tagged
        </p>
      )}
    </div>
  )
}
