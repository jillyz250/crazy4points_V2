// One-time accurate location backfill for experience_listings that scraped null
// location (Jill 2026-09-05). Only fills where a well-known venue/team/festival
// makes the city unambiguous. Never guesses; leaves the rest null for the
// scraper's improved prompt to fill on the next re-scrape.
import { createClient } from '@supabase/supabase-js'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

// substring (lowercase) -> "City, Region". Order matters (first match wins).
const MAP = [
  ['madison square garden','New York, NY'],['radio city music hall','New York, NY'],
  ['brooklyn paramount','Brooklyn, NY'],['metlife stadium','East Rutherford, NJ'],
  ['crypto.com arena','Los Angeles, CA'],['chicago theatre','Chicago, IL'],
  ['united center','Chicago, IL'],['wintrust','Chicago, IL'],
  ['atlanta hawks','Atlanta, GA'],['atlanta falcons','Atlanta, GA'],
  ['chicago bears','Chicago, IL'],['chicago sky','Chicago, IL'],['chicago white sox','Chicago, IL'],
  ['seattle seahawks','Seattle, WA'],['seattle mariners','Seattle, WA'],
  ['new york rangers','New York, NY'],['new york giants','East Rutherford, NJ'],['new york jets','East Rutherford, NJ'],
  ['los angeles sparks','Los Angeles, CA'],['la sparks','Los Angeles, CA'],
  ['san diego wave','San Diego, CA'],['houston texans','Houston, TX'],
  ['orlando pride','Orlando, FL'],['inter miami','Miami, FL'],
  ['austin city limits','Austin, TX'],
  // Fixed venues / teams / festivals (accurate, not guesses)
  ['chase center','San Francisco, CA'],['chase field','Phoenix, AZ'],
  ['american airlines center','Dallas, TX'],['kaseya center','Miami, FL'],
  ['tampa bay lightning','Tampa, FL'],['lincoln center','New York, NY'],
  ['ohio state','Columbus, OH'],
  ['coachella','Indio, CA'],['stagecoach','Indio, CA'],['wimbledon','London, UK'],
  ['all points east','London, UK'],['bst hyde park','London, UK'],['us open tennis','New York, NY'],
  ['toyota oakdale theatre','Wallingford, CT'],['glc live at 20 monroe','Grand Rapids, MI'],
  ['westbury music fair','Westbury, NY'],['aragon ballroom','Chicago, IL'],['the wiltern','Los Angeles, CA'],
  ['london restaurant festival','London, UK'],['afl grand final','Melbourne, Australia'],
  ['shoreditch','London, UK'],['the sanderson','London, UK'],
]
const { data } = await db.from('experience_listings')
  .select('id,title,location').eq('status','active')
const targets = (data??[]).filter(r=>!r.location||!String(r.location).trim())
let filled=0; const hits={}
for(const r of targets){
  const t=(r.title||'').toLowerCase()
  const m=MAP.find(([k])=>t.includes(k))
  if(m){ await db.from('experience_listings').update({location:m[1]}).eq('id',r.id); filled++; hits[m[1]]=(hits[m[1]]||0)+1 }
}
console.log(`Null-location active listings: ${targets.length}. Filled (unambiguous): ${filled}. Left null: ${targets.length-filled}.`)
console.log('By city:', JSON.stringify(hits,null,0))
