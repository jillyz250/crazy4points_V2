import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import { getDontSleepSweetSpots, groupByRouteBucket } from '@/utils/supabase/dontSleepQueries'
import type { EnrichedSweetSpot } from '@/utils/supabase/dontSleepQueries'
import { ROUTE_BUCKET_LABELS } from '@/lib/airports'
import type { RouteBucket } from '@/lib/airports'
import SweetSpotCard from '@/components/hub/SweetSpotCard'
import ChartDisclaimer from '@/components/hub/ChartDisclaimer'

export const metadata: Metadata = {
  title: "Don't Sleep On These — The Points Hub — crazy4points",
  description:
    "Living sweet spots — the best redemptions in 2026 that still actually work, with survival odds and what might kill each one.",
  alternates: { canonical: 'https://www.crazy4points.com/hub/dont-sleep' },
}

export const revalidate = 300

const BUCKET_ORDER: RouteBucket[] = [
  'us-short',
  'us-medium',
  'us-long',
  'us-eu-east',
  'us-eu-west',
  'us-japan',
  'us-se-asia',
  'us-me-india',
  'us-pacific',
  'us-africa',
  'us-samerica',
]

export default async function Page() {
  const supabase = createAdminClient()
  let rows: EnrichedSweetSpot[] = []
  try {
    rows = await getDontSleepSweetSpots(supabase)
  } catch (err) {
    console.error('[hub/dont-sleep] failed:', err)
    rows = []
  }

  const groups = groupByRouteBucket(rows)

  return (
    <main className="rg-major-section">
      <div className="rg-container" style={{ maxWidth: '60rem' }}>
        <Link
          href="/hub"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            fontFamily: 'var(--font-ui)',
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            textDecoration: 'none',
            marginBottom: '1rem',
          }}
        >
          ← Back to the Hub
        </Link>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: 'var(--color-primary)',
            margin: '0 0 0.75rem',
            lineHeight: 1.1,
          }}
        >
          Don&apos;t Sleep On These
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.0625rem',
            color: 'var(--color-text-secondary)',
            margin: '0 0 0.5rem',
            lineHeight: 1.55,
            maxWidth: '40rem',
          }}
        >
          The best redemptions in 2026 that still actually work — not a stale
          blog post. Each sweet spot has a health rating and what might kill it.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary)',
            margin: '0 0 2rem',
            lineHeight: 1.5,
            fontStyle: 'italic',
            maxWidth: '40rem',
          }}
        >
          We skip fantasy redemptions. Every spot here is on a published
          chart that traditionally has decent availability — but you still
          need to confirm space on the operating airline before transferring
          miles.
        </p>

        <ChartDisclaimer />

        {rows.length === 0 ? (
          <div
            style={{
              padding: '1.5rem',
              background: 'var(--color-background-soft)',
              border: '1px dashed var(--color-border-soft)',
              borderRadius: 'var(--radius-card)',
              textAlign: 'center',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.125rem',
                color: 'var(--color-primary)',
                margin: '0 0 0.5rem',
              }}
            >
              Sweet spots are getting curated
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9375rem',
                color: 'var(--color-text-secondary)',
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              We tag redemptions as sweet spots only when they&apos;re actually
              bookable. As we author more airlines and verify availability,
              this page fills out.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {BUCKET_ORDER.filter((b) => groups.has(b)).map((b) => (
              <section key={b}>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    color: 'var(--color-primary)',
                    margin: '0 0 0.75rem',
                  }}
                >
                  {ROUTE_BUCKET_LABELS[b]}
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {groups.get(b)!.map((r) => (
                    <SweetSpotCard key={r.id} r={r} />
                  ))}
                </div>
              </section>
            ))}
            {groups.has('other') && (
              <section>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.25rem',
                    color: 'var(--color-primary)',
                    margin: '0 0 0.75rem',
                  }}
                >
                  Other regions
                </h2>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(20rem, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {groups.get('other')!.map((r) => (
                    <SweetSpotCard key={r.id} r={r} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: '3rem',
            padding: '1.25rem',
            background: 'var(--color-background-soft)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.0625rem',
              color: 'var(--color-primary)',
              margin: '0 0 0.5rem',
            }}
          >
            What &ldquo;sweet spot&rdquo; means here
          </h2>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              color: 'var(--color-text-secondary)',
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            A redemption that&apos;s both cheap on miles AND has decent
            availability. We don&apos;t care about theoretical 9.4 CPP if you
            can&apos;t book the seat. &ldquo;Stable&rdquo; means it&apos;s
            holding for now; &ldquo;At risk&rdquo; means we&apos;re watching it
            for a devaluation or partner shift.
          </p>
        </div>
      </div>
    </main>
  )
}
