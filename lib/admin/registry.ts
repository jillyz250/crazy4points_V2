/**
 * Admin page registry — the ONE typed source of truth for every admin page.
 * ------------------------------------------------------------------------
 * Phase 0 of the admin redesign (Devon, 2026-09-02).
 *
 * Before this file, the admin surface was described in three hand-maintained
 * places that had drifted apart (the nav's NAV_GROUPS, the dashboard tiles, and
 * whatever pages actually existed under app/admin/(protected)/). New pages got
 * built and never wired into the nav — 13 real pages were orphaned.
 *
 * From now on, EVERY admin page is declared here exactly once. The nav, the
 * dashboard "Today" queue, and any future page directory all derive from this
 * list. Add a page here when you build it; delete it here when you retire it.
 * There is no second list to keep in sync.
 *
 * OWNERSHIP MODEL: every page belongs to one employee (owner) and one task
 * category. The nav groups by owner (who to ask) and sub-labels by task (what
 * it does), so the panel reads as the org that runs it.
 */

// ── Owners (the crazy4points team) ──────────────────────────────────────────

export type OwnerSlug =
  | 'morgan-chief'
  | 'john-content'
  | 'kesha-social'
  | 'janet-growth'
  | 'priya-sources'
  | 'bill-security'
  | 'devon-design'
  | 'erica-finance'

export type Owner = {
  slug: OwnerSlug
  /** First name, for the nav group header. */
  name: string
  /** Role line, shown small under the name. */
  role: string
  /** Group-header emoji (matches the employee's persona badge). */
  emoji: string
  /** Sort order of the owner group in the nav, top to bottom. */
  order: number
}

/**
 * Owner display metadata + nav order. Names/roles/emoji mirror the employees
 * table (source of truth: /admin/org). Keep in sync when the org changes.
 */
export const OWNERS: Record<OwnerSlug, Owner> = {
  'morgan-chief': { slug: 'morgan-chief', name: 'Morgan', role: 'Chief of Staff', emoji: '🧭', order: 1 },
  'john-content': { slug: 'john-content', name: 'John', role: 'Head of Content', emoji: '✍️', order: 2 },
  'kesha-social': { slug: 'kesha-social', name: 'Kesha', role: 'Head of Social', emoji: '📣', order: 3 },
  'janet-growth': { slug: 'janet-growth', name: 'Janet', role: 'Growth & Revenue', emoji: '📈', order: 4 },
  'priya-sources': { slug: 'priya-sources', name: 'Priya', role: 'Sources & Data Integrity', emoji: '🔍', order: 5 },
  'bill-security': { slug: 'bill-security', name: 'Bill', role: 'Head of Security', emoji: '🔒', order: 6 },
  'devon-design': { slug: 'devon-design', name: 'Devon', role: 'Head of Design & UX', emoji: '🎨', order: 7 },
  'erica-finance': { slug: 'erica-finance', name: 'Erica', role: 'Finance & Accounting', emoji: '🧾', order: 8 },
}

// ── Task categories (the "what does this do" sub-label) ─────────────────────

export type TaskCategory =
  | 'Ops'
  | 'Content'
  | 'Social'
  | 'Growth'
  | 'Sources'
  | 'Accuracy'
  | 'Reference'
  | 'Reliability'
  | 'Design'
  | 'Finance'

export type PageStatus = 'active' | 'planned' | 'deprecated'

export type AdminPage = {
  /** Stable unique id (kebab-case). Used as a React key + future deep-links. */
  id: string
  /** Nav + tile label. */
  title: string
  /** One-line "what this is" — feeds tooltips + the future page directory. */
  description: string
  /** Employee who owns this page. */
  owner: OwnerSlug
  /** What kind of work this page is — the nav sub-label. */
  taskCategory: TaskCategory
  /** Route (may carry a query string for filtered views). */
  path: string
  status: PageStatus
  /** Emoji icon for now; swap for a real icon set in a later phase. */
  icon: string
  /** Higher = more urgent. Feeds the future dashboard "Today" queue. */
  dashboardPriority: number
  /** Optional permission keys (reserved; nothing enforces these yet). */
  permissions?: string[]
  /** Two-letter rail abbreviation for the collapsed sidebar. */
  abbr: string
  /**
   * Optional active-state override. Needed for query-string routes that share a
   * pathname (e.g. the Programs filter tabs) so only the matching one lights up.
   */
  match?: (pathname: string, search: string) => boolean
  /** Nav badge key, wired to a live count by the admin layout. */
  badgeKey?: 'refreshQueue'
}

