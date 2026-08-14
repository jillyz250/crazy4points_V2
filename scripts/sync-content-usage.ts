/**
 * Sync the content_usage ledger from existing data — idempotent, re-runnable.
 * Pulls past newsletters (headline / sweet_spot / jills_take) and "Social post:"
 * reminders into the running list. The newsletter build also calls this before
 * reading the ledger, so this script is mainly for a manual/cron refresh.
 *
 * Run: set -a; . ./.env.local; set +a; node_modules/.bin/tsx scripts/sync-content-usage.ts
 */
import { createAdminClient } from '@/utils/supabase/server'
import { syncContentUsageFromHistory } from '@/utils/content/contentUsage'

;(async () => {
  const sb = createAdminClient()
  const logged = await syncContentUsageFromHistory(sb)
  console.log(`content_usage sync: ${logged} newly logged`)
})()
