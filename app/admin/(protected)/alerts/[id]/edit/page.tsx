import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { getAlertById, getPrograms, getAlertPrograms } from '@/utils/supabase/queries'
import { checkAlertGates } from '@/utils/alerts/publishGates'
import { getAlertOverrides } from '@/utils/supabase/alertOverrides'
import { findVariantByAlertId } from '@/utils/content/writeAlertVariant'
import { archiveVariantAction } from '@/app/admin/(protected)/drafts/actions'
import SocialVariantsButton from '@/components/admin/SocialVariantsButton'
import ConfirmButton from '@/components/admin/ConfirmButton'
import EditAlertForm from './EditAlertForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditAlertPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()

  const [alertWithPrograms, programs, taggedProgramIds] = await Promise.all([
    getAlertById(supabase, id).catch(() => null),
    getPrograms(supabase),
    getAlertPrograms(supabase, id),
  ])

  if (!alertWithPrograms) notFound()

  const [gates, overrides, refs] = await Promise.all([
    checkAlertGates(supabase, alertWithPrograms),
    getAlertOverrides(supabase, id),
    findVariantByAlertId(supabase, id),
  ])

  // editorial_value_add is canonical in the content_variant metadata; the
  // `alerts` mirror never projects it (stays null), so getAlertById returns
  // null and the QC box renders "no value-add" even when the writer reported
  // items. Read it from the variant so the box reflects reality.
  if (refs?.variant_id) {
    const { data: variantRow } = await supabase
      .from('content_variants')
      .select('metadata')
      .eq('id', refs.variant_id)
      .maybeSingle()
    const eva = (variantRow?.metadata as { editorial_value_add?: unknown } | null)?.editorial_value_add
    if (eva !== undefined) {
      ;(alertWithPrograms as { editorial_value_add?: unknown }).editorial_value_add = eva
    }
  }

  // Phase 4.5 — check if social variants already exist for this topic so the
  // button can read "Regenerate" instead of "Generate" when appropriate.
  let hasExistingSocials = false
  if (refs?.topic_id) {
    const { count } = await supabase
      .from('content_variants')
      .select('*', { count: 'exact', head: true })
      .eq('topic_id', refs.topic_id)
      .in('format', ['facebook', 'instagram', 'linkedin', 'x'])
    hasExistingSocials = (count ?? 0) > 0
  }

  const secondaryOnly = taggedProgramIds.filter((id) => id !== alertWithPrograms.primary_program_id)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <h1 style={{ margin: 0 }}>Edit Alert</h1>
        {/* Archive (soft-delete) is always available on the alert edit page —
            cleanest exit for test-writes, abandoned drafts, etc. Uses the
            same archive action the Drafts hub row uses. */}
        {refs?.variant_id && (
          <ConfirmButton
            action={archiveVariantAction.bind(null, refs.variant_id) as unknown as () => Promise<unknown>}
            confirmMessage={`Archive this alert?\n\nUseful for test writes you're not going to publish. Row drops out of the active queue; data stays in the DB for audit. Find it via the Archived chip in Drafts if you need it back.`}
            variant="danger"
          >
            Archive draft
          </ConfirmButton>
        )}
      </div>

      {/* Phase 4.5 — Social variants control bar lives at the top so it's
          the first thing visible after publish (when the action becomes
          available) instead of scrolled past below the form. */}
      {refs?.topic_id && (
        <div
          style={{
            marginBottom: '1.75rem',
            maxWidth: '640px',
            padding: '1rem 1.125rem',
            background: 'var(--admin-surface)',
            border: '1px solid var(--admin-border)',
            borderRadius: 'var(--radius-card, 12px)',
            boxShadow: 'var(--admin-shadow, none)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Social variants</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-subtle)' }}>~$0.01/platform · ~$0.05 for all 4</span>
          </div>
          <SocialVariantsButton
            topicId={refs.topic_id}
            isPublished={alertWithPrograms.status === 'published'}
            hasExistingSocials={hasExistingSocials}
          />
        </div>
      )}

      <EditAlertForm
        alert={alertWithPrograms}
        programs={programs}
        taggedProgramIds={secondaryOnly}
        gates={gates}
        overrides={overrides}
      />
    </div>
  )
}
