'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { generateSocialVariantsAction } from '@/app/admin/(protected)/social/actions'

/**
 * Phase 4.5 — Social variants control bar.
 *
 * Per-platform buttons so generating just one platform doesn't cost 4×
 * (each Sonnet call ≈ $0.013; full bundle ≈ $0.05). The "All 4" pill is
 * still there for the rare case where you want the full set.
 *
 * SV9 — generation only fires when the parent alert is published.
 */
const PLATFORMS = [
  { key: 'facebook' as const,  label: 'Facebook' },
  { key: 'instagram' as const, label: 'Instagram' },
  { key: 'linkedin' as const,  label: 'LinkedIn' },
  { key: 'x' as const,         label: 'X' },
]

type Platform = (typeof PLATFORMS)[number]['key']

export default function SocialVariantsButton({
  topicId,
  isPublished,
  hasExistingSocials,
}: {
  topicId: string
  isPublished: boolean
  hasExistingSocials: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [pendingTarget, setPendingTarget] = useState<Platform | 'all' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ formats: string[] } | null>(null)

  function fire(targets: Platform[], label: Platform | 'all') {
    setError(null)
    setSuccess(null)
    setPendingTarget(label)
    startTransition(async () => {
      const res = await generateSocialVariantsAction(topicId, targets)
      if (res.ok) {
        setSuccess({ formats: res.variants.map((v) => v.format) })
      } else {
        setError(res.error)
      }
      setPendingTarget(null)
    })
  }

  if (!isPublished) {
    return (
      <div
        style={{
          padding: '0.75rem 1rem',
          background: 'var(--admin-surface-alt)',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--radius-ui)',
          color: 'var(--admin-text-muted)',
          fontSize: '0.875rem',
        }}
      >
        Social variants generate after the alert is published. If you&apos;re not going
        to publish this one, use <strong>Archive draft</strong> at the top of the page.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '0.625rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--admin-text-muted)',
            marginRight: '0.25rem',
          }}
        >
          Generate
        </span>
        {PLATFORMS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => fire([p.key], p.key)}
            disabled={pending}
            className="chip chip--blue"
            style={{ border: 'none', cursor: pending ? 'wait' : 'pointer' }}
          >
            {pending && pendingTarget === p.key ? `${p.label}…` : p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => fire(PLATFORMS.map((p) => p.key), 'all')}
          disabled={pending}
          className="chip chip--purple"
          style={{ border: 'none', cursor: pending ? 'wait' : 'pointer', marginLeft: '0.25rem' }}
        >
          {pending && pendingTarget === 'all' ? 'All 4…' : (hasExistingSocials ? 'Regenerate all 4' : 'All 4')}
        </button>
        {hasExistingSocials && (
          <Link
            href={`/admin/drafts?format=facebook`}
            className="admin-btn admin-btn-ghost admin-btn-sm"
            style={{ marginLeft: 'auto' }}
          >
            View existing →
          </Link>
        )}
      </div>
      {success && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--admin-success)' }}>
          ✓ Generated: {success.formats.join(', ')}. Find them in Drafts (status: needs review).
        </p>
      )}
      {error && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--admin-danger)' }}>
          ✗ {error}
        </p>
      )}
    </div>
  )
}
