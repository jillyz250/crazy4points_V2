/**
 * Search index — the corpus behind the header's global search.
 *
 * The whole searchable site is only ~310 items (programs, cards, alerts,
 * experiences, guides, blog posts), so we ship ONE compact JSON index and let
 * the browser filter it in memory. That means results appear as the reader
 * types with no per-keystroke database round trip, and no query load on
 * Supabase. The client fetches this lazily the first time search is opened,
 * so it costs nothing on a normal page view.
 *
 * Cached for an hour — the corpus changes when content is published, and
 * search being an hour stale is fine.
 */
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { GUIDES } from '@/lib/guides'

export const revalidate = 3600

export type SearchDocType = 'program' | 'card' | 'alert' | 'guide' | 'experience' | 'blog'

export interface SearchDoc {
  /** Entity kind, used for grouping + the result badge. */
  t: SearchDocType
  /** Display title. */
  n: string
  /** Secondary line (issuer, program type, category...). Optional. */
  s?: string
  /** Destination URL. */
  u: string
}

const PROGRAM_TYPE_LABEL: Record<string, string> = {
  airline: 'Airline program',
  hotel: 'Hotel program',
  alliance: 'Alliance',
  credit_card: 'Points currency',
}

export async function GET() {
  try {
    const supabase = createAdminClient()

    const [programs, cards, issuers, alerts, experiences, blog] = await Promise.all([
      // Authored program pages only — an active row without content_updated_at
      // has no published page and would 404.
      supabase
        .from('programs')
        .select('slug, name, type')
        .eq('is_active', true)
        .not('content_updated_at', 'is', null),
      supabase.from('credit_cards').select('slug, name, issuer_id').eq('is_active', true),
      supabase.from('issuers').select('id, name'),
      supabase
        .from('alerts')
        .select('slug, short_slug, title, type')
        .eq('status', 'published')
        .order('published_at', { ascending: false }),
      supabase
        .from('experiences')
        .select('slug, name, parent_program_label')
        .eq('status', 'published'),
      supabase
        .from('content_ideas')
        .select('slug, title, category')
        .eq('type', 'blog')
        .eq('status', 'published')
        .not('slug', 'is', null),
    ])

    const issuerName = new Map((issuers.data ?? []).map((i) => [i.id as string, i.name as string]))
    const docs: SearchDoc[] = []

    for (const p of programs.data ?? []) {
      docs.push({
        t: 'program',
        n: p.name as string,
        s: PROGRAM_TYPE_LABEL[p.type as string] ?? 'Program',
        u: `/programs/${p.slug}`,
      })
    }

    for (const c of cards.data ?? []) {
      docs.push({
        t: 'card',
        n: c.name as string,
        s: issuerName.get(c.issuer_id as string) ?? 'Credit card',
        u: `/cards/${c.slug}`,
      })
    }

    for (const a of alerts.data ?? []) {
      docs.push({
        t: 'alert',
        n: a.title as string,
        s: 'Alert',
        // short_slug is the canonical public URL when present.
        u: `/alerts/${(a.short_slug as string) || (a.slug as string)}`,
      })
    }

    for (const e of experiences.data ?? []) {
      docs.push({
        t: 'experience',
        n: e.name as string,
        s: (e.parent_program_label as string) ?? 'Experiences',
        u: `/experiences/${e.slug}`,
      })
    }

    for (const b of blog.data ?? []) {
      docs.push({
        t: 'blog',
        n: b.title as string,
        s: 'Article',
        u: `/blog/${b.slug}`,
      })
    }

    // Guides are a static registry, not a table.
    for (const g of GUIDES) {
      docs.push({ t: 'guide', n: g.title, s: 'Guide', u: `/guides/${g.slug}` })
    }

    return NextResponse.json(
      { docs },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[search-index] failed:', message)
    return NextResponse.json({ docs: [], error: message }, { status: 500 })
  }
}
