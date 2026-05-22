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
      <h1 style={{ marginBottom: '1.25rem' }}>Edit Alert</h1>

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
