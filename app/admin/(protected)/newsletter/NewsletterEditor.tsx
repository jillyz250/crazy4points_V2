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
  lockBigStoryAction,
  unlockBigStoryAction,
  generateBigStoryFromLockAction,
  generateSubjectOptionsFromLockAction,
  lockSweetSpotAction,
  unlockSweetSpotAction,
  generateSweetSpotFromLockAction,
} from './actions'
import type { NewsletterSlots, AlsoHappeningItem, NewsletterSweetSpot, SweetSpotBestUse } from '@/utils/ai/newsletterSlots'
import type { BigStoryCandidate } from './page'
import type { VerifyClaim } from '@/utils/ai/verifyAlertDraft'
import type { MissingFact } from '@/utils/ai/verifyBigStoryDraft'
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
  bigStoryCandidates: BigStoryCandidate[]
  bigStoryClaims: VerifyClaim[]
  bigStoryMissingFacts: MissingFact[]
  sweetSpotRefId: string | null
  sweetSpotRefType: 'alert' | null
}

/** What's currently running, so we can surface inline progress + disable the
 *  buttons that would conflict. null = idle. */
type PendingTarget = 'subjects' | 'big-story' | 'sweet-spot' | 'lock' | 'unlock' | 'save' | 'run' | 'test' | 'blast' | null

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
  bigStoryCandidates,
  bigStoryClaims: initialBigStoryClaims,
  bigStoryMissingFacts: initialBigStoryMissing,
  sweetSpotRefId: initialSweetSpotRefId,
  sweetSpotRefType: initialSweetSpotRefType,
}: Props) {
  const [slots, setSlots] = useState<NewsletterSlots>(initialSlots)
  const [bigStoryClaims, setBigStoryClaims] = useState<VerifyClaim[]>(initialBigStoryClaims)
  const [bigStoryMissing, setBigStoryMissing] = useState<MissingFact[]>(initialBigStoryMissing)
  const [sweetSpotRefId, setSweetSpotRefId] = useState<string | null>(initialSweetSpotRefId)
  const [sweetSpotRefType, setSweetSpotRefType] = useState<'alert' | null>(initialSweetSpotRefType)
  const [confirmWord, setConfirmWord] = useState('')
  const [testToEmail, setTestToEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, start] = useTransition()
  const [pendingTarget, setPendingTarget] = useState<PendingTarget>(null)

  const isSent = status === 'sent'

  function notify(msg: string, err = false) {
    if (err) { setError(msg); setMessage(null) }
    else { setMessage(msg); setError(null) }
    // Scroll-to-top rule: every notify means an action just completed,
    // and the new content / chips are at the top of the page. Smooth-
    // scroll back so the result is visible instead of leaving the user
    // parked next to the button they clicked.
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
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

  function handleSendTestToEmail() {
    const target = testToEmail.trim()
    if (!target) {
      notify('Enter an email to send to.', true)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      notify("That email doesn't look right.", true)
      return
    }
    start(async () => {
      try {
        await saveSlotsAction(id, slots)
        const res = await sendTestAction(id, target)
        notify(res.mode === 'catchup' ? `Forwarded to ${res.to}.` : `Preview sent to ${res.to}.`)
        setTestToEmail('')
      } catch (e) { notify(e instanceof Error ? e.message : 'Test send failed', true) }
    })
  }

  function handleLockBigStory(alertId: string) {
    setPendingTarget('lock')
    start(async () => {
      try {
        await lockBigStoryAction(id, alertId)
        setSlots((prev) => ({
          ...prev,
          big_story_ref_id: alertId,
          big_story_ref_type: 'alert',
          big_story_html: null,
        }))
        setBigStoryClaims([])
        setBigStoryMissing([])
        notify('Big Story locked. Click "Generate Big Story" to write the article.')
      } catch (e) { notify(e instanceof Error ? e.message : 'Lock failed', true) }
      setPendingTarget(null)
    })
  }

  function handleUnlockBigStory() {
    if (!confirm('Unlock Big Story? The current draft article will also be cleared.')) return
    setPendingTarget('unlock')
    start(async () => {
      try {
        await unlockBigStoryAction(id)
        setSlots((prev) => ({
          ...prev,
          big_story_ref_id: null,
          big_story_ref_type: null,
          big_story_html: null,
        }))
        setBigStoryClaims([])
        setBigStoryMissing([])
        notify('Unlocked. Pick a new lead or run a full regenerate.')
      } catch (e) { notify(e instanceof Error ? e.message : 'Unlock failed', true) }
      setPendingTarget(null)
    })
  }

  function handleLockSweetSpot(alertId: string) {
    setPendingTarget('lock')
    start(async () => {
      try {
        await lockSweetSpotAction(id, alertId)
        setSweetSpotRefId(alertId)
        setSweetSpotRefType('alert')
        setSlots((prev) => ({ ...prev, sweet_spot: null }))
        notify('Sweet Spot alert locked. Run Now to write prose anchored to it.')
      } catch (e) { notify(e instanceof Error ? e.message : 'Lock failed', true) }
      setPendingTarget(null)
    })
  }

  function handleGenerateSweetSpot() {
    setPendingTarget('sweet-spot')
    start(async () => {
      try {
        const res = await generateSweetSpotFromLockAction(id)
        setSlots((prev) => ({ ...prev, sweet_spot: res.sweet_spot }))
        notify('Sweet Spot written.')
      } catch (e) { notify(e instanceof Error ? e.message : 'Generate failed', true) }
      setPendingTarget(null)
    })
  }

  function handleUnlockSweetSpot() {
    if (!confirm('Unlock Sweet Spot? The current Sweet Spot prose will also be cleared.')) return
    setPendingTarget('unlock')
    start(async () => {
      try {
        await unlockSweetSpotAction(id)
        setSweetSpotRefId(null)
        setSweetSpotRefType(null)
        setSlots((prev) => ({ ...prev, sweet_spot: null }))
        notify('Sweet Spot unlocked. Pick a new one or let Sonnet choose on Run Now.')
      } catch (e) { notify(e instanceof Error ? e.message : 'Unlock failed', true) }
      setPendingTarget(null)
    })
  }

  function handleGenerateSubjects() {
    setPendingTarget('subjects')
    start(async () => {
      try {
        const res = await generateSubjectOptionsFromLockAction(id)
        setSlots((prev) => ({
          ...prev,
          subject_options: res.options,
          subject: res.options[0] ?? '',
        }))
        notify(`Generated ${res.options.length} subject options anchored to the Big Story.`)
      } catch (e) { notify(e instanceof Error ? e.message : 'Generate failed', true) }
      setPendingTarget(null)
    })
  }

  function handleGenerateBigStory() {
    setPendingTarget('big-story')
    start(async () => {
      try {
        const res = await generateBigStoryFromLockAction(id)
        setSlots((prev) => ({ ...prev, big_story_html: res.html }))
        setBigStoryClaims(res.claims)
        setBigStoryMissing(res.missing_facts)
        const unsupportedHigh = res.claims.filter((c) => c.supported !== true && c.severity === 'high').length
        const missingHigh = res.missing_facts.filter((m) => m.severity === 'high').length
        const parts = []
        if (unsupportedHigh > 0) parts.push(`${unsupportedHigh} unsupported claim${unsupportedHigh === 1 ? '' : 's'}`)
        if (missingHigh > 0) parts.push(`${missingHigh} missing source fact${missingHigh === 1 ? '' : 's'}`)
        notify(
          parts.length > 0
            ? `Article written. Review the ${parts.join(' + ')} above before sending.`
            : 'Article written, fact-checked, and complete.',
        )
      } catch (e) { notify(e instanceof Error ? e.message : 'Generate failed', true) }
      setPendingTarget(null)
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

      {/* 1. Pick the lead — Jill picks 1-of-5 alerts before anything else */}
      <div style={sectionStyle}>
        <label style={labelStyle}>① Pick the lead alert</label>
        <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '0 0 0.625rem' }}>
          Pick this week&apos;s lead from the {bigStoryCandidates.length} published alert{bigStoryCandidates.length === 1 ? '' : 's'} below. Subject lines and the Big Story article will both be derived from your pick.
        </p>
        {slots.big_story_ref_id && slots.big_story_ref_type === 'alert' ? (
          <LockedBigStoryCard
            candidate={bigStoryCandidates.find((c) => c.id === slots.big_story_ref_id) ?? null}
            lockedId={slots.big_story_ref_id}
            disabled={isSent || isPending}
            onUnlock={handleUnlockBigStory}
          />
        ) : (
          <BigStoryPicker
            candidates={bigStoryCandidates}
            disabled={isSent || isPending}
            onLock={handleLockBigStory}
          />
        )}
      </div>

      {/* 2. Subject line — anchored to the locked alert */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>② Subject line</label>
          {!isSent && (
            <button
              type="button"
              onClick={handleGenerateSubjects}
              disabled={isPending || !slots.big_story_ref_id}
              style={slots.big_story_ref_id ? btnSecondary : { ...btnSecondary, opacity: 0.5, cursor: 'not-allowed' }}
              title={slots.big_story_ref_id ? 'Generate 5 punchy options anchored to the locked lead' : 'Lock a lead alert first'}
            >
              {pendingTarget === 'subjects'
                ? 'Generating headlines…'
                : slots.subject_options.length > 0
                  ? 'Regenerate headlines'
                  : 'Generate headlines'}
            </button>
          )}
        </div>
        {!slots.big_story_ref_id && !isSent && (
          <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '0 0 0.625rem' }}>
            Lock a lead alert above first — subject options will anchor to it.
          </p>
        )}
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

      {/* 3. Big Story article — anchored to locked alert + chosen subject */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>③ 🚨 Big Story article</label>
          {!isSent && (
            <button
              type="button"
              onClick={handleGenerateBigStory}
              disabled={isPending || !slots.big_story_ref_id}
              style={slots.big_story_ref_id ? btnPrimary : { ...btnPrimary, opacity: 0.5, cursor: 'not-allowed' }}
              title={slots.big_story_ref_id ? 'Write the ~150-word article body around the locked lead + chosen subject' : 'Lock a lead alert first'}
            >
              {pendingTarget === 'big-story'
                ? 'Writing + fact-checking…'
                : slots.big_story_html
                  ? 'Regenerate Big Story'
                  : 'Generate Big Story'}
            </button>
          )}
        </div>
        {!slots.big_story_ref_id && !isSent && (
          <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '0 0 0.5rem' }}>
            Lock a lead alert above first.
          </p>
        )}
        <BigStoryMissingFacts missing={bigStoryMissing} />
        <BigStoryFactCheck claims={bigStoryClaims} />
        <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '0 0 0.5rem' }}>
          ~150 words, plain HTML. Use {'<p>'} for paragraphs and one {'<ul>'} of bullets. The renderer adds the section heading. Edit freely after generation.
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

      {/* Sweet Spot */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>⭐ Sweet Spot of the Week</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {!isSent && (
              <button
                type="button"
                onClick={handleGenerateSweetSpot}
                disabled={isPending || !sweetSpotRefId}
                style={sweetSpotRefId ? btnPrimary : { ...btnPrimary, opacity: 0.5, cursor: 'not-allowed' }}
                title={sweetSpotRefId ? 'Write the Sweet Spot prose around the locked alert (without touching other slots)' : 'Lock a Sweet Spot alert first'}
              >
                {pendingTarget === 'sweet-spot'
                  ? 'Writing…'
                  : slots.sweet_spot
                    ? 'Regenerate Sweet Spot'
                    : 'Generate Sweet Spot'}
              </button>
            )}
            {slots.sweet_spot && !isSent && (
              <button type="button" onClick={clearSweetSpot} style={btnGhost}>Hide section</button>
            )}
          </div>
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '0 0 0.625rem' }}>
          Deep-dive value-add card. Topic + mechanic explainer + 3-4 specific best uses. Empty topic = section hidden.
        </p>

        {/* NL2a — Sweet Spot alert picker. Excludes whichever alert is
            locked as Big Story so the two slots can't share a source. */}
        <div style={{ marginBottom: '0.875rem' }}>
          {sweetSpotRefId && sweetSpotRefType === 'alert' ? (
            <LockedSweetSpotCard
              candidate={bigStoryCandidates.find((c) => c.id === sweetSpotRefId) ?? null}
              lockedId={sweetSpotRefId}
              disabled={isSent || isPending}
              onUnlock={handleUnlockSweetSpot}
            />
          ) : (
            <SweetSpotPicker
              candidates={bigStoryCandidates.filter((c) => c.id !== slots.big_story_ref_id)}
              bigStoryLocked={!!slots.big_story_ref_id}
              disabled={isSent || isPending}
              onLock={handleLockSweetSpot}
            />
          )}
        </div>
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
            <textarea
              value={u.why}
              onChange={(e) => updateSweetSpotUse(i, { why: e.target.value })}
              placeholder="Why this is a great use (1 sentence, with the math)"
              className="admin-input"
              style={{ minHeight: '3.25rem', resize: 'vertical', lineHeight: 1.5 }}
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

      {/* Action bar — always visible. The "Send preview to specific email"
          block stays available even after status='sent' so admin can forward
          the published newsletter to people who weren't on the list yet. */}
      <div style={{ ...sectionStyle, background: 'var(--admin-surface-alt)' }}>
        {!isSent && (
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <button type="button" onClick={handleSave} disabled={isPending} style={btnSecondary}>{isPending ? 'Working…' : 'Save'}</button>
            <button type="button" onClick={handleRunNow} disabled={isPending} style={btnSecondary}>Run Now (regenerate)</button>
            <button type="button" onClick={handleSendTest} disabled={isPending} style={btnPrimary}>Send test to me</button>
          </div>
        )}

        <div style={{ marginBottom: !isSent ? '1rem' : 0 }}>
          <label style={labelStyle}>
            {isSent ? 'Forward this newsletter to a specific email' : 'Send a preview to a specific email'}
          </label>
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
            {isSent
              ? 'This newsletter has already been sent to subscribers. Use this to forward it to a single new address.'
              : 'Sends the same email as "Send test to me," but to whoever you type.'}
            {' '}Always marked as preview (gold banner).
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="email"
              value={testToEmail}
              onChange={(e) => setTestToEmail(e.target.value)}
              placeholder="email@example.com"
              className="admin-input"
              style={{ maxWidth: '320px' }}
              disabled={isPending}
            />
            <button type="button" onClick={handleSendTestToEmail} disabled={isPending || !testToEmail.trim()} style={btnSecondary}>
              {isSent ? 'Forward to this address' : 'Send preview to this address'}
            </button>
          </div>
        </div>

        {!isSent && (
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
        )}
      </div>
    </div>
  )
}

