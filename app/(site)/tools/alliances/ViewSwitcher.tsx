'use client'

import Link from 'next/link'

export type ExplorerView = 'alliance' | 'airline' | 'status' | 'search'

const TABS: { key: ExplorerView; label: string; hint: string }[] = [
  { key: 'alliance', label: 'By Alliance', hint: 'Tier ladder + members' },
  { key: 'airline', label: 'By Airline', hint: 'Search 59 carriers' },
  { key: 'status', label: 'By Status', hint: 'Equivalency + perks' },
  { key: 'search', label: 'Find Redemptions', hint: 'Filter partner awards' },
]

export default function ViewSwitcher({ current }: { current: ExplorerView }) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        borderBottom: '2px solid var(--color-border-soft)',
        paddingBottom: '0.5rem',
      }}
    >
      {TABS.map((tab) => {
        const active = tab.key === current
        return (
          <Link
            key={tab.key}
            href={`/tools/alliances?view=${tab.key}`}
            role="tab"
            aria-selected={active}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.125rem',
              padding: '0.625rem 1rem',
              borderRadius: 'var(--radius-ui)',
              fontFamily: 'var(--font-ui)',
              fontSize: '0.875rem',
              fontWeight: active ? 700 : 500,
              color: active ? '#fff' : 'var(--color-text-primary)',
              background: active ? 'var(--color-primary)' : 'var(--color-background-soft)',
              textDecoration: 'none',
              transition: 'background-color 0.15s, color 0.15s',
            }}
          >
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{tab.label}</span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 500,
                opacity: 0.85,
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              {tab.hint}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
