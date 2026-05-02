import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Reciprocal AI bots — explicit allow so the policy is documented
      // and they can crawl + cite us. Citations are referral traffic.
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'GoogleOther', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
      // Aggressive non-reciprocal scrapers — they take but don't cite.
      // They honor robots.txt entries that name them specifically.
      { userAgent: 'Bytespider', disallow: '/' },
      { userAgent: 'PetalBot', disallow: '/' },
      // Default
      { userAgent: '*', allow: '/' },
    ],
    sitemap: 'https://crazy4points.com/sitemap.xml',
  }
}
