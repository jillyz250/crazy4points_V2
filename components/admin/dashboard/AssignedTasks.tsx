'use client'

import { useState, useRef, useTransition } from 'react'
import { Icon } from '@/components/admin/preview/icons'
import { assignTask, setTaskStatus, deleteEmployeeTask } from '@/app/admin/(protected)/org/[slug]/actions'
import {
  sortOpenTasks,
  type EmployeeTask,
  type TaskPriority,
  type TaskStatus,
} from '@/app/admin/(protected)/org/[slug]/tasks'

/**
 * Assigned Tasks board — a head's work items (Devon, 2026-09-03).
 * Sits at the top of each head's page: their OPEN tasks (status != done), P1
 * first, then P2/P3, then oldest. Each row shows a priority chip, the title +
 * detail, who assigned it, and a status control. Marking done drops it into a
 * collapsed "Done" area. Distinct from Jill's My Tasks (jill_tasks) and the
 * Decision Log. Optimistic local state keeps it instant; the server actions are
 * the source of truth on next load.
 */

const PRIORITY_LABEL: Record<TaskPriority, string> = { P1: 'P1', P2: 'P2', P3: 'P3' }
const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  blocked: 'Blocked',
  done: 'Done',
}
// Working statuses selectable from the row (done is reached via the check button).
const WORKING_STATUSES: TaskStatus[] = ['todo', 'in_progress', 'blocked']

