import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { getAlertById, getPrograms, getAlertPrograms } from '@/utils/supabase/queries'
import { checkAlertGates } from '@/utils/alerts/publishGates'
import { getAlertOverrides } from '@/utils/supabase/alertOverrides'
import { findVariantByAlertId } from '@/utils/content/writeAlertVariant'
import SocialVariantsButton from '@/components/admin/SocialVariantsButton'
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
      <h1 style={{ marginBottom: '2rem' }}>Edit Alert</h1>
      <EditAlertForm
        alert={alertWithPrograms}
        programs={programs}
        taggedProgramIds={secondaryOnly}
        gates={gates}
        overrides={overrides}
      />

      {refs?.topic_id && (
        <div style={{ marginTop: '2rem', maxWidth: '640px' }}>
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.125rem' }}>Social variants</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-muted)', marginBottom: '0.75rem' }}>
            Generate ready-to-paste Facebook / Instagram / LinkedIn / X copy from this topic&apos;s
            verified facts. Variants share one narrative spine so the bundle stays coherent.
          </p>
          <SocialVariantsButton
            topicId={refs.topic_id}
            isPublished={alertWithPrograms.status === 'published'}
            hasExistingSocials={hasExistingSocials}
          />
        </div>
      )}
    </div>
  )
}
