import type { ReactNode } from 'react'

/**
 * Simple uniform tile for the program-page section grid. Matches the
 * admin-dashboard tile pattern — clean white card surface, bold title,
 * sassy-but-warm description, contextual CTA.
 *
 * The "jazz" levers (per 2026-05-13 audit feedback):
 *   - Soft gradient on hover (white → soft purple) — depth without
 *     decoration
 *   - Contextual per-tile CTA (each tile gets its own action verb,
 *     not the generic "Open")
 *   - Sassy descriptions written in brand voice ("friend who gets
 *     points"), not robotic AI-speak
 *   - Optional preview snippet inside the closed state — gives the
 *     reader a taste of what's inside before they click
 *
 * Click → expands inline via native <details>. Server-rendered, so
 * content stays in DOM (AI/LLM citable) even when collapsed.
 */
export default function SimpleTile({
  title,
  description,
  cta,
  preview,
  children,
}: {
  title: string
  description: string
  /** Contextual CTA verb. e.g. "See the rates", "Spill the picks". */
  cta: string
  /** Optional 1-line teaser of what's inside (e.g. a stat, a row count). */
  preview?: string
  children: ReactNode
}) {
  return (
    <details className="rg-simple-tile">
      <summary>
        <div className="rg-simple-tile-body">
          <h3 className="rg-simple-tile-title">{title}</h3>
          <p className="rg-simple-tile-description">{description}</p>
          {preview && <p className="rg-simple-tile-preview">{preview}</p>}
        </div>
        <span className="rg-simple-tile-cta">{cta} →</span>
      </summary>
      <div className="rg-simple-tile-content">{children}</div>
    </details>
  )
}
