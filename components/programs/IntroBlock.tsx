import { marked } from 'marked'

/**
 * Standalone intro block on /programs/[slug]. Pulled out of
 * ProgramPageContent so it can render above the tile grid while the
 * rest of the editorial sections (award chart, sweet spots, etc.)
 * move into tiles below.
 *
 * Treatment: soft-purple block with a 3px purple left border —
 * matches the original ProgramPageContent intro pattern so the page
 * still reads consistent across pre- and post-redesign programs.
 */
export default async function IntroBlock({
  intro,
}: {
  intro: string | null
}) {
  if (!intro?.trim()) return null
  const html = await marked.parse(intro, { async: true })
  return (
    <section
      id="intro"
      style={{
        marginBottom: '3rem',
        scrollMarginTop: '2rem',
        padding: '1.25rem 1.5rem',
        background: 'var(--color-background-soft)',
        borderRadius: 'var(--radius-card)',
        borderLeft: '3px solid var(--color-primary)',
      }}
    >
      <div
        className="rg-prose"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '1rem',
          lineHeight: 1.65,
          color: 'var(--color-text-primary)',
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  )
}
