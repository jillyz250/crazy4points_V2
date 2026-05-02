'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { TierCrossoverRow } from '@/utils/supabase/queries'

export type ByStatusFormProgram = {
  slug: string
  name: string
  tier_crossover: TierCrossoverRow[]
}

/**
 * Client form for /tools/alliances?view=status. Replaces the previous
 * server-rendered <form method="get"> so the tier dropdown populates
 * instantly when the program changes (no Compare round-trip needed).
 *
 * Compare pushes URL params (?view=status&program=X&tier=Y) so the
 * server-rendered results section below the form keeps working
 * unchanged.
 */
export default function ByStatusFormClient({
  programs,
  initialProgram,
  initialTier,
}: {
  programs: ByStatusFormProgram[]
  initialProgram: string
  initialTier: string
}) {
  const router = useRouter()
  const [program, setProgram] = useState(initialProgram)
  const [tier, setTier] = useState(initialTier)

  // When program changes, reset tier so a Delta tier doesn't carry over
  // into a Lufthansa selection. The exception: keep the tier on first
  // mount when both initialProgram + initialTier come from URL.
  useEffect(() => {
    if (program !== initialProgram) setTier('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [program])

  const selectedTiers =
    programs.find((p) => p.slug === program)?.tier_crossover ?? []

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!program || !tier) return
    const params = new URLSearchParams()
    params.set('view', 'status')
    params.set('program', program)
    params.set('tier', tier)
    router.push(`/tools/alliances?${params.toString()}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        alignItems: 'end',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ minWidth: '14rem', flex: '1 1 18rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-secondary)',
            marginBottom: '0.25rem',
          }}
        >
          I have status with
        </label>
        <select
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            fontSize: '1rem',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-ui)',
            background: '#fff',
          }}
        >
          <option value="">Select program…</option>
          {programs.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div style={{ minWidth: '14rem', flex: '1 1 18rem' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-secondary)',
            marginBottom: '0.25rem',
          }}
        >
          My tier
        </label>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          disabled={selectedTiers.length === 0}
          style={{
            width: '100%',
            padding: '0.5rem 0.75rem',
            fontSize: '1rem',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-ui)',
            background: '#fff',
          }}
        >
          <option value="">
            {selectedTiers.length === 0 ? 'Select program first' : 'Select tier…'}
          </option>
          {selectedTiers.map((t) => (
            <option key={t.member_tier} value={t.member_tier}>
              {t.member_tier} → {t.alliance_tier}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rg-btn-primary"
        style={{ height: '2.375rem' }}
        disabled={!program || !tier}
      >
        Compare
      </button>
    </form>
  )
}
