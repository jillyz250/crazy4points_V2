/**
 * Build a slim IATA-codes data file for the Airport Code Ladder game.
 *
 * Fetches OpenFlights' public-domain airports.dat, filters to commercial
 * airports with a valid 3-letter IATA, writes data/iata-codes.json.
 *
 * Re-run if you need to refresh the dataset:
 *   node scripts/build-iata-codes.mjs
 */
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const OUT = resolve(__dirname, '..', 'data', 'iata-codes.json')

const SOURCE = 'https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat'

/** Parse one CSV row (OpenFlights uses double-quoted strings + comma delimiter,
 *  no embedded commas inside quotes for this file — confirmed by spot check). */
function parseRow(line) {
  const cells = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      const end = line.indexOf('"', i + 1)
      cells.push(line.slice(i + 1, end))
      i = end + 2 // skip closing quote + comma
    } else {
      const end = line.indexOf(',', i)
      if (end === -1) {
        cells.push(line.slice(i))
        break
      }
      cells.push(line.slice(i, end))
      i = end + 1
    }
  }
  return cells
}

const res = await fetch(SOURCE)
if (!res.ok) {
  console.error(`Fetch failed: ${res.status} ${res.statusText}`)
  process.exit(1)
}
const text = await res.text()
const lines = text.split('\n').filter(Boolean)

const seen = new Set()
const out = []
for (const line of lines) {
  const c = parseRow(line)
  // Columns: 0=id, 1=name, 2=city, 3=country, 4=IATA, 5=ICAO, 6=lat, 7=lng,
  // 8=alt, 9=tz_offset, 10=dst, 11=tz_name, 12=type, 13=source
  const name = c[1]
  const city = c[2]
  const country = c[3]
  const iata = (c[4] ?? '').toUpperCase()
  const type = c[12]
  if (type !== 'airport') continue
  if (!/^[A-Z]{3}$/.test(iata)) continue
  if (iata === '\\N') continue
  if (seen.has(iata)) continue
  seen.add(iata)
  out.push({ code: iata, name, city, country })
}

out.sort((a, b) => a.code.localeCompare(b.code))

await writeFile(OUT, JSON.stringify(out) + '\n', 'utf8')
console.log(`Wrote ${out.length} IATA codes to ${OUT}`)
