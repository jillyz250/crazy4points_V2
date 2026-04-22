'use server'

import { headers } from 'next/headers'

export interface JobResult {
  ok: boolean
  status: number
  body: unknown
  durationMs: number
}

async function triggerJob(path: string): Promise<JobResult> {
  const secret = process.env.INTEL_API_SECRET
  if (!secret) {
    return { ok: false, status: 0, body: { error: 'INTEL_API_SECRET not configured' }, durationMs: 0 }
  }

  const h = await headers()
  const host = h.get('host')
  const proto = h.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https')
  const url = `${proto}://${host}${path}`

  const started = Date.now()
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'x-intel-secret': secret },
      cache: 'no-store',
    })
    const text = await res.text()
    let body: unknown = text
    try { body = JSON.parse(text) } catch { /* keep text */ }
    return { ok: res.ok, status: res.status, body, durationMs: Date.now() - started }
  } catch (err) {
    return {
      ok: false,
      status: 0,
      body: { error: err instanceof Error ? err.message : String(err) },
      durationMs: Date.now() - started,
    }
  }
}

export async function runScoutAction(): Promise<JobResult> {
  return triggerJob('/api/run-scout')
}

export async function runBriefAction(): Promise<JobResult> {
  return triggerJob('/api/build-brief')
}
