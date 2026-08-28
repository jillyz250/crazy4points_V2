// Shared Supabase client + a query wrapper for diagnostic/one-off scripts.
//
// The "silent-column trap": asking for a column that doesn't exist fails the
// WHOLE query and returns no rows — which looks identical to "the table is
// empty." A script that only reads `data` (not `error`) then reports a scary,
// false "0". `must()` THROWS on any query error so a typo can never masquerade
// as empty data. Use it for every read in a throwaway script.
//
// Usage:
//   import { db, must } from './lib/db.mjs'
//   const rows = await must(db.from('programs').select('slug, name'))
//   const { count } = await must(db.from('alerts').select('id', { count: 'exact', head: true }))
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
  }),
)

export const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

/** Await a Supabase query and THROW on error (kills the silent-column trap).
 *  Returns `{ data, count }` for head/count queries, else the `data` array. */
export async function must(query) {
  const { data, error, count } = await query
  if (error) throw new Error(`[db] query failed: ${error.message}`)
  return count != null ? { data, count } : data
}
