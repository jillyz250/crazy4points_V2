'use client'

/**
 * VariantsGrid — the 8-format variant card grid on the topic edit page.
 * (PR 3 of content system rehaul.)
 *
 * Each card: format name, status badge, body length, Generate / Edit /
 * View fact-grep buttons. Publishing lives in PR 4.
 */

import { useState, useTransition } from 'react'
import {
  generateVariantAction,
  updateVariantBodyAction,
} from '@/app/admin/(protected)/topics/actions'
import type {
  ContentVariant,
  VariantFormat,
  VariantStatus,
  FactCheckStatus,
} from '@/utils/supabase/queries'
import type {
  FactGrepResult,
  FactGrepUnmatched,
} from '@/utils/content/factGrepCheck'

const FORMATS: VariantFormat[] = [
  'alert',
  'blog',
  'newsletter',
  'facebook',
  'twitter',
  'instagram',
  'linkedin',
  'threads',
]

const FORMAT_LABELS: Record<VariantFormat, string> = {
  alert: 'Alert',
  blog: 'Blog',
  newsletter: 'Newsletter',
  facebook: 'Facebook',
  twitter: 'Twitter / X',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  threads: 'Threads',
}

const FORMAT_ICONS: Record<VariantFormat, string> = {
  alert: '🚨',
  blog: '📝',
  newsletter: '📧',
  facebook: 'f',
  twitter: '𝕏',
  instagram: '📷',
  linkedin: 'in',
  threads: '@',
}

function statusBadge(status: VariantStatus | null): { dot: string; label: string; color: string } {
  if (!status) return { dot: '⚪', label: 'Not generated', color: 'var(--color-text-secondary)' }
  switch (status) {
    case 'draft':
      return { dot: '🟡', label: 'Draft', color: '#7a5b00' }
    case 'needs_review':
      return { dot: '🟠', label: 'Needs review', color: '#a85a00' }
    case 'approved':
      return { dot: '🟢', label: 'Approved', color: '#1f6a1f' }
    case 'published':
      return { dot: '📤', label: 'Published', color: '#1f3a8a' }
    case 'archived':
      return { dot: '🗄', label: 'Archived', color: 'var(--color-text-secondary)' }
  }
}

function bodyMetric(format: VariantFormat, body: string | null): string {
  if (!body) return ''
  const words = body.trim().split(/\s+/).filter(Boolean).length
  const chars = body.length
  // Short-form formats: char count. Long-form: word count.
  if (
    format === 'twitter' ||
    format === 'threads' ||
    format === 'instagram' ||
    format === 'linkedin'
  ) {
    return `${chars} chars`
  }
  return `${words} words`
}

function unmatchedFromMetadata(v: ContentVariant): FactGrepUnmatched[] {
  const raw = (v.metadata ?? {}) as { fact_grep_unmatched?: FactGrepUnmatched[] }
  return Array.isArray(raw.fact_grep_unmatched) ? raw.fact_grep_unmatched : []
}

