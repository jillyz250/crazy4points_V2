import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getExperiences } from '@/utils/supabase/queries'
import ExperiencesDirectory from '@/components/experiences/ExperiencesDirectory'

// Directory of experience programs; changes only when we add/edit a program.
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Experiences — Redeem Points & Cardholder Access | Crazy4Points',
  description:
    'Every major program that lets you redeem points or miles for experiences, or unlocks cardholder presales and access — concerts, sports, dining, and money-can\'t-buy moments.',
}

export default async function ExperiencesPage() {
  const supabase = createAdminClient()
  const experiences = await getExperiences(supabase)

  return (
    <main className="rg-container rg-major-section">
      <header className="mb-10 max-w-3xl">
        <h1 className="mb-4 font-display text-4xl text-[var(--color-primary)] md:text-5xl">Experiences</h1>
        <p className="font-body text-lg text-[var(--color-text-primary)]">
          Points and miles aren&apos;t just for flights and hotel nights. Loyalty programs and card
          issuers will trade them — or your cardholder status — for concerts, sporting events, chef
          tables, festival access, and genuinely money-can&apos;t-buy moments. Many even let you pay
          with cash instead, your choice.
        </p>
        <p className="mt-3 font-body text-[var(--color-text-secondary)]">
          Here&apos;s every major platform worth knowing, split into <strong>redeem-your-points</strong>{' '}
          programs and <strong>cardholder access &amp; presales</strong>. Filter and sort to find the one
          that fits what you carry.
        </p>
      </header>

      <ExperiencesDirectory experiences={experiences} />
    </main>
  )
}
