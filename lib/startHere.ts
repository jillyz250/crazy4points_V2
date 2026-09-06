// Start Here — onboarding hub + persona paths (Jill, 2026-09-06). A GUIDE, not a
// quiz: readers self-select a persona, each with its own image + page, then a
// short tutorial of what the site offers. Persona pages render from this data
// via app/(site)/start-here/[persona]/page.tsx.

export type PersonaTool = { label: string; href: string; desc: string }

export type Persona = {
  key: string
  title: string
  tagline: string
  intro: string
  accent: string // hex — the persona's accent
  /** /start-here/persona-<key>.png once generated; null renders a placeholder. */
  image: string | null
  steps: string[]
  tools: PersonaTool[]
}

export const PERSONAS: Persona[] = [
  {
    key: 'luxury',
    title: 'Luxury for less',
    tagline: "First-class seats, VIP suites, and money-can't-buy moments — on points.",
    intro:
      "You want the best, without the best-in-class price tag. Points are how you fly lie-flat, stay in suites, and get into rooms money can't buy.",
    accent: '#9A7B1F',
    image: '/start-here/persona-luxury.png',
    steps: [
      'Open a premium rewards card and earn its welcome bonus.',
      'Transfer those points to the sweet spots that unlock premium cabins and suites.',
      'Book the VIP moments waiting in the Experiences finder.',
    ],
    tools: [
      { label: 'Experiences', href: '/experiences', desc: 'VIP events, suites, chef’s tables — booked with points.' },
      { label: 'Sweet Spots', href: '/sweet-spots', desc: 'The redemptions that punch far above their point cost.' },
      { label: 'Card Explorer', href: '/cards', desc: 'Find the premium card that earns the right points.' },
    ],
  },
  {
    key: 'discounted-travel',
    title: 'Travel more for less',
    tagline: 'Flights, hotels, whole trips — for a fraction of the cash price.',
    intro:
      'You just want to travel more without spending more. Points plus well-timed deals stretch your budget across flights and hotels all year.',
    accent: '#17868A',
    image: '/start-here/persona-discounted-travel.png',
    steps: [
      'Subscribe so award sales, transfer bonuses, and welcome offers come to you.',
      "Grab a flexible travel card's welcome bonus to build a starting balance.",
      'Book flights and hotels through the programs your points reach.',
    ],
    tools: [
      { label: 'Alerts', href: '/alerts', desc: 'The deals worth acting on, sorted by urgency.' },
      { label: 'Programs', href: '/programs', desc: 'Every airline + hotel program and how to use it.' },
      { label: 'Card Explorer', href: '/cards', desc: 'Match a card to the trips you actually take.' },
    ],
  },
  {
    key: 'new',
    title: 'Brand new to points',
    tagline: 'Never done this before? Start right here, one step at a time.',
    intro:
      "Points travel sounds complicated. It isn't. Here's the simplest path from zero to your first (nearly) free trip.",
    accent: '#2E7D5B',
    image: '/start-here/persona-new.png',
    steps: [
      'Join the Insider List so the good stuff lands in your inbox.',
      'Read the getting-started guides — plain English, no jargon.',
      'Open one beginner-friendly card and earn its bonus.',
    ],
    tools: [
      { label: 'The Insider List', href: '/newsletter', desc: 'The curated digest that teaches as it goes.' },
      { label: 'Getting-Started Guides', href: '/guides#getting-started', desc: 'The basics, step by step.' },
      { label: 'Card Explorer', href: '/cards', desc: 'Find a simple first card.' },
    ],
  },
  {
    key: 'toolkit',
    title: "I've got points — now what",
    tagline: "Sitting on points and miles? Let's put them to work.",
    intro:
      "You've earned points but aren't sure how to use them well. These tools show you exactly what they unlock — and how to get the most out of each one.",
    accent: '#33518A',
    image: '/start-here/persona-toolkit.png',
    steps: [
      'See what your points can reach in the Card Explorer.',
      'Find the high-value redemptions in Sweet Spots.',
      'Turn them into a trip or an experience.',
    ],
    tools: [
      { label: 'Card Explorer', href: '/cards', desc: 'See where the points you already hold can go.' },
      { label: 'Sweet Spots', href: '/sweet-spots', desc: 'The best-value ways to redeem.' },
      { label: 'Experiences', href: '/experiences', desc: 'Cash in points for unforgettable moments.' },
    ],
  },
]

export const personaByKey = (key: string): Persona | undefined => PERSONAS.find((p) => p.key === key)

// The "how the site works" tutorial on the hub — the four pillars.
export const SITE_TUTORIAL: { name: string; what: string; how: string; href: string }[] = [
  {
    name: 'Alerts',
    what: 'The deals worth acting on — award sales, transfer bonuses, and the biggest card welcome offers.',
    how: 'Skim them sorted by urgency, or let the newsletter bring the best ones to you.',
    href: '/alerts',
  },
  {
    name: 'Experiences',
    what: "Money-can't-buy moments — VIP events, suites, chef's tables — you can book with points.",
    how: 'Open the finder and filter by the points you already hold.',
    href: '/experiences',
  },
  {
    name: 'Credit Cards',
    what: 'The right card is the engine — it earns the points everything else runs on.',
    how: 'Use the Card Explorer to match a card to how you travel.',
    href: '/cards',
  },
  {
    name: 'The Insider List',
    what: 'A short, curated digest so you never miss a move worth making.',
    how: 'Join once — the best deals and how-tos come to you.',
    href: '/newsletter',
  },
]
