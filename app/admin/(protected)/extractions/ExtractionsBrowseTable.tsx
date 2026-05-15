'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/admin/ui/Badge'
import {
  REFRESH_ENTITY_LABELS,
  urgencyForAge,
  type RefreshEntityType,
} from '@/lib/admin/refresh-cadences'
import type { ExtractionsBrowseItem } from '@/utils/supabase/queries'

const URGENCY_TONE = {
  on_time: 'success',
  overdue: 'warning',
  very_overdue: 'danger',
  critical: 'danger',
} as const

const URGENCY_LABEL = {
  on_time: 'On time',
  overdue: 'Overdue',
  very_overdue: 'Very overdue',
  critical: 'Critical',
} as const

function entityLabel(entityType: string): string {
  if (entityType in REFRESH_ENTITY_LABELS) {
    return REFRESH_ENTITY_LABELS[entityType as RefreshEntityType]
  }
  return entityType.replace(/_/g, ' ')
}

function formatAge(days: number): string {
  if (days >= 365) {
    const years = Math.floor(days / 365)
    return `${years}y${days % 365 ? ` ${Math.floor((days % 365) / 30)}mo` : ''}`
  }
  if (days >= 60) return `${Math.floor(days / 30)}mo`
  if (days >= 14) return `${Math.floor(days / 7)}w`
  return `${days}d`
}

export default function ExtractionsBrowseTable({
  rows,
  markVerifiedAction,
}: {
  rows: ExtractionsBrowseItem[]
  markVerifiedAction: (formData: FormData) => Promise<void>
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.entity_name.toLowerCase().includes(q) ||
        r.entity_slug.toLowerCase().includes(q),
    )
  }, [rows, search])

  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="search"
          placeholder="Search by name or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            maxWidth: '24rem',
            padding: '0.5rem 0.75rem',
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-ui)',
            background: '#fff',
          }}
        />
        <span
          style={{
            marginLeft: '0.75rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          {filtered.length} of {rows.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p
          style={{
            fontFamily: 'var(--font-body)',
            color: 'var(--color-text-secondary)',
            padding: '1.5rem',
            textAlign: 'center',
          }}
        >
          No matches.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th style={{ textAlign: 'right' }}>Age</th>
                <th style={{ textAlign: 'right' }}>Cadence</th>
                <th>Last verified</th>
                <th>Status</th>
                <th style={{ width: '12rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const urgency = urgencyForAge(item.age_days, item.cadence_days)
                return (
                  <tr key={`${item.entity_type}-${item.entity_id}`}>
                    <td
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {entityLabel(item.entity_type)}
                    </td>
                    <td style={{ fontWeight: 500 }}>{item.entity_name}</td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontFamily: 'var(--font-ui)',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {formatAge(item.age_days)}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {item.cadence_days}d
                    </td>
                    <td
                      style={{
                        color: 'var(--color-text-secondary)',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {item.last_verified ?? <em>never</em>}
                    </td>
                    <td>
                      <Badge tone={URGENCY_TONE[urgency]}>
                        {URGENCY_LABEL[urgency]}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.375rem',
                          justifyContent: 'flex-end',
                          flexWrap: 'wrap',
                        }}
                      >
                        {item.extract_url ? (
                          <Link
                            href={item.extract_url}
                            className="admin-btn admin-btn-primary admin-btn-sm"
                            title="Run extraction pipeline"
                          >
                            Extract
                          </Link>
                        ) : null}
                        <form action={markVerifiedAction}>
                          <input
                            type="hidden"
                            name="entity_type"
                            value={item.entity_type}
                          />
                          <input
                            type="hidden"
                            name="entity_id"
                            value={item.entity_id}
                          />
                          <button
                            type="submit"
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            title="Mark verified without extracting"
                          >
                            ✓
                          </button>
                        </form>
                        <Link
                          href={item.edit_url}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
