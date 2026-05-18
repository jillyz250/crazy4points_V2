'use client'

import { useState, useTransition } from 'react'
import {
  updateTopicAction,
  extractFactLedgerAction,
  verifyTopicAction,
  archiveTopicAction,
  activateTopicAction,
  updateFactLedgerAction,
} from '@/app/admin/(protected)/topics/actions'
import type {
  Topic,
  FactLedgerEntry,
  TopicType,
  ConfidenceLevel,
  ContentVariant,
} from '@/utils/supabase/queries'
import type { VerifyError } from '@/utils/content/verifyTopic'
import { MultiSelectChecklist, type MultiSelectOption } from './MultiSelectChecklist'
import VariantsGrid from './VariantsGrid'

const TOPIC_TYPE_OPTIONS: TopicType[] = [
  'promo',
  'transfer_bonus',
  'signup_bonus',
  'referral_bonus',
  'retention_offer',
  'limited_time_offer',
  'shopping_portal_bonus',
  'award_sale',
  'companion_pass',
  'dining_bonus',
  'milestone_bonus',
  'card_credit',
  'card_refresh',
  'fee_change',
  'devaluation',
  'sweet_spot',
  'program_change',
  'partner_change',
  'category_change',
  'earn_rate_change',
  'status_change',
  'status_promo',
  'policy_change',
  'industry_news',
  'award_availability',
  'glitch',
  'other',
]

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  marginBottom: '0.25rem',
  display: 'block',
  color: 'var(--color-text-secondary)',
}
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.625rem',
  fontSize: '1rem',
  border: '1px solid var(--color-border-soft)',
  borderRadius: 'var(--radius-ui)',
  background: '#fff',
}
const sectionStyle: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '1.5rem',
  borderTop: '1px solid var(--color-border-soft)',
}

