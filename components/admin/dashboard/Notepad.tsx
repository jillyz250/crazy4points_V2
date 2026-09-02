'use client'

import { useState, useRef, useTransition } from 'react'
import { Icon } from '@/components/admin/preview/icons'
import { createNote, updateNote, deleteNote, sendNoteToTakes, type DashboardNote } from '@/app/admin/(protected)/notes-actions'

/**
 * Quick-capture Notepad (Devon, 2026-09-02). Zero-friction jots that persist to
 * dashboard_notes, saving on blur. A note can be promoted to Jill's Takes.
 * Optimistic local state keeps it feeling instant; the server actions are the
 * source of truth on next load.
 */
export default function Notepad({ initialNotes, compact = false }: { initialNotes: DashboardNote[]; compact?: boolean }) {
  const [notes, setNotes] = useState<DashboardNote[]>(initialNotes)
  const [toast, setToast] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const draftRef = useRef<HTMLTextAreaElement>(null)

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200) }

  const addFromDraft = () => {
    const el = draftRef.current
    if (!el) return
    const body = el.value.trim()
    if (!body) return
    el.value = ''
    // Optimistic temp row, reconciled with the server row.
    const temp: DashboardNote = { id: `temp-${Date.now()}`, body, sent_to_takes: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    setNotes((n) => [temp, ...n])
    startTransition(async () => {
      const saved = await createNote(body)
      if (saved) setNotes((n) => n.map((x) => (x.id === temp.id ? saved : x)))
    })
  }

  const saveEdit = (id: string, body: string) => {
    if (id.startsWith('temp-')) return
    startTransition(() => { updateNote(id, body) })
  }

  const remove = (id: string) => {
    setNotes((n) => n.filter((x) => x.id !== id))
    if (!id.startsWith('temp-')) startTransition(() => { deleteNote(id) })
  }

  const toTakes = (id: string) => {
    setNotes((n) => n.map((x) => (x.id === id ? { ...x, sent_to_takes: true } : x)))
    flash('Sent to Jill’s Takes')
    if (!id.startsWith('temp-')) startTransition(() => { sendNoteToTakes(id) })
  }

  return (
    <div className="np">
      <style dangerouslySetInnerHTML={{ __html: NP_CSS }} />
      <div className="np-capture">
        <textarea
          ref={draftRef}
          className="np-input"
          placeholder="Jot a thought… (saves when you click away)"
          rows={compact ? 2 : 3}
          onBlur={addFromDraft}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addFromDraft() } }}
        />
        <button type="button" className="np-add" onMouseDown={(e) => { e.preventDefault(); addFromDraft() }} title="Add note">
          <Icon name="plus" size={16} />
        </button>
      </div>

      <div className="np-list">
        {notes.length === 0 ? (
          <p className="np-empty"><Icon name="note" size={15} /> Nothing jotted yet. Ideas, reminders, takes — anything.</p>
        ) : notes.map((n) => (
          <div key={n.id} className="np-note">
            <textarea
              className="np-note-body"
              defaultValue={n.body}
              rows={1}
              onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px' }}
              onBlur={(e) => {
                const v = e.currentTarget.value.trim()
                if (!v) { remove(n.id); return }
                if (v !== n.body) saveEdit(n.id, v)
              }}
            />
            <div className="np-note-actions">
              {n.sent_to_takes ? (
                <span className="np-chip"><Icon name="check" size={12} /> In Takes</span>
              ) : (
                <button type="button" className="np-act" onClick={() => toTakes(n.id)} title="Send to Jill's Takes">
                  <Icon name="send" size={13} /> Takes
                </button>
              )}
              <button type="button" className="np-act np-act-danger" onClick={() => remove(n.id)} title="Delete note">
                <Icon name="trash" size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {toast && <div className="np-toast"><Icon name="check" size={14} /> {toast}</div>}
    </div>
  )
}

const NP_CSS = `
.admin .np { position:relative; }
.admin .np-capture { position:relative; margin-bottom:.9rem; }
.admin .np-input {
  width:100%; resize:vertical; font:inherit; font-size:var(--admin-text-sm); line-height:1.5;
  padding:12px 42px 12px 14px; border-radius:12px; color:var(--admin-text);
  background:color-mix(in srgb, var(--color-accent) 6%, #fff);
  border:1px solid color-mix(in srgb, var(--color-accent) 30%, var(--admin-border));
  transition:border-color .14s ease, box-shadow .14s ease;
}
.admin .np-input:focus { outline:none; border-color:var(--color-primary); box-shadow:0 0 0 3px var(--admin-accent-soft); }
.admin .np-input::placeholder { color:var(--admin-text-subtle); }
.admin .np-add {
  position:absolute; right:8px; bottom:8px; width:28px; height:28px; display:flex; align-items:center; justify-content:center;
  border-radius:8px; border:none; cursor:pointer; color:#fff; background:var(--color-primary); transition:background .14s ease;
}
.admin .np-add:hover { background:var(--admin-accent-hover); }
.admin .np-list { display:flex; flex-direction:column; gap:.55rem; }
.admin .np-note {
  display:flex; align-items:flex-start; gap:10px; padding:11px 12px; border-radius:11px;
  background:var(--admin-surface); border:1px solid var(--admin-border); transition:border-color .14s ease;
}
.admin .np-note:hover { border-color:color-mix(in srgb, var(--color-primary) 25%, var(--admin-border)); }
.admin .np-note-body {
  flex:1; min-width:0; border:none; background:transparent; resize:none; font:inherit;
  font-size:var(--admin-text-sm); line-height:1.5; color:var(--admin-text-secondary); padding:2px 0; overflow:hidden;
}
.admin .np-note-body:focus { outline:none; color:var(--admin-text); }
.admin .np-note-actions { display:flex; align-items:center; gap:4px; flex-shrink:0; }
.admin .np-act {
  display:inline-flex; align-items:center; gap:4px; font-size:var(--admin-text-xs); font-weight:600; cursor:pointer;
  padding:5px 9px; border-radius:7px; border:1px solid transparent; background:transparent; color:var(--admin-text-muted);
  transition:background .14s ease, color .14s ease, border-color .14s ease;
}
.admin .np-act:hover { background:var(--admin-accent-soft); color:var(--color-primary); border-color:color-mix(in srgb, var(--color-primary) 20%, transparent); }
.admin .np-act-danger:hover { background:var(--admin-danger-soft); color:var(--admin-danger); border-color:transparent; }
.admin .np-chip { display:inline-flex; align-items:center; gap:4px; font-size:var(--admin-text-xs); font-weight:700; color:var(--admin-success); padding:4px 9px; border-radius:9999px; background:var(--admin-success-soft); }
.admin .np-empty { display:flex; align-items:center; gap:8px; margin:0; padding:14px 4px; color:var(--admin-text-subtle); font-size:var(--admin-text-sm); }
.admin .np-toast {
  position:fixed; bottom:24px; left:50%; transform:translateX(-50%); z-index:50;
  display:flex; align-items:center; gap:8px; padding:10px 18px; border-radius:9999px;
  background:var(--admin-text); color:#fff; font-size:var(--admin-text-sm); font-weight:600;
  box-shadow:0 10px 30px rgba(0,0,0,.25); animation:np-rise .2s ease;
}
@keyframes np-rise { from { opacity:0; transform:translate(-50%, 8px); } to { opacity:1; transform:translate(-50%, 0); } }
`
