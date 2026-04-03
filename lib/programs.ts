// Single source of truth for all tracked loyalty programs.

export const PROGRAMS = [
  { slug: 'chase',       name: 'Chase' },
  { slug: 'amex',        name: 'American Express' },
  { slug: 'citi',        name: 'Citi ThankYou Points' },
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
  { slug: 'choice',          name: 'Choice Privileges' },
  // Credit card currencies
  { slug: 'bilt',            name: 'Bilt Rewards' },
  { slug: 'wells_fargo',     name: 'Wells Fargo Rewards' },
  { slug: 'us_bank',         name: 'US Bank Altitude' },
  // Airlines
  { slug: 'alaska',          name: 'Alaska Airlines Mileage Plan' },
  { slug: 'british_airways', name: 'British Airways Executive Club' },
  { slug: 'aeroplan',        name: 'Air Canada Aeroplan' },
  { slug: 'krisflyer',       name: 'Singapore Airlines KrisFlyer' },
  { slug: 'asia_miles',      name: 'Cathay Pacific Asia Miles' },
  { slug: 'emirates',        name: 'Emirates Skywards' },
  { slug: 'etihad',          name: 'Etihad Guest' },
  { slug: 'jal',             name: 'Japan Airlines JAL Mileage Bank' },
  { slug: 'turkish',         name: 'Turkish Airlines Miles&Smiles' },
  { slug: 'aeromexico',      name: 'Aeromexico Club Premier' },
  { slug: 'eva_air',         name: 'EVA Air Infinity MileageLands' },
  { slug: 'jetblue',         name: 'JetBlue TrueBlue' },
  { slug: 'qatar',           name: 'Qatar Airways Privilege Club' },
  // Hotels
  { slug: 'wyndham',         name: 'Wyndham Rewards' },
  { slug: 'radisson',        name: 'Radisson Rewards' },
  { slug: 'best_western',    name: 'Best Western Rewards' },
  { slug: 'accor',           name: 'Accor Live Limitless' },
]

export const PROGRAM_SLUGS = PROGRAMS.map((p) => p.slug)

export const getProgramName = (slug: string): string =>
  PROGRAMS.find((p) => p.slug === slug)?.name ?? slug
