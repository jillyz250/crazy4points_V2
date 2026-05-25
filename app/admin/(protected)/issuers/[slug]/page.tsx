/**
 * /admin/issuers/[slug] — per-issuer editor.
 *
 * Edits the simple text fields on an `issuers` row (name, intro,
 * website_url, logo_url, notes). The heavier "what cards does this
 * issuer offer" view is auto-derived in Phase 2 on the public
 * /issuers/[slug] page — no per-card maintenance here.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import IssuerEditorForm from './IssuerEditorForm'

export const dynamic = 'force-dynamic'

export default async function AdminIssuerEditorPage(props: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await props.params
  const supabase = createAdminClient()
  const { data: issuer } = await supabase
    .from('issuers')
    .select('slug, name, intro, website_url, logo_url, notes, last_verified, updated_at')
    .eq('slug', slug)
    .maybeSingle()

  if (!issuer) notFound()

  // Surface card count for editorial context — "Amex issues 24 cards" etc.
  const { count: cardCount } = await supabase
    .from('credit_cards')
    .select('id', { count: 'exact', head: true })
    .eq('issuer_id', (await supabase.from('issuers').select('id').eq('slug', slug).single()).data?.id ?? '')

  return (
    <div>
      <PageHeader
        title={`Edit issuer: ${issuer.name}`}
        description={
          `Slug: ${issuer.slug} · ${cardCount ?? 0} cards in this issuer's lineup. ` +
          'Edit brand-level content; per-card content is managed under /admin/cards.'
        }
      />

      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/issuers" style={{ color: 'var(--color-primary)', fontSize: '0.875rem' }}>
          ← Back to issuers
        </Link>
      </div>

      <IssuerEditorForm
        slug={issuer.slug}
        initial={{
          name: issuer.name ?? '',
          intro: issuer.intro ?? '',
          website_url: issuer.website_url ?? '',
          logo_url: issuer.logo_url ?? '',
          notes: issuer.notes ?? '',
        }}
      />
    </div>
  )
}
