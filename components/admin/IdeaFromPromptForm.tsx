'use client'

import { useActionState, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  createIdeaFromPromptAction,
  type CreateFromPromptResult,
} from '@/app/admin/(protected)/content-ideas/actions'

const MIN_LEN = 30
const MAX_LEN = 1000
const EXAMPLE = `What you can do with 80,000 Hilton Honors points in Hawaii. Most people think 80k is barely enough for a single night at a top property, but you can stretch it across multiple stays at category 4-6 properties on Maui and the Big Island. Cover the actual sweet spots and which dates offer the best ratio.`

export default function IdeaFromPromptForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState<CreateFromPromptResult | null, FormData>(
    createIdeaFromPromptAction,
    null
  )
  const [prompt, setPrompt] = useState('')
  const [_isRedirecting, startTransition] = useTransition()

  // On success, redirect to the content-ideas page with a query param so we
  // can highlight the newly created row.
  if (state?.ok) {
    startTransition(() => {
      router.push(`/admin/content-ideas?just_created=${state.id}`)
    })
  }

  const charCount = prompt.length
  const tooShort = charCount > 0 && charCount < MIN_LEN
  const tooLong = charCount > MAX_LEN
  const counterColor = tooLong
    ? '#b91c1c'
    : tooShort
      ? '#92400e'
      : 'var(--admin-text-muted)'

  return (
    <form
      action={formAction}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        maxWidth: '52rem',
      }}
    >
      <label
        htmlFor="prompt"
        style={{
          fontFamily: 'var(--font-ui)',
          fontSize: '0.8125rem',
          fontWeight: 600,
          color: 'var(--admin-text)',
        }}
      >
        Your idea — 3-4 sentences. What's the angle, the audience, what the
        reader walks away knowing?
      </label>

      <textarea
        id="prompt"
        name="prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={EXAMPLE}
        rows={6}
        minLength={MIN_LEN}
        maxLength={MAX_LEN}
        required
        className="admin-input"
        style={{
          width: '100%',
          resize: 'vertical',
          minHeight: '8rem',
          fontFamily: 'var(--font-body)',
          lineHeight: 1.55,
        }}
        disabled={isPending}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: 'var(--font-ui)',
          fontSize: '0.75rem',
          gap: '0.5rem',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ color: counterColor }}>
          {charCount} / {MAX_LEN} chars{' '}
          {tooShort && `(need at least ${MIN_LEN})`}
          {tooLong && '(over the limit)'}
        </span>
        <span style={{ color: 'var(--admin-text-muted)' }}>
          Uses Claude Haiku — about 3 seconds, $0.002 per draft.
        </span>
      </div>

      {state && !state.ok && (
        <div
          style={{
            padding: '0.625rem 0.75rem',
            borderRadius: 'var(--admin-radius)',
            border: '1px solid #fca5a5',
            background: '#fef2f2',
            color: '#b91c1c',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            fontWeight: 500,
          }}
        >
          {state.error}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '0.625rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="submit"
          disabled={isPending || tooShort || tooLong || charCount === 0}
          className="admin-btn admin-btn-primary"
        >
          {isPending ? 'Drafting…' : '⚡ Draft this idea'}
        </button>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: '0.75rem',
            color: 'var(--admin-text-muted)',
          }}
        >
          We'll create the idea row. From the content-ideas page, click "Run
          all checks" to write the article and run fact / voice / originality.
        </span>
      </div>
    </form>
  )
}
