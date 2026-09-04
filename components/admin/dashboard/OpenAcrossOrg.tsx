/**
 * OpenAcrossOrg — the "nothing gets lost" board (Devon, 2026-09-04).
 *
 * Registry-driven: for every countable admin queue (lib/admin/openCounts.ts) it
 * shows a live open-count as a compact one-line row, grouped under the head who
 * owns it. Zero-count rows vanish; an all-zero group vanishes; a fully-clear org
 * collapses to a single calm strip. Backlog piles render muted so a big number
 * can't shout over real work.
 *
 * Two modes, one source of truth:
 *   • dashboard (no `only`): the full board — one card per owner, worst first.
 *   • org page (`only={slug}`): just that head's slice, retitled "Open queues".
 *
 * It ships its own scoped CSS (oao-*) built on the shared --admin-* tokens, so it
 * reads natively on the dashboard (beside dh-* rows) and on the org page alike.
 */
import Link from 'next/link'
import { ADMIN_PAGES, OWNERS, type OwnerSlug, type AdminPage } from '@/lib/admin/registry'
import { OPEN_COUNT_SPECS, OPEN_COUNT_TIER, type OpenCountTier } from '@/lib/admin/openCounts'
import { Icon, type IconName } from '@/components/admin/preview/icons'

// A distinct glyph per countable surface (falls back to a neutral list icon).
const SURFACE_ICON: Record<string, IconName> = {
  triage: 'inbox',
  drafts: 'pencil',
  'change-signals': 'activity',
  'card-bonus-signals': 'creditCard',
  'program-drift': 'shield',
  'verification-findings': 'check',
  'refresh-queue': 'gauge',
  experiences: 'star',
  sweepstakes: 'award',
  errors: 'alert',
  'content-ideas-blog': 'lightbulb',
}

type Row = { page: AdminPage; count: number; tier: OpenCountTier }
type Group = { owner: (typeof OWNERS)[OwnerSlug]; rows: Row[]; sum: number }

// Per-head category grouping for the "Open queues" slice (Jill, 2026-09-04).
// Only Priya for now — her surfaces bucket into five named categories. `ids` are
// countable surfaces (shown only when count > 0); `links` are static entries for
// areas with no queue count (source health/coverage), so the category is present.
type CatGroup = { label: string; ids?: string[]; links?: { title: string; href: string; icon: IconName }[] }
const CATEGORY_MAP: Partial<Record<OwnerSlug, CatGroup[]>> = {
  'priya-sources': [
    { label: 'Triage', ids: ['triage'] },
    { label: 'Sources', links: [{ title: 'Source health & coverage', href: '/admin/sources', icon: 'globe' }] },
    { label: 'Changes', ids: ['change-signals', 'card-bonus-signals'] },
    { label: 'Data integrity', ids: ['program-drift', 'verification-findings'], links: [{ title: 'Accuracy hub', href: '/admin/accuracy?tab=data-integrity', icon: 'shield' }] },
    { label: 'Freshness', ids: ['refresh-queue'] },
  ],
}

// Registry page for a countable id, only if it's an active surface.
const pageById = new Map<string, AdminPage>(
  ADMIN_PAGES.filter((p) => p.status === 'active').map((p) => [p.id, p]),
)

/**
 * Build the owner-grouped model from live counts. Only surfaces with a known
 * count > 0 survive. Within a group: actionable before backlog, then count desc.
 * Groups are ordered by the owner's nav order; a group with no live rows drops.
 */
export function buildOpenGroups(counts: Record<string, number>, only?: OwnerSlug): Group[] {
  const rowsByOwner = new Map<OwnerSlug, Row[]>()
  for (const spec of OPEN_COUNT_SPECS) {
    const page = pageById.get(spec.id)
    if (!page || !page.owner) continue
    if (only && page.owner !== only) continue
    const n = counts[spec.id]
    if (n == null || n <= 0) continue
    const list = rowsByOwner.get(page.owner) ?? []
    list.push({ page, count: n, tier: spec.tier })
    rowsByOwner.set(page.owner, list)
  }

  const tierRank: Record<OpenCountTier, number> = { actionable: 0, backlog: 1 }
  return (Object.values(OWNERS) as (typeof OWNERS)[OwnerSlug][])
    .sort((a, b) => a.order - b.order)
    .map((owner) => {
      const rows = (rowsByOwner.get(owner.slug) ?? []).sort(
        (a, b) => tierRank[a.tier] - tierRank[b.tier] || b.count - a.count,
      )
      const sum = rows.reduce((s, r) => s + r.count, 0)
      return { owner, rows, sum }
    })
    .filter((g) => g.rows.length > 0)
}

