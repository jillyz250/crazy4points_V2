import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import NewTopicForm from '@/components/admin/topics/NewTopicForm'
import type { MultiSelectOption } from '@/components/admin/topics/MultiSelectChecklist'

export const dynamic = 'force-dynamic'

export default async function NewTopicPage() {
  const supabase = createAdminClient()

  const [{ data: programs }, { data: cards }] = await Promise.all([
    supabase
      .from('programs')
      .select('slug, name, type')
      .order('name', { ascending: true }),
    supabase
      .from('credit_cards')
      .select('slug, name')
      .order('name', { ascending: true }),
  ])

  const programOptions: MultiSelectOption[] = (programs ?? []).map(
    (p: { slug: string; name: string; type: string | null }) => ({
      slug: p.slug,
      name: p.name,
      group: p.type,
    }),
  )
  const cardOptions: MultiSelectOption[] = (cards ?? []).map(
    (c: { slug: string; name: string }) => ({
      slug: c.slug,
      name: c.name,
    }),
  )

  return (
    <div>
      <PageHeader
        title="New topic"
        description="Create a verified editorial topic. After creation you'll extract its fact ledger and run anti-fabrication checks."
        actions={
          <Link href="/admin/topics" className="rg-btn-secondary">
            Cancel
          </Link>
        }
      />
      <NewTopicForm programs={programOptions} cards={cardOptions} />
    </div>
  )
}
