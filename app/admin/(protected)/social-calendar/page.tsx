import { assertAdmin } from '@/lib/auth/admin'
import { createAdminClient } from '@/utils/supabase/server'
import { addManualPost } from './actions'
import SocialCalendarBoard, { type Row } from './SocialCalendarBoard'
import { CATEGORY_LABEL } from '@/lib/socialCategories'

export const dynamic = 'force-dynamic'

function monthLabel(y: number, m0: number) {
  return new Date(Date.UTC(y, m0, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}
function ymd(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

export default async function SocialCalendarPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  await assertAdmin()
  const db = createAdminClient()
  const sp = await searchParams

  const todayET = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const [ty, tm] = todayET.split('-').map(Number)
  const m = /^\d{4}-\d{2}$/.test(sp.m ?? '') ? sp.m! : `${ty}-${String(tm).padStart(2, '0')}`
  const [year, month] = m.split('-').map(Number)
  const first = new Date(Date.UTC(year, month - 1, 1))
  const last = new Date(Date.UTC(year, month, 0))
  const prevM = `${month === 1 ? year - 1 : year}-${String(month === 1 ? 12 : month - 1).padStart(2, '0')}`
  const nextM = `${month === 12 ? year + 1 : year}-${String(month === 12 ? 1 : month + 1).padStart(2, '0')}`

  const { data: scheduled } = await db.from('social_calendar').select('*')
    .gte('post_date', ymd(first)).lte('post_date', ymd(last))
    .in('status', ['planned', 'drafted', 'posted']).order('post_date')
  const { data: triage } = await db.from('social_calendar').select('*')
    .eq('status', 'suggested').gte('post_date', todayET).order('post_date')

  // Mix at a glance (last 30d + this month), by category.
  const since = new Date(Date.UTC(ty, tm - 1, 1)); since.setUTCDate(since.getUTCDate() - 30)
  const { data: mixRows } = await db.from('social_calendar').select('category,status')
    .in('status', ['posted', 'drafted', 'planned']).gte('post_date', ymd(since))
  const mix = new Map<string, number>()
  for (const r of mixRows ?? []) mix.set(r.category, (mix.get(r.category) ?? 0) + 1)

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

      <div style={{ margin: '.75rem 0 1rem', fontSize: 13, color: 'var(--color-text-secondary)' }}>
        <strong style={{ color: 'var(--color-text-primary)' }}>Recent mix (30d):</strong>{' '}
        {mix.size === 0 ? 'nothing scheduled yet' : [...mix.entries()].map(([c, n]) => `${n} ${CATEGORY_LABEL[c] ?? c}`).join(' · ')}
        {' '}<span style={{ opacity: 0.7 }}>(vary the types, aim for one post per platform per day)</span>
      </div>

      <SocialCalendarBoard
        year={year}
        month={month}
        todayISO={todayET}
        scheduled={(scheduled ?? []) as Row[]}
        triage={(triage ?? []) as Row[]}
      />

      <details style={{ marginTop: 16, maxWidth: 440 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 700, fontSize: 14 }}>+ Add a post manually</summary>
        <form action={addManualPost} style={{ display: 'grid', gap: 6, marginTop: 8 }}>
          <input type="date" name="post_date" required style={{ padding: 6, borderRadius: 6, border: '1px solid var(--color-border-soft)' }} />
          <select name="platform" required style={{ padding: 6, borderRadius: 6, border: '1px solid var(--color-border-soft)' }}>
            <option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option>
          </select>
          <input name="topic" placeholder="Topic (e.g., Amex to ANA sweet spot)" required style={{ padding: 6, borderRadius: 6, border: '1px solid var(--color-border-soft)', fontSize: 14 }} />
          <input name="link_url" placeholder="Link URL (optional)" style={{ padding: 6, borderRadius: 6, border: '1px solid var(--color-border-soft)', fontSize: 14 }} />
          <button className="rg-btn-primary" style={{ padding: '.4rem .8rem' }}>Add to calendar</button>
        </form>
      </details>
    </div>
  )
}
