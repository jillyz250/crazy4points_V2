'use client'

import { useRef, useState, useTransition } from 'react'
import { Icon } from '@/components/admin/preview/icons'
import { setQuickNote } from '@/app/admin/(protected)/org/[slug]/actions'

/**
 * Quick Note sticky — the hero's warm cream note panel (Devon, 2026-09-03).
 * Bound to employees.quick_note (migration 662). Editable inline: type, then it
 * saves on blur via the setQuickNote server action (admin-gated). Empty clears
 * it. A tiny "Saved" flash confirms the write; otherwise it stays out of the way.
 */
export default function QuickNote({
  slug,
  employeeName,
  initialNote,
}: {
  slug: string
  employeeName: string
  initialNote: string | null
}) {
  const [saved, setSaved] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [, startTransition] = useTransition()
  const lastSaved = useRef<string>(initialNote ?? '')
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const first = employeeName.split(' ')[0]

  const commit = (el: HTMLTextAreaElement) => {
    const next = el.value.trim()
    if (next === lastSaved.current.trim()) return
    lastSaved.current = next
    setSaved('saving')
    startTransition(async () => {
      await setQuickNote(slug, next)
      setSaved('saved')
      if (flashTimer.current) clearTimeout(flashTimer.current)
      flashTimer.current = setTimeout(() => setSaved('idle'), 1800)
    })
  }

  return (
    <div className="qn">
      <style dangerouslySetInnerHTML={{ __html: QN_CSS }} />
      <div className="qn-head">
        <span className="qn-title"><Icon name="note" size={13} /> Notes</span>
        <span className={`qn-flag qn-flag-${saved}`} aria-live="polite">
          {saved === 'saving' ? 'Saving…' : saved === 'saved' ? 'Saved' : ''}
        </span>
      </div>
      <textarea
        className="qn-area"
        defaultValue={initialNote ?? ''}
        placeholder={`Add a note about ${first}…`}
        maxLength={4000}
        aria-label={`Quick note about ${employeeName}`}
        onBlur={(e) => commit(e.currentTarget)}
      />
    </div>
  )
}

const QN_CSS = `
.admin .qn {
  display:flex; flex-direction:column; min-height:100%;
  border-radius:14px; padding:11px 13px 10px;
  color:#4a3f2a;
  background:
    linear-gradient(180deg, #fff9df 0%, #fdf3c6 100%);
  border:1px solid #e7d69a;
  box-shadow:0 1px 2px rgba(120,90,40,.10), 0 12px 26px -20px rgba(120,90,40,.5);
}
.admin .qn-head { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px; }
.admin .qn-title { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.07em; color:#9a7b32; }
.admin .qn-title svg { color:#b8912f; }
.admin .qn-flag { font-size:.62rem; font-weight:700; letter-spacing:.03em; text-transform:uppercase; transition:opacity .2s ease; }
.admin .qn-flag-idle { opacity:0; }
.admin .qn-flag-saving { color:#9a7b32; opacity:.8; }
.admin .qn-flag-saved { color:var(--admin-success); opacity:1; }
.admin .qn-area {
  flex:1; width:100%; resize:none; min-height:74px;
  font:inherit; font-size:var(--admin-text-sm); line-height:1.5; color:#4a3f2a;
  background:transparent; border:none; padding:0;
}
.admin .qn-area:focus { outline:none; }
.admin .qn-area::placeholder { color:#b39a5e; }
`
