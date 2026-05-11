'use client'

import { useMemo, useState } from 'react'
import type { ActiveTransferBonus, SourceCurrency } from '@/utils/supabase/transferBonusQueries'
import { SOURCE_CURRENCIES, detectSourceCurrency } from '@/utils/supabase/transferBonusQueries'
import TransferBonusCard from '@/components/hub/TransferBonusCard'

export default function ShouldITransferClient({
  bonuses,
}: {
  bonuses: ActiveTransferBonus[]
}) {
  const [source, setSource] = useState<SourceCurrency | 'all'>('all')

  const filtered = useMemo(() => {
    if (source === 'all') return bonuses
    return bonuses.filter((b) => detectSourceCurrency(b.alert.title) === source)
  }, [bonuses, source])

  const availableSources = useMemo(() => {
    const s = new Set<SourceCurrency>()
    for (const b of bonuses) {
      const detected = detectSourceCurrency(b.alert.title)
      if (detected) s.add(detected)
    }
    return s
  }, [bonuses])

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
            marginBottom: '0.5rem',
          }}
        >
          Filter by source currency
        </div>
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}
          role="group"
          aria-label="Source currency filter"
        >
          <SourceChip
            id="all"
            label={`All bonuses (${bonuses.length})`}
            active={source === 'all'}
            onClick={() => setSource('all')}
          />
          {SOURCE_CURRENCIES.filter((s) => availableSources.has(s.id)).map(
            (s) => (
              <SourceChip
                key={s.id}
                id={s.id}
                label={s.short}
                active={source === s.id}
                onClick={() => setSource(s.id)}
              />
            ),
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p
          style={{
            padding: '1.25rem',
            background: 'var(--color-background-soft)',
            border: '1px dashed var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            color: 'var(--color-text-secondary)',
            margin: 0,
            textAlign: 'center',
          }}
        >
          No active transfer bonuses from{' '}
          {SOURCE_CURRENCIES.find((s) => s.id === source)?.short ?? 'this source'}{' '}
          right now. Check back — bonuses run constantly.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filtered.map((b) => (
            <TransferBonusCard key={b.alert.id} bonus={b} />
          ))}
        </div>
      )}
    </div>
  )
}

function SourceChip({
  id,
  label,
  active,
  onClick,
}: {
  id: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      key={id}
      type="button"
      onClick={onClick}
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
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  )
}
