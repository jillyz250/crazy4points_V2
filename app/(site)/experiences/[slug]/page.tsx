import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { renderProseMarkdown } from '@/lib/blog/sanitize'
import { createAdminClient } from '@/utils/supabase/server'
import { getExperienceBySlug } from '@/utils/supabase/queries'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()
  const exp = await getExperienceBySlug(supabase, slug)
  if (!exp) return { title: 'Experience not found | Crazy4Points' }
  return {
    title: `${exp.name} — Experiences | Crazy4Points`,
    description: exp.intro ?? `${exp.name}: how to use ${exp.currency} for experiences.`,
  }
}

const MODE_LABEL: Record<string, string> = {
  redeem: 'Redeem points for experiences',
  access: 'Cardholder access & presales',
  both: 'Redeem points + cardholder access',
}

async function md(text: string | null): Promise<string | null> {
  if (!text) return null
  return renderProseMarkdown(text)
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
function fmtDate(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  return `${MONTHS[parseInt(m[2], 10) - 1]} ${parseInt(m[3], 10)}, ${m[1]}`
}

function Section({ title, html }: { title: string; html: string | null }) {
  if (!html) return null
  return (
    <section className="rg-sub-section border-t border-[var(--color-border-soft)]">
      <h2 className="mb-3 font-display text-2xl text-[var(--color-primary)]">{title}</h2>
      <div className="rg-prose font-body text-[var(--color-text-primary)]" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  )
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createAdminClient()
  const exp = await getExperienceBySlug(supabase, slug)
  if (!exp) notFound()

  const isRedeem = exp.mode === 'redeem' || exp.mode === 'both'
  const [introHtml, whatHtml, howHtml, accessHtml, standoutHtml, gtkHtml, valueHtml] = await Promise.all([
    md(exp.intro),
    md(exp.what_you_get),
    md(exp.how_it_works),
    md(exp.how_to_access),
    md(exp.standout_examples),
    md(exp.good_to_know),
    md(exp.value_take),
  ])

  return (
    <main className="rg-container rg-major-section max-w-3xl">
      <nav className="mb-6 font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
        <Link href="/experiences" className="hover:text-[var(--color-primary)]">Experiences</Link>
        <span className="mx-2">/</span>
        <span>{exp.parent_program_label}</span>
      </nav>

      <header className="mb-8">
        <h1 className="mb-3 font-display text-4xl text-[var(--color-primary)] md:text-5xl">{exp.name}</h1>
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--color-primary)] px-3 py-1 font-ui text-[11px] font-medium uppercase tracking-wide text-white">
            {MODE_LABEL[exp.mode]}
          </span>
          {exp.entry_point_label && (
            <span className="rounded-full bg-[var(--color-background-soft)] px-3 py-1 font-ui text-[11px] text-[var(--color-text-secondary)]">
              {exp.entry_point_label}
            </span>
          )}
          <span className="rounded-full bg-[var(--color-background-soft)] px-3 py-1 font-ui text-[11px] text-[var(--color-text-secondary)]">
            {exp.region}
          </span>
        </div>
        {introHtml && (
          <div className="rg-prose font-body text-lg text-[var(--color-text-primary)]" dangerouslySetInnerHTML={{ __html: introHtml }} />
        )}
        {exp.official_url && (
          <a
            href={exp.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="rg-btn-primary mt-5 inline-flex"
          >
            Visit {exp.name}
          </a>
        )}
      </header>

      {/* Recently featured — a real snapshot of current storefront inventory,
          honestly dated. Only some programs expose this publicly. */}
      {exp.recent_highlights.length > 0 && (
        <section className="rg-sub-section border-t border-[var(--color-border-soft)]">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl text-[var(--color-primary)]">Current experiences</h2>
            {exp.highlights_updated_at && (
              <span className="font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
                as of {fmtDate(exp.highlights_updated_at)}
              </span>
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {exp.recent_highlights.map((h, i) => (
              <li
                key={i}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-4 py-2.5"
              >
                <span className="font-body text-[var(--color-text-primary)]">{h.title}</span>
                {h.detail && (
                  <span className="font-ui text-sm font-medium text-[var(--color-primary)]">{h.detail}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 font-body text-sm text-[var(--color-text-secondary)]">
            This is what we found as of the date above, checked daily. Inventory changes constantly, so confirm what&apos;s bookable and current on {exp.official_url ? 'the official site' : 'the program'} before you plan.
          </p>
        </section>
      )}

      <Section title={isRedeem ? 'What you can redeem for' : 'What access you get'} html={whatHtml} />
      <Section title="How it works" html={howHtml} />
      <Section title="Who's eligible & how to access" html={accessHtml} />
      <Section title="Standout examples" html={standoutHtml} />
      <Section title="Good to know" html={gtkHtml} />
      <Section title="Our take" html={valueHtml} />

      {/* Cross-link to the parent program reference page (when we have one). */}
      {exp.parent_program_slug && (
        <section className="rg-sub-section border-t border-[var(--color-border-soft)]">
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-5">
            <p className="mb-2 font-ui text-xs uppercase tracking-wide text-[var(--color-text-secondary)]">
              Part of {exp.parent_program_label}
            </p>
            <Link
              href={`/programs/${exp.parent_program_slug}`}
              className="font-display text-lg text-[var(--color-primary)] hover:underline"
            >
              See the full {exp.parent_program_label} guide →
            </Link>
          </div>
        </section>
      )}
    </main>
  )
}
