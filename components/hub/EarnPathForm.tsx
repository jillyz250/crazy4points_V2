'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Program } from '@/utils/supabase/queries'

export default function EarnPathForm({
  targets,
  initialTarget = '',
  initialMode = 'fastest',
}: {
  targets: Program[]
  initialTarget?: string
  initialMode?: 'fastest' | 'cheapest' | 'easiest'
}) {
  const router = useRouter()
  const [target, setTarget] = useState(initialTarget)
  const [mode, setMode] = useState(initialMode)

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!target) return
    router.push(`/hub/earn-path?target=${target}&mode=${mode}`)
  }

  function pickMode(m: 'fastest' | 'cheapest' | 'easiest') {
    setMode(m)
    if (target) router.push(`/hub/earn-path?target=${target}&mode=${m}`)
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        padding: '1.25rem',
        background: 'var(--color-background-soft)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-card)',
        marginBottom: '1.5rem',
        display: 'grid',
        gap: '0.875rem',
      }}
    >
      <label style={{ display: 'grid', gap: '0.375rem' }}>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
          }}
        >
          What miles do you need?
        </span>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          required
          style={{
            padding: '0.625rem 0.75rem',
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-ui)',
            background: '#fff',
            minHeight: '44px',
          }}
        >
          <option value="">Pick a program…</option>
          {targets.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            marginBottom: '0.375rem',
          }}
        >
          How do you want to get there?
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
          {(['fastest', 'cheapest', 'easiest'] as const).map((m) => {
            const active = mode === m
            const label =
              m === 'fastest'
                ? '🏃 Fastest'
                : m === 'cheapest'
                  ? '💰 Cheapest'
                  : '🛋️ Easiest'
            return (
              <button
                key={m}
                type="button"
                onClick={() => pickMode(m)}
                style={{
                  padding: '0.4375rem 0.75rem',
                  fontFamily: 'var(--font-ui)',
                  fontSize: '0.75rem',
                  fontWeight: active ? 700 : 600,
                  border: active ? 'none' : '1px solid var(--color-border-soft)',
                  background: active ? 'var(--color-primary)' : '#fff',
                  color: active ? '#fff' : 'var(--color-text-primary)',
                  borderRadius: '999px',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <button
        type="submit"
        disabled={!target}
        style={{
          padding: '0.75rem 1rem',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.9375rem',
          fontWeight: 700,
          color: '#fff',
          background: target
            ? 'var(--color-primary)'
            : 'var(--color-text-secondary)',
          border: 'none',
          borderRadius: 'var(--radius-ui)',
          cursor: target ? 'pointer' : 'not-allowed',
          minHeight: '44px',
          justifySelf: 'start',
        }}
      >
        Show me the paths →
      </button>
    </form>
  )
}
