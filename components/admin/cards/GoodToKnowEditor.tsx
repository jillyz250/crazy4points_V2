'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { draftGoodToKnowAction, saveGoodToKnowAction } from '@/app/admin/(protected)/cards/[slug]/extract/actions'

/**
 * Editor panel for the card's `good_to_know` callout.
 *
 * Two actions:
 *   1. "Draft from extraction" — calls Sonnet with the card's facts + voice
 *      samples from other curated cards. Saves the draft directly so the
 *      textarea below picks it up on page revalidation.
 *   2. "Save" — commits whatever's in the textarea (after editor review).
 *
 * Sonnet output is a STARTING POINT, not a final commit. The editor should
 * always read through, edit for voice, fact-check anything that looks
 * specific or risky, before considering the card published.
 */
export default function GoodToKnowEditor({
  slug,
  initialValue,
}: {
  slug: string
  initialValue: string | null
}) {
  const [text, setText] = useState(initialValue ?? '')
  const [showSaved, setShowSaved] = useState(false)
  const hasContent = (initialValue ?? '').trim().length > 0
  const bulletCount = (text.match(/^\s*-\s/gm) ?? []).length

  return (
    <section
      style={{
        marginTop: '2rem',
        padding: '1.25rem 1.5rem',
        background: 'var(--color-background-soft)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--color-border-soft)',
      }}
    >
      <header style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.125rem',
            fontWeight: 600,
            color: 'var(--color-primary)',
            margin: 0,
          }}
        >
          Editorial layer — Good to know
        </h2>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.125rem 0.5rem',
            borderRadius: '9999px',
            background: hasContent ? 'var(--color-primary)' : 'var(--color-border-soft)',
            color: hasContent ? '#fff' : 'var(--color-text-secondary)',
          }}
        >
          {hasContent ? `${bulletCount} bullets` : 'empty'}
        </span>
      </header>

      <p
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary)',
          marginBottom: '1rem',
          lineHeight: 1.5,
        }}
      >
        The 5-7 bullet callout that appears at the top of the public card page in
        Jill&apos;s voice. Sonnet can draft a first version from the extracted facts +
        existing curated cards as voice samples — review and edit before saving.
      </p>

      <form action={draftGoodToKnowAction} style={{ marginBottom: '1rem' }}>
        <input type="hidden" name="slug" value={slug} />
        <DraftButton hasExisting={hasContent} />
        {hasContent && (
          <span style={{ marginLeft: '0.75rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            ⚠️ Drafting will REPLACE the current good_to_know. Copy first if you want to preserve.
          </span>
        )}
      </form>

      <form
        action={async (fd: FormData) => {
          setShowSaved(false)
          await saveGoodToKnowAction(fd)
          setShowSaved(true)
          setTimeout(() => setShowSaved(false), 3000)
        }}
      >
        <input type="hidden" name="slug" value={slug} />
        <textarea
          name="good_to_know"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder='- Lead phrase - detail. Add 5-7 bullets, one per line, each starting with "- ". Warning bullets starting with "NO " get a gold dot on the public page.'
          style={{
            width: '100%',
            padding: '0.75rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.9375rem',
            lineHeight: 1.55,
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-ui)',
            resize: 'vertical',
            background: '#fff',
            color: 'var(--color-text-primary)',
          }}
        />
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <SaveButton />
          {showSaved && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              ✓ Saved
            </span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            {text.length} chars · {bulletCount} bullets
          </span>
        </div>
      </form>
    </section>
  )
}

function DraftButton({ hasExisting }: { hasExisting: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rg-btn-primary"
      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', opacity: pending ? 0.6 : 1 }}
    >
      {pending
        ? '✏️ Drafting...'
        : hasExisting
          ? '🔄 Re-draft from extraction'
          : '✏️ Draft from extraction'}
    </button>
  )
}

function SaveButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rg-btn-primary"
      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem', opacity: pending ? 0.6 : 1 }}
    >
      {pending ? 'Saving...' : 'Save good_to_know'}
    </button>
  )
}
