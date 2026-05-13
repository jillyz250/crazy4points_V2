import type { ReactNode } from 'react'

/**
 * Simple uniform tile for the program-page section grid. Matches the
 * admin-dashboard tile pattern Jill referenced (clean white card,
 * bold title, gray description, "Open →" CTA). No oversized numerals,
 * no asymmetric layout, no category eyebrows — just clean cards.
 *
 * Click → expands inline via native <details>. Server-rendered, so
 * content stays in DOM (AI/LLM citable) even when collapsed.
 */
export default function SimpleTile({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <details className="rg-simple-tile">
      <summary>
        <div className="rg-simple-tile-body">
          <h3 className="rg-simple-tile-title">{title}</h3>
          <p className="rg-simple-tile-description">{description}</p>
        </div>
        <span className="rg-simple-tile-cta">Open →</span>
      </summary>
      <div className="rg-simple-tile-content">{children}</div>
    </details>
  )
}
