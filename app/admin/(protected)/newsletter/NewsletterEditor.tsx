'use client'

/**
 * Newsletter V2 admin editor — slot-based.
 *
 * Each section is its own card. Edits persist to the slot columns introduced
 * in migration 222. The "Send to subscribers" flow keeps the same triple gate
 * from V1: type "Send" exactly + browser confirm + server-side check.
 */
import { useState, useTransition } from 'react'
import {
  saveSlotsAction,
  sendTestAction,
  sendToSubscribersAction,
  runNowAction,
} from './actions'
import type { NewsletterSlots, AlsoHappeningItem, NewsletterSweetSpot, SweetSpotBestUse } from '@/utils/ai/newsletterSlots'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'

interface Props {
  id: string
  weekOf: string
  status: 'draft' | 'sent' | 'failed'
  slots: NewsletterSlots
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

const cardStyle: React.CSSProperties = {
  background: 'var(--admin-surface-alt)',
  border: '1px solid var(--admin-border)',
  borderRadius: 'var(--admin-radius)',
  padding: '0.875rem 1rem',
  marginBottom: '0.625rem',
}

const btnBase: React.CSSProperties = {
  padding: '0.5rem 1rem',
  border: 'none',
  borderRadius: 'var(--admin-radius)',
  fontSize: '0.875rem',
  fontWeight: 600,
  cursor: 'pointer',
}

const btnPrimary: React.CSSProperties = { ...btnBase, background: 'var(--admin-accent)', color: '#fff' }
const btnSecondary: React.CSSProperties = { ...btnBase, background: '#fff', color: 'var(--admin-accent)', border: '1px solid var(--admin-accent)' }
const btnDanger: React.CSSProperties = { ...btnBase, background: '#c0392b', color: '#fff' }
const btnDangerDisabled: React.CSSProperties = { ...btnBase, background: '#d9d9d9', color: '#8a8a8a', cursor: 'not-allowed' }
const btnGhost: React.CSSProperties = { ...btnBase, background: 'transparent', color: 'var(--admin-text-muted)', border: '1px dashed var(--admin-border)', padding: '0.375rem 0.75rem', fontSize: '0.8125rem' }

export default function NewsletterEditor({
  id,
  weekOf,
  status,
  slots: initialSlots,
  sentAt,
  recipientCount,
  activeSubscriberCount,
}: Props) {
  const [slots, setSlots] = useState<NewsletterSlots>(initialSlots)
  const [confirmWord, setConfirmWord] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()

  const isSent = status === 'sent'

  function notify(msg: string, err = false) {
    if (err) { setError(msg); setMessage(null) }
    else { setMessage(msg); setError(null) }
  }

  function patch<K extends keyof NewsletterSlots>(key: K, value: NewsletterSlots[K]) {
    setSlots((prev) => ({ ...prev, [key]: value }))
  }

  function patchGame(p: Partial<NewsletterSlots['game']>) {
    setSlots((prev) => ({ ...prev, game: { ...prev.game, ...p } }))
  }

  function setAlso(items: AlsoHappeningItem[]) {
    setSlots((prev) => ({ ...prev, also_happening: items }))
  }

  function patchSweetSpot(p: Partial<NewsletterSweetSpot>) {
    setSlots((prev) => {
      const current: NewsletterSweetSpot = prev.sweet_spot ?? { topic: '', mechanic_explainer: '', best_uses: [] }
      return { ...prev, sweet_spot: { ...current, ...p } }
    })
  }

  function setSweetSpotUses(uses: SweetSpotBestUse[]) {
    patchSweetSpot({ best_uses: uses })
  }

  function updateSweetSpotUse(i: number, p: Partial<SweetSpotBestUse>) {
    const uses = slots.sweet_spot?.best_uses ?? []
    setSweetSpotUses(uses.map((u, idx) => (idx === i ? { ...u, ...p } : u)))
  }

  function addSweetSpotUse() {
    const uses = slots.sweet_spot?.best_uses ?? []
    setSweetSpotUses([...uses, { name: '', why: '' }])
  }

  function removeSweetSpotUse(i: number) {
    const uses = slots.sweet_spot?.best_uses ?? []
    setSweetSpotUses(uses.filter((_, idx) => idx !== i))
  }

  function clearSweetSpot() {
    setSlots((prev) => ({ ...prev, sweet_spot: null }))
  }

  function updateAlso(i: number, p: Partial<AlsoHappeningItem>) {
    setAlso(slots.also_happening.map((it, idx) => (idx === i ? { ...it, ...p } : it)))
  }

  function moveAlso(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= slots.also_happening.length) return
    const next = slots.also_happening.slice()
    ;[next[i], next[j]] = [next[j], next[i]]
    setAlso(next)
  }

