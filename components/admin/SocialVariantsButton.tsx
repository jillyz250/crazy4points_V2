'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { generateSocialVariantsAction } from '@/app/admin/(protected)/social/actions'

/**
 * Phase 4.5 PR D — "Generate social variants" button.
 *
 * Visible on a published alert's edit page. Fires the server action which
 * generates FB / IG / LinkedIn / X copy in parallel from the topic's
 * fact ledger + primary_intent, persists them as needs_review variants
 * sharing one generation_group_id (narrative spine preservation).
 *
 * Disabled when:
 *   - The parent alert isn't published (SV9 — humans would skip review)
 *   - A generation is already in flight
 */
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ count: number } | null>(null)

  function onClick() {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const res = await generateSocialVariantsAction(topicId)
      if (res.ok) {
        setSuccess({ count: res.variants.length })
      } else {
        setError(res.error)
      }
    })
  }

  if (!isPublished) {
    return (
      <div
        style={{
          padding: '0.75rem 1rem',
          background: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--radius-ui)',
          color: 'var(--admin-text-muted)',
          fontSize: '0.875rem',
        }}
      >
        Publish this alert first to generate social variants.
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={onClick}
          disabled={pending}
          className="admin-btn admin-btn-primary"
        >
          {pending ? 'Generating 4 variants…' : hasExistingSocials ? 'Regenerate social variants' : 'Generate social variants'}
        </button>
        {hasExistingSocials && (
          <Link
            href={`/admin/drafts?format=facebook`}
            className="admin-btn admin-btn-ghost admin-btn-sm"
          >
            View existing
          </Link>
        )}
      </div>
      {success && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--admin-success, #1e5c2e)' }}>
          ✓ {success.count} variants generated (status: needs review). Find them in the Drafts hub by format.
        </p>
      )}
      {error && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--admin-danger, #7a1f1f)' }}>
          ✗ {error}
        </p>
      )}
    </div>
  )
}
