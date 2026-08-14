/**
 * Backfill experience_listings.image_url by scraping each listing's detail page.
 *
 * Run: set -a; . ./.env.local; set +a; node_modules/.bin/tsx scripts/backfill-experience-images.ts [--all] [--limit N]
 *
 * Default targets active MARQUEE listings (non-presale) with an empty image_url
 * — the gallery cards need them. --all includes presales too. Idempotent:
 * skips listings that already have an image. Sequential with a small delay to
 * stay polite to Firecrawl + the source sites.
 */
import { createAdminClient } from '@/utils/supabase/server'
import { isPointsExperience, type MarqueeListing } from '@/lib/experiences/marquee'
import { scrapeListingImage } from '@/utils/experiences/scrapeListingImage'

async function main() {
  const all = process.argv.includes('--all')
  const limIdx = process.argv.indexOf('--limit')
  const limit = limIdx >= 0 ? parseInt(process.argv[limIdx + 1] ?? '0', 10) : 0

  const sb = createAdminClient()
  const { data } = await sb
    .from('experience_listings')
    .select('id, title, category, format, points_required, current_bid, minimum_bid, detail_url, image_url')
    .eq('status', 'active')
  let targets = (data ?? []).filter((e) => e.detail_url && !e.image_url)
  // default: points experiences (the gallery/finder need them); --all = everything
  if (!all) targets = targets.filter((e) => isPointsExperience(e as unknown as MarqueeListing))
  if (limit > 0) targets = targets.slice(0, limit)

  console.log(`backfilling images for ${targets.length} listing(s)${all ? ' (incl. presales)' : ' (points experiences)'}...`)
  let hit = 0
  let miss = 0
  for (const t of targets) {
    const img = await scrapeListingImage(t.detail_url as string)
    if (img) {
      await sb.from('experience_listings').update({ image_url: img }).eq('id', t.id)
      hit++
      console.log(`  ✅ ${(t.title as string).slice(0, 40)}`)
    } else {
      miss++
      console.log(`  ❌ ${(t.title as string).slice(0, 40)}`)
    }
    // small courtesy delay between scrapes
    await new Promise((r) => setTimeout(r, 400))
  }
  console.log(`\ndone: ${hit} image(s) saved, ${miss} miss(es).`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
