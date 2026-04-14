import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('programs')
    .select('id, slug, name, type, tier, logo_url, program_url, is_active')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('[GET /api/programs] error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
