// Lists guides + evergreen articles due for a 6-month re-verify (freshness
// guardrail). Run in the daily ritual's Refresh-queue phase (Phase 8).
//   node_modules/.bin/tsx scripts/guides-due-refresh.ts
import { guidesDueForRefresh, GUIDES } from '@/lib/guides'

const due = guidesDueForRefresh(6)
console.log(`Guides: ${GUIDES.length} total · ${due.length} due for 6-month refresh\n`)
if (due.length === 0) {
  console.log('  All guides verified within the last 6 months. Nothing due.')
} else {
  for (const g of due) {
    const age = g.ageMonths === Infinity ? 'no date' : `${g.ageMonths}mo`
    console.log(`  [${age.padStart(7)}] /guides/${g.slug}  (last verified ${g.updated ?? 'never'})`)
  }
  console.log('\n-> Re-verify the oldest against official sources (multi-source standard), correct, and bump `updated` in lib/guides.ts.')
}
