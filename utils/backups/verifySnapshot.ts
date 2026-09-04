/**
 * Remy's reliability check: prove a backup is actually RESTORABLE, not just that
 * a file exists. Unzips the gzip, parses it, and sanity-checks the critical
 * tables against the live DB. Reused by the weekly cron (nightly-snapshot on
 * Fridays) and runnable ad-hoc. A backup you've never restored isn't a backup.
 */

import { gunzipSync } from 'node:zlib'
import type { SupabaseClient } from '@supabase/supabase-js'

export type VerifyResult = {
  ok: boolean
  summary: string
  checks: { label: string; ok: boolean }[]
}

export async function verifySnapshot(gz: Buffer, supabase: SupabaseClient): Promise<VerifyResult> {
  const checks: { label: string; ok: boolean }[] = []

  let parsed: { tables?: Record<string, unknown[]> } | null = null
  try {
    parsed = JSON.parse(gunzipSync(gz).toString('utf8'))
  } catch {
    return { ok: false, summary: 'Backup FAILED to unzip/parse — it is not restorable. Investigate now.', checks: [{ label: 'unzips + parses as JSON', ok: false }] }
  }

  const tables = parsed?.tables ?? {}
  const subs = (tables.subscribers ?? []) as { email?: unknown }[]
  const withEmail = subs.filter((s) => s && typeof s.email === 'string' && (s.email as string).includes('@')).length
  const tableCount = Object.keys(tables).length
  const programs = (tables.programs ?? []).length

  const { count: liveSubs } = await supabase.from('subscribers').select('*', { count: 'exact', head: true })

  checks.push({ label: 'unzips + parses as JSON', ok: !!parsed?.tables })
  checks.push({ label: `${tableCount} tables present (>=15)`, ok: tableCount >= 15 })
  checks.push({ label: `subscribers all have valid emails (${withEmail}/${subs.length})`, ok: subs.length > 0 && withEmail === subs.length })
  checks.push({ label: `backup subs (${subs.length}) matches live (${liveSubs ?? '?'})`, ok: subs.length === (liveSubs ?? -1) })
  checks.push({ label: `programs present (${programs} rows)`, ok: programs > 0 })

  const ok = checks.every((c) => c.ok)
  const summary = ok
    ? `Reliability check PASSED: backup unzips, ${tableCount} tables, ${subs.length} subscribers all valid and matching live. Verified restorable.`
    : `Reliability check FLAGGED: ${checks.filter((c) => !c.ok).map((c) => c.label).join('; ')}. Do not trust this backup until fixed.`

  return { ok, summary, checks }
}