export default function AssignedTasks({
  employeeSlug,
  employeeName,
  initialTasks,
}: {
  employeeSlug: string
  employeeName: string
  initialTasks: EmployeeTask[]
}) {
  const [tasks, setTasks] = useState<EmployeeTask[]>(initialTasks)
  const [priority, setPriority] = useState<TaskPriority>('P2')
  const [, startTransition] = useTransition()
  const titleRef = useRef<HTMLInputElement>(null)
  const detailRef = useRef<HTMLInputElement>(null)

  const open = sortOpenTasks(tasks.filter((t) => t.status !== 'done'))
  const done = tasks
    .filter((t) => t.status === 'done')
    .sort((a, b) => new Date(b.done_at ?? b.updated_at).getTime() - new Date(a.done_at ?? a.updated_at).getTime())

  const first = employeeName.split(' ')[0]

  const add = () => {
    const titleEl = titleRef.current
    if (!titleEl) return
    const title = titleEl.value.trim()
    if (!title) return
    const detail = (detailRef.current?.value ?? '').trim()
    titleEl.value = ''
    if (detailRef.current) detailRef.current.value = ''
    const now = new Date().toISOString()
    const temp: EmployeeTask = {
      id: `temp-${Date.now()}`,
      employee_slug: employeeSlug,
      title,
      detail: detail || null,
      priority,
      status: 'todo',
      assigned_by: 'jill',
      link: null,
      created_at: now,
      updated_at: now,
      due_at: null,
      done_at: null,
    }
    setTasks((t) => [temp, ...t])
    startTransition(async () => {
      const saved = await assignTask(employeeSlug, title, priority, detail || undefined)
      if (saved) setTasks((t) => t.map((x) => (x.id === temp.id ? saved : x)))
    })
    titleEl.focus()
  }

  const changeStatus = (id: string, next: TaskStatus) => {
    const now = new Date().toISOString()
    setTasks((t) =>
      t.map((x) =>
        x.id === id
          ? { ...x, status: next, updated_at: now, done_at: next === 'done' ? now : null }
          : x,
      ),
    )
    if (!id.startsWith('temp-')) startTransition(() => { setTaskStatus(id, next, employeeSlug) })
  }

  const remove = (id: string) => {
    setTasks((t) => t.filter((x) => x.id !== id))
    if (!id.startsWith('temp-')) startTransition(() => { deleteEmployeeTask(id, employeeSlug) })
  }

  const row = (t: EmployeeTask) => {
    const isDone = t.status === 'done'
    return (
      <div key={t.id} className={`at-task${isDone ? ' at-task-done' : ''}`}>
        <button
          type="button"
          className="at-check"
          role="checkbox"
          aria-checked={isDone}
          aria-label={isDone ? `Reopen: ${t.title}` : `Mark done: ${t.title}`}
          title={isDone ? 'Reopen' : 'Mark done'}
          onClick={() => changeStatus(t.id, isDone ? 'todo' : 'done')}
        >
          {isDone ? <Icon name="check" size={18} /> : <span className="at-check-box" />}
        </button>

        <span className={`at-pri at-pri-${t.priority.toLowerCase()}`} title={`Priority ${t.priority}`}>
          {PRIORITY_LABEL[t.priority]}
        </span>

        <div className="at-body">
          <div className="at-title-row">
            <span className="at-title">{t.title}</span>
            {!isDone && t.status !== 'todo' && (
              <span className={`at-pill at-pill-${t.status}`}>{STATUS_LABEL[t.status]}</span>
            )}
          </div>
          {t.detail && <p className="at-detail">{t.detail}</p>}
          <div className="at-meta">
            {t.assigned_by && <span className="at-assigned">Assigned by {cap(t.assigned_by)}</span>}
          </div>
        </div>

        {!isDone && (
          <label className="at-status" title="Change status">
            <span className="sr-only">Status for {t.title}</span>
            <select
              className={`at-select at-select-${t.status}`}
              value={t.status}
              onChange={(e) => changeStatus(t.id, e.target.value as TaskStatus)}
            >
              {WORKING_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </label>
        )}

        <button
          type="button"
          className="at-del"
          onClick={() => remove(t.id)}
          title="Delete task"
          aria-label={`Delete: ${t.title}`}
        >
          <Icon name="trash" size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className="at">
      <style dangerouslySetInnerHTML={{ __html: AT_CSS }} />

      {/* Assign form */}
      <div className="at-add">
        <div className="at-add-main">
          <input
            ref={titleRef}
            className="at-input"
            type="text"
            placeholder={`Assign a task to ${first}…`}
            maxLength={500}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          />
          <select
            className="at-add-pri"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            title="Priority"
            aria-label="Priority"
          >
            <option value="P1">P1 · urgent</option>
            <option value="P2">P2 · normal</option>
            <option value="P3">P3 · later</option>
          </select>
          <button
            type="button"
            className="at-add-btn"
            onMouseDown={(e) => { e.preventDefault(); add() }}
            title="Assign task"
          >
            <Icon name="plus" size={15} /> Assign
          </button>
        </div>
        <input
          ref={detailRef}
          className="at-input at-input-detail"
          type="text"
          placeholder="Optional: what does done look like?"
          maxLength={4000}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
        />
      </div>

      {/* Open list */}
      <div className="at-list">
        {open.length === 0 ? (
          <p className="at-empty"><Icon name="check" size={16} /> No assigned tasks.</p>
        ) : open.map(row)}
      </div>

      {/* Done (collapsed) */}
      {done.length > 0 && (
        <details className="at-done">
          <summary>
            <Icon name="arrow" size={13} className="at-done-chev" />
            <span>Done ({done.length})</span>
          </summary>
          <div className="at-list at-list-done">{done.map(row)}</div>
        </details>
      )}
    </div>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const AT_CSS = `
.admin .at { position:relative; }
.admin .at .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); border:0; }

/* Assign form */
.admin .at-add { margin-bottom:1.1rem; display:flex; flex-direction:column; gap:.55rem; }
.admin .at-add-main { display:flex; gap:.55rem; align-items:stretch; }
.admin .at-input {
  flex:1; min-width:0; font:inherit; font-size:1rem; line-height:1.5;
  padding:11px 14px; border-radius:12px; color:var(--admin-text);
  background:color-mix(in srgb, var(--color-primary) 4%, #fff);
  border:1px solid color-mix(in srgb, var(--color-primary) 18%, var(--admin-border));
  transition:border-color .14s ease, box-shadow .14s ease;
}
.admin .at-input:focus { outline:none; border-color:var(--color-primary); box-shadow:0 0 0 3px var(--admin-accent-soft); }
.admin .at-input::placeholder { color:var(--admin-text-subtle); }
.admin .at-input-detail { font-size:var(--admin-text-sm); padding:9px 14px; }
.admin .at-add-pri {
  flex-shrink:0; font:inherit; font-size:var(--admin-text-sm); font-weight:600; cursor:pointer;
  padding:0 12px; border-radius:12px; color:var(--admin-text);
  background:var(--admin-surface);
  border:1px solid color-mix(in srgb, var(--color-primary) 18%, var(--admin-border));
}
.admin .at-add-pri:focus { outline:none; border-color:var(--color-primary); box-shadow:0 0 0 3px var(--admin-accent-soft); }
.admin .at-add-btn {
  flex-shrink:0; display:inline-flex; align-items:center; gap:6px; font:inherit; font-size:var(--admin-text-sm); font-weight:700;
  padding:0 16px; border-radius:12px; border:none; cursor:pointer; color:#fff; background:var(--color-primary); transition:background .14s ease;
}
.admin .at-add-btn:hover { background:var(--admin-accent-hover, var(--color-primary-hover)); }
.admin .at-add-btn:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }

/* List */
.admin .at-list { display:flex; flex-direction:column; gap:.5rem; }
.admin .at-task {
  display:flex; align-items:flex-start; gap:12px; padding:12px 13px; border-radius:12px;
  background:var(--admin-surface); border:1px solid var(--admin-border);
  transition:border-color .14s ease, box-shadow .14s ease;
}
.admin .at-task:hover { border-color:color-mix(in srgb, var(--color-primary) 25%, var(--admin-border)); box-shadow:0 10px 26px -22px rgba(107,45,143,.4); }

/* Check-off (completion) */
.admin .at-check {
  display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px;
  width:26px; height:26px; padding:0; border:none; background:transparent; cursor:pointer;
  color:var(--admin-success); border-radius:8px;
}
.admin .at-check-box {
  width:19px; height:19px; border-radius:6px; display:block;
  border:2px solid color-mix(in srgb, var(--color-primary) 35%, var(--admin-border)); transition:border-color .14s ease, background .14s ease;
}
.admin .at-check:hover .at-check-box { border-color:var(--color-primary); background:var(--admin-accent-soft); }
.admin .at-check:focus-visible { outline:2px solid var(--color-primary); outline-offset:2px; }

/* Priority chip */
.admin .at-pri {
  flex-shrink:0; margin-top:1px; display:inline-flex; align-items:center; justify-content:center;
  min-width:30px; height:24px; padding:0 8px; border-radius:7px;
  font-size:var(--admin-text-xs); font-weight:800; letter-spacing:.03em; font-variant-numeric:tabular-nums;
}
.admin .at-pri-p1 { color:var(--admin-danger); background:var(--admin-danger-soft); border:1px solid color-mix(in srgb, var(--admin-danger) 30%, var(--admin-border)); }
.admin .at-pri-p2 { color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 18%, var(--admin-border)); }
.admin .at-pri-p3 { color:var(--admin-text-muted); background:var(--admin-surface-alt); border:1px solid var(--admin-border); }

/* Body */
.admin .at-body { min-width:0; flex:1; }
.admin .at-title-row { display:flex; align-items:center; gap:9px; flex-wrap:wrap; }
.admin .at-title { font-size:.96rem; font-weight:700; color:var(--admin-text); line-height:1.35; word-break:break-word; }
.admin .at-detail { margin:4px 0 0; font-size:var(--admin-text-sm); color:var(--admin-text-secondary); line-height:1.5; }
.admin .at-meta { margin-top:5px; display:flex; align-items:center; gap:10px; }
.admin .at-assigned { font-size:var(--admin-text-xs); color:var(--admin-text-subtle); font-weight:600; }

/* Status pill (display, for non-todo working states) */
.admin .at-pill { flex-shrink:0; font-size:var(--admin-text-xs); font-weight:800; padding:2px 8px; border-radius:9999px; text-transform:uppercase; letter-spacing:.04em; }
.admin .at-pill-in_progress { color:var(--admin-info); background:var(--admin-info-soft); }
.admin .at-pill-blocked { color:var(--admin-warning); background:var(--admin-warning-soft); }

/* Status select (change control) */
.admin .at-status { flex-shrink:0; margin-top:1px; }
.admin .at-select {
  font:inherit; font-size:var(--admin-text-xs); font-weight:700; cursor:pointer; text-transform:uppercase; letter-spacing:.03em;
  padding:5px 9px; border-radius:8px; border:1px solid var(--admin-border); background:var(--admin-surface); color:var(--admin-text-muted);
  transition:border-color .14s ease, color .14s ease, background .14s ease;
}
.admin .at-select:hover { border-color:color-mix(in srgb, var(--color-primary) 30%, var(--admin-border)); }
.admin .at-select:focus-visible { outline:2px solid var(--color-primary); outline-offset:1px; }
.admin .at-select-in_progress { color:var(--admin-info); border-color:color-mix(in srgb, var(--admin-info) 35%, var(--admin-border)); background:var(--admin-info-soft); }
.admin .at-select-blocked { color:var(--admin-warning); border-color:color-mix(in srgb, var(--admin-warning) 35%, var(--admin-border)); background:var(--admin-warning-soft); }

/* Delete */
.admin .at-del {
  flex-shrink:0; margin-top:1px; display:inline-flex; align-items:center; justify-content:center;
  width:30px; height:30px; border-radius:8px; border:1px solid transparent; background:transparent;
  color:var(--admin-text-subtle); cursor:pointer; opacity:0; transition:background .14s ease, color .14s ease, opacity .14s ease;
}
.admin .at-task:hover .at-del { opacity:1; }
.admin .at-del:hover { background:var(--admin-danger-soft); color:var(--admin-danger); }
.admin .at-del:focus-visible { opacity:1; outline:2px solid var(--color-primary); outline-offset:1px; }

/* Empty */
.admin .at-empty { display:flex; align-items:center; gap:8px; margin:0; padding:16px 4px; color:var(--admin-text-subtle); font-size:var(--admin-text-sm); }
.admin .at-empty svg { color:var(--admin-success); }

/* Done rows */
.admin .at-task-done { background:transparent; border-color:transparent; padding:9px 13px; }
.admin .at-task-done .at-title { color:var(--admin-text-subtle); text-decoration:line-through; font-weight:600; }
.admin .at-task-done .at-detail { display:none; }
.admin .at-task-done .at-pri { opacity:.55; }

/* Collapsed Done section */
.admin .at-done { margin-top:.9rem; border-top:1px solid var(--admin-border); padding-top:.5rem; }
.admin .at-done > summary {
  list-style:none; cursor:pointer; display:flex; align-items:center; gap:7px; padding:6px 4px;
  font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--admin-text-muted);
}
.admin .at-done > summary::-webkit-details-marker { display:none; }
.admin .at-done > summary:hover { color:var(--color-primary); }
.admin .at-done-chev { transition:transform .2s ease; }
.admin .at-done[open] .at-done-chev { transform:rotate(90deg); }
.admin .at-list-done { margin-top:.35rem; }

@media (max-width:600px) {
  .admin .at-add-main { flex-wrap:wrap; }
  .admin .at-input { flex-basis:100%; }
}
`
