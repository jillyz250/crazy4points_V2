/**
 * Traveler types — single source of truth for the five "points traveler"
 * archetypes, their recommended cards, and the Find Your Why quiz.
 *
 * Consumed by: the Find Your Why quiz (components/guides/WhyQuiz.tsx), the
 * Best First Card guide, and any per-type deep links. Edit a card pick or a
 * type here and every surface updates together.
 */

export interface Pick {
  name: string
  slug: string
  fee: string
  blurb: string
}

export interface TravelerType {
  /** Anchor id used in URLs (e.g. /guides/best-first-card#deal-seeker). */
  id: string
  name: string
  /** Short name without "The", for chips and quiz results. */
  short: string
  tagline: string
  /** One-line "here's you" summary for the quiz result. */
  blurb: string
  winning: string
  anchor: Pick
  alsoConsider: Pick[]
  /** Optional honest caveat rendered under the picks on the Best First Card page. */
  note?: string
}

export const TRAVELER_TYPES: TravelerType[] = [
  {
    id: 'deal-seeker',
    name: 'The Deal-Seeker',
    short: 'Deal-Seeker',
    tagline: `You're trying to spend less, period.`,
    blurb: `You're chasing a lighter bill, not luxury. Cash back, a free flight, a free hotel night, whatever knocks something meaningful off the total.`,
    winning: `I spent $500 less on that trip.`,
    anchor: {
      name: 'Citi Double Cash',
      slug: 'citi-double-cash',
      fee: 'No annual fee',
      blurb: `2% back on everything you buy, no annual fee, nothing to think about: 1% when you buy, 1% when you pay it off. The purest "spend less" card there is, and it beats the flat rate on most no-fee cards.`,
    },
    alsoConsider: [
      {
        name: 'Capital One Venture',
        slug: 'capital-one-venture',
        fee: '$95 a year',
        blurb: `2x on everything, and the miles erase any travel purchase: book the flight, then wipe it off your bill. Dead simple, and the miles transfer to airlines on their own if you ever want to stretch them further.`,
      },
      {
        name: 'Chase Sapphire Preferred',
        slug: 'chase-sapphire-preferred',
        fee: '$95 a year',
        blurb: `The step up when you want a bigger win: the welcome bonus alone can knock a whole flight off your next trip, and unlike a cash-back card, its points transfer to airlines and hotels on their own. Worth the $95 if you'll use it.`,
      },
      {
        name: 'IHG One Rewards Premier',
        slug: 'chase-ihg-one-rewards-premier',
        fee: '$99 a year',
        blurb: `The deal-seeker's quiet secret weapon: a hotel card whose annual free night reliably covers a room worth more than the fee. About as close to free money as this hobby gets.`,
      },
    ],
  },
  {
    id: 'little-luxury-blender',
    name: 'The Little-Luxury Blender',
    short: 'Little-Luxury Blender',
    tagline: `A notch nicer than usual.`,
    blurb: `Normal trips, just a notch nicer. The airport lounge, the 4 p.m. checkout, the room upgrade, the free breakfast, the rental car that's somehow a convertible now.`,
    winning: `Same vacation. Better experience.`,
    anchor: {
      name: 'Capital One Venture X',
      slug: 'capital-one-venture-x',
      fee: '$395 a year',
      blurb: `Lounge access (Capital One's own lounges plus Priority Pass), a $300 travel credit, and 10,000 anniversary miles that together roughly cancel out the fee. It's the one card that delivers "a notch nicer" without jumping to the $795 tier. Best value if you'll actually use that annual travel credit.`,
    },
    alsoConsider: [
      {
        name: 'Chase Sapphire Preferred',
        slug: 'chase-sapphire-preferred',
        fee: '$95 a year',
        blurb: `The cheapest way into flexible, transferable points. No lounge access, but a low fee and a great starter for aiming perks at whichever trip needs them.`,
      },
      {
        name: 'Chase Sapphire Reserve',
        slug: 'chase-sapphire-reserve',
        fee: '$795 a year',
        blurb: `Budget permitting: more lounges, richer hotel credits, and stronger travel protection than the Preferred.`,
      },
    ],
    note: `Notice there's no co-brand hotel card here on purpose. For the Blender, flexible points are the stronger move, because they can become hotel nights or airline seats later. You stay unlocked until the trip tells you what it needs.`,
  },
  {
    id: 'splurger',
    name: 'The Splurger',
    short: 'Splurger',
    tagline: `Points buy the stuff you'd never pay cash for.`,
    blurb: `Points buy the stuff you'd never pay cash for: the lie-flat suite, the overwater villa, the lounge you actually want to sit in. You unlock a version of travel that used to be off-limits.`,
    winning: `I flew a cabin I'd never pay cash for.`,
    anchor: {
      name: 'The Platinum Card from American Express',
      slug: 'amex-platinum',
      fee: '$895 a year',
      blurb: `5x points on flights booked directly with airlines or through Amex Travel, Centurion Lounge access, Fine Hotels + Resorts perks, and transferable points that turn into international business and first class, where they out-punch cash by a wide margin. One tip: pair it with the Amex Gold for everyday earning, because the Platinum only earns 1x at the grocery store.`,
    },
    alsoConsider: [
      {
        name: 'Chase Sapphire Reserve',
        slug: 'chase-sapphire-reserve',
        fee: '$795 a year',
        blurb: `The Chase version of the flagship: transfer to Hyatt and airline partners, Sapphire lounge access, and Points Boost on travel.`,
      },
      {
        name: 'Hilton Honors Aspire',
        slug: 'amex-hilton-honors-aspire',
        fee: '$550 a year',
        blurb: `The hotel-luxury play, and the answer to "can I use points at the fancy Hiltons?" Yes: automatic Hilton Diamond status (upgrades, free breakfast, lounge access) plus an annual free night you can use at nearly any Hilton, including the Waldorf Astoria and Conrad luxury brands.`,
      },
    ],
    note: `One honest caveat on hotels: most co-brand free-night certificates are capped in value, so they're perfect for a nice mid-tier hotel but usually won't cover a night at the very top luxury properties. For those, you want an uncapped certificate like the Aspire's, or raw points, ideally Hyatt, whose award chart makes even Park Hyatts reachable.`,
  },
  {
    id: 'dream-tripper',
    name: 'The Dream-Tripper',
    short: 'Dream-Tripper',
    tagline: `Bank it all for one enormous, almost-free trip.`,
    blurb: `You bank everything for one enormous, almost-free, all-out trip. The honeymoon, the bucket-list safari, the two weeks you could never otherwise justify.`,
    winning: `I finally took the trip I'd been putting off.`,
    anchor: {
      name: 'Chase Sapphire Preferred',
      slug: 'chase-sapphire-preferred',
      fee: '$95 a year',
      blurb: `Cheap to hold, a big welcome bonus, and transferable points that don't expire while the card is open. The patient hoarder's anchor.`,
    },
    alsoConsider: [
      {
        name: 'American Express Gold Card',
        slug: 'amex-gold',
        fee: '$325 a year',
        blurb: `The accumulation engine: 4x points at restaurants and U.S. supermarkets stacks a pile fast.`,
      },
      {
        name: 'Chase Ink business cards',
        slug: 'chase-ink-business-preferred',
        fee: '$0 to $95 a year',
        blurb: `If you have a business, even a side hustle, Ink cards come with big welcome bonuses that can fuel the stash quickly.`,
      },
    ],
    note: `The single most valuable rule on this whole page: keep your points flexible until you've picked the trip. And if you're saving for years, spread them across a couple of programs (Chase, Amex, Capital One) so one program's devaluation can't sink your plan.`,
  },
  {
    id: 'value-gamer',
    name: 'The Value Gamer',
    short: 'Value Gamer',
    tagline: `Luxury and the deal, no compromise.`,
    blurb: `You want the luxury and the deal, and you're not picking one. You learn the sweet spots, ride the transfer bonuses, and treat the whole thing as a game worth getting good at.`,
    winning: `I know exactly why this redemption was worth it.`,
    anchor: {
      name: 'Chase Sapphire Preferred',
      slug: 'chase-sapphire-preferred',
      fee: '$95 a year',
      blurb: `Your first lever. The famous Hyatt sweet spot lives in Chase points, and the Preferred is the low-cost way in. Move up to the Reserve once the perks earn their keep.`,
    },
    alsoConsider: [
      {
        name: 'American Express Gold Card',
        slug: 'amex-gold',
        fee: '$325 a year',
        blurb: `Your Amex base. Membership Rewards transfer bonuses to airline partners are the value gamer's playground.`,
      },
      {
        name: 'Capital One Venture X',
        slug: 'capital-one-venture-x',
        fee: '$395 a year',
        blurb: `A third flexible currency plus lounge access, so there's always a good transfer ratio to chase.`,
      },
      {
        name: 'Citi Strata Premier',
        slug: 'citi-strata-premier',
        fee: '$95 a year',
        blurb: `Opens its own set of transfer partners (Turkish, Qatar, and more), for when you want every lever on the board.`,
      },
      {
        name: 'The World of Hyatt Credit Card',
        slug: 'chase-world-of-hyatt',
        fee: '$95 a year',
        blurb: `Hyatt status plus the cheapest luxury award chart in the game. The card gets you status and a free night; the real magic is transferring your Chase points to Hyatt for Park Hyatts that cost a fortune in cash.`,
      },
    ],
    note: `A bonus lever if you rent: the Bilt cards earn points on rent, money most renters leave on the table entirely. Just treat Bilt as a bonus currency, not your core one, since its ecosystem is still young.`,
  },
]

