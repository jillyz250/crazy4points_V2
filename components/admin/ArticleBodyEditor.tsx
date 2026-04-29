'use client'

import { useState, useTransition } from 'react'
import {
  updateArticleBodyAction,
  type UpdateArticleBodyResult,
} from '@/app/admin/(protected)/content-ideas/actions'

interface Props {
  ideaId: string
  body: string
  writtenAt: string | null
}

/**
 * Inline article-body editor for the content-ideas admin card.
 *
 * Replaces the read-only `<pre>` viewer with a click-to-edit toggle.
 * Closed state mirrors the previous UX (collapsible "Article body (N chars)"
 * disclosure) so editors don't have to relearn the surface; expanded state
 * adds an "Edit" button next to the metadata, which swaps the `<pre>` for a
 * `<textarea>` plus Save / Cancel.
 *
 * Doesn't reset fact-check / voice / originality pills on save — the editor
 * sees the "stale pill" state after editing and explicitly re-runs checks.
 */
export default function ArticleBodyEditor({ ideaId, body, writtenAt }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(body)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<
    | { kind: 'ok'; text: string }
    | { kind: 'err'; text: string }
    | null
  >(null)

  const charCount = (isEditing ? draft : body).length
  const writtenLabel = writtenAt ? ` · drafted ${new Date(writtenAt).toLocaleString()}` : ''

  function handleSave() {
    setMessage(null)
    startTransition(async () => {
      const res: UpdateArticleBodyResult = await updateArticleBodyAction(ideaId, draft)
      if (res.ok) {
        setMessage({
          kind: 'ok',
          text: `Saved ${res.chars.toLocaleString()} chars · re-run fact / voice / originality checks if your edit changed facts`,
        })
        setIsEditing(false)
      } else {
        setMessage({ kind: 'err', text: res.error })
      }
    })
  }

  function handleCancel() {
    setDraft(body)
    setIsEditing(false)
    setMessage(null)
  }

  return (
    <details
      style={{ margin: '0 0 0.75rem' }}
      // Keep open while editing so cancel/save are reachable without
      // collapsing the surface.
      open={isEditing || undefined}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontSize: '0.8125rem',
          color: 'var(--admin-accent)',
          fontWeight: 600,
        }}
      >
        Article body ({charCount.toLocaleString()} chars{writtenLabel})
      </summary>

      <div style={{ marginTop: '0.5rem' }}>
        {/* Action bar — always present so the affordance is discoverable */}
        <div
          style={{
            display: 'flex',
            gap: '0.375rem',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}
        >
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setDraft(body)
                setIsEditing(true)
                setMessage(null)
              }}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              ✎ Edit body
            </button>
          )}
          {isEditing && (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={pending || draft.trim().length === 0}
                className="admin-btn admin-btn-primary admin-btn-sm"
              >
                {pending ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={pending}
                className="admin-btn admin-btn-ghost admin-btn-sm"
              >
                Cancel
              </button>
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--admin-text-muted)',
                  marginLeft: '0.25rem',
                }}
              >
                Markdown supported · {draft.length.toLocaleString()} chars
              </span>
            </>
          )}
        </div>

        {message && (
          <div
            role="status"
            style={{
              padding: '0.375rem 0.625rem',
              marginBottom: '0.5rem',
              borderRadius: 'var(--admin-radius)',
              fontSize: '0.75rem',
              border: `1px solid ${
                message.kind === 'ok' ? 'var(--admin-success)' : 'var(--admin-danger)'
              }`,
              background:
                message.kind === 'ok'
                  ? 'var(--admin-success-soft, #e6f4ea)'
                  : 'var(--admin-danger-soft, #fdecea)',
              color:
                message.kind === 'ok' ? 'var(--admin-success)' : 'var(--admin-danger)',
            }}
          >
            {message.text}
          </div>
        )}

        {isEditing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={pending}
            spellCheck
            style={{
              width: '100%',
              minHeight: '24rem',
              padding: '0.75rem 0.875rem',
              background: 'var(--admin-surface-alt)',
              border: '1px solid var(--admin-border)',
              borderRadius: 'var(--admin-radius)',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.8125rem',
              lineHeight: 1.55,
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <pre
            style={{
              padding: '0.75rem 0.875rem',
              background: 'var(--admin-surface-alt)',
              border: '1px solid var(--admin-border)',
              borderRadius: 'var(--admin-radius)',
              fontSize: '0.8125rem',
              lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: 0,
            }}
          >
            {body}
          </pre>
        )}
      </div>
    </details>
  )
}
