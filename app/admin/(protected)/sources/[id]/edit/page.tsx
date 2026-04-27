import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/server'
import { getSourceById } from '@/utils/supabase/queries'
import EditSourceForm from './EditSourceForm'

export default async function EditSourcePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createAdminClient()
  const source = await getSourceById(supabase, id)
  if (!source) notFound()

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Edit Source</h1>
      <EditSourceForm source={source} />
    </div>
  )
}