export function getTravelerType(id: string): TravelerType | undefined {
  return TRAVELER_TYPES.find((t) => t.id === id)
}

// ---- Find Your Why quiz -------------------------------------------------
// Each option maps to a type id; the highest tally wins (ties break toward the
// earlier type in TRAVELER_TYPES). Options are in TRAVELER_TYPES order.

export interface QuizOption {
  label: string
  type: string
}
export interface QuizQuestion {
  q: string
  options: QuizOption[]
}

export const QUIZ: QuizQuestion[] = [
  {
    q: 'Surprise: 100,000 points just landed in your account tonight. First instinct?',
    options: [
      { label: `Knock the cost off a trip I'm already taking. Free-ish is free-ish.`, type: 'deal-seeker' },
      { label: `Upgrade the trip I've got planned. Lounge, late checkout, yes please.`, type: 'little-luxury-blender' },
      { label: `Book the lie-flat suite I have zero business affording.`, type: 'splurger' },
      { label: `Touch nothing. This is going in the vault for The Big One.`, type: 'dream-tripper' },
      { label: `Open six tabs and find the single most insane-value redemption on earth.`, type: 'value-gamer' },
    ],
  },
  {
    q: `Be honest. The real reason you're into points is...`,
    options: [
      { label: `Paying less. Full stop.`, type: 'deal-seeker' },
      { label: `Traveling like the version of me with slightly better taste.`, type: 'little-luxury-blender' },
      { label: `Doing stuff I would never, ever pay cash for.`, type: 'splurger' },
      { label: `One unforgettable trip I keep telling myself "someday."`, type: 'dream-tripper' },
      { label: `The chase. Beating the system is the whole sport.`, type: 'value-gamer' },
    ],
  },
  {
    q: `"Transfer partners" and "sweet spots." Your honest reaction?`,
    options: [
      { label: `Sounds like homework. Hard pass.`, type: 'deal-seeker' },
      { label: `I'll learn the one trick that gets me a perk.`, type: 'little-luxury-blender' },
      { label: `Teach me whatever unlocks business class.`, type: 'splurger' },
      { label: `I'll cram right before the big trip, thanks.`, type: 'dream-tripper' },
      { label: `I already have a spreadsheet. And feelings about it.`, type: 'value-gamer' },
    ],
  },
  {
    q: 'Your dream itinerary is basically...',
    options: [
      { label: `The same trip everyone takes, just cheaper.`, type: 'deal-seeker' },
      { label: `Normal trip, but the good room and free breakfast.`, type: 'little-luxury-blender' },
      { label: `Overwater villa, private plunge pool, do not disturb.`, type: 'splurger' },
      { label: `Two weeks somewhere I've been dreaming about for years.`, type: 'dream-tripper' },
      { label: `A wild multi-city routing held together with transfer bonuses and vibes.`, type: 'value-gamer' },
    ],
  },
  {
    q: `The win that'd make you text the group chat immediately:`,
    options: [
      { label: `"This whole trip cost me $500 less."`, type: 'deal-seeker' },
      { label: `"Same vacation, way comfier. I've evolved."`, type: 'little-luxury-blender' },
      { label: `"I flew a cabin I could never actually afford."`, type: 'splurger' },
      { label: `"I FINALLY booked the bucket-list trip."`, type: 'dream-tripper' },
      { label: `"$10,000 seat. 60,000 points. I cannot stop grinning."`, type: 'value-gamer' },
    ],
  },
]

/** Tally answers (type ids) and return the winning type id. */
export function scoreQuiz(answers: string[]): string {
  const tally: Record<string, number> = {}
  for (const a of answers) tally[a] = (tally[a] ?? 0) + 1
  let best = TRAVELER_TYPES[0].id
  let bestN = -1
  for (const t of TRAVELER_TYPES) {
    const n = tally[t.id] ?? 0
    if (n > bestN) {
      bestN = n
      best = t.id
    }
  }
  return best
}
