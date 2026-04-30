'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Program } from '@/utils/supabase/queries'
import { toggleProgramAction } from './actions'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import ProgramPageContentEditor from './ProgramPageContentEditor'

const ALLIANCE_LABEL: Record<string, string> = {
  skyteam:        'SkyTeam',
  star_alliance:  'Star Alliance',
  oneworld:       'oneworld',
  none:           'Independent',
  other:          'Partnership',
}

const ALLIANCE_COLOR: Record<string, string> = {
  skyteam:        '#0033A0',
  star_alliance:  '#1A1A1A',
  oneworld:       '#C8102E',
  none:           '#4A4A4A',
  other:          '#4A4A4A',
}

/**
 * Counts how many of the page-content sections a program has populated.
 * Surfaces in admin so authors can see at-a-glance what's done vs. todo.
 *
 * Field set varies by type:
 *   - airline:   10 (alliance, hubs, intro, award_chart, transfer_partners,
 *                    how_to_spend, sweet_spots, tier_benefits, lounge_access,
 *                    quirks)
 *   - hotel:     9  (no hubs)
 *   - alliance:  6  (intro, member_programs, sweet_spots, tier_benefits,
 *                    lounge_access, quirks — alliance-specific shape)
 *   - other:     defaults to airline shape
 */
function pageCompleteness(program: Program): { filled: number; total: number; missing: string[] } {
  const isHotel = program.type === 'hotel'
  const isAlliance = program.type === 'alliance'
  const checks: Array<[string, boolean]> = isAlliance
    ? [
        ['Intro',           !!program.intro?.trim()],
        ['Member programs', (program.member_programs?.length ?? 0) > 0],
        ['Sweet spots',     !!program.sweet_spots?.trim()],
        ['Tier benefits',   (program.tier_benefits?.length ?? 0) > 0],
        ['Lounge access',   !!program.lounge_access?.trim()],
        ['Tips & quirks',   !!program.quirks?.trim()],
      ]
    : [
        ['Alliance',          !!program.alliance],
        ...(isHotel ? [] : [['Hubs', (program.hubs?.length ?? 0) > 0] as [string, boolean]]),
        ['Intro',             !!program.intro?.trim()],
        ['Award chart',       !!program.award_chart?.trim()],
        ['Transfer partners', (program.transfer_partners?.length ?? 0) > 0],
        ['How to spend',      !!program.how_to_spend?.trim()],
        ['Sweet spots',       !!program.sweet_spots?.trim()],
        ['Tier benefits',     (program.tier_benefits?.length ?? 0) > 0],
        ['Lounge access',     !!program.lounge_access?.trim()],
        ['Tips & quirks',     !!program.quirks?.trim()],
      ]
  const filled = checks.filter(([, ok]) => ok).length
  const missing = checks.filter(([, ok]) => !ok).map(([label]) => label)
  return { filled, total: checks.length, missing }
}

/**
 * Days since a program's editorial content was last touched.
 * Returns null when there's no content yet (no review needed).
 */
