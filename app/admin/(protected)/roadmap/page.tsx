import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { Card } from '@/components/admin/ui/Card'
import { Badge } from '@/components/admin/ui/Badge'
import { createAdminClient } from '@/utils/supabase/server'
import { normalizeTag } from '@/lib/contentTags'
import { fillRoadmapGapsAction } from '../content-ideas/actions'
import {
  ROADMAP,
  PILLARS,
  isLive,
  roadmapProgress,
  upNext,
  pillarLabel,
  PLATFORM_TRACK,
  platformProgress,
} from '@/lib/contentRoadmap'

export const metadata: Metadata = { title: 'Content Roadmap' }

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ height: '8px', borderRadius: '999px', background: 'var(--admin-border)', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--admin-accent)' }} />
    </div>
  )
}

const platformTone: Record<string, 'success' | 'accent' | 'neutral'> = {
  done: 'success',
  next: 'accent',
  planned: 'neutral',
}

export default async function RoadmapPage() {
  const prog = roadmapProgress()
  const plat = platformProgress()
  const next = upNext(4)

  // Content ideas tagged into a pillar (migration 619) — the opportunistic feed
  // promoted onto the roadmap spine. Only open ideas, grouped by pillar.
  const sb = createAdminClient()
  const { data: promotedRows } = await sb
    .from('content_ideas')
    .select('id, title, roadmap_pillar, tags, priority')
    .not('roadmap_pillar', 'is', null)
    .in('status', ['new', 'idea_bank'])
    .limit(500)
  const normTitle = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const plannedTitles = new Set(ROADMAP.map((i) => normTitle(i.title)))
  // Planned slots that now have a backing idea (gap-filler) → shown as "idea ready".
  const backedTitles = new Set((promotedRows ?? []).map((r) => normTitle(r.title as string)))
  const promotedByPillar: Record<string, { id: string; title: string; priority: number }[]> = {}
  // Coverage counter: how many tagged ideas carry each tag. Tags are canonicalized
  // (normalizeTag) at read time so program-name variants collapse to one bar,
  // even for ideas tagged before the whitelist existed.
  const tagCounts = new Map<string, number>()
  for (const r of promotedRows ?? []) {
    const key = r.roadmap_pillar as string
    // "Tagged ideas" = ideas BEYOND the plan; a gap-filler idea that just backs
    // a planned slot shows as "idea ready" on that slot instead of duplicating.
    if (!plannedTitles.has(normTitle(r.title as string))) {
      ;(promotedByPillar[key] ??= []).push({
        id: r.id as string,
        title: r.title as string,
        priority: (r.priority as number | null) ?? 2,
      })
    }
    // Canonicalize + dedupe within a row so one idea can't double-count a tag.
    const seen = new Set<string>()
    for (const t of (Array.isArray(r.tags) ? (r.tags as string[]) : [])) {
      const c = normalizeTag(t)
      if (!c || seen.has(c)) continue
      seen.add(c)
      tagCounts.set(c, (tagCounts.get(c) ?? 0) + 1)
    }
  }
  // High-priority first within each pillar, then title.
  for (const key of Object.keys(promotedByPillar)) {
    promotedByPillar[key].sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title))
  }
  const coverage = [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

  return (
    <div>
      <PageHeader
        title="Content roadmap"
        description="The whole plan across both tracks — content and platform — with what's shipped and what's next."
      />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <form action={fillRoadmapGapsAction}>
          <button
            type="submit"
            className="admin-btn admin-btn-ghost admin-btn-sm"
            title="Create a writable content idea for every roadmap slot that has nothing behind it yet. Idempotent — safe to re-run."
          >
            ✨ Fill roadmap gaps
          </button>
        </form>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))', marginBottom: '1.5rem' }}>
        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-text-muted)', fontWeight: 700 }}>Track 1 · Content</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.35rem 0 0.6rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text)' }}>{prog.done}</span>
            <span style={{ color: 'var(--admin-text-subtle)' }}>/ {prog.total} guides · {prog.pct}%</span>
          </div>
          <ProgressBar pct={prog.pct} />
        </Card>
        <Card style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-text-muted)', fontWeight: 700 }}>Track 2 · Platform</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.35rem 0 0.6rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--admin-text)' }}>{plat.done}</span>
            <span style={{ color: 'var(--admin-text-subtle)' }}>/ {plat.total} builds shipped</span>
          </div>
          <ProgressBar pct={Math.round((plat.done / plat.total) * 100)} />
        </Card>
      </div>

      {/* Coverage — tagged ideas per tag (mostly program names). Shows where
          content is stacking up and where the gaps are. */}
      {coverage.length > 0 && (
        <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.6rem' }}>
            <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-text-subtle)', fontWeight: 700 }}>Coverage by tag</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)' }}>{coverage.length} tags · {promotedRows?.length ?? 0} tagged ideas</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {coverage.map(([tag, count]) => (
              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', border: '1px solid var(--admin-border)', borderRadius: '999px', padding: '0.15rem 0.5rem', background: 'var(--admin-bg-subtle)' }}>
                <span style={{ color: 'var(--admin-text)' }}>{tag}</span>
                <span style={{ fontWeight: 800, color: 'var(--admin-accent)' }}>{count}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Up next */}
      <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--admin-text-subtle)', fontWeight: 700, marginBottom: '0.6rem' }}>Up next</div>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {next.map((item, i) => (
            <li key={item.title} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  flex: '0 0 auto', width: '1.4rem', height: '1.4rem', display: 'grid', placeItems: 'center',
                  borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                  background: i === 0 ? 'var(--admin-accent)' : 'var(--admin-accent-soft)',
                  color: i === 0 ? '#fff' : 'var(--admin-accent)',
                }}
              >
                {i + 1}
              </span>
              <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--admin-text)', fontWeight: i === 0 ? 600 : 400 }}>
                {item.title}
              </span>
              <Badge tone="neutral">{pillarLabel(item.pillar)}</Badge>
            </li>
          ))}
        </ol>
      </Card>

      {/* Content track — pillars */}
      <h2 style={{ fontSize: '1rem', color: 'var(--admin-text)', margin: '0 0 0.75rem' }}>Content pillars</h2>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {PILLARS.map((pillar) => {
          const items = ROADMAP.filter((i) => i.pillar === pillar.key)
          const done = items.filter(isLive).length
          return (
            <Card key={pillar.key} style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '0.5rem 0.75rem', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--admin-text)' }}>{pillar.label}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--admin-text-muted)', flex: 1 }}>{pillar.blurb}</span>
                <Badge tone={done === items.length ? 'success' : 'neutral'}>{done}/{items.length}</Badge>
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {items.map((item) => {
                  const live = isLive(item)
                  return (
                    <li key={item.title} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.875rem' }}>
                      <span aria-hidden="true" style={{ flex: '0 0 auto', color: live ? 'var(--admin-success)' : 'var(--admin-text-subtle)', fontWeight: 700, width: '1rem', textAlign: 'center' }}>
                        {live ? '✓' : '·'}
                      </span>
                      {live && item.guideSlug ? (
                        <Link href={`/guides/${item.guideSlug}`} target="_blank" style={{ color: 'var(--admin-link)', flex: 1 }}>{item.title}</Link>
                      ) : (
                        <span style={{ color: live ? 'var(--admin-text)' : 'var(--admin-text-muted)', flex: 1 }}>{item.title}</span>
                      )}
                      {live ? (
                        <Badge tone="success">live</Badge>
                      ) : backedTitles.has(normTitle(item.title)) ? (
                        <Badge tone="accent">idea ready</Badge>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: 'var(--admin-text-subtle)' }}>planned</span>
                      )}
                    </li>
                  )
                })}
              </ul>
              {(promotedByPillar[pillar.key]?.length ?? 0) > 0 && (
                <div style={{ marginTop: '0.7rem', borderTop: '1px dashed var(--admin-border)', paddingTop: '0.55rem' }}>
                  <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--admin-accent)', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Tagged ideas ({promotedByPillar[pillar.key].length})
                  </div>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {promotedByPillar[pillar.key].map((idea) => (
                      <li key={idea.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                        <span aria-hidden style={{ color: 'var(--admin-accent)', fontWeight: 700 }}>+</span>
                        <Link href="/admin/content-ideas" style={{ color: 'var(--admin-text)', flex: 1 }}>{idea.title}</Link>
                        {idea.priority === 1 && (
                          <span title="High priority" style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--admin-accent)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>↑ High</span>
                        )}
                        {idea.priority === 3 && (
                          <span title="Low priority" style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle)' }}>↓ Low</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Platform track */}
      <h2 style={{ fontSize: '1rem', color: 'var(--admin-text)', margin: '1.75rem 0 0.75rem' }}>Platform · the knowledge graph</h2>
      <Card style={{ padding: '1rem 1.25rem' }}>
        <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: 'var(--admin-text-muted)' }}>
          The machine under the content: data layers so cards, programs, benefits, guides, and alerts reference each other.
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {PLATFORM_TRACK.map((item) => (
            <li key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
              <Badge tone={platformTone[item.status]}>{item.status}</Badge>
              <span style={{ flex: 1 }}>
                <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--admin-text)' }}>{item.title}</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--admin-text-muted)' }}>{item.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
