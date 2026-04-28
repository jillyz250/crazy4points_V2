import type { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export const revalidate = 3600

const BASE_URL = 'https://crazy4points.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let alertEntries: MetadataRoute.Sitemap = []
  let programEntries: MetadataRoute.Sitemap = []
  let blogEntries: MetadataRoute.Sitemap = []
  let cardEntries: MetadataRoute.Sitemap = []

  try {
    const supabase = await createClient()

    const { data: alerts } = await supabase
      .from('alerts')
      .select('slug, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    alertEntries = (alerts ?? []).map((a: { slug: string; published_at: string | null }) => ({
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
  } catch {
    // Supabase unavailable — return static pages only
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/alerts`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/daily-brief`, changeFrequency: 'hourly', priority: 0.9 },
  ]

  return [...staticPages, ...programEntries, ...cardEntries, ...blogEntries, ...alertEntries]
}
