import type { Alliance } from '@/utils/supabase/queries'

export const ALLIANCE_LABEL: Record<Alliance, string> = {
  skyteam: 'SkyTeam',
  star_alliance: 'Star Alliance',
  oneworld: 'oneworld',
  none: 'Independent',
  other: 'Partnership',
}

export const ALLIANCE_BADGE_COLOR: Record<Alliance, string> = {
  skyteam: '#0033A0',           // SkyTeam corporate blue
  star_alliance: '#1A1A1A',     // Star Alliance corporate black
  oneworld: '#C8102E',          // oneworld corporate red
  none: '#6B2D8F',              // Independent: c4p brand purple (distinct from Star Alliance black)
  other: '#B45309',             // Partnership: amber-brown (distinct from Independent + oneworld red)
}

/**
 * Text color paired with each ALLIANCE_BADGE_COLOR.
 * All current backgrounds are dark; text is white for all. Kept as a map
 * so future light-bg badges can override individually.
 */
export const ALLIANCE_BADGE_TEXT_COLOR: Record<Alliance, string> = {
  skyteam: '#FFFFFF',
  star_alliance: '#FFFFFF',
  oneworld: '#FFFFFF',
  none: '#FFFFFF',
  other: '#FFFFFF',
}
