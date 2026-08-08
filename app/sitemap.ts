import type { MetadataRoute } from 'next'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { SITE_URL as BASE_URL } from '@/lib/constants'
import { selectAlertViewFromVariants } from '@/utils/content/alertView'
import { getPublicNewsletters } from '@/utils/content/publicNewsletters'
import { getExperiences } from '@/utils/supabase/queries'
import { GUIDES } from '@/lib/guides'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let alertEntries: MetadataRoute.Sitemap = []
  let programEntries: MetadataRoute.Sitemap = []
  let blogEntries: MetadataRoute.Sitemap = []
  let cardEntries: MetadataRoute.Sitemap = []
  let issuerEntries: MetadataRoute.Sitemap = []
  let newsletterEntries: MetadataRoute.Sitemap = []
  let experienceEntries: MetadataRoute.Sitemap = []

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

    // content_updated_at is bumped on every content write (the staleness
    // signal); updated_at is the row-level fallback. Preferring the former
    // gives crawlers a real "when did this page change" date instead of none.
    const { data: programs } = await supabase
      .from('programs')
      .select('slug, content_updated_at, updated_at')
      .eq('is_active', true)

    programEntries = (programs ?? []).map(
      (p: { slug: string; content_updated_at: string | null; updated_at: string | null }) => ({
        url: `${BASE_URL}/programs/${p.slug}`,
        lastModified: p.content_updated_at ?? p.updated_at ?? undefined,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      })
    )

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
      .eq('closed_to_new_applicants', false)
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

    // Public newsletter archive — each sent issue is an indexable page.
    const newsletters = await getPublicNewsletters(supabase)
    newsletterEntries = newsletters.map((n) => ({
      url: `${BASE_URL}/newsletter/${n.slug}`,
      lastModified: n.sent_at ?? undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

    // Experiences directory — one indexable page per published experience.
    // The experiences table isn't anon-readable (the hub reads it with the
    // service role), so use the admin client here too.
    const experiences = await getExperiences(createAdminClient())
    experienceEntries = experiences.map((e) => ({
      url: `${BASE_URL}/experiences/${e.slug}`,
      lastModified: e.last_verified ?? undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  } catch {
    // Supabase unavailable — return static pages only
  }

  // Editorial guides — driven by the lib/guides.ts registry (no DB), so these
  // are emitted even if Supabase is down.
  const guideEntries: MetadataRoute.Sitemap = GUIDES.map((g) => ({
    url: `${BASE_URL}/guides/${g.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/alerts`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/cards`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/daily-brief`, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/start-here`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/guides`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/experiences`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/decision-engine`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/destinations`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/newsletter`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/tools/alliances`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/tools/ways-to-book`, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/tools/sapphire-reserve-checklist`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  return [...staticPages, ...guideEntries, ...programEntries, ...issuerEntries, ...cardEntries, ...blogEntries, ...newsletterEntries, ...experienceEntries, ...alertEntries]
}