// Small helper so the Programs filter tabs match on their `?type=` only.
const typeMatch = (base: string, type?: string) => (pathname: string, search: string) => {
  if (pathname !== base && !pathname.startsWith(base + '/')) return false
  if (type) return search.includes('type=' + type)
  return !search.includes('type=')
}

/**
 * EVERY admin page. Ordered within each owner by task category so the nav can
 * render light task sub-labels off consecutive entries.
 *
 * Parity note: this list is a superset of the old NAV_GROUPS — it also adopts
 * the 13 pages that were built but never linked (agents, analytics,
 * data-integrity, program-drift, verification-findings, change-signals,
 * card-bonus-signals, card-extractions, refresh-queue, roadmap, sweepstakes,
 * takes, glossary). Detail/edit routes (…/new, …/[id]/edit) are intentionally
 * NOT listed — they are reached from their parent list page, not the nav.
 */
export const ADMIN_PAGES: AdminPage[] = [
  // ── Morgan · Command / Ops ────────────────────────────────────────────────
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'The org command center — meters, the game, and what needs Jill today.',
    owner: 'morgan-chief',
    taskCategory: 'Ops',
    path: '/admin',
    status: 'active',
    icon: '🏠',
    dashboardPriority: 100,
    abbr: 'Da',
  },
  {
    id: 'org',
    title: 'Org Chart',
    description: 'The AI team: who owns what, meters, and the Breakroom.',
    owner: 'morgan-chief',
    taskCategory: 'Ops',
    path: '/admin/org',
    status: 'active',
    icon: '👥',
    dashboardPriority: 48,
    abbr: 'Or',
  },
  {
    id: 'breakroom',
    title: 'Breakroom',
    description: 'The office soap opera — every character\'s arc + the shared office feed. Flavor only, internal.',
    owner: 'morgan-chief',
    taskCategory: 'Ops',
    path: '/admin/breakroom',
    status: 'active',
    icon: '☕',
    dashboardPriority: 12,
    abbr: 'Bo',
  },
  {
    id: 'decisions',
    title: 'Decisions',
    description: 'The Decision Log — proposals from the team awaiting your approve/reject.',
    owner: 'morgan-chief',
    taskCategory: 'Ops',
    path: '/admin/decisions',
    status: 'active',
    icon: '⚖️',
    dashboardPriority: 90,
    abbr: 'De',
  },
  {
    id: 'ai-usage',
    title: 'AI Usage',
    description: 'Model spend + token usage across the platform.',
    owner: 'morgan-chief',
    taskCategory: 'Ops',
    path: '/admin/ai-usage',
    status: 'active',
    icon: '🧮',
    dashboardPriority: 40,
    abbr: 'Ai',
  },

  // ── John · Content ────────────────────────────────────────────────────────
  {
    id: 'drafts',
    title: 'Drafts',
    description: 'The unified writing hub — alerts + social drafts awaiting publish.',
    owner: 'john-content',
    taskCategory: 'Content',
    path: '/admin/drafts',
    status: 'active',
    icon: '✍️',
    dashboardPriority: 88,
    abbr: 'Dr',
  },
  {
    id: 'content-ideas-blog',
    title: 'Blog',
    description: 'Blog + evergreen content ideas queue.',
    owner: 'john-content',
    taskCategory: 'Content',
    path: '/admin/content-ideas?type=blog',
    status: 'active',
    icon: '💡',
    dashboardPriority: 62,
    abbr: 'Bl',
    // Light up on the content-ideas page regardless of the active filter.
    match: (p) => p === '/admin/content-ideas',
  },
  {
    id: 'newsletter',
    title: 'Newsletter',
    description: 'Build + send the weekly newsletter.',
    owner: 'john-content',
    taskCategory: 'Content',
    path: '/admin/newsletter',
    status: 'active',
    icon: '📧',
    dashboardPriority: 70,
    abbr: 'Nw',
  },
  {
    id: 'briefs',
    title: 'Daily Briefs',
    description: 'AI-generated editorial briefs feeding the writing queue.',
    owner: 'john-content',
    taskCategory: 'Content',
    path: '/admin/briefs',
    status: 'active',
    icon: '📋',
    dashboardPriority: 58,
    abbr: 'Br',
  },
  {
    id: 'topics',
    title: 'Topics',
    description: 'Editorial topic taxonomy + landing pages.',
    owner: 'john-content',
    taskCategory: 'Content',
    path: '/admin/topics',
    status: 'active',
    icon: '🏷️',
    dashboardPriority: 30,
    abbr: 'Tp',
  },
  {
    id: 'question-radar',
    title: 'Question Radar',
    description: 'Real reader questions to answer in content.',
    owner: 'john-content',
    taskCategory: 'Content',
    path: '/admin/question-radar',
    status: 'active',
    icon: '📡',
    dashboardPriority: 44,
    abbr: 'QR',
  },
  {
    id: 'roadmap',
    title: 'Content Roadmap',
    description: 'The content strategy roadmap + pillar rotation.',
    owner: 'john-content',
    taskCategory: 'Content',
    path: '/admin/roadmap',
    status: 'active',
    icon: '🗺️',
    dashboardPriority: 32,
    abbr: 'Rm',
  },
  {
    id: 'experiences',
    title: 'Experiences',
    description: 'Curate featured experiences + presales for the public directory.',
    owner: 'kesha-social',
    taskCategory: 'Content',
    path: '/admin/experiences',
    status: 'active',
    icon: '✨',
    dashboardPriority: 46,
    abbr: 'Xp',
  },
  {
    id: 'sweepstakes',
    title: 'Sweepstakes',
    description: 'Points-only sweepstakes monitor + coverage queue.',
    owner: 'kesha-social',
    taskCategory: 'Content',
    path: '/admin/sweepstakes',
    status: 'active',
    icon: '🎟️',
    dashboardPriority: 50,
    abbr: 'Sw',
  },
  {
    id: 'takes',
    title: "Jill's Takes",
    description: 'Jill\'s takes inbox — opinions to weave into content + newsletter.',
    owner: 'john-content',
    taskCategory: 'Content',
    path: '/admin/takes',
    status: 'active',
    icon: '💬',
    dashboardPriority: 36,
    abbr: 'Jt',
  },

  // ── Kesha · Social ────────────────────────────────────────────────────────
  {
    id: 'creatives',
    title: 'Creatives',
    description: 'Social graphics + creative assets.',
    owner: 'kesha-social',
    taskCategory: 'Social',
    path: '/admin/creatives',
    status: 'active',
    icon: '🎨',
    dashboardPriority: 42,
    abbr: 'Cr',
  },
  {
    id: 'social-calendar',
    title: 'Social Calendar',
    description: 'Scheduled + planned social posts across platforms.',
    owner: 'kesha-social',
    taskCategory: 'Social',
    path: '/admin/social-calendar',
    status: 'active',
    icon: '📅',
    dashboardPriority: 52,
    abbr: 'SC',
  },

  // ── Janet · Growth & Revenue ──────────────────────────────────────────────
  {
    id: 'subscribers',
    title: 'Subscribers',
    description: 'Newsletter subscriber list + signup health.',
    owner: 'janet-growth',
    taskCategory: 'Growth',
    path: '/admin/subscribers',
    status: 'active',
    icon: '👤',
    dashboardPriority: 54,
    abbr: 'Su',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    description: 'Traffic, search, and signup analytics dashboard.',
    owner: 'janet-growth',
    taskCategory: 'Growth',
    path: '/admin/analytics',
    status: 'active',
    icon: '📈',
    dashboardPriority: 56,
    abbr: 'An',
  },
  {
    id: 'short-links',
    title: 'Short links',
    description: 'Campaign short links + click attribution.',
    owner: 'janet-growth',
    taskCategory: 'Growth',
    path: '/admin/short-links',
    status: 'active',
    icon: '🔗',
    dashboardPriority: 34,
    abbr: 'Sl',
  },

  // ── Priya · Sources ───────────────────────────────────────────────────────
  {
    id: 'sources',
    title: 'Sources',
    description: 'Scout source list feeding the intel pipeline.',
    owner: 'priya-sources',
    taskCategory: 'Sources',
    path: '/admin/sources',
    status: 'active',
    icon: '🌐',
    dashboardPriority: 60,
    abbr: 'So',
  },
  {
    id: 'triage',
    title: 'Triage',
    description: 'Intel triage — dedup + promote raw signals into coverage.',
    owner: 'priya-sources',
    taskCategory: 'Sources',
    path: '/admin/triage',
    status: 'active',
    icon: '🗂️',
    dashboardPriority: 92,
    abbr: 'Tr',
  },
  {
    id: 'scrapes',
    title: 'Scrapes',
    description: 'Scrape runs + change detection results.',
    owner: 'priya-sources',
    taskCategory: 'Sources',
    path: '/admin/scrapes',
    status: 'active',
    icon: '🕷️',
    dashboardPriority: 38,
    abbr: 'Sc',
  },
  {
    id: 'change-signals',
    title: 'Change signals',
    description: 'Detected program/page changes awaiting review.',
    owner: 'priya-sources',
    taskCategory: 'Sources',
    path: '/admin/change-signals',
    status: 'active',
    icon: '📶',
    dashboardPriority: 72,
    abbr: 'Cs',
  },
  {
    id: 'card-bonus-signals',
    title: 'Welcome-bonus signals',
    description: 'Detected card welcome-bonus changes to verify + cover.',
    owner: 'priya-sources',
    taskCategory: 'Sources',
    path: '/admin/card-bonus-signals',
    status: 'active',
    icon: '🎉',
    dashboardPriority: 68,
    abbr: 'Wb',
  },

  // ── Priya · Accuracy ──────────────────────────────────────────────────────
  {
    id: 'agents',
    title: 'Accuracy Agents',
    description: 'Accuracy agent scorecard + items needing attention.',
    owner: 'priya-sources',
    taskCategory: 'Accuracy',
    path: '/admin/agents',
    status: 'active',
    icon: '🤖',
    dashboardPriority: 78,
    abbr: 'Ag',
  },
  {
    id: 'fact-checks',
    title: 'Fact Checks',
    description: 'Fact-check queue reconciling pages vs official sources.',
    owner: 'priya-sources',
    taskCategory: 'Accuracy',
    path: '/admin/fact-checks',
    status: 'active',
    icon: '✅',
    dashboardPriority: 80,
    abbr: 'Fc',
  },
  {
    id: 'verification-findings',
    title: 'Re-verification findings',
    description: 'Open findings from automated re-verification runs.',
    owner: 'priya-sources',
    taskCategory: 'Accuracy',
    path: '/admin/verification-findings',
    status: 'active',
    icon: '🔎',
    dashboardPriority: 76,
    abbr: 'Vf',
  },
  {
    id: 'data-integrity',
    title: 'Data integrity',
    description: 'Data-integrity issues ranked by severity.',
    owner: 'priya-sources',
    taskCategory: 'Accuracy',
    path: '/admin/data-integrity',
    status: 'active',
    icon: '🛡️',
    dashboardPriority: 82,
    abbr: 'Di',
  },
  {
    id: 'program-drift',
    title: 'Program-fact drift',
    description: 'Detected drift between program data + prose.',
    owner: 'priya-sources',
    taskCategory: 'Accuracy',
    path: '/admin/program-drift',
    status: 'active',
    icon: '🌀',
    dashboardPriority: 74,
    abbr: 'Pd',
  },

  // ── Priya · Reference (the data catalog) ─────────────────────────────────
  {
    id: 'programs',
    title: 'Programs',
    description: 'Loyalty program catalog (airlines, hotels, currencies).',
    owner: 'john-content',
    taskCategory: 'Reference',
    path: '/admin/programs',
    status: 'active',
    icon: '🏆',
    dashboardPriority: 40,
    abbr: 'Pr',
    match: typeMatch('/admin/programs'),
  },
  {
    id: 'programs-currencies',
    title: 'Currencies',
    description: 'Transferable-points currencies view of the program catalog.',
    owner: 'john-content',
    taskCategory: 'Reference',
    path: '/admin/programs?type=loyalty_program',
    status: 'active',
    icon: '💠',
    dashboardPriority: 20,
    abbr: 'Cu',
    match: typeMatch('/admin/programs', 'loyalty_program'),
  },
  {
    id: 'programs-hotels',
    title: 'Hotels',
    description: 'Hotel view of the program catalog.',
    owner: 'john-content',
    taskCategory: 'Reference',
    path: '/admin/programs?type=hotel',
    status: 'active',
    icon: '🏨',
    dashboardPriority: 20,
    abbr: 'Ho',
    match: typeMatch('/admin/programs', 'hotel'),
  },
  {
    id: 'programs-otas',
    title: 'OTAs',
    description: 'Online-travel-agency view of the program catalog.',
    owner: 'john-content',
    taskCategory: 'Reference',
    path: '/admin/programs?type=ota',
    status: 'active',
    icon: '🧳',
    dashboardPriority: 20,
    abbr: 'Ot',
    match: typeMatch('/admin/programs', 'ota'),
  },
  {
    id: 'issuers',
    title: 'Issuers',
    description: 'Card issuers catalog.',
    owner: 'john-content',
    taskCategory: 'Reference',
    path: '/admin/issuers',
    status: 'active',
    icon: '🏦',
    dashboardPriority: 22,
    abbr: 'Is',
  },
  {
    id: 'cards',
    title: 'Cards',
    description: 'Credit card catalog + reference pages.',
    owner: 'john-content',
    taskCategory: 'Reference',
    path: '/admin/cards',
    status: 'active',
    icon: '💳',
    dashboardPriority: 24,
    abbr: 'Cd',
  },
  {
    id: 'partner-redemptions',
    title: 'Partner Redemptions',
    description: 'Transfer-partner redemption sweet spots.',
    owner: 'john-content',
    taskCategory: 'Reference',
    path: '/admin/partner-redemptions',
    status: 'active',
    icon: '🔁',
    dashboardPriority: 22,
    abbr: 'PR',
  },
  {
    id: 'tokens',
    title: 'Intro tokens',
    description: 'Dynamic intro tokens (counts, partner lists) used in prose.',
    owner: 'john-content',
    taskCategory: 'Reference',
    path: '/admin/tokens',
    status: 'active',
    icon: '🔤',
    dashboardPriority: 18,
    abbr: 'Tk',
  },
  {
    id: 'extractions',
    title: 'Extractions',
    description: 'Program content extraction queue + apply/skip log.',
    owner: 'priya-sources',
    taskCategory: 'Reference',
    path: '/admin/extractions',
    status: 'active',
    icon: '⚗️',
    dashboardPriority: 64,
    abbr: 'Ex',
    badgeKey: 'refreshQueue',
  },
  {
    id: 'card-extractions',
    title: 'Card extractions',
    description: 'Card content extraction queue.',
    owner: 'priya-sources',
    taskCategory: 'Reference',
    path: '/admin/card-extractions',
    status: 'active',
    icon: '🧾',
    dashboardPriority: 26,
    abbr: 'Ce',
  },
  {
    id: 'refresh-queue',
    title: 'Refresh Queue',
    description: 'Programs/cards queued for a content refresh.',
    owner: 'priya-sources',
    taskCategory: 'Reference',
    path: '/admin/refresh-queue',
    status: 'active',
    icon: '♻️',
    dashboardPriority: 28,
    abbr: 'Rq',
  },
  {
    id: 'manual-overrides',
    title: 'Manual overrides',
    description: 'Manual field overrides that pin values against extraction.',
    owner: 'priya-sources',
    taskCategory: 'Reference',
    path: '/admin/manual-overrides',
    status: 'active',
    icon: '✏️',
    dashboardPriority: 20,
    abbr: 'Mo',
  },

  // ── Bill · Reliability ────────────────────────────────────────────────────
  {
    id: 'backups',
    title: 'Backups',
    description: 'Backup + disaster-recovery status.',
    owner: 'bill-security',
    taskCategory: 'Reliability',
    path: '/admin/backups',
    status: 'active',
    icon: '💾',
    dashboardPriority: 66,
    abbr: 'Bk',
  },
  {
    id: 'errors',
    title: 'Errors',
    description: 'Runtime error log + recent failures.',
    owner: 'bill-security',
    taskCategory: 'Reliability',
    path: '/admin/errors',
    status: 'active',
    icon: '🚨',
    dashboardPriority: 84,
    abbr: 'Er',
  },
  {
    id: 'jobs',
    title: 'Jobs',
    description: 'Cron + background job runs and health.',
    owner: 'bill-security',
    taskCategory: 'Reliability',
    path: '/admin/jobs',
    status: 'active',
    icon: '⚙️',
    dashboardPriority: 55,
    abbr: 'Jo',
  },

  // ── Devon · Design ────────────────────────────────────────────────────────
  {
    id: 'glossary',
    title: 'Glossary',
    description: 'The admin design-system vocabulary — chips, tokens, statuses.',
    owner: 'devon-design',
    taskCategory: 'Design',
    path: '/admin/glossary',
    status: 'active',
    icon: '🎨',
    dashboardPriority: 16,
    abbr: 'Gl',
  },

  // ── Erica · Finance ───────────────────────────────────────────────────────
  {
    id: 'expenses',
    title: 'Expenses',
    description: 'The money going out — log expenses, running + monthly totals, and a quick calculator.',
    owner: 'erica-finance',
    taskCategory: 'Finance',
    path: '/admin/expenses',
    status: 'active',
    icon: '🧾',
    dashboardPriority: 45,
    abbr: 'Ep',
  },

  // ── Deprecated ghosts (kept reachable for old bookmarks; NOT in the nav) ──
  {
    id: 'alerts-legacy',
    title: 'Alerts',
    description: 'Legacy alias — redirects to Drafts (?format=alert).',
    owner: 'john-content',
    taskCategory: 'Content',
    path: '/admin/alerts',
    status: 'deprecated',
    icon: '📰',
    dashboardPriority: 0,
    abbr: 'Al',
  },
  {
    id: 'intel-legacy',
    title: 'Intel',
    description: 'Legacy alias — redirects to Triage.',
    owner: 'priya-sources',
    taskCategory: 'Sources',
    path: '/admin/intel',
    status: 'deprecated',
    icon: '🛰️',
    dashboardPriority: 0,
    abbr: 'In',
  },
]