export default function VariantsGrid({
  slug,
  variants,
  factCheckStatus,
}: {
  slug: string
  variants: ContentVariant[]
  factCheckStatus: FactCheckStatus
}) {
  const [isPending, startTransition] = useTransition()
  const [byFormat, setByFormat] = useState<Partial<Record<VariantFormat, ContentVariant>>>(
    () => Object.fromEntries(variants.map((v) => [v.format, v])) as Partial<
      Record<VariantFormat, ContentVariant>
    >,
  )
  const [editingFormat, setEditingFormat] = useState<VariantFormat | null>(null)
  const [editorBody, setEditorBody] = useState('')
  const [editorTitle, setEditorTitle] = useState('')
  const [grepModalFormat, setGrepModalFormat] = useState<VariantFormat | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const verified =
    factCheckStatus === 'verified' || factCheckStatus === 'partially_verified'

  function flashError(e: string | null | undefined) {
    setError(e ?? null)
    setInfo(null)
  }
  function flashInfo(m: string) {
    setInfo(m)
    setError(null)
  }

  function applyGenerated(format: VariantFormat, v: ContentVariant) {
    setByFormat((prev) => ({ ...prev, [format]: v }))
  }

  function onGenerate(format: VariantFormat) {
    if (!verified) {
      flashError('Verify the topic first.')
      return
    }
    flashError(null)
    const fd = new FormData()
    fd.set('slug', slug)
    fd.set('format', format)
    startTransition(async () => {
      const r = await generateVariantAction(fd)
      if (!r.ok) {
        flashError(r.error ?? 'Generation failed.')
        return
      }
      // Re-fetch the variant from the result. We don't have the full row but
      // we have status + variantId + grep — the page will refresh on
      // revalidation. For optimistic UI we patch minimally.
      flashInfo(
        r.factGrepResult && r.factGrepResult.unmatched.length > 0
          ? `Generated — fact-grep flagged ${r.factGrepResult.unmatched.length} unmatched claim${r.factGrepResult.unmatched.length === 1 ? '' : 's'}. Status: ${r.status}.`
          : `Generated. Status: ${r.status}.`,
      )
      // Trigger a server refetch via reload — the server action revalidates
      // the path, but we're inside a transition + client state, so simplest
      // is to reload. The PR 4 publish pipeline will refine this.
      if (typeof window !== 'undefined') window.location.reload()
    })
  }

  function onOpenEdit(format: VariantFormat) {
    const existing = byFormat[format]
    if (!existing) return
    setEditingFormat(format)
    setEditorBody(existing.body ?? '')
    setEditorTitle(existing.title ?? '')
  }

  function onSaveEdit() {
    if (!editingFormat) return
    flashError(null)
    const fd = new FormData()
    fd.set('slug', slug)
    fd.set('format', editingFormat)
    fd.set('body', editorBody)
    fd.set('title', editorTitle)
    startTransition(async () => {
      const r = await updateVariantBodyAction(fd)
      if (!r.ok) {
        flashError(r.error ?? 'Save failed.')
        return
      }
      flashInfo(
        r.factGrepResult && r.factGrepResult.unmatched.length > 0
          ? `Saved — fact-grep still flags ${r.factGrepResult.unmatched.length} unmatched. Status: ${r.status}.`
          : `Saved. Status: ${r.status}.`,
      )
      setEditingFormat(null)
      if (typeof window !== 'undefined') window.location.reload()
    })
  }

  function onCancelEdit() {
    setEditingFormat(null)
    setEditorBody('')
    setEditorTitle('')
  }

  return (
    <div>
      {!verified && (
        <div
          style={{
            padding: '0.75rem',
            background: '#fff8e1',
            border: '1px solid #f0d97a',
            borderRadius: 'var(--radius-ui)',
            color: '#7a5b00',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          Topic is <strong>{factCheckStatus}</strong>. Run <strong>Verify topic</strong>{' '}
          before generating variants — the fact ledger is the only sanctioned source of fact.
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '0.75rem',
            background: '#fdf3f3',
            border: '1px solid #f5c2c2',
            borderRadius: 'var(--radius-ui)',
            color: '#8a1f1f',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          {error}
        </div>
      )}
      {info && (
        <div
          style={{
            padding: '0.75rem',
            background: '#f0f7f0',
            border: '1px solid #c2e0c2',
            borderRadius: 'var(--radius-ui)',
            color: '#1f6a1f',
            marginBottom: '1rem',
            fontSize: '0.875rem',
          }}
        >
          {info}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))',
          gap: '0.75rem',
        }}
      >
        {FORMATS.map((format) => {
          const v = byFormat[format]
          const status = v?.status ?? null
          const badge = statusBadge(status)
          const metric = v ? bodyMetric(format, v.body) : ''
          const unmatched = v ? unmatchedFromMetadata(v) : []

          return (
            <div
              key={format}
              style={{
                padding: '0.75rem',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-card)',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                minHeight: '11rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1rem' }} aria-hidden>
                    {FORMAT_ICONS[format]}
                  </span>
                  <strong style={{ fontSize: '0.875rem' }}>{FORMAT_LABELS[format]}</strong>
                </div>
                <span style={{ fontSize: '0.75rem' }} aria-hidden>
                  {badge.dot}
                </span>
              </div>

              <div style={{ fontSize: '0.75rem', color: badge.color }}>
                {badge.label}
                {metric && (
                  <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.4rem' }}>
                    · {metric}
                  </span>
                )}
              </div>

              {unmatched.length > 0 && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: '#8a1f1f',
                    background: '#fdf3f3',
                    border: '1px solid #f5c2c2',
                    padding: '0.25rem 0.4rem',
                    borderRadius: 'var(--radius-ui)',
                  }}
                >
                  {unmatched.length} fact-grep issue
                  {unmatched.length === 1 ? '' : 's'}
                </div>
              )}

              <div
                style={{
                  marginTop: 'auto',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.35rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => onGenerate(format)}
                  className="rg-btn-secondary"
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                  disabled={isPending || !verified}
                >
                  {v ? 'Regenerate' : 'Generate'}
                </button>
                {v && (
                  <button
                    type="button"
                    onClick={() => onOpenEdit(format)}
                    className="rg-btn-secondary"
                    style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                    disabled={isPending}
                  >
                    Edit
                  </button>
                )}
                {unmatched.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setGrepModalFormat(format)}
                    className="rg-btn-secondary"
                    style={{ padding: '0.3rem 0.55rem', fontSize: '0.75rem' }}
                  >
                    View fact-grep
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit modal (inline panel) */}
      {editingFormat && byFormat[editingFormat] && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
            background: 'var(--color-background-soft)',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>
            Edit {FORMAT_LABELS[editingFormat]} variant
          </h3>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
              Title (optional for social)
            </label>
            <input
              value={editorTitle}
              onChange={(e) => setEditorTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                fontSize: '1rem',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-ui)',
                background: '#fff',
              }}
            />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
              Body
            </label>
            <textarea
              value={editorBody}
              onChange={(e) => setEditorBody(e.target.value)}
              style={{
                width: '100%',
                minHeight: '14rem',
                padding: '0.5rem',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-ui)',
                background: '#fff',
              }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
              Saving re-runs fact-grep. Unmatched claims flip status to needs_review.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onSaveEdit}
              className="rg-btn-primary"
              disabled={isPending}
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="rg-btn-secondary"
              disabled={isPending}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Fact-grep modal */}
      {grepModalFormat && byFormat[grepModalFormat] && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1rem',
            border: '1px solid #f5c2c2',
            borderRadius: 'var(--radius-card)',
            background: '#fdf3f3',
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#8a1f1f' }}>
            Fact-grep issues — {FORMAT_LABELS[grepModalFormat]}
          </h3>
          <p style={{ fontSize: '0.8rem', marginTop: 0 }}>
            The generator surfaced specific claims (dollars, percents, dates)
            that don&apos;t appear in this topic&apos;s fact ledger. Either edit
            them out, or add a matching ledger entry and verify the topic again.
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
            {unmatchedFromMetadata(byFormat[grepModalFormat]!).map((u, i) => (
              <li key={i}>
                <code style={{ fontSize: '0.8rem' }}>{u.claim_snippet}</code>{' '}
                <span style={{ color: 'var(--color-text-secondary)' }}>({u.pattern_type})</span>
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setGrepModalFormat(null)}
              className="rg-btn-secondary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
