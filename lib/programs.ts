// Single source of truth for all tracked loyalty programs.

export const PROGRAMS = [
  { slug: 'chase',       name: 'Chase' },
  { slug: 'amex',        name: 'American Express' },
  { slug: 'citi',        name: 'Citi' },
  { slug: 'capital_one', name: 'Capital One' },
  { slug: 'hyatt',       name: 'World of Hyatt' },
  { slug: 'marriott',    name: 'Marriott Bonvoy' },
  { slug: 'hilton',      name: 'Hilton Honors' },
  { slug: 'ihg',         name: 'IHG One Rewards' },
  { slug: 'united',      name: 'United MileagePlus' },
  { slug: 'delta',       name: 'Delta SkyMiles' },
  { slug: 'aa',          name: 'American Airlines AAdvantage' },
  { slug: 'southwest',   name: 'Southwest Rapid Rewards' },
  { slug: 'flying_blue',    name: 'Air France-KLM Flying Blue' },
  { slug: 'virgin_atlantic', name: 'Virgin Atlantic Flying Club' },
  { slug: 'avianca',         name: 'Avianca LifeMiles' },
]

export const PROGRAM_SLUGS = PROGRAMS.map((p) => p.slug)

export const getProgramName = (slug: string): string =>
  PROGRAMS.find((p) => p.slug === slug)?.name ?? slug