function daysSinceReview(program: Program): number | null {
  if (!program.content_updated_at) return null
  const ms = Date.now() - new Date(program.content_updated_at).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

const STALE_DAYS = 60
const REVIEW_DAYS = 180

type ReviewStatus = 'fresh' | 'stale' | 'review-due' | 'empty'

function reviewStatus(program: Program): ReviewStatus {
  const days = daysSinceReview(program)
  if (days === null) return 'empty'
  if (days >= REVIEW_DAYS) return 'review-due'
  if (days >= STALE_DAYS) return 'stale'
  return 'fresh'
}

function ReviewBadge({ program }: { program: Program }) {
  const status = reviewStatus(program)
  const days = daysSinceReview(program)
  if (status === 'empty' || status === 'fresh') return null
  const tone = status === 'review-due'
    ? { background: '#fee2e2', color: '#991b1b', label: `Review (${days}d)` }
    : { background: '#fef3c7', color: '#92400e', label: `Stale (${days}d)` }
  return (
    <span
      style={{
        padding: '0.125rem 0.5rem',
        fontSize: '0.6875rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        background: tone.background,
        color: tone.color,
        borderRadius: '9999px',
        fontFamily: 'var(--font-ui)',
      }}
      title={`Editorial content last updated ${days} days ago. Threshold: stale at ${STALE_DAYS}d, review-due at ${REVIEW_DAYS}d.`}
    >
      {tone.label}
    </span>
  )
}

function MonitorBadge({ tier }: { tier: string | null }) {
  if (!tier) return null
  const color = tier === 'daily' ? '#0F766E' : tier === 'weekly' ? '#7C2D12' : '#4A4A4A'
  return (
    <span style={{ fontSize: '0.6875rem', color, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
      {tier}
    </span>
  )
}

type SortMode = 'default' | 'staleness'

export default function ProgramsTable({ programs }: { programs: Program[] }) {
  const [filter, setFilter] = useState('')
  const [reviewOnly, setReviewOnly] = useState(false)
  const [sort, setSort] = useState<SortMode>('default')

  const reviewDueCount = useMemo(
    () => programs.filter((p) => reviewStatus(p) === 'review-due').length,
    [programs]
  )

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    let rows = programs
    if (q) {
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      )
    }
    if (reviewOnly) {
      rows = rows.filter((p) => reviewStatus(p) === 'review-due')
    }
    if (sort === 'staleness') {
      // Most days-since-review first; programs with no content sort last.
      rows = [...rows].sort((a, b) => {
        const da = daysSinceReview(a)
        const db = daysSinceReview(b)
        if (da === null && db === null) return 0
        if (da === null) return 1
        if (db === null) return -1
        return db - da
      })
    }
    return rows
  }, [programs, filter, reviewOnly, sort])

  if (programs.length === 0) {
    return (
      <EmptyState
        title="No programs of this type yet"
        description="Add one from the form above, or pick a different tab."
      />
    )
  }

  return (
    <>
      <div
        style={{
          marginBottom: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name or slug…"
          className="admin-input"
          style={{ maxWidth: '20rem', flex: '1 1 16rem' }}
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="admin-input"
          style={{ width: 'auto', fontSize: '0.8125rem' }}
          title="Sort programs"
        >
          <option value="default">Sort: default</option>
          <option value="staleness">Sort: staleness</option>
        </select>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontSize: '0.8125rem',
            color: reviewDueCount > 0 ? '#991b1b' : 'var(--admin-text-muted)',
            fontWeight: reviewDueCount > 0 ? 600 : 400,
            cursor: 'pointer',
          }}
          title={`${reviewDueCount} program${reviewDueCount === 1 ? '' : 's'} not reviewed in ${REVIEW_DAYS}+ days`}
        >
          <input
            type="checkbox"
            checked={reviewOnly}
            onChange={(e) => setReviewOnly(e.target.checked)}
          />
          Review-due only ({reviewDueCount})
        </label>
        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
          {filter || reviewOnly ? `${visible.length} of ${programs.length}` : `${programs.length} total`}
        </span>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ tableLayout: 'auto' }}>
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Program</th>
                <th>Page content</th>
                <th style={{ width: '4rem' }}></th>
                <th style={{ width: '6rem' }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((program) => {
                const c = pageCompleteness(program)
                const completeness =
                  c.filled === c.total ? 'complete' : c.filled === 0 ? 'empty' : 'partial'
                const completenessColor =
                  completeness === 'complete'
                    ? 'var(--admin-success, #16a34a)'
                    : completeness === 'partial'
                      ? 'var(--admin-warning, #d97706)'
                      : 'var(--admin-text-subtle, #9ca3af)'
                return (
                  <tr key={program.id}>
                    {/* Program (name + meta) */}
                    <td style={{ verticalAlign: 'top', paddingTop: '0.875rem', paddingBottom: '0.875rem' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>
                        {program.name}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--admin-text-subtle)', fontFamily: 'var(--font-mono, ui-monospace, monospace)' }}>
                          {program.slug}
                        </span>
                        {program.alliance && (
                          <span
                            style={{
                              padding: '0.0625rem 0.375rem',
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              color: '#fff',
                              background: ALLIANCE_COLOR[program.alliance] ?? '#4A4A4A',
                              borderRadius: '9999px',
                            }}
                          >
                            {ALLIANCE_LABEL[program.alliance] ?? program.alliance}
                          </span>
                        )}
                        {(program.hubs?.length ?? 0) > 0 && (
                          <span style={{ color: 'var(--admin-text-muted)' }}>
                            {program.hubs!.join(' · ')}
                          </span>
                        )}
                        <MonitorBadge tier={program.monitor_tier} />
                        <ReviewBadge program={program} />
                      </div>
                    </td>

                    {/* Page content completeness */}
                    <td style={{ verticalAlign: 'top', paddingTop: '0.875rem', paddingBottom: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.875rem',
                            fontWeight: 700,
                            color: completenessColor,
                            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                          }}
                        >
                          {c.filled}/{c.total}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                          {completeness === 'complete'
                            ? 'all sections done'
                            : completeness === 'empty'
                              ? 'no content yet'
                              : `missing: ${c.missing.slice(0, 2).join(', ')}${c.missing.length > 2 ? `, +${c.missing.length - 2}` : ''}`}
                        </span>
                      </div>
                    </td>

                    {/* Edit button (modal) + dedicated full-page route */}
                    <td style={{ verticalAlign: 'top', paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <ProgramPageContentEditor
                          programId={program.id}
                          programName={program.name}
                          programType={program.type}
                          initialIntro={program.intro}
                          initialAwardChart={program.award_chart}
                          initialTransferPartners={program.transfer_partners}
                          initialSweetSpots={program.sweet_spots}
                          initialQuirks={program.quirks}
                          initialHowToSpend={program.how_to_spend}
                          initialTierBenefits={program.tier_benefits}
                          initialLoungeAccess={program.lounge_access}
                          initialAlliance={program.alliance}
                          initialHubs={program.hubs}
                          initialUpdatedAt={program.content_updated_at}
                        />
                        <Link
                          href={`/admin/programs/${program.slug}/edit`}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          title="Open in dedicated edit page"
                        >
                          ↗
                        </Link>
                      </div>
                    </td>

                    {/* Active toggle */}
                    <td style={{ verticalAlign: 'top', paddingTop: '0.875rem', paddingBottom: '0.875rem' }}>
                      <form action={toggleProgramAction.bind(null, program.id, !program.is_active)}>
                        <button
                          type="submit"
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          style={{ padding: 0, background: 'transparent' }}
                        >
                          <Badge tone={program.is_active ? 'success' : 'neutral'}>
                            {program.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: 'center',
                      color: 'var(--admin-text-muted)',
                      padding: '1.5rem',
                      fontSize: '0.8125rem',
                    }}
                  >
                    No matches for &ldquo;{filter}&rdquo;
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
