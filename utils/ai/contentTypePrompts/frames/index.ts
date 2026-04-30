/**
 * Registry: activity_frame → activity-specific prompt section.
 *
 * Adding a new frame:
 *   1. Drop a .ts file alongside this one (e.g. golf_trip.ts) exporting
 *      a const string.
 *   2. Add one entry below.
 *   3. Add the value to lib/admin/contentTaxonomy.ts ACTIVITY_FRAMES.
 *   No DB migration.
 *
 * Unregistered frames fall back to FRAME_GENERAL (no activity section,
 * just the universal checklist). Means you can tag an idea with a topic
 * before its frame prompt is written and the writer still works.
 */
import type { ActivityFrame } from '@/lib/admin/contentTaxonomy'
import { FRAME_GENERAL } from './_general'
import { FRAME_RACE } from './race'
import { FRAME_CONCERT } from './concert'
import { FRAME_SPORTS } from './sports'
import { FRAME_THEME_PARK } from './theme_park'
import { FRAME_WEDDING } from './wedding'
import { FRAME_ASTRO } from './astro'
import { FRAME_PILGRIMAGE } from './pilgrimage'
import { FRAME_SKI } from './ski'
import { FRAME_HIKING } from './hiking'
import { FRAME_BEACH } from './beach'
import { FRAME_CRUISE } from './cruise'
import { FRAME_SPA } from './spa'
import { FRAME_CASINO } from './casino'
import { FRAME_ROMANTIC } from './romantic'
import { FRAME_FOODIE } from './foodie'
import { FRAME_ADVENTURE } from './adventure'
import { FRAME_HISTORICAL } from './historical'
import { FRAME_COLLEGE } from './college'
import { FRAME_FAMILY } from './family'
import { FRAME_PHOTOGRAPHY } from './photography'
import { FRAME_PET } from './pet'
import { FRAME_BUSINESS } from './business'
import { FRAME_LAYOVER } from './layover'
import { FRAME_SOLO } from './solo'
import { FRAME_ACCESSIBILITY } from './accessibility'

export const ACTIVITY_FRAME_PROMPTS: Record<ActivityFrame, string> = {
  race: FRAME_RACE,
  concert: FRAME_CONCERT,
  sports: FRAME_SPORTS,
  theme_park: FRAME_THEME_PARK,
  wedding: FRAME_WEDDING,
  astro: FRAME_ASTRO,
  pilgrimage: FRAME_PILGRIMAGE,
  ski: FRAME_SKI,
  hiking: FRAME_HIKING,
  beach: FRAME_BEACH,
  cruise: FRAME_CRUISE,
  spa: FRAME_SPA,
  casino: FRAME_CASINO,
  romantic: FRAME_ROMANTIC,
  foodie: FRAME_FOODIE,
  adventure: FRAME_ADVENTURE,
  historical: FRAME_HISTORICAL,
  college: FRAME_COLLEGE,
  family: FRAME_FAMILY,
  photography: FRAME_PHOTOGRAPHY,
  pet: FRAME_PET,
  business: FRAME_BUSINESS,
  layover: FRAME_LAYOVER,
  solo: FRAME_SOLO,
  accessibility: FRAME_ACCESSIBILITY,
}

export const FALLBACK_FRAME = FRAME_GENERAL
