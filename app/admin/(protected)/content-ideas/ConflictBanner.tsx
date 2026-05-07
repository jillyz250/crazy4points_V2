'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { resolveIntelConflictAction } from './actions'

export default function ConflictBanner({
  intelId,
  programSlug,
  programName,
  field,
  summary,
  intelClaim,
  programText,
}: {
  intelId: string
  programSlug: string
  programName: string
  field: string
  summary: string
  intelClaim: string
  programText: string
}) {
  const [pending, startTransition] = useTransition()

  function resolve(kind: 'intel_dismissed' | 'program_updated' | 'external_verified' | 'false_positive') {
    startTransition(async () => {
      await resolveIntelConflictAction(intelId, kind)
    })
  }

  return (
    <div
      style={{
        marginBottom: '0.75rem',
        padding: '0.75rem 0.875rem',
        background: '#FEF2F2',
        border: '1px solid #FCA5A5',
        borderLeft: '4px solid #DC2626',
        borderRadius: 'var(--radius-ui)',
        fontSize: '0.8125rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '1rem' }}>🚨</span>
        <strong style={{ color: '#991B1B' }}>
          Conflicts with /programs/{programSlug}
        </strong>
        <span style={{ color: '#7F1D1D', fontSize: '0.75rem' }}>
          ({field} field)
        </span>
      </div>

      <div style={{ color: '#1f2937', marginBottom: '0.625rem' }}>
        {summary}
      </div>

      {(intelClaim || programText) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            fontSize: '0.75rem',
          }}
        >
          {intelClaim && (
            <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #FECACA' }}>
              <div style={{ fontWeight: 600, color: '#7F1D1D', marginBottom: '0.25rem', fontSize: '0.6875rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Intel claims
              </div>
              <div style={{ color: '#374151', lineHeight: 1.4 }}>{intelClaim}</div>
            </div>
          )}
          {programText && (
            <div style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px', border: '1px solid #C7D2FE' }}>
              <div style={{ fontWeight: 600, color: '#3730A3', marginBottom: '0.25rem', fontSize: '0.6875rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {programName} page says
              </div>
              <div style={{ color: '#374151', lineHeight: 1.4 }}>{programText}</div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        <Link
          href={`/admin/programs/${programSlug}/edit`}
          className="admin-btn admin-btn-primary admin-btn-sm"
        >
          Update {programName} page
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={() => resolve('intel_dismissed')}
          className="admin-btn admin-btn-secondary admin-btn-sm"
        >
          Dismiss intel (intel is wrong)
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => resolve('external_verified')}
          className="admin-btn admin-btn-ghost admin-btn-sm"
        >
          Mark resolved
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => resolve('false_positive')}
          className="admin-btn admin-btn-ghost admin-btn-sm"
          title="Detector was wrong - both sources are actually consistent"
        >
          False positive
        </button>
      </div>
    </div>
  )
}
