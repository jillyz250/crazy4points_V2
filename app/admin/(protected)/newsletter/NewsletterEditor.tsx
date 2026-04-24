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

  function updateHaul(i: number, patch: Partial<typeof draft.haul[number]>) {
    setDraft({
      ...draft,
      haul: draft.haul.map((h, idx) => (idx === i ? { ...h, ...patch } : h)),
    })
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

      <div style={sectionStyle}>
        <label style={labelStyle}>Opener</label>
        <textarea
          value={draft.opener}
          onChange={(e) => setDraft({ ...draft, opener: e.target.value })}
          className="admin-input"
          style={{ minHeight: '4.5rem', resize: 'vertical', lineHeight: 1.5 }}
          disabled={isSent}
        />
      </div>

      {draft.big_one && (
        <div style={sectionStyle}>
          <label style={labelStyle}>The Big One</label>
          <input
            type="text"
            value={draft.big_one.headline}
            onChange={(e) => setDraft({ ...draft, big_one: { ...draft.big_one!, headline: e.target.value } })}
            placeholder="Headline"
            className="admin-input"
            style={{ marginBottom: '0.5rem' }}
            disabled={isSent}
          />
          <textarea
            value={draft.big_one.why_it_matters}
            onChange={(e) => setDraft({ ...draft, big_one: { ...draft.big_one!, why_it_matters: e.target.value } })}
            placeholder="Why it matters"
            className="admin-input"
            style={{ minHeight: '4.5rem', resize: 'vertical', lineHeight: 1.5, marginBottom: '0.5rem' }}
            disabled={isSent}
          />
          <textarea
            value={draft.big_one.what_to_do}
            onChange={(e) => setDraft({ ...draft, big_one: { ...draft.big_one!, what_to_do: e.target.value } })}
            placeholder="What to do"
            className="admin-input"
            style={{ minHeight: '4.5rem', resize: 'vertical', lineHeight: 1.5 }}
            disabled={isSent}
          />
        </div>
      )}

      {draft.haul && draft.haul.length > 0 && (
        <div style={sectionStyle}>
          <label style={labelStyle}>This Week's Haul ({draft.haul.length})</label>
          {draft.haul.map((item, i) => (
            <div key={i} style={{ padding: '0.75rem 0', borderTop: i === 0 ? 'none' : '1px dashed var(--admin-border)' }}>
              <input
                type="text"
                value={item.headline}
                onChange={(e) => updateHaul(i, { headline: e.target.value })}
                placeholder="Headline"
                className="admin-input"
                style={{ marginBottom: '0.5rem' }}
                disabled={isSent}
              />
              <textarea
                value={item.blurb}
                onChange={(e) => updateHaul(i, { blurb: e.target.value })}
                placeholder="Blurb"
                className="admin-input"
                style={{ minHeight: '4.5rem', resize: 'vertical', lineHeight: 1.5 }}
                disabled={isSent}
              />
            </div>
          ))}
        </div>
      )}

      {draft.sweet_spot && (
        <div style={sectionStyle}>
          <label style={labelStyle}>Sweet Spot</label>
          <input
            type="text"
            value={draft.sweet_spot.topic}
            onChange={(e) => setDraft({ ...draft, sweet_spot: { ...draft.sweet_spot!, topic: e.target.value } })}
            placeholder="Topic"
            className="admin-input"
            style={{ marginBottom: '0.5rem' }}
            disabled={isSent}
          />
          <textarea
            value={draft.sweet_spot.mechanic_explainer}
            onChange={(e) => setDraft({ ...draft, sweet_spot: { ...draft.sweet_spot!, mechanic_explainer: e.target.value } })}
            placeholder="Mechanic explainer"
            className="admin-input"
            style={{ minHeight: '7rem', resize: 'vertical', lineHeight: 1.5 }}
            disabled={isSent}
          />
          <p style={{ margin: '0.625rem 0 0', fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
            Best uses: {draft.sweet_spot.best_uses?.length ?? 0} items (edit via Run Now regeneration for now)
          </p>
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
