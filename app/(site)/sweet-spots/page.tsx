import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import SweetSpotsExplorer from './Explorer'

export const metadata: Metadata = {
  title: 'Points Sweet Spots — The Best Value Redemptions | Crazy4Points',
  description:
    'The redemptions worth your points, program by program: free stopovers, cheap first class, standout business class, aspirational hotels, and lounge value.',
  alternates: { canonical: 'https://www.crazy4points.com/sweet-spots' },
}

export const revalidate = 3600

type Bullet = { title: string; body: string }

// programs.sweet_spots is authored markdown bullets ("- **Title** — description").
function parseBullets(md: string): Bullet[] {
  return md
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => {
      const text = l.replace(/^[-*]\s+/, '')
      const m = text.match(/^\*\*(.+?)\*\*\s*[—–-]?\s*(.*)$/)
      if (m) return { title: m[1].trim(), body: m[2].replace(/\*\*/g, '').trim() }
      return { title: '', body: text.replace(/\*\*/g, '').trim() }
    })
    .filter((b) => b.title || b.body)
}

export default async function SweetSpotsPage() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const [{ data: progs }, { data: bonusAlerts }] = await Promise.all([
    supabase.from('programs').select('slug, name, type, sweet_spots').eq('is_active', true).not('sweet_spots', 'is', null).order('name'),
    supabase
      .from('alerts')
      .select('id')
      .eq('status', 'published')
      .in('type', ['transfer_bonus', 'point_purchase', 'award_sale'])
      .or(`end_date.is.null,end_date.gte.${today}`),
  ])

  const programs = (progs ?? [])
    .map((p) => ({
      slug: p.slug as string,
      name: p.name as string,
      type: (p.type as string) ?? 'other',
      bullets: parseBullets((p.sweet_spots as string) ?? ''),
    }))
    .filter((p) => p.bullets.length > 0)

  // "Hot now" = a live transfer-bonus / buy-points / award-sale alert tags this program.
  const hotSlugs = new Set<string>()
  const alertIds = (bonusAlerts ?? []).map((a) => a.id)
  if (alertIds.length) {
    const { data: aps } = await supabase.from('alert_programs').select('program_id').in('alert_id', alertIds)
    const progIds = [...new Set((aps ?? []).map((a) => a.program_id))]
    if (progIds.length) {
      const { data: hp } = await supabase.from('programs').select('slug').in('id', progIds)
      for (const p of hp ?? []) hotSlugs.add(p.slug as string)
    }
  }

  return (
    <div className="rg-container px-6 py-12 md:px-8 md:py-16">
      <header className="max-w-2xl">
        <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Sweet spots</p>
        <h1 className="mt-2">The best value for your points</h1>
        <p className="mt-3 font-body text-[1.0625rem] leading-relaxed text-[var(--color-text-secondary)]">
          Not every redemption is worth it. These are the ones that are, program by program: free stopovers, cheap
          first class, standout business, aspirational hotels, and lounge value. A{' '}
          <span className="font-semibold text-[var(--color-primary)]">Hot now</span> tag means a live bonus makes this
          program's points even more valuable this week.
        </p>
      </header>

      <SweetSpotsExplorer programs={programs} hotSlugs={[...hotSlugs]} />

      <p className="mt-12 max-w-3xl font-body text-xs leading-relaxed text-[var(--color-text-secondary)] opacity-80">
        Sweet spots are drawn from our program pages and verified against the airline or hotel program. Award pricing
        changes often and premium-cabin space is limited, so confirm the current cost and availability with the program
        before you transfer points.
      </p>
    </div>
  )
}
