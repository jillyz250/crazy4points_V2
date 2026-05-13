import type { ReactNode } from 'react'

/**
 * Tile primitive for the program-page tile grid. Server-rendered
 * <details> element — content stays in the DOM when collapsed for
 * AI/LLM citability.
 *
 * The "pop" levers (no icons):
 *   - Oversized Playfair tabular numeral bottom-left (`stat`)
 *   - Index numeral top-right in gold Montserrat (`index`)
 *   - 24px hairline under eyebrow signals section type
 *
 * See styles/globals.css `.rg-tile` block for the full design system.
 */

export type TileCategory = 'Reference' | 'Live' | 'Opinion' | 'Archive'

export default function Tile({
  index,
  category,
  title,
  teaser,
  stat,
  statLabel,
  span = 4,
  children,
  defaultOpen = false,
}: {
  /** Display number top-right ("01", "02", ...). */
  index: string
  /** Category — drives the gold/purple/black eyebrow hairline. */
  category: TileCategory
  /** Section name in Playfair. */
  title: string
  /** One-line italic teaser under the title. */
  teaser: string
  /** Oversized Playfair numeral bottom-left (the "pop" lever). */
  stat: string | number
  /** Small-caps Montserrat label next to the stat. */
  statLabel: string
  /** 12-column span at desktop. Defaults to 4. */
  span?: 4 | 5 | 6 | 7 | 8 | 12
  children: ReactNode
  defaultOpen?: boolean
}) {
  // Map category → eyebrow modifier (drives the hairline color)
  const eyebrowClass =
    category === 'Reference' ? 'rg-tile-eyebrow-reference' :
    category === 'Live'      ? 'rg-tile-eyebrow-live' :
    category === 'Opinion'   ? 'rg-tile-eyebrow-opinion' :
                               'rg-tile-eyebrow-reference'

  return (
    <details
      className="rg-tile"
      style={{ gridColumn: `span ${span}` }}
      open={defaultOpen}
    >
      <summary>
        <span className="rg-tile-index">{index}</span>
        <span className={`rg-tile-eyebrow ${eyebrowClass}`}>
          {category}
        </span>
        <h3 className="rg-tile-title">{title}</h3>
        <p className="rg-tile-teaser">{teaser}</p>
        <div className="rg-tile-stat-row">
          <span className="rg-tile-stat">{stat}</span>
          <span className="rg-tile-stat-label">{statLabel}</span>
        </div>
        <span className="rg-tile-toggle" aria-hidden>+</span>
      </summary>
      <div className="rg-tile-body">{children}</div>
    </details>
  )
}
