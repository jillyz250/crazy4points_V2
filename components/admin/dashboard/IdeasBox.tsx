'use client'

import { useRef, useState, useTransition } from 'react'
import { Icon } from '@/components/admin/preview/icons'
import { addIdea, decideIdea, shipIdea } from '@/app/admin/(protected)/org/[slug]/actions'
import {
  sortIdeas,
  AREA_LABEL,
  STATUS_LABEL,
  IDEA_AREAS,
  type EmployeeIdea,
  type IdeaArea,
} from '@/app/admin/(protected)/org/[slug]/ideas'

/**
 * Ideas box — an employee's proactive suggestions for THEIR area (Devon,
 * 2026-09-03). Each idea shows the text, a small area tag and a semantic status
 * chip (new / approved / rejected / shipped). Jill can add one, approve/reject
 * it, and mark it shipped — optimistic local state keeps it instant; the server
 * actions (employee_ideas, migration 663) are the source of truth on next load.
 * The section header + illustration slot live on the server page; this renders
 * the card body (add form + list).
 */

export default function IdeasBox({
  employeeSlug,
  employeeName,
  initialIdeas,
}: {
  employeeSlug: string
  employeeName: string
  initialIdeas: EmployeeIdea[]
}) {
  const [ideas, setIdeas] = useState<EmployeeIdea[]>(initialIdeas)
  const [area, setArea] = useState<IdeaArea>('other')
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const first = employeeName.split(' ')[0]

  const ordered = sortIdeas(ideas)

  const add = () => {
    const el = inputRef.current
    if (!el) return
    const text = el.value.trim()
    if (!text) return
    el.value = ''
    const now = new Date().toISOString()
    const temp: EmployeeIdea = {
      id: `temp-${Date.now()}`,
      employee_slug: employeeSlug,
      idea: text,
      area,
      status: 'new',
      created_by: 'jill',
      decided_note: null,
      created_at: now,
      decided_at: null,
      shipped_at: null,
    }
    setIdeas((list) => [temp, ...list])
    startTransition(async () => {
      const saved = await addIdea(employeeSlug, text, area)
      if (saved) setIdeas((list) => list.map((x) => (x.id === temp.id ? saved : x)))
    })
    el.focus()
  }

  const decide = (id: string, decision: 'approved' | 'rejected') => {
    const now = new Date().toISOString()
    setIdeas((list) => list.map((x) => (x.id === id ? { ...x, status: decision, decided_at: now } : x)))
    if (!id.startsWith('temp-')) startTransition(() => { decideIdea(id, decision, employeeSlug) })
  }

  const ship = (id: string) => {
    const now = new Date().toISOString()
    setIdeas((list) => list.map((x) => (x.id === id ? { ...x, status: 'shipped', shipped_at: now } : x)))
    if (!id.startsWith('temp-')) startTransition(() => { shipIdea(id, employeeSlug) })
  }

  const card = (idea: EmployeeIdea) => (
    <div key={idea.id} className={`ib-idea ib-idea-${idea.status}`}>
      <div className="ib-idea-main">
        <p className="ib-idea-text">{idea.idea}</p>
        <div className="ib-idea-tags">
          <span className={`ib-area ib-area-${idea.area}`}>{AREA_LABEL[idea.area]}</span>
          <span className={`ib-status ib-status-${idea.status}`}>{STATUS_LABEL[idea.status]}</span>
          {idea.created_by !== 'jill' && <span className="ib-by">Suggested by {first}</span>}
        </div>
        {idea.decided_note && <p className="ib-idea-note"><Icon name="note" size={12} /> {idea.decided_note}</p>}
      </div>
      <div className="ib-idea-actions">
        {idea.status === 'new' && (
          <>
            <button type="button" className="ib-btn ib-btn-approve" onClick={() => decide(idea.id, 'approved')}>
              <Icon name="check" size={14} /> Approve
            </button>
            <button type="button" className="ib-btn ib-btn-reject" onClick={() => decide(idea.id, 'rejected')}>
              Reject
            </button>
          </>
        )}
        {idea.status === 'approved' && (
          <button type="button" className="ib-btn ib-btn-ship" onClick={() => ship(idea.id)}>
            <Icon name="send" size={13} /> Mark shipped
          </button>
        )}
        {idea.status === 'shipped' && (
          <span className="ib-done"><Icon name="spark" size={14} /> Shipped</span>
        )}
        {idea.status === 'rejected' && (
          <button type="button" className="ib-btn ib-btn-quiet" onClick={() => decide(idea.id, 'approved')} title="Reconsider">
            Reconsider
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="ib">
      <style dangerouslySetInnerHTML={{ __html: IB_CSS }} />

      {/* Add an idea */}
      <div className="ib-add">
        <input
          ref={inputRef}
          className="ib-input"
          type="text"
          placeholder={`Add an idea for ${first}'s area…`}
          maxLength={2000}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
        <select
          className="ib-area-select"
          value={area}
          onChange={(e) => setArea(e.target.value as IdeaArea)}
          title="Area"
          aria-label="Idea area"
        >
          {IDEA_AREAS.map((a) => (
            <option key={a} value={a}>{AREA_LABEL[a]}</option>
          ))}
        </select>
        <button type="button" className="ib-add-btn" onMouseDown={(e) => { e.preventDefault(); add() }} title="Add idea">
          <Icon name="plus" size={15} /> Add
        </button>
      </div>

      {/* List */}
      {ordered.length === 0 ? (
        <p className="ib-empty"><Icon name="lightbulb" size={16} /> No ideas yet.</p>
      ) : (
        <div className="ib-list">{ordered.map(card)}</div>
      )}
    </div>
  )
}

const IB_CSS = `
.admin .ib { position:relative; }

/* Add-an-idea form */
.admin .ib-add { display:flex; gap:.55rem; align-items:stretch; margin-bottom:1.1rem; }
.admin .ib-input {
  flex:1; min-width:0; font:inherit; font-size:1rem; line-height:1.5;
  padding:11px 14px; border-radius:12px; color:var(--admin-text);
  background:color-mix(in srgb, var(--color-accent) 6%, #fff);
  border:1px solid color-mix(in srgb, var(--color-accent) 30%, var(--admin-border));
  transition:border-color .14s ease, box-shadow .14s ease;
}
.admin .ib-input:focus { outline:none; border-color:var(--color-primary); box-shadow:0 0 0 3px var(--admin-accent-soft); }
.admin .ib-input::placeholder { color:var(--admin-text-subtle); }
.admin .ib-area-select {
  flex-shrink:0; font:inherit; font-size:var(--admin-text-sm); font-weight:600; cursor:pointer;
  padding:0 12px; border-radius:12px; color:var(--admin-text); background:var(--admin-surface);
  border:1px solid color-mix(in srgb, var(--color-primary) 18%, var(--admin-border));
}
.admin .ib-area-select:focus { outline:none; border-color:var(--color-primary); box-shadow:0 0 0 3px var(--admin-accent-soft); }
.admin .ib-add-btn {
  flex-shrink:0; display:inline-flex; align-items:center; gap:6px; font:inherit; font-size:var(--admin-text-sm); font-weight:700;
  padding:0 16px; border-radius:12px; border:none; cursor:pointer; color:#fff; background:var(--color-primary); transition:background .14s ease;
}
.admin .ib-add-btn:hover { background:var(--color-primary-hover); }
.admin .ib-add-btn:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }

/* List */
.admin .ib-list { display:flex; flex-direction:column; gap:.6rem; }
.admin .ib-idea {
  display:flex; align-items:flex-start; gap:14px; padding:13px 15px; border-radius:14px;
  background:var(--admin-surface); border:1px solid var(--admin-border);
  border-left:4px solid var(--admin-info);
  transition:border-color .14s ease, box-shadow .14s ease, transform .14s ease;
}
.admin .ib-idea:hover { box-shadow:0 12px 28px -22px rgba(107,45,143,.42); }
.admin .ib-idea-new { border-left-color:var(--admin-info); }
.admin .ib-idea-approved { border-left-color:var(--admin-success); }
.admin .ib-idea-shipped { border-left-color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 3%, var(--admin-surface)); }
.admin .ib-idea-rejected { border-left-color:var(--admin-border); opacity:.72; }
.admin .ib-idea-rejected .ib-idea-text { color:var(--admin-text-muted); }

.admin .ib-idea-main { min-width:0; flex:1; }
.admin .ib-idea-text { margin:0; font-size:.96rem; font-weight:600; color:var(--admin-text); line-height:1.45; word-break:break-word; }
.admin .ib-idea-tags { display:flex; align-items:center; flex-wrap:wrap; gap:7px; margin-top:9px; }

/* Area tag — small, quiet, subtly tinted per area */
.admin .ib-area {
  display:inline-flex; align-items:center; font-size:.66rem; font-weight:700; text-transform:uppercase; letter-spacing:.05em;
  padding:2px 9px; border-radius:9999px; color:var(--admin-text-muted);
  background:var(--admin-surface-alt); border:1px solid var(--admin-border);
}
.admin .ib-area-efficiency { color:#0e7490; background:color-mix(in srgb,#0e7490 9%,#fff); border-color:color-mix(in srgb,#0e7490 22%,var(--admin-border)); }
.admin .ib-area-visual { color:var(--color-primary); background:color-mix(in srgb,var(--color-primary) 8%,#fff); border-color:color-mix(in srgb,var(--color-primary) 20%,var(--admin-border)); }
.admin .ib-area-data { color:#1d4ed8; background:color-mix(in srgb,#1d4ed8 8%,#fff); border-color:color-mix(in srgb,#1d4ed8 20%,var(--admin-border)); }
.admin .ib-area-process { color:#b45309; background:color-mix(in srgb,#b45309 9%,#fff); border-color:color-mix(in srgb,#b45309 22%,var(--admin-border)); }
.admin .ib-area-accuracy { color:#047857; background:color-mix(in srgb,#047857 9%,#fff); border-color:color-mix(in srgb,#047857 22%,var(--admin-border)); }
.admin .ib-area-growth { color:#a21caf; background:color-mix(in srgb,#a21caf 8%,#fff); border-color:color-mix(in srgb,#a21caf 20%,var(--admin-border)); }

/* Status chip — semantic */
.admin .ib-status { display:inline-flex; align-items:center; font-size:.66rem; font-weight:800; text-transform:uppercase; letter-spacing:.05em; padding:2px 9px; border-radius:9999px; }
.admin .ib-status-new { color:var(--admin-info); background:var(--admin-info-soft); }
.admin .ib-status-approved { color:var(--admin-success); background:var(--admin-success-soft); }
.admin .ib-status-rejected { color:var(--admin-danger); background:var(--admin-danger-soft); }
.admin .ib-status-shipped { color:var(--color-primary); background:color-mix(in srgb,var(--color-primary) 12%,#fff); }

.admin .ib-by { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); font-weight:600; }
.admin .ib-idea-note { display:flex; align-items:flex-start; gap:6px; margin:8px 0 0; font-size:var(--admin-text-xs); color:var(--admin-text-muted); line-height:1.45; font-style:italic; }
.admin .ib-idea-note svg { flex-shrink:0; margin-top:2px; }

/* Per-idea actions */
.admin .ib-idea-actions { flex-shrink:0; display:flex; flex-direction:column; gap:6px; align-items:stretch; }
.admin .ib-btn {
  display:inline-flex; align-items:center; justify-content:center; gap:5px; white-space:nowrap;
  font:inherit; font-size:var(--admin-text-xs); font-weight:700; cursor:pointer;
  padding:6px 12px; border-radius:9px; border:1px solid var(--admin-border); background:var(--admin-surface); color:var(--admin-text-muted);
  transition:background .14s ease, border-color .14s ease, color .14s ease;
}
.admin .ib-btn:focus-visible { outline:2px solid var(--color-primary); outline-offset:1px; }
.admin .ib-btn-approve { color:var(--admin-success); border-color:color-mix(in srgb,var(--admin-success) 35%,var(--admin-border)); background:var(--admin-success-soft); }
.admin .ib-btn-approve:hover { background:color-mix(in srgb,var(--admin-success) 18%,#fff); border-color:var(--admin-success); }
.admin .ib-btn-reject:hover { color:var(--admin-danger); border-color:color-mix(in srgb,var(--admin-danger) 35%,var(--admin-border)); background:var(--admin-danger-soft); }
.admin .ib-btn-ship { color:#fff; background:var(--color-primary); border-color:var(--color-primary); }
.admin .ib-btn-ship:hover { background:var(--color-primary-hover); border-color:var(--color-primary-hover); }
.admin .ib-btn-quiet:hover { color:var(--color-primary); border-color:color-mix(in srgb,var(--color-primary) 30%,var(--admin-border)); }
.admin .ib-done { display:inline-flex; align-items:center; gap:6px; font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.04em; color:var(--color-primary); padding:6px 2px; }

/* Empty */
.admin .ib-empty { display:flex; align-items:center; gap:8px; margin:0; padding:18px 4px; color:var(--admin-text-subtle); font-size:var(--admin-text-sm); }
.admin .ib-empty svg { color:var(--color-accent); }

@media (max-width:600px) {
  .admin .ib-add { flex-wrap:wrap; }
  .admin .ib-input { flex-basis:100%; }
  .admin .ib-idea { flex-direction:column; gap:11px; }
  .admin .ib-idea-actions { flex-direction:row; width:100%; }
  .admin .ib-btn { flex:1; }
}
`
