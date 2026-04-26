'use client'

import { useState, useTransition } from 'react'
import {
  saveNewsletterAction,
  sendTestAction,
  sendToSubscribersAction,
  runNowAction,
} from './actions'
import type { NewsletterDraft } from '@/utils/ai/buildNewsletter'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'

interface FactCheckClaim {
  claim: string
  supported: boolean
  severity: string
  source_excerpt?: string | null
}

interface Props {
  id: string
  weekOf: string
  status: 'draft' | 'sent' | 'failed'
  subject: string
  subjectOptions: string[]
  draft: NewsletterDraft
  sentAt: string | null
  recipientCount: number | null
  activeSubscriberCount: number
  factCheckedAt: string | null
  factCheckClaims: FactCheckClaim[] | null
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.6875rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--admin-text-muted)',
  marginBottom: '0.375rem',
}

const sectionStyle: React.CSSProperties = {
  background: 'var(--admin-surface)',
  border: '1px solid var(--admin-border)',
  borderRadius: 'var(--admin-radius-lg)',
  padding: '1rem 1.125rem',
  marginBottom: '1rem',
}

export default function NewsletterEditor({
  id,
  weekOf,
  status,
  subject: initialSubject,
  subjectOptions,
  draft: initialDraft,
  sentAt,
  recipientCount,
  activeSubscriberCount,
  factCheckedAt,
  factCheckClaims,
}: Props) {
  const [subject, setSubject] = useState(initialSubject)
  const [draft, setDraft] = useState<NewsletterDraft>(initialDraft)
  const [confirmWord, setConfirmWord] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()

  const isSent = status === 'sent'

  function notify(msg: string, err = false) {
    if (err) { setError(msg); setMessage(null) }
    else { setMessage(msg); setError(null) }
  }

  function handleSave() {
    start(async () => {
      try {
        await saveNewsletterAction(id, { subject, draft_json: draft })
        notify('Saved.')
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Save failed', true)
      }
    })
  }

  function handleRunNow() {
    if (!confirm('Regenerate this week\'s draft? Your edits will be overwritten.')) return
    start(async () => {
      try {
        const res = await runNowAction()
        notify(`Regenerated. ${res.alerts_considered ?? 0} alerts + ${res.ideas_considered ?? 0} ideas considered. Reload the page.`)
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Regenerate failed', true)
      }
    })
  }

  function handleSendTest() {
    start(async () => {
      try {
        await saveNewsletterAction(id, { subject, draft_json: draft })
        const res = await sendTestAction(id)
        notify(`Test sent to ${res.to}.`)
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Test send failed', true)
      }
    })
  }

  function handleSendToSubscribers() {
    if (confirmWord !== 'Send') {
      notify('Type the word "Send" in the confirm box to enable the blast.', true)
      return
    }
    if (!confirm(`Really send to ${activeSubscriberCount} active subscribers?`)) return
    start(async () => {
      try {
        await saveNewsletterAction(id, { subject, draft_json: draft })
        const res = await sendToSubscribersAction(id, confirmWord)
        notify(`Sent to ${res.sent}/${res.total} subscribers.${res.failed ? ` ${res.failed} failed.` : ''}`)
        setConfirmWord('')
      } catch (e) {
        notify(e instanceof Error ? e.message : 'Send failed', true)
      }
    })
  }

  // The validator emits new field names AND mirrors them onto legacy ones,
  // so reading either works. Helpers below prefer the new names.
  const headline = draft.the_headline ?? draft.big_one ?? null
  const quickWins = draft.quick_wins ?? draft.haul ?? []
  const play = draft.play_of_the_week ?? draft.sweet_spot ?? null
  const headsUp = draft.heads_up ?? []
  const onMyRadar = draft.on_my_radar ?? []

  function updateQuickWin(i: number, patch: Partial<(typeof quickWins)[number]>) {
    const next = quickWins.map((h, idx) => (idx === i ? { ...h, ...patch } : h))
    setDraft({ ...draft, quick_wins: next, haul: next })
  }
  function updateHeadsUp(i: number, patch: Partial<(typeof headsUp)[number]>) {
    setDraft({ ...draft, heads_up: headsUp.map((h, idx) => (idx === i ? { ...h, ...patch } : h)) })
  }
  function updateRadar(i: number, patch: Partial<(typeof onMyRadar)[number]>) {
    setDraft({ ...draft, on_my_radar: onMyRadar.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) })
  }

  const sendEnabled = confirmWord === 'Send' && !isPending && !isSent
  const statusDescription = isSent && sentAt
    ? `sent ${new Date(sentAt).toLocaleString()} to ${recipientCount ?? 0} subscribers`
    : `${activeSubscriberCount} active subscribers ready`

  return (
    <div>
      <PageHeader
        title={`Newsletter — Week of ${weekOf}`}
        description={statusDescription}
        actions={<Badge tone={isSent ? 'success' : 'accent'}>{status}</Badge>}
      />

      {(message || error) && (
        <div style={{
          padding: '0.625rem 0.75rem',
          marginBottom: '1rem',
          borderRadius: 'var(--admin-radius)',
          border: `1px solid ${error ? 'var(--admin-danger)' : 'var(--admin-success)'}`,
          background: error ? 'var(--admin-danger-soft)' : 'var(--admin-success-soft)',
          color: error ? 'var(--admin-danger)' : 'var(--admin-success)',
          fontSize: '0.875rem',
        }}>
          {error ?? message}
        </div>
      )}

      {/* Phase 6b — fact-check summary */}
      {factCheckedAt && factCheckClaims && (() => {
        const unsupported = factCheckClaims.filter((c) => !c.supported)
        const high = unsupported.filter((c) => c.severity === 'high')
        const checked = new Date(factCheckedAt).toLocaleString()
        if (unsupported.length === 0) {
          return (
            <div style={{ padding: '0.5rem 0.75rem', marginBottom: '1rem', borderRadius: 'var(--admin-radius)', background: '#e6f4ea', border: '1px solid #9ac4a7', fontSize: '0.8125rem', color: '#1e5c2e' }}>
              ✓ Fact-checked — no unsupported claims · checked {checked}
            </div>
          )
        }
        return (
          <details
            open={high.length > 0}
            style={{
              marginBottom: '1rem',
              background: '#fff8e1',
              border: '1px solid #fde68a',
              borderRadius: 'var(--admin-radius)',
              fontSize: '0.8125rem',
              color: '#5a4210',
            }}
          >
            <summary style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontWeight: 600 }}>
              ⚠ {unsupported.length} claim{unsupported.length === 1 ? '' : 's'} flagged
              {high.length > 0 && <span style={{ fontWeight: 400 }}> · {high.length} high-severity</span>}
              <span style={{ fontWeight: 400, color: '#7a5a1f' }}> · checked {checked}</span>
            </summary>
            <ul style={{ margin: 0, padding: '0 0.75rem 0.625rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {unsupported.map((c, i) => (
                <li key={i} style={{ lineHeight: 1.4 }}>
                  <strong style={{ color: c.severity === 'high' ? '#7a1f1f' : '#7a5a1f' }}>
                    [{c.severity}]
                  </strong>{' '}
                  {c.claim}
                </li>
              ))}
            </ul>
          </details>
        )
      })()}

      <div style={sectionStyle}>
        <label style={labelStyle}>Subject line</label>
        {subjectOptions.length > 0 && (
          <div style={{ display: 'grid', gap: '0.375rem', marginBottom: '0.75rem' }}>
            {subjectOptions.map((opt, i) => (
              <label key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="radio" name="subject" checked={subject === opt} onChange={() => setSubject(opt)} disabled={isSent} style={{ accentColor: 'var(--admin-accent)' }} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Type a custom subject"
          className="admin-input"
          disabled={isSent}
        />
      </div>

      {headline && (
        <div style={sectionStyle}>
          <label style={labelStyle}>The Headline</label>
          <input
            type="text"
            value={headline.headline}
            onChange={(e) => setDraft({ ...draft, the_headline: { ...headline, headline: e.target.value }, big_one: { ...headline, headline: e.target.value } })}
            placeholder="Headline"
            className="admin-input"
            style={{ marginBottom: '0.5rem' }}
            disabled={isSent}
          />
          <textarea
            value={headline.why_it_matters}
            onChange={(e) => setDraft({ ...draft, the_headline: { ...headline, why_it_matters: e.target.value }, big_one: { ...headline, why_it_matters: e.target.value } })}
            placeholder="Why it matters"
            className="admin-input"
            style={{ minHeight: '4.5rem', resize: 'vertical', lineHeight: 1.5, marginBottom: '0.5rem' }}
            disabled={isSent}
          />
          <textarea
            value={headline.what_to_do}
            onChange={(e) => setDraft({ ...draft, the_headline: { ...headline, what_to_do: e.target.value }, big_one: { ...headline, what_to_do: e.target.value } })}
            placeholder="What to do"
            className="admin-input"
            style={{ minHeight: '4.5rem', resize: 'vertical', lineHeight: 1.5 }}
            disabled={isSent}
          />
        </div>
      )}

      {quickWins.length > 0 && (
        <div style={sectionStyle}>
          <label style={labelStyle}>Quick Wins ({quickWins.length})</label>
          {quickWins.map((item, i) => (
            <div key={i} style={{ padding: '0.75rem 0', borderTop: i === 0 ? 'none' : '1px dashed var(--admin-border)' }}>
              <input
                type="text"
                value={item.headline}
                onChange={(e) => updateQuickWin(i, { headline: e.target.value })}
                placeholder="Headline"
                className="admin-input"
                style={{ marginBottom: '0.5rem' }}
                disabled={isSent}
              />
              <textarea
                value={item.blurb}
                onChange={(e) => updateQuickWin(i, { blurb: e.target.value })}
                placeholder="Blurb (auto-sourced from the alert's why_this_matters when present)"
                className="admin-input"
                style={{ minHeight: '4.5rem', resize: 'vertical', lineHeight: 1.5 }}
                disabled={isSent}
              />
            </div>
          ))}
        </div>
      )}

      {play && (
        <div style={sectionStyle}>
          <label style={labelStyle}>The Play of the Week</label>
          <input
            type="text"
            value={play.topic}
            onChange={(e) => setDraft({ ...draft, play_of_the_week: { ...play, topic: e.target.value }, sweet_spot: { ...play, topic: e.target.value } })}
            placeholder="Topic"
            className="admin-input"
            style={{ marginBottom: '0.5rem' }}
            disabled={isSent}
          />
          <textarea
            value={play.mechanic_explainer}
            onChange={(e) => setDraft({ ...draft, play_of_the_week: { ...play, mechanic_explainer: e.target.value }, sweet_spot: { ...play, mechanic_explainer: e.target.value } })}
            placeholder="Mechanic explainer"
            className="admin-input"
            style={{ minHeight: '7rem', resize: 'vertical', lineHeight: 1.5 }}
            disabled={isSent}
          />
          <p style={{ margin: '0.625rem 0 0', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            Best uses: {play.best_uses?.length ?? 0} items (edit via Run Now regeneration for now)
          </p>
        </div>
      )}

      {headsUp.length > 0 && (
        <div style={sectionStyle}>
          <label style={labelStyle}>Heads Up ({headsUp.length})</label>
          {headsUp.map((item, i) => (
            <div key={i} style={{ padding: '0.625rem 0', borderTop: i === 0 ? 'none' : '1px dashed var(--admin-border)' }}>
              <input
                type="text"
                value={item.headline}
                onChange={(e) => updateHeadsUp(i, { headline: e.target.value })}
                placeholder="What's changing"
                className="admin-input"
                style={{ marginBottom: '0.375rem' }}
                disabled={isSent}
              />
              <textarea
                value={item.what}
                onChange={(e) => updateHeadsUp(i, { what: e.target.value })}
                placeholder="One-sentence what"
                className="admin-input"
                style={{ minHeight: '3rem', resize: 'vertical', lineHeight: 1.5, marginBottom: '0.375rem' }}
                disabled={isSent}
              />
              <input
                type="text"
                value={item.when}
                onChange={(e) => updateHeadsUp(i, { when: e.target.value })}
                placeholder="When (e.g. Ends Apr 30)"
                className="admin-input"
                disabled={isSent}
              />
            </div>
          ))}
        </div>
      )}

      {onMyRadar.length > 0 && (
        <div style={sectionStyle}>
          <label style={labelStyle}>On My Radar ({onMyRadar.length})</label>
          {onMyRadar.map((item, i) => (
            <div key={i} style={{ padding: '0.625rem 0', borderTop: i === 0 ? 'none' : '1px dashed var(--admin-border)' }}>
              <input
                type="text"
                value={item.headline}
                onChange={(e) => updateRadar(i, { headline: e.target.value })}
                placeholder="Headline"
                className="admin-input"
                style={{ marginBottom: '0.375rem' }}
                disabled={isSent}
              />
              <textarea
                value={item.why}
                onChange={(e) => updateRadar(i, { why: e.target.value })}
                placeholder="Why it might matter soon"
                className="admin-input"
                style={{ minHeight: '3rem', resize: 'vertical', lineHeight: 1.5 }}
                disabled={isSent}
              />
            </div>
          ))}
        </div>
      )}

      <div style={sectionStyle}>
        <label style={labelStyle}>Jill's Take</label>
        <textarea
          value={draft.jills_take}
          onChange={(e) => setDraft({ ...draft, jills_take: e.target.value })}
          className="admin-input"
          style={{ minHeight: '4.5rem', resize: 'vertical', lineHeight: 1.5 }}
          disabled={isSent}
        />
      </div>

      {!isSent && (
        <div style={{ ...sectionStyle, background: 'var(--admin-surface-alt)' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button type="button" onClick={handleSave} disabled={isPending} className="admin-btn admin-btn-secondary admin-btn-sm">
              {isPending ? 'Working…' : 'Save'}
            </button>
            <button type="button" onClick={handleRunNow} disabled={isPending} className="admin-btn admin-btn-secondary admin-btn-sm">
              Run Now (regenerate)
            </button>
            <button type="button" onClick={handleSendTest} disabled={isPending} className="admin-btn admin-btn-primary admin-btn-sm">
              Send test to me
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '1rem' }}>
            <label style={labelStyle}>Danger zone — send to real subscribers</label>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
              Type <strong>Send</strong> below exactly. Case-sensitive. Then click the button.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                value={confirmWord}
                onChange={(e) => setConfirmWord(e.target.value)}
                placeholder='Type "Send" to enable'
                className="admin-input"
                style={{ maxWidth: '220px' }}
              />
              <button
                type="button"
                onClick={handleSendToSubscribers}
                disabled={!sendEnabled}
                className="admin-btn admin-btn-danger admin-btn-sm"
              >
                Send to {activeSubscriberCount} subscribers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
