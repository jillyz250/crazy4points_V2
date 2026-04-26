'use client'

import { useMemo, useState } from 'react'
import type { SourceWithFeedCount, SourceType } from '@/utils/supabase/queries'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { toggleSourceAction } from './actions'
import DeleteSourceButton from './DeleteSourceButton'

type Tone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral'

const TIER_TONE: Record<number, Tone> = {
  1: 'accent',
  2: 'success',
  3: 'warning',
  4: 'danger',
  5: 'neutral',
}

const TYPE_LABEL: Record<SourceType, string> = {
  official_partner: 'Official',
  blog: 'Blog',
  community: 'Community',
  social: 'Social',
  email: 'Email',
}

function freshness(iso: string | null | undefined): { tone: Tone; label: string } {
  if (!iso) return { tone: 'danger', label: 'never' }
  const ageMs = Date.now() - new Date(iso).getTime()
  const hours = ageMs / (1000 * 60 * 60)
  let label: string
  if (hours < 1) label = `${Math.max(1, Math.round(ageMs / 60000))}m`
  else if (hours < 24) label = `${Math.round(hours)}h`
  else label = `${Math.round(hours / 24)}d`
  if (hours < 24) return { tone: 'success', label }
  if (hours < 24 * 7) return { tone: 'warning', label }
  return { tone: 'danger', label }
}

function approvalRate(produced: number, approved: number): { tone: Tone; label: string } | null {
  if (produced <= 0) return null
  const rate = approved / produced
  const label = `${Math.round(rate * 100)}%`
  if (rate >= 0.5) return { tone: 'success', label }
  if (rate >= 0.2) return { tone: 'warning', label }
  return { tone: 'danger', label }
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url)
    const path = (u.pathname + u.search).replace(/\/$/, '')
    return path ? `${u.host}${path}` : u.host
  } catch {
    return url
  }
}

export default function SourcesTable({
  sources,
  lastFindings,
}: {
  sources: SourceWithFeedCount[]
  lastFindings: Record<string, string>
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sources
    return sources.filter((s) => {
      const haystack = [
        s.name,
        s.url,
        s.notes ?? '',
        TYPE_LABEL[s.type] ?? s.type,
        `t${s.tier}`,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [sources, query])

  const dupeUrls = useMemo(() => {
    const counts = new Map<string, number>()
    for (const s of sources) counts.set(s.url, (counts.get(s.url) ?? 0) + 1)
    return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([url]) => url))
  }, [sources])

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          marginBottom: '0.875rem',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, URL, notes, type, or tier (e.g. t1, hyatt, rss)…"
          className="admin-input"
          style={{ flex: '1 1 18rem', minWidth: '14rem', fontSize: '0.875rem' }}
          aria-label="Search sources"
        />
        <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.8125rem' }}>
          {filtered.length} of {sources.length}
        </span>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Name &amp; URL</th>
                <th>Type</th>
                <th style={{ textAlign: 'center' }}>Feeds</th>
                <th>Active</th>
                <th>Last Finding</th>
                <th style={{ textAlign: 'center' }}>Produced</th>
                <th style={{ textAlign: 'center' }}>Approved</th>
                <th style={{ textAlign: 'center' }}>Rate</th>
                <th>Notes</th>
                <th style={{ width: '2rem' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((source) => {
                const fresh = freshness(lastFindings[source.name] ?? null)
                const rate = approvalRate(source.items_produced, source.items_approved)
                const isDupe = dupeUrls.has(source.url)
                return (
                  <tr key={source.id}>
                    <td><Badge tone={TIER_TONE[source.tier] ?? 'neutral'}>T{source.tier}</Badge></td>
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          {source.name}
                        </a>
                        {isDupe && (
                          <span title="Another source has the same URL">
                            <Badge tone="warning">dup</Badge>
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--admin-text-muted)',
                          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                          marginTop: '0.125rem',
                          wordBreak: 'break-all',
                        }}
                      >
                        {shortenUrl(source.url)}
                      </div>
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)' }}>
                      {TYPE_LABEL[source.type] ?? source.type.replace(/_/g, ' ')}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>
                      {source.feed_count}
                    </td>
                    <td>
                      <form action={toggleSourceAction.bind(null, source.id, !source.is_active)}>
                        <button type="submit" className="admin-btn admin-btn-ghost admin-btn-sm">
                          <Badge tone={source.is_active ? 'success' : 'neutral'}>
                            {source.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </form>
                    </td>
                    <td>
                      <Badge tone={fresh.tone}>{fresh.label}</Badge>
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>{source.items_produced}</td>
                    <td style={{ textAlign: 'center', color: 'var(--admin-text-muted)' }}>{source.items_approved}</td>
                    <td style={{ textAlign: 'center' }}>
                      {rate ? (
                        <Badge tone={rate.tone}>{rate.label}</Badge>
                      ) : (
                        <span style={{ color: 'var(--admin-text-subtle)' }}>—</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--admin-text-muted)', maxWidth: '14rem' }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {source.notes ?? '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <DeleteSourceButton id={source.id} name={source.name} />
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--admin-text-muted)' }}>
                    No sources match "{query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
