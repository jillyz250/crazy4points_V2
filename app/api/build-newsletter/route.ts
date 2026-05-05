import { NextRequest, NextResponse } from 'next/server'
import { runBuildNewsletter } from '@/utils/ai/runBuildNewsletter'

export const maxDuration = 300

/**
 * Thin auth wrapper around runBuildNewsletter().
 *
 * The actual generation pipeline (queries → Sonnet → fact-check → upsert) lives
 * in utils/ai/runBuildNewsletter.ts so server actions (Run Now button) can call
 * it directly. Calling this URL from a server action via fetch broke in prod
 * — see Newsletter V1.5.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const manualSecret = req.headers.get('x-intel-secret')
  const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isManual = manualSecret === process.env.INTEL_API_SECRET

  if (!isCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const force = url.searchParams.get('force') === '1'

  const result = await runBuildNewsletter({ force })
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status ?? 500 })
  }
  return NextResponse.json(result)
}
