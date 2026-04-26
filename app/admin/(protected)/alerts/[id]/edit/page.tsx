import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { getAlertById, getPrograms, getAlertPrograms } from '@/utils/supabase/queries'
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

  // Strip the primary out of the tagged-programs list — it lives in the
  // "Program" dropdown above the form. Showing it here too is confusing.
  const secondaryOnly = taggedProgramIds.filter((id) => id !== alertWithPrograms.primary_program_id)

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Edit Alert</h1>
      <EditAlertForm alert={alertWithPrograms} programs={programs} taggedProgramIds={secondaryOnly} />
    </div>
  )
}
