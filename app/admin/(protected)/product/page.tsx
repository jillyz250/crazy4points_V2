import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card, CardBody } from '@/components/admin/ui/Card'
import { EmptyState } from '@/components/admin/ui/EmptyState'

export const dynamic = 'force-dynamic'

// Quinn's Product board (Jill, 2026-09-05): "what we build next" in one place —
// the feature pipeline (Quinn's tasks), the idea intake awaiting a call, the
// parked bets with their revisit dates (so no idea dies in a backlog), and what
// has shipped. Read-only for now; decisions still happen in the morning meeting.

type Task = {
  id: string; title: string; detail: string | null; priority: string | null
  status: string; due_at: string | null; link: string | null; done_at: string | null; updated_at: string
}
type Idea = {
  id: string; employee_slug: string; idea: string; area: string | null; status: string
  revisit_on: string | null; created_at: string; decided_note: string | null
}

const PRI: Record<string, { label: string; bg: string; fg: string }> = {
  P1: { label: 'P1 · urgent', bg: '#fdecea', fg: '#b3261e' },
  P2: { label: 'P2 · now', bg: '#fff4e5', fg: '#8a5a00' },
  P3: { label: 'P3 · later', bg: '#eef1f5', fg: '#516072' },
}
const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
const priRank = (p: string | null) => (p === 'P1' ? 0 : p === 'P2' ? 1 : p === 'P3' ? 2 : 3)
const ownerName = (slug: string) => slug.split('-')[0].replace(/^\w/, (c) => c.toUpperCase())

function Pill({ children, bg, fg }: { children: React.ReactNode; bg: string; fg: string }) {
  return (
    <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '1px 8px', borderRadius: 9999, background: bg, color: fg, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

export default async function ProductBoardPage() {
  const db = createAdminClient()
  const [tasksRes, ideasRes] = await Promise.all([
    db
      .from('employee_tasks')
      .select('id,title,detail,priority,status,due_at,link,done_at,updated_at')
      .eq('employee_slug', 'quinn-product')
      .order('updated_at', { ascending: false }),
    db
      .from('employee_ideas')
      .select('id,employee_slug,idea,area,status,revisit_on,created_at,decided_note')
      .order('created_at', { ascending: false }),
  ])
  const tasks = (tasksRes.data ?? []) as Task[]
  const ideas = (ideasRes.data ?? []) as Idea[]
  const today = new Date().toISOString().slice(0, 10)

  const building = tasks.filter((t) => t.status !== 'done').sort((a, b) => priRank(a.priority) - priRank(b.priority))
  const shipped = tasks.filter((t) => t.status === 'done').slice(0, 12)
  const intake = ideas.filter((i) => i.status === 'new')
  const parked = ideas
    .filter((i) => i.status === 'parked')
    .sort((a, b) => (a.revisit_on ?? '9999').localeCompare(b.revisit_on ?? '9999'))

  return (
    <div>
      <PageHeader
        title="Product"
        description="What we build next — the feature pipeline, ideas awaiting a call, and parked bets that resurface on their revisit date. Nothing dies in a backlog."
        actions={
          <Link href="/admin/org/quinn-product" className="admin-btn admin-btn-ghost">
            Quinn&rsquo;s page ↗
          </Link>
        }
      />

      {/* ── Building now (Quinn's active feature tasks) ── */}
      <h2 style={{ fontSize: '1rem', margin: '0 0 0.75rem' }}>
        🚀 Building now <span style={{ fontSize: '0.875rem', fontWeight: 400, opacity: 0.6 }}>({building.length})</span>
      </h2>
      {building.length === 0 ? (
        <EmptyState title="Nothing in flight" description="No open product tasks. Approve an idea in the morning meeting to queue one." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {building.map((t) => {
            const pri = t.priority ? PRI[t.priority] : null
            return (
              <Card key={t.id}>
                <CardBody padding="0.875rem 1rem">
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {pri && <Pill bg={pri.bg} fg={pri.fg}>{pri.label}</Pill>}
                        <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                          {t.link ? <Link href={t.link}>{t.title}</Link> : t.title}
                        </span>
                      </div>
                      {t.detail && (
                        <div
                          style={{
                            fontSize: '0.8125rem', opacity: 0.72, marginTop: '0.25rem', lineHeight: 1.45,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}
                        >
                          {t.detail}
                        </div>
                      )}
                    </div>
                    {t.due_at && (
                      <span style={{ fontSize: '0.75rem', opacity: 0.6, whiteSpace: 'nowrap' }}>Due {fmt(t.due_at)}</span>
                    )}
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Idea intake (new, awaiting a decision — any owner) ── */}
      <h2 style={{ fontSize: '1rem', margin: '2rem 0 0.75rem' }}>
        💡 Idea intake <span style={{ fontSize: '0.875rem', fontWeight: 400, opacity: 0.6 }}>({intake.length})</span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 400, opacity: 0.6, marginLeft: '0.5rem' }}>awaiting act / park / reject</span>
      </h2>
      {intake.length === 0 ? (
        <EmptyState title="No new ideas" description="The team floats ideas into their boxes; new ones land here for a call." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {intake.map((i) => (
            <Card key={i.id}>
              <CardBody padding="0.75rem 1rem">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.9rem' }}>{i.idea}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.15rem' }}>
                      {ownerName(i.employee_slug)}{i.area ? ` · ${i.area}` : ''} · floated {fmt(i.created_at)}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ── Parked · revisit pipeline (no idea dies) ── */}
      <h2 style={{ fontSize: '1rem', margin: '2rem 0 0.75rem' }}>
        ⏳ Parked <span style={{ fontSize: '0.875rem', fontWeight: 400, opacity: 0.6 }}>({parked.length})</span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 400, opacity: 0.6, marginLeft: '0.5rem' }}>resurfaces on its revisit date</span>
      </h2>
      {parked.length === 0 ? (
        <EmptyState title="Nothing parked" description="Good-but-not-now ideas get a revisit date and land here so they never get lost." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {parked.map((i) => {
            const due = i.revisit_on != null && i.revisit_on <= today
            return (
              <Card key={i.id}>
                <CardBody padding="0.75rem 1rem">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '0.9rem' }}>{i.idea}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.15rem' }}>
                        {ownerName(i.employee_slug)}{i.area ? ` · ${i.area}` : ''}
                        {i.decided_note ? ` · ${i.decided_note}` : ''}
                      </div>
                    </div>
                    {due ? (
                      <Pill bg="#fdecea" fg="#b3261e">Due to revisit</Pill>
                    ) : i.revisit_on ? (
                      <span style={{ fontSize: '0.75rem', opacity: 0.6, whiteSpace: 'nowrap' }}>Revisit {fmt(i.revisit_on)}</span>
                    ) : null}
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Shipped ── */}
      {shipped.length > 0 && (
        <>
          <h2 style={{ fontSize: '1rem', margin: '2rem 0 0.75rem' }}>
            ✅ Shipped <span style={{ fontSize: '0.875rem', fontWeight: 400, opacity: 0.6 }}>({shipped.length})</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {shipped.map((t) => (
              <Card key={t.id}>
                <CardBody padding="0.625rem 1rem">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ minWidth: 0, flex: 1, fontSize: '0.875rem', opacity: 0.85 }}>
                      {t.link ? <Link href={t.link}>{t.title}</Link> : t.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.55, whiteSpace: 'nowrap' }}>{fmt(t.done_at ?? t.updated_at)}</span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
