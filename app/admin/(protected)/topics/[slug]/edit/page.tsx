import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { getTopicBySlug } from '@/utils/supabase/queries'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Badge } from '@/components/admin/ui/Badge'
import TopicEditor from '@/components/admin/topics/TopicEditor'
import type { MultiSelectOption } from '@/components/admin/topics/MultiSelectChecklist'

export const dynamic = 'force-dynamic'

export default async function EditTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = createAdminClient()
  const topic = await getTopicBySlug(supabase, slug)
  if (!topic) notFound()

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

  const factCheckTone: 'success' | 'warning' | 'danger' | 'neutral' =
    topic.fact_check_status === 'verified'
      ? 'success'
      : topic.fact_check_status === 'partially_verified'
      ? 'warning'
      : topic.fact_check_status === 'failed'
      ? 'danger'
      : 'neutral'

  return (
    <div>
      <PageHeader
        title={topic.title}
        description={
          <span>
            Slug <code>{topic.slug}</code> · <Badge tone="neutral">{topic.status}</Badge>{' '}
            <Badge tone={factCheckTone}>{topic.fact_check_status}</Badge>
            {topic.verified_at && (
              <span style={{ marginLeft: '0.5rem', color: 'var(--color-text-secondary)' }}>
                verified {new Date(topic.verified_at).toISOString().slice(0, 10)}{' '}
                {topic.verified_by && `by ${topic.verified_by}`}
              </span>
            )}
          </span>
        }
        actions={
          <Link href="/admin/topics" className="rg-btn-secondary">
            Back
          </Link>
        }
      />
      <TopicEditor topic={topic} programOptions={programOptions} cardOptions={cardOptions} />
    </div>
  )
}
