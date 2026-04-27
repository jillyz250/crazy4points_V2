import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createAdminClient } from '@/utils/supabase/server'
import { getPropertiesForProgram } from '@/utils/supabase/queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import PropertiesAdmin from './PropertiesAdmin'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: `${slug} properties — Admin` }
}

export default async function ProgramPropertiesPage({ params }: Props) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: program } = await supabase
    .from('programs')
    .select('id, slug, name, type')
    .eq('slug', slug)
    .maybeSingle()

  if (!program) notFound()

  const properties = await getPropertiesForProgram(supabase, program.id)

  return (
    <div>
      <PageHeader
        title={`${program.name} — properties`}
        description={
          program.type === 'hotel'
            ? `Per-property facts (category, points, brand, region). Used by the public sortable list and as authoritative reference data for the writer + fact-checker.`
            : `Per-property data is intended for hotel programs. This page works for non-hotel programs too, but it's most useful for hotels.`
        }
        actions={
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              href={`/admin/programs/${program.slug}/edit`}
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              ← Back to program
            </Link>
            <Link
              href={`/programs/${program.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-ghost admin-btn-sm"
            >
              View public page ↗
            </Link>
          </div>
        }
      />

      <PropertiesAdmin
        programId={program.id}
        programSlug={program.slug}
        initialProperties={properties}
      />
    </div>
  )
}
