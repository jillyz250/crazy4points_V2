/**
 * Backfill programs.logo_url with each brand's own favicon (nominative fair use:
 * a program's own mark, used to identify that program). Sourced from the brand's
 * domain via Google's favicon service at 128px — reliable, and it proxies the
 * site's own icon rather than a third-party rendition.
 *
 * Curated slug -> domain map (the major programs first; the long tail can be
 * added later). Only sets a logo for a mapped slug; leaves the rest null.
 *
 * Run: set -a; . ./.env.local; set +a; node_modules/.bin/tsx scripts/backfill-program-logos.ts
 */
import { createAdminClient } from '@/utils/supabase/server'

const DOMAINS: Record<string, string> = {
  // US airlines
  aa: 'aa.com', delta: 'delta.com', united: 'united.com', alaska: 'alaskaair.com',
  southwest: 'southwest.com', jetblue: 'jetblue.com', hawaiian: 'hawaiianairlines.com',
  atmos: 'alaskaair.com', spirit: 'spirit.com', frontier: 'flyfrontier.com',
  allegiant: 'allegiantair.com', 'sun-country': 'suncountry.com', avelo: 'aveloair.com',
  breeze: 'flybreeze.com',
  // Canada / Europe
  'air-canada': 'aircanada.com', aeroplan: 'aircanada.com', 'british-airways': 'britishairways.com',
  'ba-avios': 'britishairways.com', 'air-france': 'airfrance.com', klm: 'klm.com',
  'flying-blue': 'flyingblue.com', lufthansa: 'lufthansa.com', 'miles-and-more': 'miles-and-more.com',
  swiss: 'swiss.com', austrian: 'austrian.com', iberia: 'iberia.com', finnair: 'finnair.com',
  tap: 'flytap.com', sas: 'flysas.com', aegean: 'aegeanair.com', 'aer-lingus': 'aerlingus.com',
  'virgin-atlantic': 'virginatlantic.com', 'virgin-red': 'virgin.com', icelandair: 'icelandair.com',
  norwegian: 'norwegian.com', 'ita-airways': 'itaspa.com', vueling: 'vueling.com', condor: 'condor.com',
  // Middle East / Africa / Asia
  emirates: 'emirates.com', etihad: 'etihad.com', qatar: 'qatarairways.com',
  turkish: 'turkishairlines.com', krisflyer: 'singaporeair.com', cathay: 'cathaypacific.com',
  ana: 'ana.co.jp', jal: 'jal.co.jp', 'korean-air': 'koreanair.com', asiana: 'flyasiana.com',
  thai: 'thaiairways.com', 'eva-air': 'evaair.com', 'china-airlines': 'china-airlines.com',
  srilankan: 'srilankan.com', 'air-india': 'airindia.com', vietnam: 'vietnamairlines.com',
  'vietnam-airlines': 'vietnamairlines.com', garuda: 'garuda-indonesia.com',
  'garuda-indonesia': 'garuda-indonesia.com', ethiopian: 'ethiopianairlines.com', saudia: 'saudia.com',
  starlux: 'starlux-airlines.com', 'oman-air': 'omanair.com',
  // Latin America / Pacific
  qantas: 'qantas.com', 'virgin-australia': 'virginaustralia.com', 'air-new-zealand': 'airnewzealand.com',
  avianca: 'avianca.com', copa: 'copaair.com', latam: 'latam.com', aeromexico: 'aeromexico.com',
  azul: 'voeazul.com.br', smiles: 'smiles.com.br', volaris: 'volaris.com', 'fiji-airways': 'fijiairways.com',
  // Alliances
  oneworld: 'oneworld.com', 'star-alliance': 'staralliance.com', skyteam: 'skyteam.com',
  // Hotels
  'marriott-bonvoy': 'marriott.com', hilton: 'hilton.com', hyatt: 'hyatt.com', ihg: 'ihg.com',
  wyndham: 'wyndhamhotels.com', choice: 'choicehotels.com', 'best-western': 'bestwestern.com',
  accor: 'accor.com', radisson: 'radissonhotels.com', 'radisson-americas': 'radissonhotels.com',
  sonesta: 'sonesta.com', omni: 'omnihotels.com', langham: 'langhamhotels.com',
  'shangri-la': 'shangri-la.com', melia: 'melia.com', barcelo: 'barcelo.com', sandals: 'sandals.com',
  mgm: 'mgmresorts.com', caesars: 'caesars.com', 'club-med': 'clubmed.us', 'leading-hotels': 'lhw.com',
  iprefer: 'preferredhotels.com', 'gha-discovery': 'ghadiscovery.com', slh: 'slh.com',
  stash: 'stashrewards.com', 'disney-vacation-club': 'disneyvacationclub.disney.go.com',
  'bahia-principe': 'bahia-principe.com',
  // Banks / transferable currencies
  amex: 'americanexpress.com', chase: 'chase.com', citi: 'citi.com', 'capital-one': 'capitalone.com',
  bilt: 'biltrewards.com', 'wells-fargo': 'wellsfargo.com', 'bank-of-america': 'bankofamerica.com',
  // Shopping / booking
  rakuten: 'rakuten.com', 'expedia-one-key': 'expedia.com', 'booking-com': 'booking.com',
  'hotels-com': 'hotels.com', priceline: 'priceline.com', agoda: 'agoda.com', 'trip-com': 'trip.com',
  vrbo: 'vrbo.com', hotwire: 'hotwire.com',
}

async function main() {
  const sb = createAdminClient()
  const { data } = await sb.from('programs').select('slug, logo_url')
  const bySlug = new Map((data ?? []).map((p) => [p.slug as string, p]))
  let set = 0
  let skipped = 0
  for (const [slug, domain] of Object.entries(DOMAINS)) {
    if (!bySlug.has(slug)) { skipped++; continue }
    const logo = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    const { error } = await sb.from('programs').update({ logo_url: logo }).eq('slug', slug)
    if (!error) set++
  }
  const mapped = Object.keys(DOMAINS).length
  console.log(`domain map: ${mapped} | logos set: ${set} | slugs not found: ${skipped} | programs total: ${data?.length}`)
  console.log(`unmapped programs (no logo yet): ${(data ?? []).filter((p) => !DOMAINS[p.slug as string]).length}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
