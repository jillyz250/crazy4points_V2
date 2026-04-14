import { createClient } from '@/utils/supabase/server'
import { getPrograms } from '@/utils/supabase/queries'
import NewAlertForm from './NewAlertForm'

export default async function NewAlertPage() {
  const supabase = await createClient()
  const programs = await getPrograms(supabase)
  console.log('[NewAlertPage] programs count:', programs.length, programs.map(p => p.name))

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>New Alert</h1>
      <NewAlertForm programs={programs} />
    </div>
  )
}
