'use client'

import { useMemo, useState } from 'react'
import type { EnrichedSweetSpot } from '@/utils/supabase/dontSleepQueries'
import type { SourceCurrency } from '@/utils/supabase/transferBonusQueries'
import {
  SOURCE_CURRENCIES,
  SOURCE_FAMILY_SLUGS,
} from '@/utils/supabase/transferBonusQueries'
import { ROUTE_BUCKET_LABELS } from '@/lib/airports'
import type { RouteBucket } from '@/lib/airports'
import SweetSpotCard from '@/components/hub/SweetSpotCard'

const BUCKET_ORDER: RouteBucket[] = [
  'us-short',
  'us-medium',
  'us-long',
  'us-eu-east',
  'us-eu-west',
  'us-japan',
  'us-se-asia',
  'us-me-india',
  'us-pacific',
  'us-africa',
  'us-samerica',
]

/**
 * Pre-built map: source-family → Set of destination program slugs the family
 * can transfer to. Built once on the server from the transfer graph so the
 * client doesn't need to walk the graph on every filter change.
 */
export type DestinationsBySource = Record<SourceCurrency, string[]>

/**
 * Client wrapper for Don't Sleep. Manages a source-currency chip filter
 * that scopes rows to redemptions whose destination program can be reached
 * from the selected source (e.g. picking "Chase" hides any row whose
 * destination Chase UR doesn't transfer to).
 *
 * Re-buckets filtered rows by RouteBucket on every filter change.
 */
export default function DontSleepClient({
  rows,
  destinationsBySource,
}: {
  rows: EnrichedSweetSpot[]
  destinationsBySource: DestinationsBySource
}) {
  const [source, setSource] = useState<SourceCurrency | 'all'>('all')

  const filtered = useMemo(() => {
    if (source === 'all') return rows
    const reachable = new Set(destinationsBySource[source] ?? [])
    return rows.filter((r) => {
      const slug = r.currency_program?.slug
      return slug ? reachable.has(slug) : false
    })
  }, [rows, source, destinationsBySource])

  // Only show chips for sources that can actually reach at least one row.
  const availableSources = useMemo(() => {
    const s = new Set<SourceCurrency>()
    const destinationSlugs = new Set(
      rows.map((r) => r.currency_program?.slug).filter(Boolean) as string[],
    )
    for (const src of Object.keys(SOURCE_FAMILY_SLUGS) as SourceCurrency[]) {
      const reachable = destinationsBySource[src] ?? []
      if (reachable.some((slug) => destinationSlugs.has(slug))) {
        s.add(src)
      }
    }
    return s
  }, [rows, destinationsBySource])

  const groups = useMemo(() => groupByBucket(filtered), [filtered])

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
            label={`All (${rows.length})`}
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
          No sweet spots reachable from{' '}
          {SOURCE_CURRENCIES.find((s) => s.id === source)?.short ?? 'this source'}{' '}
          right now. Try another source — or pick &ldquo;All&rdquo; to browse.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {BUCKET_ORDER.filter((b) => groups.has(b)).map((b) => (
            <section key={b}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  color: 'var(--color-primary)',
                  margin: '0 0 0.75rem',
                }}
              >
                {ROUTE_BUCKET_LABELS[b]}
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {groups.get(b)!.map((r) => (
                  <SweetSpotCard key={r.id} r={r} />
                ))}
              </div>
            </section>
          ))}
          {groups.has('other') && (
            <section>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  color: 'var(--color-primary)',
                  margin: '0 0 0.75rem',
                }}
              >
                Other regions
              </h2>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {groups.get('other')!.map((r) => (
                  <SweetSpotCard key={r.id} r={r} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Group rows by their first route_bucket. Rows with no buckets land in
 * "other". Identical logic to dontSleepQueries.groupByRouteBucket but
 * re-implemented client-side because we re-group on every filter change.
 */
function groupByBucket(
  rows: EnrichedSweetSpot[],
): Map<RouteBucket | 'other', EnrichedSweetSpot[]> {
  const map = new Map<RouteBucket | 'other', EnrichedSweetSpot[]>()
  for (const r of rows) {
    const buckets = (r.route_buckets ?? []) as RouteBucket[]
    const key: RouteBucket | 'other' = buckets[0] ?? 'other'
    const arr = map.get(key) ?? []
    arr.push(r)
    map.set(key, arr)
  }
  return map
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
