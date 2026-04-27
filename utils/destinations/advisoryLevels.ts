/**
 * US State Department travel advisory level helpers.
 *
 * Levels 1-4, with consistent label + color treatment across components.
 * Used by the Decision Engine, the destination page, and (eventually) any
 * trip-planning surface.
 */

export type AdvisoryLevel = 1 | 2 | 3 | 4

export interface AdvisoryStyle {
  level: AdvisoryLevel
  label: string
  shortLabel: string
  bg: string
  border: string
  fg: string
  /** Hex of the dot/swatch — same as border, used when fg is too light. */
  dot: string
}

export const ADVISORY_STYLES: Record<AdvisoryLevel, AdvisoryStyle> = {
  1: {
    level: 1,
    label: 'Exercise Normal Precautions',
    shortLabel: 'Level 1 · Normal precautions',
    bg: '#E8F5EE',
    border: '#2D8B5F',
    fg: '#1F5F40',
    dot: '#2D8B5F',
  },
  2: {
    level: 2,
    label: 'Exercise Increased Caution',
    shortLabel: 'Level 2 · Increased caution',
    bg: '#FFF7E0',
    border: '#D4A52E',
    fg: '#8B6F1A',
    dot: '#D4A52E',
  },
  3: {
    level: 3,
    label: 'Reconsider Travel',
    shortLabel: 'Level 3 · Reconsider travel',
    bg: '#FFE8D2',
    border: '#D97933',
    fg: '#8B4A1A',
    dot: '#D97933',
  },
  4: {
    level: 4,
    label: 'Do Not Travel',
    shortLabel: 'Level 4 · Do not travel',
    bg: '#FCE0DE',
    border: '#C93D3D',
    fg: '#8A1F1F',
    dot: '#C93D3D',
  },
}

export function styleForLevel(level: number | null | undefined): AdvisoryStyle | null {
  if (level === 1 || level === 2 || level === 3 || level === 4) {
    return ADVISORY_STYLES[level]
  }
  return null
}
