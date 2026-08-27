'use client'

import { useState } from 'react'
import type { ExperienceGroup } from '@/lib/experiences/marquee'
import ExperienceCard from './ExperienceCard'

/**
 * The single "Featured right now" gallery. Merges what used to be two stacked
 * sections (Featured U.S. / Featured beyond) into one calmer surface with a
 * region toggle. Defaults to the U.S. tab (the audience skews U.S./NY). The
 * toggle only appears when both regions have picks; otherwise it's just the
 * one grid.
 */
export default function FeaturedGallery({ us, intl }: { us: ExperienceGroup[]; intl: ExperienceGroup[] }) {
  const hasUS = us.length > 0
  const hasINTL = intl.length > 0
  const [tab, setTab] = useState<'US' | 'INTL'>(hasUS ? 'US' : 'INTL')
  const showToggle = hasUS && hasINTL
  const groups = tab === 'US' ? us : intl

  return (
    <div>
      {showToggle && (
        <div role="tablist" aria-label="Filter featured experiences by region" className="mb-6 flex gap-2">
          <TabPill active={tab === 'US'} onClick={() => setTab('US')} label={`In the U.S.`} count={us.length} />
          <TabPill active={tab === 'INTL'} onClick={() => setTab('INTL')} label={`Beyond the U.S.`} count={intl.length} />
        </div>
      )}
      {/* 4-across on desktop so the curated hero stays a single tight row, not a
          tall stack you have to scroll past to reach the filters. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((g) => (
          <ExperienceCard key={g.key} group={g} />
        ))}
      </div>
    </div>
  )
}

function TabPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        'rg-tap-target inline-flex items-center gap-2 rounded-full px-4 py-2 font-ui text-sm transition-colors ' +
        (active
          ? 'bg-[var(--color-primary)] text-white'
          : 'border border-[var(--color-border-soft)] text-[var(--color-primary)] hover:border-[var(--color-accent)] hover:bg-[var(--color-background-soft)]')
      }
    >
      {label}
      <span className={active ? 'text-white/70' : 'text-[var(--color-text-secondary)]'}>{count}</span>
    </button>
  )
}