  function addAlso() {
    setAlso([
      ...slots.also_happening,
      { category: '', headline: '', blurb: '', link_url: '', alert_id: null },
    ])
  }

  function removeAlso(i: number) {
    setAlso(slots.also_happening.filter((_, idx) => idx !== i))
  }

  function handleSave() {
    start(async () => {
      try {
        await saveSlotsAction(id, slots)
        notify('Saved.')
      } catch (e) { notify(e instanceof Error ? e.message : 'Save failed', true) }
    })
  }

  function handleRunNow() {
    if (!confirm("Regenerate this week's draft? Your edits will be overwritten.")) return
    start(async () => {
      try {
        const res = await runNowAction()
        if (res.ok) notify(`Regenerated. ${(res as { alerts_considered?: number }).alerts_considered ?? 0} alerts considered. Reload the page.`)
        else notify('Regenerate failed.', true)
      } catch (e) { notify(e instanceof Error ? e.message : 'Regenerate failed', true) }
    })
  }

  function handleSendTest() {
    start(async () => {
      try {
        await saveSlotsAction(id, slots)
        const res = await sendTestAction(id)
        notify(`Test sent to ${res.to}.`)
      } catch (e) { notify(e instanceof Error ? e.message : 'Test send failed', true) }
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
        await saveSlotsAction(id, slots)
        const res = await sendToSubscribersAction(id, confirmWord)
        notify(`Sent to ${res.sent}/${res.total} subscribers.${res.failed ? ` ${res.failed} failed.` : ''}`)
        setConfirmWord('')
      } catch (e) { notify(e instanceof Error ? e.message : 'Send failed', true) }
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
        }}>{error ?? message}</div>
      )}

      {/* Subject */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Subject line</label>
        {slots.subject_options.length > 0 && (
          <div style={{ display: 'grid', gap: '0.375rem', marginBottom: '0.75rem' }}>
            {slots.subject_options.map((opt, i) => (
              <label key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input type="radio" name="subject" checked={slots.subject === opt} onChange={() => patch('subject', opt)} disabled={isSent} style={{ accentColor: 'var(--admin-accent)' }} />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        )}
        <input
          type="text"
          value={slots.subject}
          onChange={(e) => patch('subject', e.target.value)}
          placeholder="Type a custom subject"
          className="admin-input"
          disabled={isSent}
        />
      </div>

      {/* Hero kicker (optional) */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Hero eyebrow (optional, above "Week of …")</label>
        <input
          type="text"
          value={slots.hero_kicker ?? ''}
          onChange={(e) => patch('hero_kicker', e.target.value || null)}
          placeholder='Leave empty for no eyebrow'
          className="admin-input"
          disabled={isSent}
        />
      </div>

      {/* Game slot */}
      <div style={sectionStyle}>
        <label style={labelStyle}>🎮 Game of the Week</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <input type="text" value={slots.game.slug ?? ''} onChange={(e) => patchGame({ slug: e.target.value || null })} placeholder="Game slug (e.g. middle-seat) — empty hides card" className="admin-input" disabled={isSent} />
          <input type="text" value={slots.game.title ?? ''} onChange={(e) => patchGame({ title: e.target.value || null })} placeholder="Display title" className="admin-input" disabled={isSent} />
        </div>
        <textarea
          value={slots.game.clue_text ?? ''}
          onChange={(e) => patchGame({ clue_text: e.target.value || null })}
          placeholder="Body copy under the title (one short sentence)"
          className="admin-input"
          style={{ minHeight: '3.5rem', resize: 'vertical', lineHeight: 1.5 }}
          disabled={isSent}
        />
      </div>

      {/* Big Story */}
      <div style={sectionStyle}>
        <label style={labelStyle}>🚨 The Big Story</label>
        <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '0 0 0.5rem' }}>
          ~150 words, plain HTML. Use {'<p>'} for paragraphs and one {'<ul>'} of bullets. The renderer adds the section heading.
        </p>
        <textarea
          value={slots.big_story_html ?? ''}
          onChange={(e) => patch('big_story_html', e.target.value || null)}
          placeholder="<p>Spirit went dark this week — full ground stop…</p>"
          className="admin-input"
          style={{ minHeight: '12rem', resize: 'vertical', lineHeight: 1.5, fontFamily: 'monospace', fontSize: '0.8125rem' }}
          disabled={isSent}
        />
      </div>

      {/* Sweet Spot */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>⭐ Sweet Spot of the Week</label>
          {slots.sweet_spot && !isSent && (
            <button type="button" onClick={clearSweetSpot} style={btnGhost}>Hide section</button>
          )}
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '0 0 0.625rem' }}>
          Deep-dive value-add card. Topic + mechanic explainer + 3-4 specific best uses. Empty topic = section hidden.
        </p>
        <input
          type="text"
          value={slots.sweet_spot?.topic ?? ''}
          onChange={(e) => patchSweetSpot({ topic: e.target.value })}
          placeholder='Topic (e.g. "Capital One -> Qantas 20% transfer bonus")'
          className="admin-input"
          style={{ marginBottom: '0.5rem' }}
          disabled={isSent}
        />
        <textarea
          value={slots.sweet_spot?.mechanic_explainer ?? ''}
          onChange={(e) => patchSweetSpot({ mechanic_explainer: e.target.value })}
          placeholder="Mechanic explainer — 3-5 sentences explaining how the play works, with real numbers"
          className="admin-input"
          style={{ minHeight: '7rem', resize: 'vertical', lineHeight: 1.5, marginBottom: '0.75rem' }}
          disabled={isSent}
        />
        <label style={{ ...labelStyle, marginTop: '0.25rem' }}>Best uses ({slots.sweet_spot?.best_uses?.length ?? 0})</label>
        {(slots.sweet_spot?.best_uses ?? []).map((u, i) => (
          <div key={i} style={{ ...cardStyle, marginBottom: '0.5rem' }}>
            <input
              type="text"
              value={u.name}
              onChange={(e) => updateSweetSpotUse(i, { name: e.target.value })}
              placeholder="Property / route / award (be specific, with numbers)"
              className="admin-input"
              style={{ marginBottom: '0.375rem' }}
              disabled={isSent}
            />
            <input
              type="text"
              value={u.why}
              onChange={(e) => updateSweetSpotUse(i, { why: e.target.value })}
              placeholder="Why this is a great use (1 sentence, with the math)"
              className="admin-input"
              disabled={isSent}
            />
            {!isSent && (
              <button type="button" onClick={() => removeSweetSpotUse(i)} style={{ ...btnGhost, marginTop: '0.375rem' }}>Remove</button>
            )}
          </div>
        ))}
        {!isSent && (
          <button type="button" onClick={addSweetSpotUse} style={btnSecondary}>+ Add best use</button>
        )}
      </div>

      {/* Also Happening */}
      <div style={sectionStyle}>
        <label style={labelStyle}>📍 Also Happening ({slots.also_happening.length})</label>
        {slots.also_happening.length === 0 && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', margin: '0 0 0.75rem' }}>No cards yet. Add one below.</p>
        )}
        {slots.also_happening.map((item, i) => (
          <div key={i} style={cardStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input type="text" value={item.category} onChange={(e) => updateAlso(i, { category: e.target.value })} placeholder="Category (free-text)" className="admin-input" disabled={isSent} />
              <input type="text" value={item.link_url} onChange={(e) => updateAlso(i, { link_url: e.target.value })} placeholder="Link URL (e.g. /alerts/intel-...)" className="admin-input" disabled={isSent} />
            </div>
            <input type="text" value={item.headline} onChange={(e) => updateAlso(i, { headline: e.target.value })} placeholder="Headline" className="admin-input" style={{ marginBottom: '0.375rem' }} disabled={isSent} />
            <textarea value={item.blurb} onChange={(e) => updateAlso(i, { blurb: e.target.value })} placeholder="1–2 sentence blurb" className="admin-input" style={{ minHeight: '4rem', resize: 'vertical', lineHeight: 1.5 }} disabled={isSent} />
            <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => moveAlso(i, -1)} disabled={i === 0 || isSent} style={btnGhost}>↑</button>
              <button type="button" onClick={() => moveAlso(i, 1)} disabled={i === slots.also_happening.length - 1 || isSent} style={btnGhost}>↓</button>
              <button type="button" onClick={() => removeAlso(i)} disabled={isSent} style={btnGhost}>Remove</button>
            </div>
          </div>
        ))}
        {!isSent && (
          <button type="button" onClick={addAlso} style={btnSecondary}>+ Add card</button>
        )}
      </div>

      {/* Jill's Take */}
      <div style={sectionStyle}>
        <label style={labelStyle}>💬 Jill's Take — steering scratchpad</label>
        <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '0 0 0.5rem' }}>
          Optional. What should this week's take focus on? Persists between regenerates. Empty = generator picks the topic.
        </p>
        <textarea
          value={slots.jill_prompt ?? ''}
          onChange={(e) => patch('jill_prompt', e.target.value || null)}
          placeholder="e.g. Focus on the JetBlue match opportunity for ex-Spirit elites"
          className="admin-input"
          style={{ minHeight: '3.5rem', resize: 'vertical', lineHeight: 1.5, marginBottom: '0.875rem' }}
          disabled={isSent}
        />
        <label style={{ ...labelStyle, marginTop: '0.5rem' }}>Take (renders as italic block at bottom)</label>
        <textarea
          value={slots.jills_take_html ?? ''}
          onChange={(e) => patch('jills_take_html', e.target.value || null)}
          placeholder="<p>1–2 short sentences…</p>"
          className="admin-input"
          style={{ minHeight: '6rem', resize: 'vertical', lineHeight: 1.5, fontFamily: 'monospace', fontSize: '0.8125rem' }}
          disabled={isSent}
        />
      </div>

      {/* Action bar */}
      {!isSent && (
        <div style={{ ...sectionStyle, background: 'var(--admin-surface-alt)' }}>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button type="button" onClick={handleSave} disabled={isPending} style={btnSecondary}>{isPending ? 'Working…' : 'Save'}</button>
            <button type="button" onClick={handleRunNow} disabled={isPending} style={btnSecondary}>Run Now (regenerate)</button>
            <button type="button" onClick={handleSendTest} disabled={isPending} style={btnPrimary}>Send test to me</button>
          </div>
          <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '0.875rem' }}>
            <label style={labelStyle}>Danger zone — send to real subscribers</label>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
              Type <strong>Send</strong> below exactly. Case-sensitive.
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
              <button type="button" onClick={handleSendToSubscribers} disabled={!sendEnabled} style={sendEnabled ? btnDanger : btnDangerDisabled}>
                Send to {activeSubscriberCount} subscribers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
