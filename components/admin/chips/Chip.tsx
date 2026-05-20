/**
 * Chip atom — base component every typed chip composes.
 *
 * No icons (per v9 plan). Name + color only. Renders as an inline-block pill
 * with a tinted background and dark text, mapped to the chip tokens defined
 * in styles/globals.css.
 */
import type { ReactNode } from 'react'

export type ChipColor = 'green' | 'amber' | 'red' | 'purple' | 'grey' | 'blue'

export interface ChipProps {
  label: ReactNode
  color: ChipColor
  /** Tooltip on hover. */
  title?: string
  /** Smaller variant for dense rows. Default is regular. */
  size?: 'sm' | 'md'
}

const COLOR_STYLES: Record<ChipColor, { background: string; color: string; border: string }> = {
  green:  { background: 'var(--color-chip-green-bg)',  color: 'var(--color-chip-green-fg)',  border: 'var(--color-chip-green)' },
  amber:  { background: 'var(--color-chip-amber-bg)',  color: 'var(--color-chip-amber-fg)',  border: 'var(--color-chip-amber)' },
  red:    { background: 'var(--color-chip-red-bg)',    color: 'var(--color-chip-red-fg)',    border: 'var(--color-chip-red)' },
  purple: { background: 'var(--color-chip-purple-bg)', color: 'var(--color-chip-purple-fg)', border: 'var(--color-chip-purple)' },
  grey:   { background: 'var(--color-chip-grey-bg)',   color: 'var(--color-chip-grey-fg)',   border: 'var(--color-chip-grey)' },
  blue:   { background: 'var(--color-chip-blue-bg)',   color: 'var(--color-chip-blue-fg)',   border: 'var(--color-chip-blue)' },
}

export function Chip({ label, color, title, size = 'md' }: ChipProps) {
  const sty = COLOR_STYLES[color]
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
        padding: size === 'sm' ? '0.125rem 0.5rem' : '0.25rem 0.625rem',
        borderRadius: '9999px',
        fontFamily: 'var(--font-ui)',
        fontSize: size === 'sm' ? '0.6875rem' : '0.75rem',
        fontWeight: 500,
        lineHeight: 1.2,
        whiteSpace: 'nowrap',
        background: sty.background,
        color: sty.color,
        border: `1px solid ${sty.background}`,
      }}
    >
      {label}
    </span>
  )
}
