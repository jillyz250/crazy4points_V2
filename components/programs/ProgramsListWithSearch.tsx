'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ResourceCard, ResourceCategory } from '@/utils/supabase/queries'
import { ALLIANCE_LABEL, ALLIANCE_BADGE_COLOR } from '@/lib/alliance'

/**
 * Client-side filterable list for the /programs?type=<category> directory.
 * Server fetches the full list once; the input narrows by program name
 * (or slug) on each keystroke. No round-trip per keystroke. Mirrors the
 * server-side ProgramCard JSX in app/(site)/programs/page.tsx — keep both
 * in sync if you add fields.
 */
export default function ProgramsListWithSearch({
  programs,
  category,
  cta,
}: {
  programs: ResourceCard[]
  category: ResourceCategory
  cta: string
}) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return programs
    return programs.filter((p) => {
      const name = (p.name ?? '').toLowerCase()
      const slug = (p.slug ?? '').toLowerCase()
      return name.includes(needle) || slug.includes(needle)
    })
  }, [programs, q])

  return (
    <>
      <div className="mb-4">
        <label htmlFor="program-search" className="sr-only">
          Search programs
        </label>
        <input
          id="program-search"
          type="search"
          inputMode="search"
          placeholder={`Search ${programs.length} program${programs.length === 1 ? '' : 's'}…`}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoComplete="off"
          style={{
            width: '100%',
            maxWidth: '32rem',
            padding: '0.625rem 0.875rem',
            fontSize: '1rem',
            fontFamily: 'var(--font-body)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-ui)',
            background: 'var(--color-background)',
            color: 'var(--color-text-primary)',
          }}
        />
        {q.trim().length > 0 && (
          <p className="mt-2 font-body text-sm text-[var(--color-text-secondary)]">
            {filtered.length} of {programs.length} match{filtered.length === 1 ? 'es' : ''}
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-8 text-center">
          <p className="font-body text-[var(--color-text-secondary)]">
            No programs match &ldquo;{q.trim()}&rdquo;.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <li key={p.id}>
              <ProgramCard program={p} category={category} cta={cta} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

function formatUpdated(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function ProgramCard({
  program,
  category,
  cta,
}: {
  program: ResourceCard
  category: ResourceCategory
  cta: string
}) {
  const showLoyaltyBadge = category === 'airline' && program.type === 'loyalty_program'
  const allianceColor = program.alliance ? ALLIANCE_BADGE_COLOR[program.alliance] : null
  const allianceLabel = program.alliance ? ALLIANCE_LABEL[program.alliance] : null
  const hubChips = (program.hubs ?? []).slice(0, 4)
  const updated = formatUpdated(program.contentUpdatedAt)

  return (
    <Link
      href={`/programs/${program.slug}`}
      data-track-event="program_index_click"
      data-track-params={JSON.stringify({
        category,
        slug: program.slug,
        program_type: program.type,
        alliance: program.alliance ?? 'none',
      })}
      className="group flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold text-[var(--color-primary)]">
            {program.name}
          </h2>
          {showLoyaltyBadge && (
            <p className="mt-0.5 font-ui text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)]">
              Loyalty Program
            </p>
          )}
        </div>
        {allianceColor && allianceLabel && program.alliance !== 'none' && program.alliance !== 'other' && (
          <span
            className="shrink-0 rounded px-2 py-1 font-ui text-[10px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: allianceColor }}
          >
            {allianceLabel}
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1.5 font-ui text-xs text-[var(--color-text-secondary)]">
        {category === 'airline' && hubChips.length > 0 && (
          <p>
            <span className="font-medium text-[var(--color-text-primary)]">Hubs:</span>{' '}
            {hubChips.join(' · ')}
          </p>
        )}
        {category === 'alliance' && program.memberCount !== null && program.memberCount > 0 && (
          <p>
            <span className="font-medium text-[var(--color-text-primary)]">{program.memberCount}</span>{' '}
            member airline{program.memberCount === 1 ? '' : 's'}
          </p>
        )}
        {program.transferPartnerCount === 0 && program.joinedLoyaltyProgram ? (
          <p>
            Loyalty program:{' '}
            <span className="font-medium text-[var(--color-primary)]">
              {program.joinedLoyaltyProgram.name} →
            </span>
          </p>
        ) : (
          program.transferPartnerCount > 0 && (
            <p>
              <span className="font-medium text-[var(--color-text-primary)]">{program.transferPartnerCount}</span>{' '}
              transfer partner{program.transferPartnerCount === 1 ? '' : 's'}
            </p>
          )
        )}
        {program.promoCount > 0 && (
          <p>
            <span className="font-medium text-[var(--color-accent-hover)]">{program.promoCount}</span>{' '}
            promo route{program.promoCount === 1 ? '' : 's'} live
          </p>
        )}
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border-soft)] pt-3">
          <div className="flex items-center gap-2">
            {program.alertCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-ui text-[11px] font-semibold text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                {program.alertCount} active alert{program.alertCount === 1 ? '' : 's'}
              </span>
            ) : updated ? (
              <span className="font-ui text-[11px] text-[var(--color-text-secondary)]">
                Updated {updated}
              </span>
            ) : null}
          </div>
          <span className="font-ui text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)] group-hover:underline">
            {cta} →
          </span>
        </div>
      </div>
    </Link>
  )
}
