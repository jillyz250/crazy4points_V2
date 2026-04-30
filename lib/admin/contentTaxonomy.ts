/**
 * Content taxonomy — single source of truth for content_type + activity_frame
 * across admin UI, validation, and (later) writer prompt routing.
 *
 * Adding a new content type:  add to CONTENT_TYPES below + (later) drop a
 *   prompt file in utils/ai/contentTypePrompts/types/. No DB migration.
 *
 * Adding a new activity frame: add to ACTIVITY_FRAMES below + (later) drop
 *   a prompt file in utils/ai/contentTypePrompts/frames/. No DB migration.
 *
 * Tags (topics) are entirely free-form — no allowlist. The admin UI provides
 * autocomplete from existing topics so you don't drift between
 * "marathon" / "marathons".
 */

export const CONTENT_TYPES = [
  { value: 'sweet_spot',       label: 'Sweet Spot',       hint: 'Outsized redemption value (cents-per-point math)' },
  { value: 'destination_play', label: 'Destination Play', hint: 'Visiting a place/event using points (Wrigley hotels, marathon stays)' },
  { value: 'card_play',        label: 'Card Play',        hint: 'Maximizing a specific card benefit' },
  { value: 'how_to',           label: 'How-to',           hint: 'Step-by-step guide to a points task' },
  { value: 'news',             label: 'News',             hint: 'Reporting a program change' },
  { value: 'opinion',          label: 'Opinion',          hint: "Editorial / Jill's take" },
  { value: 'review',           label: 'Review',           hint: 'Single-property deep dive' },
  { value: 'roundup',          label: 'Roundup',          hint: 'Listicle (top 10, best Hyatts under 30k)' },
  { value: 'case_study',       label: 'Case Study',       hint: 'Real-trip recap with actual numbers' },
] as const

export type ContentType = (typeof CONTENT_TYPES)[number]['value']
export const CONTENT_TYPE_VALUES = CONTENT_TYPES.map((t) => t.value)

/**
 * Activity sub-frames for destination_play. The writer prompt picks the
 * activity-specific section by frame; missing frames fall back to a
 * universal "general" template so unfamiliar tags never crash.
 */
export const ACTIVITY_FRAMES = [
  // Event-driven
  { value: 'race',          label: 'Race / Marathon',         group: 'Event' },
  { value: 'concert',       label: 'Concert / Festival',      group: 'Event' },
  { value: 'sports',        label: 'Sports Game',             group: 'Event' },
  { value: 'theme_park',    label: 'Theme Park',              group: 'Event' },
  { value: 'wedding',       label: 'Wedding',                 group: 'Event' },
  { value: 'astro',         label: 'Eclipse / Astro',         group: 'Event' },
  { value: 'pilgrimage',    label: 'Religious Pilgrimage',    group: 'Event' },

  // Destination/experience-driven
  { value: 'ski',           label: 'Skiing',                  group: 'Experience' },
  { value: 'hiking',        label: 'Hiking / National Park',  group: 'Experience' },
  { value: 'beach',         label: 'Beach / Island',          group: 'Experience' },
  { value: 'cruise',        label: 'Cruise Port',             group: 'Experience' },
  { value: 'spa',           label: 'Spa / Wellness',          group: 'Experience' },
  { value: 'casino',        label: 'Casino / Gambling',       group: 'Experience' },
  { value: 'romantic',      label: 'Romantic / Anniversary',  group: 'Experience' },
  { value: 'foodie',        label: 'Foodie / Culinary',       group: 'Experience' },
  { value: 'adventure',     label: 'Adventure / Extreme',     group: 'Experience' },
  { value: 'historical',    label: 'Historical / Cultural',   group: 'Experience' },

  // Visit / personal
  { value: 'college',       label: 'College Visit',           group: 'Visit' },
  { value: 'family',        label: 'Family / Multi-gen',      group: 'Visit' },
  { value: 'photography',   label: 'Photography Expedition',  group: 'Visit' },
  { value: 'pet',           label: 'Pet-friendly Travel',     group: 'Visit' },

  // Practical
  { value: 'business',      label: 'Business / Conference',   group: 'Practical' },
  { value: 'layover',       label: 'Long-haul Layover',       group: 'Practical' },
  { value: 'solo',          label: 'Solo / Digital Nomad',    group: 'Practical' },
  { value: 'accessibility', label: 'Accessibility',           group: 'Practical' },
] as const

export type ActivityFrame = (typeof ACTIVITY_FRAMES)[number]['value']
export const ACTIVITY_FRAME_VALUES = ACTIVITY_FRAMES.map((f) => f.value)

export function isValidContentType(value: string | null | undefined): value is ContentType {
  if (!value) return false
  return (CONTENT_TYPE_VALUES as readonly string[]).includes(value)
}

export function isValidActivityFrame(value: string | null | undefined): value is ActivityFrame {
  if (!value) return false
  return (ACTIVITY_FRAME_VALUES as readonly string[]).includes(value)
}

/** Group activity frames for grouped <select> rendering. */
export function groupActivityFrames(): { group: string; frames: typeof ACTIVITY_FRAMES[number][] }[] {
  const order = ['Event', 'Experience', 'Visit', 'Practical']
  return order.map((g) => ({
    group: g,
    frames: ACTIVITY_FRAMES.filter((f) => f.group === g),
  }))
}
