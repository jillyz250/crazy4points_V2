import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { PROGRAM_SLUGS } from '@/lib/programs'

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')

  if (!process.env.REVALIDATE_SECRET) {
    console.error('REVALIDATE_SECRET is not set')
    return NextResponse.json({ message: 'Server misconfiguration' }, { status: 500 })
  }

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 })
  }

  // Revalidate all alert and content paths
  revalidatePath('/alerts')
  revalidatePath('/alerts/[slug]', 'page')
  revalidatePath('/daily-brief')
  revalidatePath('/daily-brief/[date]', 'page')

  // Revalidate each program page by slug
  for (const slug of PROGRAM_SLUGS) {
    revalidatePath(`/programs/${slug}`)
  }

  return NextResponse.json({
    revalidated: true,
    paths: [
      '/alerts',
      '/alerts/[slug]',
      '/daily-brief',
      '/daily-brief/[date]',
      ...PROGRAM_SLUGS.map((s) => `/programs/${s}`),
    ],
    timestamp: new Date().toISOString(),
  })
}
