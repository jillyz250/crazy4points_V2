'use client'

import { useState, useRef, useTransition, type ReactNode } from 'react'
import { Icon } from '@/components/admin/preview/icons'
import { addTask, toggleTask, deleteTask, type JillTask } from '@/app/admin/(protected)/tasks-actions'

/**
 * "My Tasks" — Jill's personal checklist on the dashboard (Devon, 2026-09-03).
 * Sits under her hero as the "what needs me" surface, distinct from the team's
 * decision queue. Tasks persist until she checks them off; checking one drops it
 * from the open list into a collapsed "Done" section (never hard-deleted).
 * Optimistic local state keeps it instant; the server actions are the source of
 * truth on next load.
 */
export default function MyTasks({
  initialTasks,
  emptyArt,
}: {
  initialTasks: JillTask[]
  /** Optional "all caught up" illustration (server-rendered) shown above the
   *  empty-state text when there's nothing on the list. */
  emptyArt?: ReactNode
}) {
  const [tasks, setTasks] = useState<JillTask[]>(initialTasks)
  const [, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)

  const open = tasks.filter((t) => !t.done)
  const done = tasks.filter((t) => t.done)

  const add = () => {
    const el = inputRef.current
    if (!el) return
    const title = el.value.trim()
    if (!title) return
    const due = dateRef.current?.value?.trim() || null
    el.value = ''
    if (dateRef.current) dateRef.current.value = ''
    const temp: JillTask = {
      id: `temp-${Date.now()}`, title, done: false, source: 'manual', link: null,
      due_date: due, created_at: new Date().toISOString(), done_at: null,
    }
    setTasks((t) => [temp, ...t])
    startTransition(async () => {
      const saved = await addTask(title, undefined, due ?? undefined)
      if (saved) setTasks((t) => t.map((x) => (x.id === temp.id ? saved : x)))
    })
  }

  const toggle = (id: string, next: boolean) => {
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: next, done_at: next ? new Date().toISOString() : null } : x)))
    if (!id.startsWith('temp-')) startTransition(() => { toggleTask(id, next) })
  }

  const remove = (id: string) => {
    setTasks((t) => t.filter((x) => x.id !== id))
    if (!id.startsWith('temp-')) startTransition(() => { deleteTask(id) })
  }

  const fmtDue = (d: string | null) => {
    if (!d) return null
    const due = new Date(d + 'T00:00:00')
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return { label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: due < today }
  }

  const row = (t: JillTask) => (
    <div key={t.id} className={`mt-task${t.done ? ' mt-task-done' : ''}`}>
      <button
        type="button"
        className="mt-check"
        role="checkbox"
        aria-checked={t.done}
        aria-label={t.done ? `Reopen: ${t.title}` : `Mark done: ${t.title}`}
        onClick={() => toggle(t.id, !t.done)}
        title={t.done ? 'Reopen' : 'Mark done'}
      >
        {t.done ? <Icon name="check" size={18} /> : <span className="mt-check-box" />}
      </button>
      {t.link ? (
        <a href={t.link} target={t.link.startsWith('/') ? undefined : '_blank'} rel="noopener noreferrer" className="mt-title mt-title-link" title={t.title}>
          {t.title}
        </a>
      ) : (
        <span className="mt-title" title={t.title}>{t.title}</span>
      )}
      {(() => {
        const d = fmtDue(t.due_date)
        return d ? <span className={`mt-due${d.overdue && !t.done ? ' mt-due-over' : ''}`}>{d.label}</span> : null
      })()}
      <button type="button" className="mt-del" onClick={() => remove(t.id)} title="Delete task" aria-label={`Delete: ${t.title}`}>
        <Icon name="trash" size={14} />
      </button>
    </div>
  )

  return (
    <div className="mt">
      <style dangerouslySetInnerHTML={{ __html: MT_CSS }} />
      <div className="mt-add">
        <div className="mt-add-main">
          <input
            ref={inputRef}
            className="mt-input"
            type="text"
            placeholder="Add a task and press Enter…"
            maxLength={500}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          />
          <button type="button" className="mt-add-btn" onMouseDown={(e) => { e.preventDefault(); add() }} title="Add task" aria-label="Add task">
            <Icon name="plus" size={16} />
          </button>
        </div>
        <label className="mt-add-due">
          <span>Due date (optional)</span>
          <input ref={dateRef} type="date" className="mt-date" aria-label="Due date (optional)" />
        </label>
      </div>

      <div className="mt-list">
        {open.length === 0 ? (
          <div className="mt-empty-wrap">
            {emptyArt}
            <p className="mt-empty"><Icon name="check" size={16} /> Nothing on your list &#x2705;</p>
          </div>
        ) : open.map(row)}
      </div>

      {done.length > 0 && (
        <details className="mt-done">
          <summary>
            <Icon name="arrow" size={13} className="mt-done-chev" />
            <span>{done.length} done</span>
          </summary>
          <div className="mt-list mt-list-done">{done.map(row)}</div>
        </details>
      )}
    </div>
  )
}

