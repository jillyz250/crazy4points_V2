import type { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'
import { SITE_URL as BASE_URL } from '@/lib/constants'
import { selectAlertViewFromVariants } from '@/utils/content/alertView'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let alertEntries: MetadataRoute.Sitemap = []
  let programEntries: MetadataRoute.Sitemap = []
  let blogEntries: MetadataRoute.Sitemap = []
  let cardEntries: MetadataRoute.Sitemap = []
  let issuerEntries: MetadataRoute.Sitemap = []

  try {
    const supabase = await createClient()

    // Phase 3 Wave 2 flip #1: read alert URLs from content_variants + topics.
    // Public route, SEO-critical — every URL here is something Google indexes.
    // The adapter returns the same slug + published_at shape the legacy
    // alerts query did. Verification gate
    // (scripts/phase3-verify-wave2.mjs) confirmed parity vs the old read path
    // before this flip shipped.
    const alerts = await selectAlertViewFromVariants(supabase, { status: 'published', activeOnly: true })

    alertEntries = alerts.map((a) => ({
      url: `${BASE_URL}/alerts/${a.slug}`,
      lastModified: a.published_at ?? undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    const { data: programs } = await supabase
      .from('programs')
      .select('slug')
      .eq('is_active', true)

    programEntries = (programs ?? []).map((p: { slug: string }) => ({
      url: `${BASE_URL}/programs/${p.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))

    // Blog posts — published articles from content_ideas (type='blog'). Public
    // anon read is allowed via the RLS policy added in migration 039.
    const { data: blogPosts } = await supabase
      .from('content_ideas')
      .select('slug, published_at, updated_at')
      .eq('type', 'blog')
      .eq('status', 'published')
      .not('slug', 'is', null)
      .order('published_at', { ascending: false })

    blogEntries = (blogPosts ?? []).map(
      (p: { slug: string; published_at: string | null; updated_at: string | null }) => ({
        url: `${BASE_URL}/blog/${p.slug}`,
        lastModified: p.updated_at ?? p.published_at ?? undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
      })
    )

    const { data: cards } = await supabase
      .from('credit_cards')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })

    cardEntries = (cards ?? []).map((c: { slug: string; updated_at: string | null }) => ({
      url: `${BASE_URL}/cards/${c.slug}`,
      lastModified: c.updated_at ?? undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Issuer hub pages — one per bank.
    const { data: issuers } = await supabase
      .from('issuers')
      .select('slug, updated_at')

    issuerEntries = (issuers ?? []).map((i: { slug: string; updated_at: string | null }) => ({
      url: `${BASE_URL}/issuers/${i.slug}`,
      lastModified: i.updated_at ?? undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    // Supabase unavailable — return static pages only
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/alerts`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/daily-brief`, changeFrequency: 'hourly', priority: 0.9 },
  ]

  return [...staticPages, ...programEntries, ...issuerEntries, ...cardEntries, ...blogEntries, ...alertEntries]
}
