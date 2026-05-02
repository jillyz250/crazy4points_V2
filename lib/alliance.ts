import type { Alliance } from '@/utils/supabase/queries'

export const ALLIANCE_LABEL: Record<Alliance, string> = {
  skyteam: 'SkyTeam',
  star_alliance: 'Star Alliance',
  oneworld: 'oneworld',
  none: 'Independent',
  other: 'Partnership',
}

export const ALLIANCE_BADGE_COLOR: Record<Alliance, string> = {
  skyteam: '#0033A0',
  star_alliance: '#1A1A1A',
  oneworld: '#C8102E',
  none: '#4A4A4A',
  other: '#4A4A4A',
}
