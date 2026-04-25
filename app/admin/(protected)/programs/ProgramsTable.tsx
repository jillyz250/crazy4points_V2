'use client'

import { useState, useMemo } from 'react'
import type { Program } from '@/utils/supabase/queries'
import { toggleProgramAction } from './actions'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import FaqContentEditor from './FaqContentEditor'
import ProgramPageContentEditor from './ProgramPageContentEditor'

export default function ProgramsTable({ programs }: { programs: Program[] }) {
  const [filter, setFilter] = useState('')

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return programs
    return programs.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    )
  }, [programs, filter])

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
        <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
          {filter ? `${visible.length} of ${programs.length}` : `${programs.length} total`}
        </span>
      </div>

      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Tier</th>
                <th>Monitor</th>
                <th>URL</th>
                <th>FAQ</th>
                <th>Page</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((program) => (
                <tr key={program.id}>
                  <td style={{ fontWeight: 500 }}>{program.name}</td>
                  <td style={{ color: 'var(--admin-text-muted)' }}>
                    {program.tier ?? '—'}
                  </td>
                  <td style={{ color: 'var(--admin-text-muted)' }}>
                    {program.monitor_tier ?? '—'}
                  </td>
                  <td>
                    {program.program_url ? (
                      <a
                        href={program.program_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '0.8125rem' }}
                      >
                        Link ↗
                      </a>
                    ) : (
                      <span style={{ color: 'var(--admin-text-subtle)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <FaqContentEditor
                      programId={program.id}
                      programName={program.name}
                      initialContent={program.faq_content}
                      initialUpdatedAt={program.faq_updated_at}
                    />
                  </td>
                  <td>
                    <ProgramPageContentEditor
                      programId={program.id}
                      programName={program.name}
                      initialIntro={program.intro}
                      initialTransferPartners={program.transfer_partners}
                      initialSweetSpots={program.sweet_spots}
                      initialQuirks={program.quirks}
                      initialUpdatedAt={program.content_updated_at}
                    />
                  </td>
                  <td>
                    <form action={toggleProgramAction.bind(null, program.id, !program.is_active)}>
                      <button
                        type="submit"
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                      >
                        <Badge tone={program.is_active ? 'success' : 'neutral'}>
                          {program.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
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