// ── Derived views ──────────────────────────────────────────────────────────

/** A task sub-section within one owner's nav group. */
export type NavSubSection = { taskCategory: TaskCategory; pages: AdminPage[] }
/** One owner group in the nav: the employee + their pages, grouped by task. */
export type NavOwnerGroup = { owner: Owner; sections: NavSubSection[] }

/**
 * Build the nav model: active pages grouped by owner (in OWNERS order), and
 * within each owner grouped into consecutive task sub-sections. Deprecated and
 * planned pages are excluded — they never appear in the sidebar.
 */
export function getNavOwnerGroups(): NavOwnerGroup[] {
  const active = ADMIN_PAGES.filter((p) => p.status === 'active')

  return (Object.values(OWNERS) as Owner[])
    .sort((a, b) => a.order - b.order)
    .map((owner) => {
      const pages = active.filter((p) => p.owner === owner.slug)
      // Fold consecutive same-category pages into sub-sections (order preserved).
      const sections: NavSubSection[] = []
      for (const page of pages) {
        const last = sections[sections.length - 1]
        if (last && last.taskCategory === page.taskCategory) last.pages.push(page)
        else sections.push({ taskCategory: page.taskCategory, pages: [page] })
      }
      return { owner, sections }
    })
    .filter((g) => g.sections.length > 0)
}

/** Look up a page by id. */
export function getAdminPage(id: string): AdminPage | undefined {
  return ADMIN_PAGES.find((p) => p.id === id)
}

/** All active pages sorted by dashboardPriority (highest first) — for the future "Today" queue. */
export function getPagesByPriority(): AdminPage[] {
  return ADMIN_PAGES.filter((p) => p.status === 'active').sort(
    (a, b) => b.dashboardPriority - a.dashboardPriority,
  )
}

// TODO (fast-follow, not blocking Phase 0): a global admin search bar (⌘K) that
// fuzzy-searches ADMIN_PAGES by title/description/owner/task so every page is
// reachable in two keystrokes regardless of which owner group it lives under.
