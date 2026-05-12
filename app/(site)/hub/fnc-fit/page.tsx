import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import {
  getProgramIdBySlug,
  searchProperties,
  findAlternatives,
} from '@/utils/supabase/fncFitQueries'
import { findCert, computeFit } from '@/lib/fncCerts'
import FncFitForm from '@/components/hub/FncFitForm'
import FncFitResult from '@/components/hub/FncFitResult'

export const metadata: Metadata = {
  title: 'Will My Free Night Cert Fit? — The Points Hub — crazy4points',
  description:
    "Three-second yes/no on whether your Free Night Cert covers a hotel — plus top-up math and alternatives nearby that DO fit.",
  alternates: { canonical: 'https://www.crazy4points.com/hub/fnc-fit' },
}

export const revalidate = 300

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ cert?: string; q?: string }>
}) {
  const sp = await searchParams
  const certId = (sp.cert ?? '').trim()
  const query = (sp.q ?? '').trim()

  const cert = certId ? findCert(certId) : null
  let matches: Awaited<ReturnType<typeof searchProperties>> = []
  let alternatives: Awaited<ReturnType<typeof findAlternatives>> = []
  let queryError: string | null = null

  // Short-circuit when the cert's program isn't indexed yet (Migration
  // backlog — see lib/fncCerts.ts `available: false`). Give the user a
  // clear "coming soon" message instead of letting the search fall
  // through to an empty result set.
  if (cert && cert.available === false) {
    queryError = `${cert.label.replace(/ Free Night.*$/, '')} property data is coming soon. Hyatt and Marriott searches work today.`
  } else if (cert && query) {
    try {
      const supabase = createAdminClient()
      const programId = await getProgramIdBySlug(supabase, cert.programSlug)
      if (!programId) {
        queryError = `We don't have ${cert.programSlug} properties indexed yet.`
      } else {
        matches = await searchProperties(supabase, programId, query, 3)

        // If the top match doesn't fit, surface alternatives in the same city
        if (matches.length > 0) {
          const top = matches[0]
          const fit = computeFit(cert, top)
          if (fit.verdict === 'doesnt_fit') {
            alternatives = await findAlternatives(supabase, programId, top, {
              matchModel: cert.matchModel,
              maxPoints: cert.maxPoints,
              maxCategory: cert.maxCategory,
              topupMax: cert.topupMax,
            }, 5)
          }
        }
      }
    } catch (err) {
      console.error('[hub/fnc-fit] query failed:', err)
      queryError = 'Something went wrong looking up the hotel. Try a simpler search.'
    }
  }

  return (
    <main className="rg-major-section">
      <div className="rg-container" style={{ maxWidth: '52rem' }}>
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
          Will My Free Night Cert Fit?
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1.0625rem',
            color: 'var(--color-text-secondary)',
            margin: '0 0 1.5rem',
            lineHeight: 1.55,
            maxWidth: '40rem',
          }}
        >
          Pick your Free Night Cert and search a property. We&apos;ll tell you
          if it fits, if it needs a top-up, or what alternatives in the same
          city actually work.
        </p>

        <FncFitForm initialCert={certId} initialQuery={query} />

        <div
          style={{
            marginTop: '-0.5rem',
            marginBottom: '1.5rem',
            padding: '0.625rem 0.875rem',
            background: '#FEF3C7',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--radius-ui)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8125rem',
            color: '#78350F',
            lineHeight: 1.5,
          }}
        >
          <strong>Coverage note:</strong> Hyatt is fully indexed (1,613
          properties globally). Marriott coverage is partial (~3,800 US
          properties, points data spotty). IHG and Hilton property data
          coming soon.
        </div>

        {queryError && (
          <p
            style={{
              padding: '0.875rem 1rem',
              background: '#FECACA',
              border: '1px solid #F87171',
              borderRadius: 'var(--radius-card)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem',
              color: '#7F1D1D',
              margin: '0 0 1.5rem',
            }}
          >
            {queryError}
          </p>
        )}

        {cert && query && !queryError && matches.length === 0 && (
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
              No properties matched &ldquo;{query}&rdquo;
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9375rem',
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              Try the city name (e.g. &ldquo;Vienna&rdquo;) or a more distinctive
              piece of the property name.
            </p>
          </div>
        )}

        {cert && matches.length > 0 && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {matches.map((p) => {
              const fit = computeFit(cert, p)
              return <FncFitResult key={p.id} property={p} cert={cert} fit={fit} />
            })}

            {alternatives.length > 0 && (
              <div
                style={{
                  marginTop: '1.5rem',
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
                    margin: '0 0 0.75rem',
                  }}
                >
                  Alternatives nearby that DO fit
                </h2>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {alternatives.map((a) => (
                    <div
                      key={a.id}
                      style={{
                        padding: '0.625rem 0.875rem',
                        background: '#fff',
                        border: '1px solid var(--color-border-soft)',
                        borderRadius: 'var(--radius-ui)',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.9375rem',
                          color: 'var(--color-primary)',
                        }}
                      >
                        {a.name}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.8125rem',
                          color: 'var(--color-text-secondary)',
                          marginTop: '0.125rem',
                        }}
                      >
                        {a.brand} · {a.city}
                        {a.category && ` · Cat ${a.category}`}
                        {a.standard_points != null &&
                          ` · ${(a.standard_points / 1000).toFixed(a.standard_points % 1000 === 0 ? 0 : 1)}k pts standard`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!cert && !query && (
          <div
            style={{
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
              Try these
            </h2>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              {[
                { cert: 'hyatt-1-7', q: 'Andaz Maui', label: 'Hyatt 1-7 cert → Andaz Maui (Cat 8 — see what happens)' },
                { cert: 'hyatt-1-7', q: 'Park Hyatt Vienna', label: 'Hyatt 1-7 cert → Park Hyatt Vienna' },
                { cert: 'hyatt-1-4', q: 'Hyatt Place', label: 'Hyatt 1-4 cert → Hyatt Place options' },
                { cert: 'hyatt-1-4', q: 'Tokyo', label: 'Hyatt 1-4 cert → Tokyo properties' },
              ].map((ex) => (
                <Link
                  key={`${ex.cert}-${ex.q}`}
                  href={`/hub/fnc-fit?cert=${ex.cert}&q=${encodeURIComponent(ex.q)}`}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9375rem',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    padding: '0.375rem 0',
                  }}
                >
                  → {ex.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
