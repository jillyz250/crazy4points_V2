import type { MetadataRoute } from 'next'
import { sanityFetch } from '@/lib/sanityClient'
import { PROGRAM_SLUGS } from '@/lib/programs'

export const revalidate = 3600

const BASE_URL = 'https://crazy4points.com'

interface AlertSlug {
  slug: string
  publishedAt: string
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let alerts: AlertSlug[] = []
  try {
    alerts = await sanityFetch<AlertSlug[]>(
      `*[_type == "alert" && isApproved == true]{ "slug": slug.current, publishedAt }`
    )
  } catch {
    // Sanity unavailable — sitemap still returns static and program URLs
  }

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/alerts`,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/daily-brief`,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ]

  const programPages: MetadataRoute.Sitemap = PROGRAM_SLUGS.map((slug) => ({
    url: `${BASE_URL}/programs/${slug}`,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  const alertPages: MetadataRoute.Sitemap = alerts.map((alert) => ({
    url: `${BASE_URL}/alerts/${alert.slug}`,
    lastModified: alert.publishedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  return [...staticPages, ...programPages, ...alertPages]
}
