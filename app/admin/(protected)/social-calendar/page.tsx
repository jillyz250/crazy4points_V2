import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { promoteSlot, skipSlot, setStatus, addManualPost, saveDraft, moveSlot, deleteSlot } from './actions'

export const dynamic = 'force-dynamic'

type Row = {
  id: string
  post_date: string
  platform: 'facebook' | 'instagram' | 'tiktok'
  topic: string
  source_type: string
  source_ref: string | null
  status: 'suggested' | 'planned' | 'drafted' | 'posted' | 'skipped'
  draft_body: string | null
  link_url: string | null
  notes: string | null
  posted_at: string | null
}

const PLATFORM_COLOR: Record<string, string> = { facebook: '#1877F2', instagram: '#C13584', tiktok: '#111111' }
const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  suggested: { bg: '#F1EAF8', fg: '#6B2D8F', label: 'Recommended' },
  planned: { bg: '#EAE0F5', fg: '#5A237A', label: 'Planned' },
  drafted: { bg: '#FBF1D9', fg: '#8A6D1B', label: 'Drafted' },
  posted: { bg: '#E4F5EA', fg: '#1E7A47', label: 'Posted' },
  skipped: { bg: '#EEEEEE', fg: '#888888', label: 'Skipped' },
}

function ymd(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}
function monthLabel(y: number, m: number) {
  return new Date(Date.UTC(y, m, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export default async function SocialCalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await assertAdmin()
  const db = createAdminClient()
  const sp = await searchParams

  const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const [ty, tm] = todayET.split('-').map(Number)
  const m = /^\d{4}-\d{2}$/.test(sp.m ?? '') ? sp.m! : `${ty}-${String(tm).padStart(2, '0')}`
  const [year, month] = m.split('-').map(Number) // month is 1-based
  const first = new Date(Date.UTC(year, month - 1, 1))
  const last = new Date(Date.UTC(year, month, 0))
  const prevM = `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, '0')}`
  const nextM = `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}`

  // Definite posts for this month (calendar), + all upcoming suggested (rail).
  const { data: monthRows } = await db
    .from('social_calendar')
    .select('*')
    .gte('post_date', ymd(first))
    .lte('post_date', ymd(last))
    .neq('status', 'suggested')
    .neq('status', 'skipped')
    .order('post_date')
  const { data: suggested } = await db
    .from('social_calendar')
    .select('*')
    .eq('status', 'suggested')
    .gte('post_date', todayET)
    .order('post_date')
  // Mix at a glance: posted + planned in the last/next 30 days by source_type.
  const since = new Date(Date.UTC(ty, tm - 1, 1))
  since.setUTCDate(since.getUTCDate() - 30)
  const { data: mixRows } = await db
    .from('social_calendar')
    .select('source_type,status')
    .in('status', ['posted', 'drafted', 'planned'])
    .gte('post_date', ymd(since))
  const mix = new Map<string, number>()
  for (const r of mixRows ?? []) mix.set(r.source_type, (mix.get(r.source_type) ?? 0) + 1)

  const posts = (monthRows ?? []) as Row[]
  const byDay = new Map<string, Row[]>()
  for (const p of posts) byDay.set(p.post_date, [...(byDay.get(p.post_date) ?? []), p])

  // Month grid: leading blanks + days.
  const startDow = first.getUTCDay()
  const cells: (string | null)[] = [...Array(startDow).fill(null), ...Array(last.getUTCDate()).fill(0).map((_, i) => ymd(new Date(Date.UTC(year, month - 1, i + 1))))]

  const chip = (p: Row) => {
    const s = STATUS_STYLE[p.status]
    return (
      <div key={p.id} title={`${p.platform} · ${s.label}`} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginTop: 3 }}>
        <span style={{ width: 7, height: 7, borderRadius: 99, background: PLATFORM_COLOR[p.platform], flex: '0 0 auto' }} />
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: s.fg }}>{p.topic}</span>
      </div>
    )
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1.75rem', margin: 0 }}>Social Calendar</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a href={`?m=${prevM}`} className="rg-btn-secondary" style={{ padding: '.35rem .7rem' }}>&larr;</a>
          <strong style={{ minWidth: 150, textAlign: 'center' }}>{monthLabel(year, month - 1)}</strong>
          <a href={`?m=${nextM}`} className="rg-btn-secondary" style={{ padding: '.35rem .7rem' }}>&rarr;</a>
        </div>
      </div>

      {/* Mix at a glance */}
      <div style={{ margin: '.75rem 0 1.25rem', fontSize: 13, color: 'var(--color-text-secondary)' }}>
        <strong style={{ color: 'var(--color-text-primary)' }}>Recent mix (30d):</strong>{' '}
        {mix.size === 0 ? 'nothing scheduled yet' : [...mix.entries()].map(([t, n]) => `${n} ${t}`).join(' · ')}
        {' '}<span style={{ opacity: 0.7 }}>(keep it varied, do not lean on one type)</span>
      </div>

      <div className="grid items-start gap-5 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* CALENDAR (definite) */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d} style={{ textAlign: 'center' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
            {cells.map((date, i) => (
              <div key={i} style={{ minHeight: 74, border: '1px solid var(--color-border-soft)', borderRadius: 6, padding: 4, background: date === todayET ? '#FBF7FF' : date ? '#fff' : 'transparent' }}>
                {date && <div style={{ fontSize: 10, color: date === todayET ? 'var(--color-primary)' : '#999', fontWeight: date === todayET ? 700 : 400 }}>{Number(date.slice(-2))}</div>}
                {date && (byDay.get(date) ?? []).map(chip)}
              </div>
            ))}
          </div>

          {/* This month's posts — where you act */}
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1.15rem', marginTop: '1.5rem' }}>This month&rsquo;s posts</h2>
          {posts.length === 0 && <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>Nothing scheduled yet. Slide a recommendation over, or add one below.</p>}
          {posts.map((p) => {
            const s = STATUS_STYLE[p.status]
            return (
              <div key={p.id} style={{ border: '1px solid var(--color-border-soft)', borderRadius: 8, padding: '.6rem .8rem', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ width: 9, height: 9, borderRadius: 99, background: PLATFORM_COLOR[p.platform] }} title={p.platform} />
                  <strong style={{ fontSize: 14 }}>{p.post_date}</strong>
                  <span style={{ fontSize: 12, textTransform: 'capitalize', color: 'var(--color-text-secondary)' }}>{p.platform}</span>
                  <span style={{ fontSize: 11, background: s.bg, color: s.fg, padding: '1px 8px', borderRadius: 99, fontWeight: 700 }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: '#999' }}>{p.source_type}</span>
                  <span style={{ flex: 1 }} />
                  <form action={deleteSlot}><input type="hidden" name="id" value={p.id} /><button style={{ border: 'none', background: 'none', color: '#c00', cursor: 'pointer', fontSize: 12 }}>delete</button></form>
                </div>
                <div style={{ fontSize: 14, margin: '.35rem 0', fontWeight: 600 }}>{p.topic}</div>
                {p.notes && <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{p.notes}</div>}
                <form action={saveDraft}>
                  <input type="hidden" name="id" value={p.id} />
                  <textarea name="draft_body" defaultValue={p.draft_body ?? ''} placeholder="Draft copy (or ask Claude to draft it, then paste)" rows={2} style={{ width: '100%', fontSize: 13, padding: 6, borderRadius: 6, border: '1px solid var(--color-border-soft)', fontFamily: 'var(--font-body)' }} />
                  <button className="rg-btn-secondary" style={{ padding: '.25rem .6rem', fontSize: 12, marginTop: 4 }}>Save draft</button>
                </form>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {(['planned', 'drafted', 'posted'] as const).map((st) => (
                    <form key={st} action={setStatus}>
                      <input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value={st} />
                      <button className="rg-btn-secondary" style={{ padding: '.2rem .55rem', fontSize: 11, opacity: p.status === st ? 1 : 0.6 }}>{st === 'posted' ? 'Mark posted' : `Set ${st}`}</button>
                    </form>
                  ))}
                  <form action={moveSlot} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="date" name="post_date" defaultValue={p.post_date} style={{ fontSize: 11, padding: 2 }} />
                    <button className="rg-btn-secondary" style={{ padding: '.2rem .55rem', fontSize: 11 }}>Move</button>
                  </form>
                </div>
              </div>
            )
          })}

          {/* Add manual post */}
          <details style={{ marginTop: 12 }}>
            <summary style={{ cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 700, fontSize: 14 }}>+ Add a post</summary>
            <form action={addManualPost} style={{ display: 'grid', gap: 6, marginTop: 8, maxWidth: 420 }}>
              <input type="date" name="post_date" required style={{ padding: 6, borderRadius: 6, border: '1px solid var(--color-border-soft)' }} />
              <select name="platform" required style={{ padding: 6, borderRadius: 6, border: '1px solid var(--color-border-soft)' }}>
                <option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option>
              </select>
              <input name="topic" placeholder="Topic (e.g., Chase Q4 5% categories)" required style={{ padding: 6, borderRadius: 6, border: '1px solid var(--color-border-soft)', fontSize: 14 }} />
              <input name="link_url" placeholder="Link URL (optional)" style={{ padding: 6, borderRadius: 6, border: '1px solid var(--color-border-soft)', fontSize: 14 }} />
              <button className="rg-btn-primary" style={{ padding: '.4rem .8rem' }}>Add to calendar</button>
            </form>
          </details>
        </div>

        {/* RECOMMENDED rail */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--color-primary)', fontSize: '1.15rem', marginTop: 0 }}>Recommended</h2>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: -6 }}>Auto-suggested from recurring anchors. Slide one over to schedule it.</p>
          {(suggested ?? []).length === 0 && <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Nothing recommended right now.</p>}
          {((suggested ?? []) as Row[]).map((p) => (
            <div key={p.id} style={{ border: '1px dashed var(--color-border-soft)', borderRadius: 8, padding: '.55rem .7rem', marginBottom: 8, background: '#FCFAFE' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: 99, background: PLATFORM_COLOR[p.platform] }} title={p.platform} />
                <strong style={{ fontSize: 13 }}>{p.post_date}</strong>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{p.platform}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, margin: '.25rem 0' }}>{p.topic}</div>
              {p.notes && <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{p.notes}</div>}
              <div style={{ display: 'flex', gap: 6 }}>
                <form action={promoteSlot}><input type="hidden" name="id" value={p.id} /><button className="rg-btn-primary" style={{ padding: '.2rem .6rem', fontSize: 11 }}>Schedule &rarr;</button></form>
                <form action={skipSlot}><input type="hidden" name="id" value={p.id} /><button className="rg-btn-secondary" style={{ padding: '.2rem .6rem', fontSize: 11 }}>Skip</button></form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
