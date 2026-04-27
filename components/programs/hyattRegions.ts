/**
 * Maps a country string to one of Hyatt's six published regions.
 *
 * Used at render time so we don't have to migrate the schema-level
 * `region` column (which uses a coarser 4-bucket taxonomy). Returns
 * null when a country isn't mapped — those rows still appear in the
 * table, just without a region filter match.
 *
 * Hyatt's region groups (from world.hyatt.com/explore-hotels):
 *   1. United States & Canada
 *   2. Caribbean & Latin America
 *   3. Europe
 *   4. Africa & Middle East
 *   5. Asia
 *   6. Australia & Pacific
 */

export type HyattRegion =
  | 'us_canada'
  | 'caribbean_latam'
  | 'europe'
  | 'africa_middle_east'
  | 'asia'
  | 'australia_pacific'

export const HYATT_REGION_LABELS: Record<HyattRegion, string> = {
  us_canada:           'United States & Canada',
  caribbean_latam:     'Caribbean & Latin America',
  europe:              'Europe',
  africa_middle_east:  'Africa & Middle East',
  asia:                'Asia',
  australia_pacific:   'Australia & Pacific',
}

export const HYATT_REGION_ORDER: HyattRegion[] = [
  'us_canada',
  'caribbean_latam',
  'europe',
  'africa_middle_east',
  'asia',
  'australia_pacific',
]

