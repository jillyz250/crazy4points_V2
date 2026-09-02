/**
 * Content roadmap — the one-year plan, as data. Drives the admin dashboard's
 * "Content roadmap / up next" widget and is the single source of truth behind
 * the strategy artifact.
 *
 * Live status is DERIVED, not stored: an item counts as published the moment a
 * guide with its `guideSlug` exists in lib/guides.ts. So publishing a guide
 * auto-advances the roadmap with no bookkeeping here.
 *
 * `order` sets the build queue for not-yet-written items (lower = sooner);
 * omit it and the item sorts to the back.
 */
import { GUIDES } from './guides'

export type PillarKey = 'foundations' | 'skills' | 'programs' | 'sweet-spots' | 'trips' | 'tricks'

export const PILLARS: { key: PillarKey; label: string; short: string; blurb: string }[] = [
  { key: 'foundations', label: 'Foundations', short: 'Foundation', blurb: 'The beginner core: zero to first award.' },
  { key: 'skills', label: 'How-To Skills', short: 'Skill', blurb: 'Do a specific thing, step by step.' },
  { key: 'programs', label: 'Program Guides', short: 'Program', blurb: 'How to use each currency, airline, and hotel.' },
  { key: 'sweet-spots', label: 'Sweet Spots', short: 'Sweet spot', blurb: 'The high-value plays.' },
  { key: 'trips', label: 'Planning & Trips', short: 'Trip', blurb: 'Turn points into a specific trip.' },
  { key: 'tricks', label: 'Tricks & Perk Stacks', short: 'Trick', blurb: 'Our differentiator: chaining benefits.' },
]

export interface RoadmapItem {
  title: string
  pillar: PillarKey
  /** Set when a live guide fulfills this item; live status derives from GUIDES. */
  guideSlug?: string
  /** Build-queue priority for not-yet-written items (lower = sooner). */
  order?: number
}

