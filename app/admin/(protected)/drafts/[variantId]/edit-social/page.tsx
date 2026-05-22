import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import EditSocialVariantForm from '@/components/admin/EditSocialVariantForm'

const SOCIAL_FORMATS = new Set(['facebook', 'instagram', 'linkedin', 'x'])

export default async function EditSocialVariantPage({
  params,
}: {
  params: Promise<{ variantId: string }>
}) {
  const { variantId } = await params
  const supabase = createAdminClient()

  const { data: variant } = await supabase
    .from('content_variants')
    .select('id, format, body, status, metadata, generation_group_id, topic_id, topics:topics!inner(id, slug, title)')
    .eq('id', variantId)
    .maybeSingle()

  if (!variant) notFound()
  if (!SOCIAL_FORMATS.has(variant.format as string)) {
    return (
      <div>
        <h1>Wrong editor</h1>
        <p>
          This variant&apos;s format is <strong>{variant.format}</strong>, not a social platform.
          Use the alert editor instead.
        </p>
        <Link href={`/admin/drafts`}>← back to drafts</Link>
      </div>
    )
  }

  const topic = Array.isArray(variant.topics) ? variant.topics[0] : variant.topics
  const metadata = (variant.metadata as Record<string, unknown> | null) ?? {}
  const hashtags = Array.isArray(metadata.hashtags) ? (metadata.hashtags as string[]).filter(t => typeof t === 'string') : []

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          href="/admin/drafts"
          style={{ fontSize: '0.8125rem', color: 'var(--admin-text-muted)', textDecoration: 'none' }}
        >
          ← back to drafts
        </Link>
        <h1 style={{ marginTop: '0.5rem', marginBottom: '0.25rem' }}>
          Social variant — {topic?.title ?? 'untitled'}
        </h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', margin: 0 }}>
          Topic: <code>{topic?.slug ?? '—'}</code>
        </p>
      </div>

      <EditSocialVariantForm
        variantId={variant.id as string}
        format={variant.format as string}
        initialBody={(variant.body as string | null) ?? ''}
        hashtags={hashtags}
        generationGroupId={(variant.generation_group_id as string | null) ?? null}
        status={variant.status as string}
      />
    </div>
  )
}