const COUNTRY_TO_REGION: Record<string, HyattRegion> = {
  // United States & Canada (Puerto Rico bundled here per Hyatt)
  'United States':   'us_canada',
  'Canada':          'us_canada',
  'Puerto Rico':     'us_canada',

  // Caribbean & Latin America
  'Argentina':                      'caribbean_latam',
  'Aruba':                          'caribbean_latam',
  'Bahamas':                        'caribbean_latam',
  'The Bahamas':                    'caribbean_latam',
  'Brazil':                         'caribbean_latam',
  'Cayman Islands':                 'caribbean_latam',
  'Chile':                          'caribbean_latam',
  'Colombia':                       'caribbean_latam',
  'Costa Rica':                     'caribbean_latam',
  'Cuba':                           'caribbean_latam',
  'Curaçao':                        'caribbean_latam',
  'Dominican Republic':             'caribbean_latam',
  'Ecuador':                        'caribbean_latam',
  'El Salvador':                    'caribbean_latam',
  'Guatemala':                      'caribbean_latam',
  'Guyana':                         'caribbean_latam',
  'Haiti':                          'caribbean_latam',
  'Honduras':                       'caribbean_latam',
  'Jamaica':                        'caribbean_latam',
  'Mexico':                         'caribbean_latam',
  'Nicaragua':                      'caribbean_latam',
  'Panama':                         'caribbean_latam',
  'Paraguay':                       'caribbean_latam',
  'Peru':                           'caribbean_latam',
  'Saint Kitts and Nevis':          'caribbean_latam',
  'Saint Lucia':                    'caribbean_latam',
  'Trinidad and Tobago':            'caribbean_latam',
  'Turks and Caicos Islands':       'caribbean_latam',
  'Uruguay':                        'caribbean_latam',
  'Venezuela':                      'caribbean_latam',

  // Europe (Hyatt classes Türkiye in Europe)
  'Albania':         'europe',
  'Austria':         'europe',
  'Belgium':         'europe',
  'Bulgaria':        'europe',
  'Croatia':         'europe',
  'Cyprus':          'europe',
  'Czech Republic':  'europe',
  'Czechia':         'europe',
  'Denmark':         'europe',
  'Estonia':         'europe',
  'Finland':         'europe',
  'France':          'europe',
  'Germany':         'europe',
  'Greece':          'europe',
  'Hungary':         'europe',
  'Iceland':         'europe',
  'Ireland':         'europe',
  'Italy':           'europe',
  'Latvia':          'europe',
  'Lithuania':       'europe',
  'Luxembourg':      'europe',
  'Malta':           'europe',
  'Montenegro':      'europe',
  'Netherlands':     'europe',
  'Norway':          'europe',
  'Poland':          'europe',
  'Portugal':        'europe',
  'Romania':         'europe',
  'Russia':          'europe',
  'Serbia':          'europe',
  'Slovakia':        'europe',
  'Slovenia':        'europe',
  'Spain':           'europe',
  'Sweden':          'europe',
  'Switzerland':     'europe',
  'Türkiye':         'europe',
  'Turkey':          'europe',
  'Ukraine':         'europe',
  'United Kingdom':  'europe',

  // Africa & Middle East
  'Algeria':                'africa_middle_east',
  'Bahrain':                'africa_middle_east',
  'Egypt':                  'africa_middle_east',
  'Ethiopia':               'africa_middle_east',
  'Israel':                 'africa_middle_east',
  'Jordan':                 'africa_middle_east',
  'Kenya':                  'africa_middle_east',
  'Kuwait':                 'africa_middle_east',
  'Lebanon':                'africa_middle_east',
  'Morocco':                'africa_middle_east',
  'Mozambique':             'africa_middle_east',
  'Namibia':                'africa_middle_east',
  'Nigeria':                'africa_middle_east',
  'Oman':                   'africa_middle_east',
  'Qatar':                  'africa_middle_east',
  'Rwanda':                 'africa_middle_east',
  'Saudi Arabia':           'africa_middle_east',
  'Senegal':                'africa_middle_east',
  'South Africa':           'africa_middle_east',
  'Tanzania':               'africa_middle_east',
  'Tunisia':                'africa_middle_east',
  'Uganda':                 'africa_middle_east',
  'United Arab Emirates':   'africa_middle_east',
  'Zambia':                 'africa_middle_east',
  'Zimbabwe':               'africa_middle_east',

  // Asia (Asia Pacific minus Australia/NZ/Pacific)
  'Azerbaijan':       'asia',
  'Bangladesh':       'asia',
  'Brunei':           'asia',
  'Cambodia':         'asia',
  'China':            'asia',
  'Hong Kong':        'asia',
  'India':            'asia',
  'Indonesia':        'asia',
  'Japan':            'asia',
  'Kazakhstan':       'asia',
  'Kyrgyzstan':       'asia',
  'Laos':             'asia',
  'Macao':            'asia',
  'Malaysia':         'asia',
  'Maldives':         'asia',
  'Mongolia':         'asia',
  'Myanmar':          'asia',
  'Nepal':            'asia',
  'Pakistan':         'asia',
  'Philippines':      'asia',
  'Singapore':        'asia',
  'South Korea':      'asia',
  'Sri Lanka':        'asia',
  'Taiwan':           'asia',
  'Tajikistan':       'asia',
  'Thailand':         'asia',
  'Turkmenistan':     'asia',
  'Uzbekistan':       'asia',
  'Vietnam':          'asia',

  // Australia & Pacific
  'Australia':        'australia_pacific',
  'Fiji':             'australia_pacific',
  'French Polynesia': 'australia_pacific',
  'Guam':             'australia_pacific',
  'New Caledonia':    'australia_pacific',
  'New Zealand':      'australia_pacific',
  'Papua New Guinea': 'australia_pacific',
  'Samoa':            'australia_pacific',
  'Vanuatu':          'australia_pacific',
}

export function hyattRegionForCountry(country: string | null | undefined): HyattRegion | null {
  if (!country) return null
  return COUNTRY_TO_REGION[country.trim()] ?? null
}

const COMING_SOON_PHRASES = ['coming soon', 'opening soon']

/**
 * "Coming soon" / "Opening soon" properties aren't bookable yet. Detected
 * via the notes column from the CSV import (which preserves Hyatt's own
 * markers). "Newly added" ≠ unopened — those ARE bookable.
 */
export function isComingSoon(notes: string | null | undefined): boolean {
  if (!notes) return false
  const lower = notes.toLowerCase()
  return COMING_SOON_PHRASES.some((p) => lower.includes(p))
}