function Rows({ rows }: { rows: Row[] }) {
  return (
    <>
      {rows.map((r) => (
        <Link
          key={r.page.id}
          href={r.page.path}
          className={`oao-row${r.tier === 'backlog' ? ' oao-row-quiet' : ''}`}
          title={r.page.description}
        >
          <span className="oao-ic"><Icon name={SURFACE_ICON[r.page.id] ?? 'note'} size={16} /></span>
          <span className="oao-title">{r.page.title}</span>
          {r.tier === 'backlog' && <span className="oao-tag">backlog</span>}
          <span className="oao-count">{r.count.toLocaleString()}</span>
          <span className="oao-go"><Icon name="arrow" size={14} /></span>
        </Link>
      ))}
    </>
  )
}

/**
 * The board. Pass `only={ownerSlug}` for the per-head slice on an org page;
 * omit it for the full dashboard board.
 */
export default function OpenAcrossOrg({
  counts,
  only,
}: {
  counts: Record<string, number>
  only?: OwnerSlug
}) {
  const groups = buildOpenGroups(counts, only)
  const totalOpen = groups.reduce((s, g) => s + g.sum, 0)

  // ── Per-head slice (org page) ──
  if (only) {
    const cats = CATEGORY_MAP[only]
    const g = groups[0]
    // Categorized view (e.g. Priya): render even when some categories are empty,
    // because static-link categories (Sources) should always show.
    if (cats) {
      const rowById = new Map((g?.rows ?? []).map((r) => [r.page.id, r]))
      const sum = g?.sum ?? 0
      const sections = cats
        .map((c) => ({
          label: c.label,
          rows: (c.ids ?? []).map((id) => rowById.get(id)).filter((r): r is Row => !!r),
          links: c.links ?? [],
        }))
        .filter((s) => s.rows.length > 0 || s.links.length > 0)
      if (sections.length === 0) return null
      return (
        <section className="oao-section">
          <style dangerouslySetInnerHTML={{ __html: OAO_CSS }} />
          <div className="oao-sec-head">
            <h2 className="oao-sec-title">Open queues</h2>
            <span className="oao-sec-meta">{sum.toLocaleString()} open</span>
          </div>
          <div className="oao-card oao-solo">
            {sections.map((s) => (
              <div key={s.label} className="oao-cat">
                <div className="oao-cat-label">{s.label}</div>
                {s.rows.length > 0 && <Rows rows={s.rows} />}
                {s.links.map((lk) => (
                  <Link key={lk.href} href={lk.href} className="oao-row oao-row-quiet" title={lk.title}>
                    <span className="oao-ic"><Icon name={lk.icon} size={16} /></span>
                    <span className="oao-title">{lk.title}</span>
                    <span className="oao-go"><Icon name="arrow" size={14} /></span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </section>
      )
    }
    // Flat view (every other head)
    if (groups.length === 0) return null // clean desk → no section at all
    return (
      <section className="oao-section">
        <style dangerouslySetInnerHTML={{ __html: OAO_CSS }} />
        <div className="oao-sec-head">
          <h2 className="oao-sec-title">Open queues</h2>
          <span className="oao-sec-meta">{g.sum.toLocaleString()} open</span>
        </div>
        <div className="oao-card oao-solo">
          <Rows rows={g.rows} />
        </div>
      </section>
    )
  }

  // ── Full board (dashboard) ──
  return (
    <section className="oao-section">
      <style dangerouslySetInnerHTML={{ __html: OAO_CSS }} />
      <div className="oao-sec-head">
        <h2 className="oao-sec-title">Open across the org</h2>
        <span className="oao-sec-meta">
          {groups.length === 0
            ? 'All clear'
            : `${totalOpen.toLocaleString()} open · ${groups.length} owner${groups.length === 1 ? '' : 's'}`}
        </span>
      </div>
      {groups.length === 0 ? (
        <div className="oao-clear">
          <Icon name="check" size={15} />
          <span className="oao-clear-txt">All queues clear &mdash; nothing waiting anywhere</span>
        </div>
      ) : (
        <div className="oao-grid">
          {groups.map((g) => (
            <div key={g.owner.slug} className="oao-card oao-group">
              <Link href={`/admin/org/${g.owner.slug}`} className="oao-group-head" title={`${g.owner.name} — ${g.owner.role}`}>
                <span className="oao-owner-emoji">{g.owner.emoji}</span>
                <span className="oao-owner-id">
                  <span className="oao-owner-name">{g.owner.name}</span>
                  <span className="oao-owner-role">{g.owner.role}</span>
                </span>
                <span className="oao-group-sum">{g.sum.toLocaleString()}</span>
              </Link>
              <div className="oao-rows">
                <Rows rows={g.rows} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const OAO_CSS = `
.admin .oao-section { margin-bottom:3rem; }
.admin .oao-sec-head { display:flex; align-items:baseline; justify-content:space-between; gap:12px; margin-bottom:1rem; padding:0 2px; }
.admin .oao-sec-title { font-family:var(--font-display); font-size:1.4rem; font-weight:700; letter-spacing:-.01em; color:var(--admin-text); margin:0; }
.admin .oao-sec-meta { font-size:var(--admin-text-xs); text-transform:uppercase; letter-spacing:.08em; color:var(--admin-text-subtle); font-weight:700; font-variant-numeric:tabular-nums; }

/* Card shell — matches the dashboard dh-card treatment (same tokens/shadow) */
.admin .oao-card { background:var(--admin-surface); border:1px solid color-mix(in srgb, var(--color-primary) 9%, var(--admin-border)); border-radius:18px; box-shadow:0 1px 2px rgba(107,45,143,.035), 0 18px 40px -30px rgba(107,45,143,.26); overflow:hidden; }

/* Owner-column grid — stacks on narrow viewports (never a fixed N-col grid) */
/* min(100%, 300px) so a single column can never exceed the viewport at 375px */
.admin .oao-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap:1.25rem; }
.admin .oao-grid > * { min-width:0; }

/* Group header = the owning head (links to their org page) */
.admin .oao-group-head { display:flex; align-items:center; gap:11px; padding:13px 15px; text-decoration:none; border-bottom:1px solid var(--admin-border); transition:background .14s ease; }
.admin .oao-group-head:hover { background:color-mix(in srgb, var(--color-primary) 4%, #fff); text-decoration:none; }
.admin .oao-owner-emoji { display:flex; align-items:center; justify-content:center; width:34px; height:34px; border-radius:50%; flex-shrink:0; font-size:1.05rem; line-height:1; background:var(--admin-accent-soft); border:1px solid color-mix(in srgb, var(--color-accent) 28%, var(--admin-border)); }
.admin .oao-owner-id { display:flex; flex-direction:column; min-width:0; flex:1; }
.admin .oao-owner-name { font-size:var(--admin-text-sm); font-weight:800; color:var(--admin-text); letter-spacing:-.01em; }
.admin .oao-group-head:hover .oao-owner-name { color:var(--color-primary); }
.admin .oao-owner-role { font-size:var(--admin-text-xs); color:var(--admin-text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.admin .oao-group-sum { flex-shrink:0; font-family:var(--font-display); font-size:1.25rem; font-weight:800; color:var(--color-primary); line-height:1; font-variant-numeric:tabular-nums; }

/* Rows */
.admin .oao-rows { padding:5px; }
.admin .oao-solo { padding:5px; }
/* Category groupings inside a per-head slice (e.g. Priya's 5) */
.admin .oao-cat + .oao-cat { margin-top:5px; border-top:1px solid var(--admin-border); padding-top:5px; }
.admin .oao-cat-label { font-size:var(--admin-text-xs); font-weight:800; text-transform:uppercase; letter-spacing:.06em; color:var(--admin-text-muted); padding:8px 12px 5px; }
.admin .oao-row { display:flex; align-items:center; gap:12px; padding:11px 12px; border-radius:11px; text-decoration:none; transition:background .14s ease; }
.admin .oao-row + .oao-row { border-top:1px solid var(--admin-border); border-radius:0; }
.admin .oao-row:hover { background:color-mix(in srgb, var(--color-primary) 4%, #fff); text-decoration:none; }
.admin .oao-ic { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:9px; flex-shrink:0; color:var(--color-primary); background:color-mix(in srgb, var(--color-primary) 8%, #fff); border:1px solid color-mix(in srgb, var(--color-primary) 12%, var(--admin-border)); }
.admin .oao-title { flex:1; min-width:0; font-size:var(--admin-text-sm); font-weight:700; color:var(--admin-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.admin .oao-tag { flex-shrink:0; font-size:var(--admin-text-xs); font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--admin-text-subtle); background:var(--admin-surface-alt); border:1px solid var(--admin-border); padding:1px 7px; border-radius:9999px; }
.admin .oao-count { flex-shrink:0; font-size:var(--admin-text-sm); font-weight:800; color:var(--admin-text); font-variant-numeric:tabular-nums; min-width:1.5rem; text-align:right; }
.admin .oao-go { flex-shrink:0; color:var(--admin-text-subtle); opacity:0; transform:translateX(-4px); transition:opacity .14s ease, transform .14s ease; }
.admin .oao-row:hover .oao-go { opacity:1; transform:translateX(0); color:var(--color-primary); }

/* Backlog rows — deliberately quieter so a big pile can't shout over real work */
.admin .oao-row-quiet .oao-ic { color:var(--admin-text-muted); background:var(--admin-surface-alt); border-color:var(--admin-border); }
.admin .oao-row-quiet .oao-title { font-weight:600; color:var(--admin-text-secondary); }
.admin .oao-row-quiet .oao-count { font-weight:700; color:var(--admin-text-muted); }

/* All-clear strip — one calm line, not a whole section of "nothing wrong" */
.admin .oao-clear { display:flex; align-items:center; gap:8px; padding:12px 16px; border-radius:12px; background:var(--admin-surface); border:1px solid var(--admin-border); color:var(--admin-success); }
.admin .oao-clear-txt { font-size:var(--admin-text-sm); font-weight:600; color:var(--admin-text-secondary); }
`
