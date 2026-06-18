import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
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
  return marked.parse(text, { async: true })
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