function BigStoryMissingFacts({ missing }: { missing: MissingFact[] }) {
  if (missing.length === 0) return null
  const highCount = missing.filter((m) => m.severity === 'high').length
  return (
    <div
      style={{
        border: '1px solid var(--admin-danger, #c0392b)33',
        borderRadius: 'var(--admin-radius)',
        padding: '0.625rem 0.75rem',
        marginBottom: '0.75rem',
        background: 'var(--admin-danger-soft, #fde4e4)',
      }}
    >
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-danger, #c0392b)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        ⊘ Missing from article &middot; {missing.length} fact{missing.length === 1 ? '' : 's'} in source not in article
        {highCount > 0 ? ` (${highCount} high-severity)` : ''}
      </div>
      <div style={{ display: 'grid', gap: '0.375rem' }}>
        {missing.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '0.5rem',
              alignItems: 'baseline',
              fontSize: '0.8125rem',
              background: '#fff',
              padding: '0.4375rem 0.625rem',
              borderRadius: 'var(--admin-radius)',
              border: '1px solid var(--admin-danger, #c0392b)22',
            }}
          >
            <span style={{ color: 'var(--admin-danger, #c0392b)', fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>⊘</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: 'var(--admin-text)', lineHeight: 1.4 }}>
                {m.severity === 'high' ? <strong>{m.fact}</strong> : m.fact}
              </div>
              {m.source_excerpt && (
                <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                  &ldquo;{m.source_excerpt}&rdquo;
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SweetSpotPicker({
  candidates,
  bigStoryLocked,
  disabled,
  onLock,
}: {
  candidates: BigStoryCandidate[]
  bigStoryLocked: boolean
  disabled: boolean
  onLock: (alertId: string) => void
}) {
  if (candidates.length === 0) {
    return (
      <div style={{ ...cardStyle, marginBottom: 0, color: 'var(--admin-text-muted)', fontSize: '0.8125rem' }}>
        {bigStoryLocked
          ? 'No other published alerts in the last 7 days to anchor the Sweet Spot — Sonnet will pick from general knowledge on Run Now.'
          : 'No published alerts in the last 7 days. Run a full regenerate (or publish an alert first) before picking a Sweet Spot anchor.'}
      </div>
    )
  }
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '0 0 0.5rem' }}>
        Pick which alert anchors this week&apos;s Sweet Spot. Sonnet will write the topic + mechanic + best-uses around it on the next Run Now. (Big Story alert excluded.)
      </p>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {candidates.map((c) => (
          <div key={c.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{c.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.375rem' }}>
                  {[c.alert_type, c.published_at?.slice(0, 10), c.end_date ? `ends ${c.end_date.slice(0, 10)}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
                {c.why_this_matters && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text)' }}>{c.why_this_matters}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onLock(c.id)}
                disabled={disabled}
                style={{ ...btnPrimary, flexShrink: 0, padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}
              >
                Lock as Sweet Spot
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LockedSweetSpotCard({
  candidate,
  lockedId,
  disabled,
  onUnlock,
}: {
  candidate: BigStoryCandidate | null
  lockedId: string
  disabled: boolean
  onUnlock: () => void
}) {
  return (
    <div
      style={{
        ...cardStyle,
        borderColor: 'var(--admin-accent)',
        background: 'var(--admin-accent-soft, var(--admin-surface-alt))',
        marginBottom: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--admin-accent)', marginBottom: '0.25rem' }}>
            Locked Sweet Spot anchor
          </div>
          {candidate ? (
            <>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{candidate.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                {[candidate.alert_type, candidate.published_at?.slice(0, 10)].filter(Boolean).join(' · ')}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
              Locked alert id <code>{lockedId.slice(0, 8)}…</code> is outside the current 7-day pool. Unlock to pick a fresh anchor.
            </div>
          )}
        </div>
        <button type="button" onClick={onUnlock} disabled={disabled} style={{ ...btnGhost, flexShrink: 0 }}>
          Unlock
        </button>
      </div>
    </div>
  )
}

function BigStoryFactCheck({ claims }: { claims: VerifyClaim[] }) {
  if (claims.length === 0) return null
  const supported = claims.filter((c) => c.supported === true).length
  const unsupported = claims.filter((c) => c.supported !== true)
  const highUnsupported = unsupported.filter((c) => c.severity === 'high').length
  const headerTone =
    highUnsupported > 0
      ? { color: 'var(--admin-danger)', label: `⚠ ${highUnsupported} high-severity claim${highUnsupported === 1 ? '' : 's'} need${highUnsupported === 1 ? 's' : ''} review` }
      : { color: 'var(--admin-success)', label: `✓ ${supported}/${claims.length} claim${claims.length === 1 ? '' : 's'} supported by the source alert` }
  return (
    <div
      style={{
        border: '1px solid var(--admin-border)',
        borderRadius: 'var(--admin-radius)',
        padding: '0.625rem 0.75rem',
        marginBottom: '0.75rem',
        background: 'var(--admin-surface-alt)',
      }}
    >
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: headerTone.color, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Fact-check &middot; {headerTone.label}
      </div>
      <div style={{ display: 'grid', gap: '0.375rem' }}>
        {claims.map((c, i) => {
          const isSupported = c.supported === true
          const isUnsupportedSilent = c.supported === 'unsupported'
          const bg = isSupported
            ? 'var(--admin-success-soft, #e8f5ee)'
            : isUnsupportedSilent
              ? '#fff7e6'
              : 'var(--admin-danger-soft, #fde4e4)'
          const fg = isSupported
            ? 'var(--admin-success)'
            : isUnsupportedSilent
              ? '#9a6b00'
              : 'var(--admin-danger)'
          const prefix = isSupported ? '✓' : isUnsupportedSilent ? '?' : '✗'
          return (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '0.5rem',
                alignItems: 'baseline',
                fontSize: '0.8125rem',
                background: bg,
                padding: '0.4375rem 0.625rem',
                borderRadius: 'var(--admin-radius)',
                border: `1px solid ${fg}33`,
              }}
            >
              <span style={{ color: fg, fontWeight: 700, fontFamily: 'ui-monospace, monospace' }}>{prefix}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: 'var(--admin-text)', lineHeight: 1.4 }}>
                  {c.severity === 'high' && c.supported !== true ? <strong>{c.claim}</strong> : c.claim}
                </div>
                {c.source_excerpt ? (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                    &ldquo;{c.source_excerpt}&rdquo;
                  </div>
                ) : isUnsupportedSilent ? (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--admin-text-muted)', lineHeight: 1.4 }}>
                    Source is silent on this — verify before sending.
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BigStoryPicker({
  candidates,
  disabled,
  onLock,
}: {
  candidates: BigStoryCandidate[]
  disabled: boolean
  onLock: (alertId: string) => void
}) {
  if (candidates.length === 0) {
    return (
      <div
        style={{
          ...cardStyle,
          marginBottom: 0,
          color: 'var(--admin-text-muted)',
          fontSize: '0.8125rem',
        }}
      >
        No published alerts in the last 7 days. Run a full regenerate (or
        publish an alert first) before picking a Big Story.
      </div>
    )
  }
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', margin: '0 0 0.5rem' }}>
        Pick this week&apos;s lead from the {candidates.length} published alert{candidates.length === 1 ? '' : 's'} below. Sonnet will write the article body around it.
      </p>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        {candidates.map((c) => (
          <div key={c.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{c.title}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', marginBottom: '0.375rem' }}>
                  {[c.alert_type, c.published_at?.slice(0, 10), c.end_date ? `ends ${c.end_date.slice(0, 10)}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
                {c.why_this_matters && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text)' }}>{c.why_this_matters}</div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onLock(c.id)}
                disabled={disabled}
                style={{ ...btnPrimary, flexShrink: 0, padding: '0.375rem 0.875rem', fontSize: '0.8125rem' }}
              >
                Lock as Big Story
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function LockedBigStoryCard({
  candidate,
  lockedId,
  disabled,
  onUnlock,
}: {
  candidate: BigStoryCandidate | null
  lockedId: string
  disabled: boolean
  onUnlock: () => void
}) {
  return (
    <div
      style={{
        ...cardStyle,
        borderColor: 'var(--admin-accent)',
        background: 'var(--admin-accent-soft, var(--admin-surface-alt))',
        marginBottom: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--admin-accent)', marginBottom: '0.25rem' }}>
            Locked lead
          </div>
          {candidate ? (
            <>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>{candidate.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>
                {[candidate.alert_type, candidate.published_at?.slice(0, 10)].filter(Boolean).join(' · ')}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)' }}>
              Locked alert id <code>{lockedId.slice(0, 8)}…</code> is outside the current 7-day pool. Unlock to pick a fresh lead.
            </div>
          )}
        </div>
        <button type="button" onClick={onUnlock} disabled={disabled} style={{ ...btnGhost, flexShrink: 0 }}>
          Unlock
        </button>
      </div>
    </div>
  )
}
