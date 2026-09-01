'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_COLOR, CATEGORY_LABEL, SOCIAL_CATEGORIES, topicSignature, signaturesOverlap } from '@/lib/socialCategories'
import { scheduleOnDate, setPlatformById, setCategoryById, setStatusById, skipById, deleteById, saveDraft } from './actions'

export type Row = {
  id: string
  post_date: string
  platform: 'facebook' | 'instagram' | 'tiktok'
  topic: string
  category: string
  source_type: string
  status: 'suggested' | 'planned' | 'drafted' | 'posted' | 'skipped'
  draft_body: string | null
  link_url: string | null
  notes: string | null
}

const PLAT = { facebook: 'FB', instagram: 'IG', tiktok: 'TT' } as const
const STATUS_LABEL: Record<string, string> = { planned: 'Planned', drafted: 'Drafted', posted: 'Posted' }

function ymd(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export default function SocialCalendarBoard({
  year, month, todayISO, scheduled, triage,
}: { year: number; month: number; todayISO: string; scheduled: Row[]; triage: Row[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [dragId, setDragId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const run = (fn: () => Promise<void>) => start(async () => { await fn(); router.refresh() })

  // Build the month grid.
  const first = new Date(Date.UTC(year, month - 1, 1))
  const last = new Date(Date.UTC(year, month, 0))
  const cells: (string | null)[] = [
    ...Array(first.getUTCDay()).fill(null),
    ...Array(last.getUTCDate()).fill(0).map((_, i) => ymd(new Date(Date.UTC(year, month - 1, i + 1)))),
  ]
  const byDay = new Map<string, Row[]>()
  for (const p of scheduled) byDay.set(p.post_date, [...(byDay.get(p.post_date) ?? []), p])

  // Dedup awareness: flag a triage item whose topic overlaps a scheduled/posted one.
  const scheduledSigs = scheduled.map((s) => topicSignature(s.topic))
  const isPossibleDupe = (r: Row) => {
    const sig = topicSignature(r.topic)
    return scheduledSigs.some((s) => signaturesOverlap(sig, s))
  }

  const selectedRow = [...scheduled, ...triage].find((r) => r.id === selected) ?? null

  const chip = (p: Row) => (
    <div
      key={p.id}
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); setDragId(p.id) }}
      onDragEnd={() => setDragId(null)}
      onClick={() => setSelected(p.id === selected ? null : p.id)}
      title={`${p.platform} · ${STATUS_LABEL[p.status] ?? p.status} · ${CATEGORY_LABEL[p.category]}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginTop: 3, cursor: 'grab',
        borderLeft: `3px solid ${CATEGORY_COLOR[p.category] ?? '#999'}`, paddingLeft: 4, borderRadius: 2,
        background: p.id === selected ? '#F1EAF8' : '#fff', opacity: p.status === 'posted' ? 0.6 : 1,
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color: '#666' }}>{PLAT[p.platform]}</span>
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.topic}</span>
    </div>
  )

  return (
    <div className="grid items-start gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_290px]">
      {/* CALENDAR (drop targets) */}
      <div>
        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10, fontSize: 11 }}>
          {SOCIAL_CATEGORIES.map((c) => (
            <span key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: c.color }} />{c.label}
            </span>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} style={{ textAlign: 'center' }}>{d}</div>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {cells.map((date, i) => {
            const dayPosts = date ? byDay.get(date) ?? [] : []
            const platCounts = dayPosts.reduce((m, p) => ((m[p.platform] = (m[p.platform] ?? 0) + 1), m), {} as Record<string, number>)
            const over = Object.entries(platCounts).filter(([, n]) => n > 1)
            return (
              <div
                key={i}
                onDragOver={date ? (e) => e.preventDefault() : undefined}
                onDrop={date ? (e) => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); if (id) run(() => scheduleOnDate(id, date)) } : undefined}
                style={{
                  minHeight: 78, border: '1px solid var(--color-border-soft)', borderRadius: 6, padding: 4,
                  background: date === todayISO ? '#FBF7FF' : date ? '#fff' : 'transparent',
                  outline: dragId && date ? '1px dashed #C9B3DF' : 'none',
                }}
              >
                {date && (
                  <div style={{ fontSize: 10, color: date === todayISO ? 'var(--color-primary)' : '#999', fontWeight: date === todayISO ? 700 : 400, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{Number(date.slice(-2))}</span>
                    {over.length > 0 && <span title={`More than one ${over.map(([p]) => p).join(', ')} post`} style={{ color: '#C77700' }}>⚠</span>}
                  </div>
                )}
                {dayPosts.map(chip)}
              </div>
            )
          })}
        </div>

        {/* Editor for the selected post */}
        {selectedRow && (
          <div style={{ marginTop: 14, border: '1px solid var(--color-border-soft)', borderRadius: 8, padding: '.75rem .9rem', background: '#FCFAFE' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 14 }}>{selectedRow.topic}</strong>
              <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999' }}>close</button>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '.25rem 0' }}>
              {selectedRow.post_date} · {selectedRow.status} · from {selectedRow.source_type}
            </div>
            {selectedRow.notes && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{selectedRow.notes}</div>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 11 }}>Platform{' '}
                <select defaultValue={selectedRow.platform} onChange={(e) => run(() => setPlatformById(selectedRow.id, e.target.value))} style={{ fontSize: 11 }}>
                  <option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option>
                </select>
              </label>
              <label style={{ fontSize: 11 }}>Category{' '}
                <select defaultValue={selectedRow.category} onChange={(e) => run(() => setCategoryById(selectedRow.id, e.target.value))} style={{ fontSize: 11 }}>
                  {SOCIAL_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </label>
            </div>
            <form action={saveDraft}>
              <input type="hidden" name="id" value={selectedRow.id} />
              <textarea name="draft_body" defaultValue={selectedRow.draft_body ?? ''} placeholder="Draft copy (or ask Claude to draft it, then paste)" rows={3} style={{ width: '100%', fontSize: 13, padding: 6, borderRadius: 6, border: '1px solid var(--color-border-soft)', fontFamily: 'var(--font-body)' }} />
              <button className="rg-btn-secondary" style={{ padding: '.25rem .6rem', fontSize: 12, marginTop: 4 }}>Save draft</button>
            </form>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {(['planned', 'drafted', 'posted'] as const).map((st) => (
                <button key={st} onClick={() => run(() => setStatusById(selectedRow.id, st))} className="rg-btn-secondary" style={{ padding: '.2rem .55rem', fontSize: 11, opacity: selectedRow.status === st ? 1 : 0.6 }}>
                  {st === 'posted' ? 'Mark posted' : `Set ${st}`}
                </button>
              ))}
              <button onClick={() => run(() => deleteById(selectedRow.id))} className="rg-btn-secondary" style={{ padding: '.2rem .55rem', fontSize: 11, color: '#c00' }}>Delete</button>
            </div>
          </div>
        )}
      </div>

      {/* TRIAGE (Recommended) — drag onto a day */}
      <div>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1.1rem', marginTop: 0 }}>Recommended</h2>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: -6 }}>Drag a card onto a day to schedule it. Set its platform first if needed.</p>
        {triage.length === 0 && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Nothing recommended right now.</p>}
        {triage.map((p) => (
          <div
            key={p.id}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); setDragId(p.id) }}
            onDragEnd={() => setDragId(null)}
            style={{ border: '1px solid var(--color-border-soft)', borderLeft: `4px solid ${CATEGORY_COLOR[p.category] ?? '#999'}`, borderRadius: 8, padding: '.5rem .6rem', marginBottom: 8, background: '#fff', cursor: 'grab' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, background: CATEGORY_COLOR[p.category] ?? '#999', color: '#fff', padding: '0 6px', borderRadius: 99 }}>{CATEGORY_LABEL[p.category]}</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>suggests {p.post_date.slice(5)}</span>
              {isPossibleDupe(p) && <span title="Similar topic already scheduled" style={{ fontSize: 10, color: '#C77700', fontWeight: 700 }}>possible dupe</span>}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, margin: '.25rem 0' }}>{p.topic}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <select defaultValue={p.platform} onChange={(e) => run(() => setPlatformById(p.id, e.target.value))} style={{ fontSize: 11 }}>
                <option value="facebook">FB</option><option value="instagram">IG</option><option value="tiktok">TT</option>
              </select>
              <button onClick={() => run(() => scheduleOnDate(p.id, p.post_date))} className="rg-btn-primary" style={{ padding: '.2rem .55rem', fontSize: 11 }}>Schedule</button>
              <button onClick={() => run(() => skipById(p.id))} className="rg-btn-secondary" style={{ padding: '.2rem .55rem', fontSize: 11 }}>Skip</button>
            </div>
          </div>
        ))}
      </div>
      {pending && <div style={{ position: 'fixed', bottom: 12, right: 12, fontSize: 12, color: 'var(--color-primary)', background: '#fff', padding: '4px 10px', borderRadius: 6, boxShadow: 'var(--shadow-soft)' }}>saving…</div>}
    </div>
  )
}
