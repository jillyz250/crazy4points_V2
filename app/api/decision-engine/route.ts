import { NextResponse } from 'next/server'

// Destinations content has not yet been migrated to Supabase.
// This endpoint returns an empty result set until the destinations
// table is available.
export async function POST() {
  return NextResponse.json({ destinations: [] })
}