function normalize(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

function quoteMatches(quote: string, markdown: string): boolean {
  if (!quote) return false
  return normalize(markdown).includes(normalize(quote))
}

export default function TopicEditor({
  topic,
  programOptions,
  cardOptions,
  variants,
}: {
  topic: Topic
  programOptions: MultiSelectOption[]
  cardOptions: MultiSelectOption[]
  variants: ContentVariant[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Local working state — source markdown gates the substring check.
  const [sourceMarkdown, setSourceMarkdown] = useState(topic.source_markdown ?? '')
  const [sourceUrls, setSourceUrls] = useState((topic.source_urls ?? []).join('\n'))

  const [ledger, setLedger] = useState<FactLedgerEntry[]>(topic.fact_ledger ?? [])
  const [verifyErrors, setVerifyErrors] = useState<VerifyError[]>([])
  const [lastVerifyStatus, setLastVerifyStatus] = useState<string | null>(null)

  const readOnlySource = topic.fact_check_status === 'verified' || topic.fact_check_status === 'partially_verified'

  function flashError(e: string | null | undefined) {
    setError(e ?? null)
    setInfo(null)
  }
  function flashInfo(m: string) {
    setInfo(m)
    setError(null)
  }

  function onSaveMetadata(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    flashError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('id', topic.id)
    fd.set('slug', topic.slug)
    fd.set('source_markdown', sourceMarkdown)
    fd.set('source_urls', sourceUrls)
    startTransition(async () => {
      const r = await updateTopicAction(fd)
      if (r?.error) flashError(r.error)
      else flashInfo('Saved.')
    })
  }

  function onExtractFacts() {
    flashError(null)
    setVerifyErrors([])
    setLastVerifyStatus(null)
    const fd = new FormData()
    fd.set('id', topic.id)
    fd.set('slug', topic.slug)
    startTransition(async () => {
      const r = await extractFactLedgerAction(fd)
      if (r?.error) {
        flashError(r.error)
      } else if (r?.entries) {
        setLedger(r.entries)
        flashInfo(`Extracted ${r.entries.length} claim${r.entries.length === 1 ? '' : 's'}. Review them, then click Verify.`)
      }
    })
  }

  function onSaveLedger() {
    flashError(null)
    const fd = new FormData()
    fd.set('id', topic.id)
    fd.set('slug', topic.slug)
    fd.set('fact_ledger', JSON.stringify(ledger))
    startTransition(async () => {
      const r = await updateFactLedgerAction(fd)
      if (r?.error) flashError(r.error)
      else flashInfo('Fact ledger saved.')
    })
  }

  function onVerify() {
    flashError(null)
    const fd = new FormData()
    fd.set('id', topic.id)
    fd.set('slug', topic.slug)
    // Save edited ledger first
    const saveFd = new FormData()
    saveFd.set('id', topic.id)
    saveFd.set('slug', topic.slug)
    saveFd.set('fact_ledger', JSON.stringify(ledger))
    startTransition(async () => {
      const save = await updateFactLedgerAction(saveFd)
      if (save?.error) {
        flashError(save.error)
        return
      }
      const r = await verifyTopicAction(fd)
      if (r?.error) {
        flashError(r.error)
        return
      }
      setVerifyErrors(r.errors ?? [])
      setLastVerifyStatus(r.status ?? null)
      if (r.status === 'verified') flashInfo('Verified — all checks passed.')
      else if (r.status === 'partially_verified')
        flashInfo('Partially verified — some claims are low-confidence but no hard failures.')
      else flashError(`Verification failed (${(r.errors ?? []).length} issue${(r.errors ?? []).length === 1 ? '' : 's'} below).`)
    })
  }

  function onArchive() {
    if (!confirm('Archive this topic? It will be hidden from active lists.')) return
    const fd = new FormData()
    fd.set('id', topic.id)
    fd.set('slug', topic.slug)
    startTransition(async () => {
      const r = await archiveTopicAction(fd)
      if (r?.error) flashError(r.error)
      else flashInfo('Archived.')
    })
  }

  function onActivate() {
    const fd = new FormData()
    fd.set('id', topic.id)
    fd.set('slug', topic.slug)
    startTransition(async () => {
      const r = await activateTopicAction(fd)
      if (r?.error) flashError(r.error)
      else flashInfo('Activated.')
    })
  }

  function updateLedgerRow(i: number, patch: Partial<FactLedgerEntry>) {
    setLedger((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...patch } : e)))
  }
  function removeLedgerRow(i: number) {
    setLedger((prev) => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      {error && (
        <div
          style={{
            padding: '0.75rem',
            background: '#fdf3f3',
            border: '1px solid #f5c2c2',
            borderRadius: 'var(--radius-ui)',
            color: '#8a1f1f',
            marginBottom: '1rem',
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
          }}
        >
          {info}
        </div>
      )}

      {/* Section: metadata */}
      <form onSubmit={onSaveMetadata} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Title</label>
            <input name="title" required defaultValue={topic.title} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Topic type</label>
            <select name="topic_type" defaultValue={topic.topic_type} style={inputStyle}>
              {TOPIC_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>End date</label>
            <input
              name="end_date"
              type="date"
              defaultValue={topic.end_date ? topic.end_date.slice(0, 10) : ''}
              style={inputStyle}
            />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Summary</label>
          <input name="summary" defaultValue={topic.summary ?? ''} style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Source markdown {readOnlySource && '(read-only — topic is verified)'}</label>
          <textarea
            value={sourceMarkdown}
            onChange={(e) => setSourceMarkdown(e.target.value)}
            disabled={readOnlySource}
            style={{ ...inputStyle, minHeight: '14rem', fontFamily: 'monospace', fontSize: '0.875rem' }}
          />
        </div>

        <div>
          <label style={labelStyle}>Source URLs (one per line)</label>
          <textarea
            value={sourceUrls}
            onChange={(e) => setSourceUrls(e.target.value)}
            disabled={readOnlySource}
            style={{ ...inputStyle, minHeight: '5rem', fontFamily: 'monospace', fontSize: '0.875rem' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Programs</label>
            <MultiSelectChecklist
              name="programs"
              options={programOptions}
              initialSelected={topic.programs ?? []}
            />
          </div>
          <div>
            <label style={labelStyle}>Cards</label>
            <MultiSelectChecklist
              name="cards"
              options={cardOptions}
              initialSelected={topic.cards ?? []}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="rg-btn-primary" disabled={isPending}>
            {isPending ? 'Saving…' : 'Save metadata'}
          </button>
          {topic.status === 'draft' && (
            <button type="button" onClick={onActivate} className="rg-btn-secondary" disabled={isPending}>
              Activate
            </button>
          )}
          {topic.status !== 'archived' && (
            <button type="button" onClick={onArchive} className="rg-btn-secondary" disabled={isPending}>
              Archive
            </button>
          )}
        </div>
      </form>

      {/* Section: fact ledger */}
      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Fact ledger</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Every claim must trace back to an exact substring of the source markdown.
          Extraction is done by Haiku; the substring check + issuer-domain
          allowlist run programmatically when you click Verify.
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={onExtractFacts} className="rg-btn-secondary" disabled={isPending}>
            {ledger.length === 0 ? 'Extract facts' : 'Re-extract facts'}
          </button>
          {ledger.length > 0 && (
            <>
              <button type="button" onClick={onSaveLedger} className="rg-btn-secondary" disabled={isPending}>
                Save ledger
              </button>
              <button type="button" onClick={onVerify} className="rg-btn-primary" disabled={isPending}>
                Verify topic
              </button>
            </>
          )}
        </div>

        {lastVerifyStatus && (
          <div
            style={{
              padding: '0.5rem 0.75rem',
              marginBottom: '0.75rem',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-ui)',
              background:
                lastVerifyStatus === 'verified'
                  ? '#e8f5e8'
                  : lastVerifyStatus === 'partially_verified'
                  ? '#fff8e1'
                  : '#fdecec',
              color:
                lastVerifyStatus === 'verified'
                  ? '#1f6a1f'
                  : lastVerifyStatus === 'partially_verified'
                  ? '#7a5b00'
                  : '#8a1f1f',
            }}
          >
            Last verify result: <strong>{lastVerifyStatus}</strong>
          </div>
        )}

        {verifyErrors.length > 0 && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              border: '1px solid #f5c2c2',
              borderRadius: 'var(--radius-ui)',
              background: '#fdf3f3',
            }}
          >
            <strong style={{ color: '#8a1f1f' }}>Verification errors:</strong>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
              {verifyErrors.map((e, i) => (
                <li key={i}>
                  {e.check === 'source_quote' ? (
                    <>
                      Claim #{e.claim_index + 1}: quote not found in source markdown —{' '}
                      <code style={{ fontSize: '0.75rem' }}>
                        {e.actual_quote_attempted.slice(0, 80)}
                        {e.actual_quote_attempted.length > 80 ? '…' : ''}
                      </code>
                    </>
                  ) : (
                    <>
                      URL not on issuer-domain allowlist:{' '}
                      <code style={{ fontSize: '0.75rem' }}>{e.url}</code>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {ledger.length === 0 ? (
          <div
            style={{
              padding: '1rem',
              textAlign: 'center',
              border: '1px dashed var(--color-border-soft)',
              borderRadius: 'var(--radius-card)',
              color: 'var(--color-text-secondary)',
            }}
          >
            No facts extracted yet. Click <strong>Extract facts</strong> to run Haiku
            against the source markdown above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {ledger.map((entry, i) => {
              const ok = quoteMatches(entry.source_quote, sourceMarkdown)
              return (
                <div
                  key={i}
                  style={{
                    border: `1px solid ${ok ? 'var(--color-border-soft)' : '#f5c2c2'}`,
                    background: ok ? '#fff' : '#fdf3f3',
                    borderRadius: 'var(--radius-card)',
                    padding: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem',
                      gap: '0.5rem',
                    }}
                  >
                    <strong style={{ fontSize: '0.75rem' }}>Claim #{i + 1}</strong>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select
                        value={entry.confidence}
                        onChange={(e) =>
                          updateLedgerRow(i, { confidence: e.target.value as ConfidenceLevel })
                        }
                        style={{ ...inputStyle, width: 'auto', padding: '0.25rem 0.375rem' }}
                      >
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => removeLedgerRow(i)}
                        className="rg-btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={labelStyle}>Claim</label>
                    <textarea
                      value={entry.claim}
                      onChange={(e) => updateLedgerRow(i, { claim: e.target.value })}
                      style={{ ...inputStyle, minHeight: '3rem' }}
                    />
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={labelStyle}>
                      Source quote {ok ? '(matches source markdown)' : '(NOT FOUND in source markdown)'}
                    </label>
                    <textarea
                      value={entry.source_quote}
                      onChange={(e) => updateLedgerRow(i, { source_quote: e.target.value })}
                      style={{
                        ...inputStyle,
                        minHeight: '4rem',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        borderColor: ok ? 'var(--color-border-soft)' : '#f5c2c2',
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <label style={labelStyle}>Source URL</label>
                      <input
                        value={entry.source_url}
                        onChange={(e) => updateLedgerRow(i, { source_url: e.target.value })}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Category</label>
                      <input
                        value={entry.category ?? ''}
                        onChange={(e) =>
                          updateLedgerRow(i, { category: e.target.value.trim() || null })
                        }
                        placeholder="welcome_bonus | earn_rate | benefit | …"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Section: variants */}
      <section style={sectionStyle}>
        <h2 style={{ marginTop: 0 }}>Variants</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          One card per format. Generate runs Sonnet against the fact ledger;
          fact-grep flags any dollar amount, percent, or date the model
          introduced that isn&apos;t in the ledger.
        </p>
        <VariantsGrid
          slug={topic.slug}
          variants={variants}
          factCheckStatus={topic.fact_check_status}
        />
      </section>
    </div>
  )
}
