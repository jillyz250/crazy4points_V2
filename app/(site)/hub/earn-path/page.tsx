import type { Metadata } from 'next'
import Link from 'next/link'
import { createAdminClient } from '@/utils/supabase/server'
import {
  getEarnableTargets,
  getEarnPathOptions,
  sortEarnOptions,
} from '@/utils/supabase/earnPathQueries'
import type { EarnSortMode, EarnOption } from '@/utils/supabase/earnPathQueries'
import type { Program } from '@/utils/supabase/queries'
import EarnPathForm from '@/components/hub/EarnPathForm'
import EarnPathOptionCard from '@/components/hub/EarnPathOptionCard'

export const metadata: Metadata = {
  title: 'Earn Path — The Points Hub — crazy4points',
  description:
    'Need miles in a specific program? See the fastest, cheapest, or easiest way to earn them.',
  alternates: { canonical: 'https://www.crazy4points.com/hub/earn-path' },
}

export const revalidate = 300

const VALID_MODES: EarnSortMode[] = ['fastest', 'cheapest', 'easiest']

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ target?: string; mode?: string }>
}) {
  const sp = await searchParams
  const targetSlug = (sp.target ?? '').trim()
  const mode: EarnSortMode = VALID_MODES.includes(sp.mode as EarnSortMode)
    ? (sp.mode as EarnSortMode)
    : 'fastest'

  const supabase = createAdminClient()

  let targets: Program[] = []
  let target: Program | null = null
  let options: EarnOption[] = []
  let queryError: string | null = null

  try {
    targets = await getEarnableTargets(supabase)
    if (targetSlug) {
      target = targets.find((t) => t.slug === targetSlug) ?? null
      if (target) {
        options = sortEarnOptions(
          await getEarnPathOptions(supabase, target),
          mode,
        )
      }
    }
  } catch (err) {
    console.error('[hub/earn-path] query failed:', err)
    queryError = 'Something went wrong loading the data. Refresh and try again.'
  }

  const modeBlurb: Record<EarnSortMode, string> = {
    fastest:
      'Active transfer bonuses and instant transfers first. Card SUBs last (approval + spend takes weeks).',
    cheapest:
      '1:1 transfers and no-AF cards first. Avoid expensive routes when a free one works.',
    easiest:
      'Single-step transfers from currencies you likely already have. Cards last.',
  }

  return (
    <main className="rg-major-section">
      <div className="rg-container" style={{ maxWidth: '56rem' }}>
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
          Earn Path
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
          Pick a target program and a path. We&apos;ll surface every realistic
          way to earn miles there — active bonuses, transferable currencies,
          and card SUBs — ranked by what you care about.
        </p>

        <EarnPathForm targets={targets} initialTarget={targetSlug} initialMode={mode} />

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

        {target && (
          <>
            <div
              style={{
                marginBottom: '1.25rem',
                padding: '0.875rem 1rem',
                background: 'var(--color-background-soft)',
                border: '1px solid var(--color-border-soft)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.0625rem',
                  color: 'var(--color-primary)',
                  lineHeight: 1.3,
                }}
              >
                Earning into {target.name}
              </div>
              <div
                style={{
                  marginTop: '0.25rem',
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {modeBlurb[mode]}
              </div>
            </div>

            {options.length === 0 ? (
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
                  No earn paths authored for {target.name} yet
                </h2>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9375rem',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                  }}
                >
                  We add transfer paths and co-brand cards as we author each
                  program page.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {options.map((opt, i) => (
                  <EarnPathOptionCard key={`${opt.kind}-${i}`} option={opt} />
                ))}
              </div>
            )}
          </>
        )}

        {!target && targets.length > 0 && (
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
              Try one of these
            </h2>
            <div style={{ display: 'grid', gap: '0.375rem' }}>
              {['atmos', 'aa', 'united', 'delta'].map((slug) => {
                const t = targets.find((x) => x.slug === slug)
                if (!t) return null
                return (
                  <Link
                    key={slug}
                    href={`/hub/earn-path?target=${slug}&mode=fastest`}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.9375rem',
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      padding: '0.375rem 0',
                    }}
                  >
                    → How to earn {t.name}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