export const ROADMAP: RoadmapItem[] = [
  // ORDER = build queue (Program-Guides-first for growth/AEO, per Copilot
  // validation 2026-08-13). Program Guides 2-19, then Foundations 20-23,
  // Skills 24-32, Sweet Spots 33-39, Trips 40-45, remaining Tricks 46-47.
  // Alliances stays #1 (already promised on-page in the transfers guide).

  // Pillar 1 — Foundations (beginner core, 8)
  { title: 'What Kind of Points Traveler Are You?', pillar: 'foundations', guideSlug: 'find-your-why' },
  { title: 'Points & Miles 101: How It All Works', pillar: 'foundations', order: 20 },
  { title: 'Will Travel Cards Wreck My Credit?', pillar: 'foundations', order: 21 },
  { title: 'How to Earn Points: Welcome Bonuses & Everyday Spend', pillar: 'foundations', order: 22 },
  { title: 'Your Best First Travel Card', pillar: 'foundations', guideSlug: 'best-first-card' },
  { title: 'How Points Transfers Work', pillar: 'foundations', guideSlug: 'how-points-transfers-work' },
  { title: 'Airline Alliances Explained', pillar: 'foundations', order: 1 },
  { title: 'How to Find & Book Your First Award', pillar: 'foundations', order: 23 },

  // Pillar 2 — How-To Skills (12)
  { title: 'How to Find Award Seats', pillar: 'skills', order: 24 },
  { title: 'How to Book a Partner Award', pillar: 'skills', order: 25 },
  { title: 'How to Dodge Fuel Surcharges', pillar: 'skills', order: 28 },
  { title: 'Travel Portal vs Transfer: Which Is Cheaper?', pillar: 'skills', order: 26 },
  { title: 'How to Time a Transfer Bonus', pillar: 'skills', order: 29 },
  { title: 'How to Read an Award Chart', pillar: 'skills', order: 30 },
  { title: 'How to Book Award Travel for a Family', pillar: 'skills', order: 27 },
  { title: 'How to Keep Your Points From Expiring', pillar: 'skills', order: 31 },
  { title: 'How to Book a Sold-Out Hotel', pillar: 'skills', guideSlug: 'how-to-book-a-sold-out-hotel' },
  { title: 'How to Win a Best Rate Guarantee', pillar: 'skills', guideSlug: 'how-to-win-a-best-rate-guarantee' },
  { title: 'How to Upgrade to First Class', pillar: 'skills', guideSlug: 'how-to-upgrade-american-first-class' },
  { title: 'How to Spot an Elevated Welcome Offer', pillar: 'skills', guideSlug: 'how-to-spot-an-elevated-welcome-offer' },
  { title: 'Miles for Last-Minute Trips', pillar: 'skills', order: 32 },

  // Pillar 3 — Program Guides ("How to Use X", 18) — LEAD THE QUEUE
  { title: 'How to Use Chase Ultimate Rewards', pillar: 'programs', guideSlug: 'how-to-use-chase-ultimate-rewards' },
  { title: 'How to Use Amex Membership Rewards', pillar: 'programs', guideSlug: 'how-to-use-amex-membership-rewards' },
  { title: 'How to Use Capital One Miles', pillar: 'programs', order: 4 },
  { title: 'How to Use Bilt Points', pillar: 'programs', order: 5 },
  { title: 'How to Use United MileagePlus', pillar: 'programs', order: 6 },
  { title: 'How to Use Delta SkyMiles', pillar: 'programs', order: 7 },
  { title: 'How to Use American AAdvantage', pillar: 'programs', order: 8 },
  { title: 'How to Use World of Hyatt', pillar: 'programs', order: 9 },
  { title: 'How to Use Marriott Bonvoy', pillar: 'programs', order: 10 },
  { title: 'How to Use Hilton Honors', pillar: 'programs', order: 11 },
  { title: 'How to Use Citi ThankYou Points', pillar: 'programs', order: 12 },
  { title: 'How to Use Alaska / Atmos', pillar: 'programs', order: 13 },
  { title: 'How to Use Southwest Rapid Rewards', pillar: 'programs', order: 14 },
  { title: 'How to Use Air Canada Aeroplan', pillar: 'programs', order: 15 },
  { title: 'How to Use Flying Blue', pillar: 'programs', order: 16 },
  { title: 'How to Use British Airways Avios', pillar: 'programs', order: 17 },
  { title: 'How to Use IHG One Rewards', pillar: 'programs', order: 18 },
  { title: 'How to Use Wyndham Rewards', pillar: 'programs', order: 19 },

  // Pillar 4 — Sweet Spots & Deep Dives (8)
  { title: 'Best Uses of Chase Ultimate Rewards', pillar: 'sweet-spots', order: 33 },
  { title: 'Best Uses of Amex Membership Rewards', pillar: 'sweet-spots', order: 34 },
  { title: 'Aeroplan Sweet Spots', pillar: 'sweet-spots', order: 35 },
  { title: 'Avios Sweet Spots', pillar: 'sweet-spots', order: 36 },
  { title: 'ANA / Star Alliance Sweet Spots', pillar: 'sweet-spots', order: 37 },
  { title: 'The Best Hyatt Sweet Spots', pillar: 'sweet-spots', guideSlug: 'hyatt-points-sweet-spots' },
  { title: 'Is Elite Status Worth It?', pillar: 'sweet-spots', order: 38 },
  { title: 'Business Class to Europe for the Fewest Points', pillar: 'sweet-spots', order: 39 },

  // Pillar 5 — Planning & Trips (seasonal, 6)
  { title: 'How to Fly to Europe in Business on Points', pillar: 'trips', order: 40 },
  { title: 'Hawaii on Points', pillar: 'trips', order: 41 },
  { title: 'Caribbean / Mexico Beach Trip on Points', pillar: 'trips', order: 42 },
  { title: 'Japan on Points (Shoulder Season)', pillar: 'trips', order: 43 },
  { title: 'Honeymoon on Points', pillar: 'trips', order: 44 },
  { title: 'Best Ways Out of NYC on Points', pillar: 'trips', order: 45 },

  // Pillar 6 — Tricks & Perk Stacks (our differentiator, growing catalog)
  { title: 'Hidden Perk Stacks', pillar: 'tricks', guideSlug: 'hidden-perk-stacks' },
  { title: 'The Status-Match Playbook', pillar: 'tricks', order: 46 },
  { title: 'Perk Stacks, Card by Card', pillar: 'tricks', order: 47 },
  { title: "Network Perks You're Not Using (Visa & Mastercard)", pillar: 'tricks', order: 49 },
  // Promoted from content_ideas (2026-08-28) — evergreen, so they earn a ladder slot.
  { title: 'Award Change & Cancel Rules, Airline by Airline', pillar: 'skills', order: 48 },
  { title: 'How to Use U.S. Bank Altitude Points', pillar: 'programs', order: 50 },
]

