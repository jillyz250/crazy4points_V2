import type { MetadataRoute } from 'next'
import { createClient } from '@/utils/supabase/server'

export const revalidate = 3600

const BASE_URL = 'https://crazy4points.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let alertEntries: MetadataRoute.Sitemap = []
  let programEntries: MetadataRoute.Sitemap = []

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
  } catch {
    // Supabase unavailable — return static pages only
  }

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/alerts`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/daily-brief`, changeFrequency: 'hourly', priority: 0.9 },
  ]

  return [...staticPages, ...programEntries, ...alertEntries]
}
