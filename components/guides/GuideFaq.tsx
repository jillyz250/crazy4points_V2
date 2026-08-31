import { safeJsonLd } from '@/lib/jsonLd'

/**
 * Reusable guide FAQ block. Renders a "Quick answers" section AND emits
 * FAQPage JSON-LD from the same data, so the Q&A is machine-readable for
 * search (FAQ rich results, "People also ask") and LLM answer-extraction.
 *
 * Every guide should carry 4 to 8 GENUINE questions a reader actually asks,
 * answered concretely. Do not pad with weak questions — quality over count,
 * or the page reads as SEO stuffing. Facts in answers follow the same
 * multi-source verification standard as the rest of the guide.
 *
 * Usage:
 *   <GuideFaq items={[{ q: '...', a: '...' }, ...]} />
 */
export type FaqItem = { q: string; a: string }

export function GuideFaq({ items, heading = 'Quick answers' }: { items: FaqItem[]; heading?: string }) {
  if (!items?.length) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }

  return (
    <>
      <h2 className="mt-12 font-display text-2xl font-semibold text-[var(--color-primary)]">{heading}</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6">
        {items.map((it, i) => (
          <li key={i} className="font-body text-[var(--color-text-primary)]">
            <strong>{it.q}</strong> {it.a}
          </li>
        ))}
      </ul>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
    </>
  )
}