/** Platform / knowledge-graph build track — the machine under the content. */
export type PlatformStatus = 'done' | 'next' | 'planned'
export interface PlatformItem {
  title: string
  detail: string
  status: PlatformStatus
}
export const PLATFORM_TRACK: PlatformItem[] = [
  { title: 'Benefit-chains data layer', detail: 'lib/perkChains.ts — chains as structured, sourced data', status: 'done' },
  { title: 'Benefits on card pages', detail: 'lib/networkPerks.ts + perkChainsForCard — network perks (Mastercard World Elite, etc.) and perk chains render per-card via CardBenefitStacks (2026-08-28)', status: 'done' },
  { title: 'Content-roadmap dashboard', detail: 'progress + up-next, this page', status: 'done' },
  { title: 'Program FAQ + FAQPage schema', detail: 'yes/no-lead FAQ authored per program (programs.faq) rendering FAQPage JSON-LD for AI answer extraction; house style + faq_reviewed_at staleness guard; backfilling top programs (2026-09-01)', status: 'done' },
  { title: 'Social content calendar', detail: 'admin drag-drop board (/admin/social-calendar): recurring anchors + event ingest + "+ Social calendar" buttons on experiences/sweepstakes with auto-timing (2026-09-02)', status: 'done' },
  { title: 'AEO foundation (flavor C)', detail: 'llms.txt + FAQPage schema SHIPPED; remaining: HowTo/ItemList/LoyaltyProgram schema per program + reference-style guide sections (What this covers / Key facts / Definitions / Sources). See Phase 21 AI-visibility build', status: 'next' },
  { title: 'Program-page guide cross-linking', detail: 'every program page shows its guides + a beginner pointer', status: 'next' },
  { title: 'Changes/Cancellations section — all airlines', detail: 'backfill programs.changes_policy across ~106 airline pages (Flying Blue piloted, PR #1197). Prioritize the top redemption currencies (United, Delta, AA, Alaska/Atmos, Aeroplan, Avios, ANA, Cathay, Emirates, Turkish, KrisFlyer, Virgin, LifeMiles); verify each vs the airline official page. Long-tail carriers low priority.', status: 'next' },
  { title: 'Change/Cancel policy comparison tool', detail: 'ONCE changes_policy is backfilled across airlines: a side-by-side comparator — "which airline lets me change/cancel for free?" — filter by fee thresholds, schedule-change rules, status waivers, and same-day-change rules. Jill request 2026-08-28.', status: 'planned' },
  { title: 'Per-card companion guides (interactive PDF)', detail: 'a branded, fillable PDF companion per active credit card (Jill-designed, Royal Glow) that helps a cardholder CLAIM every credit and track spend, NOT an HTML guide. Pilot = the Sapphire Reserve Companion (v54, near done): $2,190 credit tracker, monthly-claim checkboxes, $75K spend-club blocks, travel-credit + lounge logs, key dates (resets vs runs out), protections grid, newsletter + Card-Finder QR. Hosted on the card page + linked from guides. Claude\'s role per card: assemble + MULTI-SOURCE-VERIFY every figure vs the issuer\'s official terms into a fact sheet Jill builds the PDF from, then host the finished PDF. Cadence ~1/day. Jill request 2026-08-28.', status: 'next' },
  { title: 'Perk-chain system (the moat)', detail: 'data layer + per-card rendering now ship; NEXT is the queryable stack builder ("what do ALL my cards unlock?") — loyalty as a graph, not a list', status: 'next' },
  { title: 'Structured glossary', detail: 'every term a citation target for AI answers', status: 'planned' },
  { title: 'Per-chain canonical pages', detail: 'each chain its own AEO page: graph, requirements, official sources, variants', status: 'planned' },
  { title: 'Graph-aware alert publishing', detail: 'publishing an alert auto-pulls related guides, programs, and chains', status: 'planned' },
  { title: 'Points Concierge (AI-B)', detail: 'chatbot grounded in the graph — the future flagship, after the chain-system matures', status: 'planned' },
  { title: 'TikTok channel', detail: 'start posting short-form video — repurpose alerts, experiences, and tips into scroll-stopping clips; TikTok drives discovery without IG\'s link-in-bio friction. Jill request 2026-08-28.', status: 'planned' },
  { title: 'AI video avatar ("AI me")', detail: 'an AI avatar of Jill that reads a written script and generates a talking-head video (HeyGen-style), so we produce TikTok/Reels at scale from scripts without filming. Pairs with the TikTok channel. Jill request 2026-08-28.', status: 'planned' },
]

export function platformProgress(): { done: number; total: number } {
  return { done: PLATFORM_TRACK.filter((i) => i.status === 'done').length, total: PLATFORM_TRACK.length }
}

const LIVE_SLUGS = new Set(GUIDES.map((g) => g.slug))

export function isLive(item: RoadmapItem): boolean {
  return !!item.guideSlug && LIVE_SLUGS.has(item.guideSlug)
}

export function pillarLabel(key: PillarKey): string {
  return PILLARS.find((p) => p.key === key)?.short ?? key
}

export interface RoadmapProgress {
  done: number
  total: number
  pct: number
  byPillar: { key: PillarKey; label: string; done: number; total: number }[]
}

export function roadmapProgress(): RoadmapProgress {
  const done = ROADMAP.filter(isLive).length
  const total = ROADMAP.length
  const byPillar = PILLARS.map((p) => {
    const items = ROADMAP.filter((i) => i.pillar === p.key)
    return { key: p.key, label: p.label, done: items.filter(isLive).length, total: items.length }
  })
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, byPillar }
}

/** Next planned (not-yet-live) items, in build-queue order. */
export function upNext(n = 4): RoadmapItem[] {
  return ROADMAP.filter((i) => !isLive(i))
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    .slice(0, n)
}
