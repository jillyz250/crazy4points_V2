import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import ProgramPageContentEditor from '../../ProgramPageContentEditor'
import { PageHeader } from '@/components/admin/ui/PageHeader'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: `Edit ${slug} — Admin` }
}

export default async function ProgramEditPage({ params }: Props) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: program } = await supabase
    .from('programs')
    .select('id, slug, name, type, intro, transfer_partners, sweet_spots, quirks, how_to_spend, tier_benefits, lounge_access, alliance, hubs, content_updated_at')
    .eq('slug', slug)
    .maybeSingle()

  if (!program) notFound()

  return (
    <div>
      <PageHeader
        title={program.name}
        description={`Editing program-page content for ${program.slug}. The writer + fact-check pipelines treat this as authoritative source material.`}
        actions={
          <Link href="/admin/programs" className="admin-btn admin-btn-ghost admin-btn-sm">
            ← All programs
          </Link>
        }
      />

      <div
        style={{
          background: 'var(--admin-surface)',
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--admin-radius-lg, 0.75rem)',
          padding: '1.5rem',
        }}
      >
        <ProgramPageContentEditor
          programId={program.id}
          programName={program.name}
          programType={program.type}
          initialIntro={program.intro}
          initialTransferPartners={program.transfer_partners}
          initialSweetSpots={program.sweet_spots}
          initialQuirks={program.quirks}
          initialHowToSpend={program.how_to_spend}
          initialTierBenefits={program.tier_benefits}
          initialLoungeAccess={program.lounge_access}
          initialAlliance={program.alliance}
          initialHubs={program.hubs}
          initialUpdatedAt={program.content_updated_at}
          alwaysOpen
        />
      </div>
    </div>
  )
}
