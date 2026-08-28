import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import LandingSignup from '@/components/landing/LandingSignup'

// Ad landing pages must not be indexed (thin, paid-traffic-only, and they'd
// compete with the real content pages for the same terms).
export const metadata: Metadata = { robots: { index: false, follow: false } }
export const revalidate = 300

interface Landing {
  slug: string
  eyebrow: string | null
  headline: string
  subhead: string | null
  body_md: string | null
  image_url: string | null
  deadline: string | null
  deadline_label: string | null
  outbound_url: string
  outbound_label: string
  utm_campaign: string | null
}

async function getLanding(slug: string): Promise<Landing | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('campaign_landings')
    .select('slug, eyebrow, headline, subhead, body_md, image_url, deadline, deadline_label, outbound_url, outbound_label, utm_campaign')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle()
  return (data as Landing) ?? null
}

function daysLeft(deadline: string | null): number | null {
  if (!deadline) return null
  const ms = Date.parse(deadline) - Date.now()
  if (Number.isNaN(ms)) return null
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const l = await getLanding(slug)
  if (!l) notFound()

  const left = daysLeft(l.deadline)
  const includes = (l.body_md ?? '')
    .split('\n')
    .map((s) => s.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean)

  return (
    <main className="rg-major-section">
      <div className="rg-container" style={{ maxWidth: '52rem' }}>
        {l.eyebrow && (
          <p className="font-ui text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-accent)]">
            {l.eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          {l.headline}
        </h1>
        {l.subhead && (
          <p className="mt-3 font-body text-lg text-[var(--color-text-secondary)]">{l.subhead}</p>
        )}

        {(l.deadline_label || left !== null) && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-4 py-2 font-ui text-sm font-bold text-[#1A1A1A]">
            {l.deadline_label || 'Ends soon'}
            {left !== null && left <= 30 && (
              <span className="font-normal">· {left} {left === 1 ? 'day' : 'days'} left</span>
            )}
          </div>
        )}

        {l.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={l.image_url}
            alt=""
            className="mt-6 w-full rounded-[var(--radius-card)] border border-[var(--color-border-soft)] object-cover"
            style={{ maxHeight: 360 }}
          />
        )}

        {includes.length > 0 && (
          <div className="mt-6 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-5">
            <p className="font-ui text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">
              What&rsquo;s included
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5">
              {includes.map((line, i) => (
                <li key={i} className="font-body text-[var(--color-text-primary)]">{line}</li>
              ))}
            </ul>
          </div>
        )}

        {/* PRIMARY action: go bid on the real offer. This is what the visitor
            came for (the ad promised it), so it leads — big and obvious. */}
        <div className="mt-7 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-5 text-center">
          <p className="font-body text-[var(--color-text-primary)]">
            You bid with points on the official page. The highest bid wins, and bidding closes before
            the event.
          </p>
          <a
            href={l.outbound_url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rg-tap-target mt-4 inline-block rounded-[var(--radius-ui)] bg-[var(--color-accent)] px-8 py-4 font-ui text-base font-bold uppercase tracking-[0.08em] text-[#1A1A1A] transition-opacity hover:opacity-90"
          >
            {l.outbound_label} ↗
          </a>
        </div>

        {/* SECONDARY conversion: the newsletter capture. */}
        <aside className="my-8 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-primary)] px-6 py-7 sm:px-8">
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] !text-[var(--color-accent)]">
            Not ready to bid?
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold !text-white">
            Get deals like this in your inbox
          </h2>
          <p className="mt-2 max-w-xl font-body !text-white/85">
            One email with the points moves, award sweet spots, and rare experiences actually worth
            your miles. No spam, unsubscribe anytime.
          </p>
          <div className="mt-5 sm:max-w-lg">
            <LandingSignup campaign={l.utm_campaign || l.slug} />
          </div>
        </aside>

        <p className="mt-3 font-body text-sm text-[var(--color-text-secondary)]">
          crazy4points is not affiliated with the brands featured. Always confirm the current terms
          on the official page before you redeem.
        </p>
      </div>
    </main>
  )
}