const MT_CSS = `
.admin .mt { position:relative; }

/* Add-a-task */
.admin .mt-add { margin-bottom:1rem; }
.admin .mt-add-main { position:relative; }
.admin .mt-add-due { display:flex; align-items:center; gap:8px; margin-top:8px; font-size:var(--admin-text-xs); color:var(--admin-text-subtle); }
.admin .mt-date { font:inherit; font-size:1rem; padding:6px 10px; border-radius:9px; color:var(--admin-text); background:#fff; border:1px solid var(--admin-border); }
.admin .mt-date:focus { outline:none; border-color:var(--color-primary); box-shadow:0 0 0 3px var(--admin-accent-soft); }
/* Due-date chip on a task */
.admin .mt-due { flex-shrink:0; font-size:var(--admin-text-xs); font-weight:700; color:var(--admin-text-muted); background:color-mix(in srgb, var(--color-primary) 6%, #fff); border:1px solid var(--admin-border); padding:1px 8px; border-radius:9999px; font-variant-numeric:tabular-nums; }
.admin .mt-due-over { color:var(--admin-danger); background:var(--admin-danger-soft, #fdeaea); border-color:color-mix(in srgb, var(--admin-danger) 30%, transparent); }
.admin .mt-input {
  width:100%; font:inherit; font-size:1rem; line-height:1.5;
  padding:11px 44px 11px 14px; border-radius:12px; color:var(--admin-text);
  background:color-mix(in srgb, var(--color-primary) 4%, #fff);
  border:1px solid color-mix(in srgb, var(--color-primary) 18%, var(--admin-border));
  transition:border-color .14s ease, box-shadow .14s ease;
}
.admin .mt-input:focus { outline:none; border-color:var(--color-primary); box-shadow:0 0 0 3px var(--admin-accent-soft); }
.admin .mt-input::placeholder { color:var(--admin-text-subtle); }
.admin .mt-add-btn {
  position:absolute; right:7px; top:50%; transform:translateY(-50%);
  width:30px; height:30px; display:flex; align-items:center; justify-content:center;
  border-radius:9px; border:none; cursor:pointer; color:#fff; background:var(--color-primary); transition:background .14s ease;
}
.admin .mt-add-btn:hover { background:var(--admin-accent-hover); }

/* List */
.admin .mt-list { display:flex; flex-direction:column; gap:.4rem; }
.admin .mt-task {
  display:flex; align-items:center; gap:11px; padding:10px 12px; border-radius:11px;
  background:var(--admin-surface); border:1px solid var(--admin-border); transition:border-color .14s ease, background .14s ease;
}
.admin .mt-task:hover { border-color:color-mix(in srgb, var(--color-primary) 25%, var(--admin-border)); }

/* Check-off control (≥44px hit area via padding, visible box inside) */
.admin .mt-check {
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
  width:26px; height:26px; padding:0; border:none; background:transparent; cursor:pointer;
  color:var(--admin-success); border-radius:8px;
}
.admin .mt-check-box {
  width:19px; height:19px; border-radius:6px; display:block;
  border:2px solid color-mix(in srgb, var(--color-primary) 35%, var(--admin-border)); transition:border-color .14s ease, background .14s ease;
}
.admin .mt-check:hover .mt-check-box { border-color:var(--color-primary); background:var(--admin-accent-soft); }
.admin .mt-check:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }

.admin .mt-title { flex:1; min-width:0; font-size:var(--admin-text-sm); font-weight:600; line-height:1.45; color:var(--admin-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.admin a.mt-title-link { text-decoration:none; }
.admin a.mt-title-link:hover { color:var(--color-primary); text-decoration:underline; }

.admin .mt-link, .admin .mt-del {
  display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;
  width:30px; height:30px; border-radius:8px; border:1px solid transparent; background:transparent;
  color:var(--admin-text-subtle); cursor:pointer; text-decoration:none; transition:background .14s ease, color .14s ease;
}
.admin .mt-link:hover { background:var(--admin-accent-soft); color:var(--color-primary); text-decoration:none; }
.admin .mt-del { opacity:0; }
.admin .mt-task:hover .mt-del { opacity:1; }
.admin .mt-del:hover { background:var(--admin-danger-soft); color:var(--admin-danger); }
.admin .mt-link:focus-visible, .admin .mt-del:focus-visible { opacity:1; outline:2px solid var(--color-primary); outline-offset:1px; }

/* Done rows */
.admin .mt-task-done { background:transparent; border-color:transparent; }
.admin .mt-task-done .mt-title { color:var(--admin-text-subtle); text-decoration:line-through; }
.admin .mt-task-done .mt-check { color:var(--admin-success); }

/* Empty state */
.admin .mt-empty-wrap { display:flex; flex-direction:column; align-items:center; gap:6px; padding:20px 4px 22px; text-align:center; }
.admin .mt-empty-wrap .mt-empty { justify-content:center; padding:0; }
.admin .mt-empty { display:flex; align-items:center; gap:8px; margin:0; padding:16px 4px; color:var(--admin-text-subtle); font-size:var(--admin-text-sm); }
.admin .mt-empty svg { color:var(--admin-success); }

/* Collapsed "Done" section */
.admin .mt-done { margin-top:.85rem; border-top:1px solid var(--admin-border); padding-top:.5rem; }
.admin .mt-done > summary {
  list-style:none; cursor:pointer; display:flex; align-items:center; gap:7px; padding:6px 4px;
  font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--admin-text-muted);
}
.admin .mt-done > summary::-webkit-details-marker { display:none; }
.admin .mt-done > summary:hover { color:var(--color-primary); }
.admin .mt-done-chev { transition:transform .2s ease; }
.admin .mt-done[open] .mt-done-chev { transform:rotate(90deg); }
.admin .mt-list-done { margin-top:.35rem; }
`
