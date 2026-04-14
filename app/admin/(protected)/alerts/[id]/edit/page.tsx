import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { getAlertById, getPrograms } from '@/utils/supabase/queries'
import EditAlertForm from './EditAlertForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditAlertPage({ params }: Props) {
  const { id } = await params
  const supabase = createAdminClient()

  const [alertWithPrograms, programs] = await Promise.all([
    getAlertById(supabase, id).catch(() => null),
    getPrograms(supabase),
  ])

  if (!alertWithPrograms) notFound()

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Edit Alert</h1>
      <EditAlertForm alert={alertWithPrograms} programs={programs} />
    </div>
  )
}
