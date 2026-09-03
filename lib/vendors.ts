/**
 * Vendor subscriptions & spend — the single source of truth for "what are we
 * paying and should we change it."
 *
 * Data verified 2026-09-03. The flat subscriptions below are STATIC config
 * (they change only when a plan changes, so we hand-maintain them here). The
 * ONE exception is Anthropic, which is metered pay-as-you-go: its monthly
 * figure is read LIVE from the `ai_usage_log` table at render time — see the
 * `live` flag and the expenses page's 30-day rollup. Do not alter the verified
 * numbers here without re-verifying against the vendor's billing.
 */

export type VendorRec = 'hold' | 'watch' | 'action'

export type Vendor = {
  /** stable key for React lists + future joins */
  key: string
  name: string
  plan: string
  /** flat monthly subscription cost in whole dollars (0 when free) */
  flatMonthly: number
  /** additional metered/usage cost in dollars, when a plan has overage */
  usageMonthly?: number
  /** true = the monthly figure is read live at render (Anthropic only) */
  live: boolean
  /** the key limit / what you get on this plan */
  limit: string
  /** the next tier up (for the "what if we grow" decision) */
  nextTier: string
  /** hold = fine as-is · watch = keep an eye on it · action = do something */
  rec: VendorRec
  /** the finance note — why this rec, and the lever to pull */
  note: string
  /** optional renewal marker (YYYY-MM) for prepaid annual plans */
  renewal?: string
}

export const VENDORS: Vendor[] = [
  {
    key: 'vercel',
    name: 'Vercel',
    plan: 'Pro + usage',
    flatMonthly: 20,
    usageMonthly: 65,
    live: false,
    limit: 'Build CPU minutes — 97% of the bill ($82 this month)',
    nextTier: 'Enterprise (custom)',
    rec: 'action',
    note:
      'Overage is build-CPU from frequent deploys. Ignored Build Step guard shipped ' +
      '(scripts/vercel-should-build.sh) — enable in Vercel Settings > Git. Then check ' +
      'Elastic build-machine size.',
  },
  {
    key: 'anthropic',
    name: 'Anthropic API',
    plan: 'Pay-as-you-go',
    flatMonthly: 0,
    usageMonthly: undefined,
    live: true,
    limit: 'Metered — Haiku + Sonnet',
    nextTier: 'n/a',
    rec: 'hold',
    note: "The site's AI engine. Savings lever: prompt caching on the Sonnet jobs.",
  },
  {
    key: 'supabase',
    name: 'Supabase',
    plan: 'Pro',
    flatMonthly: 25,
    live: false,
    limit: '8GB DB, 100GB storage, 100K MAU, daily backups',
    nextTier: 'Team $599',
    rec: 'hold',
    note: 'Load-bearing — gives daily backups + no auto-pause. Do NOT downgrade.',
  },
  {
    key: 'chatgpt',
    name: 'ChatGPT',
    plan: 'Plus',
    flatMonthly: 20,
    live: false,
    limit: 'Used for employee portraits',
    nextTier: 'Pro $200',
    rec: 'watch',
    note: 'Softest $20 — only used for portraits. Revisit if portrait work slows.',
  },
  {
    key: 'claude',
    name: 'Claude',
    plan: 'Free this month',
    flatMonthly: 0,
    live: false,
    limit: 'Personal + Claude Code',
    nextTier: 'Pro $20 / Max $100-200',
    rec: 'hold',
    note: 'On free this month; deciding next month.',
  },
  {
    key: 'firecrawl',
    name: 'Firecrawl',
    plan: 'Hobby (5k credits/mo, prepaid annual)',
    flatMonthly: 16,
    live: false,
    limit: '5,000 credits/mo — slightly over; buys $5/1k topups',
    nextTier: 'Standard $83 (100k credits)',
    rec: 'hold',
    note:
      'Do NOT jump to Standard — topups are far cheaper at this volume. Re-decide at ' +
      'May 2026 renewal.',
    renewal: '2026-05',
  },
  {
    key: 'google-workspace',
    name: 'Google Workspace',
    plan: 'Business Starter',
    flatMonthly: 7,
    live: false,
    limit: 'Custom @crazy4points email (1 user)',
    nextTier: 'Standard $14/user',
    rec: 'hold',
    note: 'Cheapest tier — fine.',
  },
]
