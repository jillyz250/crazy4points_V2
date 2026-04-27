import type { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

// 10-minute ISR window. New programs / destinations / alerts / blog posts
// added in admin show up in the sitemap within ~10 min even without an
// explicit revalidatePath call. Publish actions also call
// revalidatePath('/sitemap.xml') for instant invalidation.
export const revalidate = 600

const BASE_URL = 'https://crazy4points.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let alertEntries: MetadataRoute.Sitemap = []
  let programEntries: MetadataRoute.Sitemap = []
  let blogEntries: MetadataRoute.Sitemap = []
  let destinationEntries: MetadataRoute.Sitemap = []

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

    // Programs (airlines, hotels, cruise lines, future categories — anything
    // added to the programs table with is_active=true).
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

    // Destinations (per migrations 010 + 011). Best-effort — if the table
    // schema differs or RLS blocks the read, the catch above handles it
    // gracefully and the sitemap just omits these entries.
    const { data: destinations } = await supabase
      .from('destinations')
      .select('slug, updated_at')

    destinationEntries = (destinations ?? []).map(
      (d: { slug: string; updated_at: string | null }) => ({
        url: `${BASE_URL}/destinations/${d.slug}`,
        lastModified: d.updated_at ?? undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      })
    )
  } catch {
    // Supabase unavailable — return static pages only
  }

  // Static public routes that exist in the file system. Keep this list in sync
  // when adding new top-level routes (e.g. /tools, /cruises, /guides).
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/alerts`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/daily-brief`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/destinations`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/decision-engine`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/newsletter`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.4 },
  ]

  return [
    ...staticPages,
    ...programEntries,
    ...destinationEntries,
    ...blogEntries,
    ...alertEntries,
  ]
}
