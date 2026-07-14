'use client'

import { useState } from 'react'
import Link from 'next/link'
import { QUIZ, TRAVELER_TYPES, getTravelerType, scoreQuiz, type Pick } from '@/lib/travelerTypes'

const eyebrow = 'font-ui text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]'
const label = 'font-ui text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]'

function CardRow({ pick, anchor }: { pick: Pick; anchor?: boolean }) {
  return (
    <Link
      href={`/cards/${pick.slug}`}
      className="group mt-2 block rounded-[var(--radius-card)] border bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)] transition hover:-translate-y-0.5"
      style={{ borderColor: anchor ? 'var(--color-accent)' : 'var(--color-border-soft)', borderLeftWidth: anchor ? '4px' : '1px' }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-display text-lg font-semibold text-[var(--color-primary)] group-hover:underline">
          {pick.name} <span aria-hidden className="inline-block transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
        </span>
        <span className="font-ui text-xs font-semibold text-[var(--color-text-secondary)]">{pick.fee}</span>
      </div>
      {anchor && <p className="mt-1.5 font-body text-sm text-[var(--color-text-primary)]" style={{ lineHeight: 1.5 }}>{pick.blurb}</p>}
    </Link>
  )
}

export default function WhyQuiz() {
  const [answers, setAnswers] = useState<string[]>([])
  const [showOthers, setShowOthers] = useState(false)

  const done = answers.length >= QUIZ.length

  // --- Quiz in progress ---
  if (!done) {
    const idx = answers.length
    const question = QUIZ[idx]
    return (
      <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background-soft)] p-6 shadow-[var(--shadow-soft)] md:p-8">
        <div className="flex items-center justify-between">
          <span className={eyebrow}>Question {idx + 1} of {QUIZ.length}</span>
          {idx > 0 && (
            <button
              type="button"
              onClick={() => setAnswers((a) => a.slice(0, -1))}
              className="font-ui text-xs font-semibold text-[var(--color-text-secondary)] underline underline-offset-4 hover:text-[var(--color-primary)]"
            >
              Back
            </button>
          )}
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border-soft)]">
          <div className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300" style={{ width: `${(idx / QUIZ.length) * 100}%` }} />
        </div>
        <h3 className="mt-5 font-display text-xl font-semibold leading-snug text-[var(--color-primary)] md:text-2xl">{question.q}</h3>
        <div className="mt-4 flex flex-col gap-2.5">
          {question.options.map((o) => (
            <button
              key={o.type}
              type="button"
              onClick={() => setAnswers((a) => [...a, o.type])}
              className="rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-4 py-3.5 text-left font-body text-[var(--color-text-primary)] transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:bg-[var(--color-background-soft)]"
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // --- Result ---
  const t = getTravelerType(scoreQuiz(answers))!
  const others = TRAVELER_TYPES.filter((x) => x.id !== t.id)

  return (
    <div>
      <div className="rounded-[var(--radius-card)] border-2 border-[var(--color-accent)] bg-[var(--color-background-soft)] p-6 shadow-[var(--shadow-soft)] md:p-8">
        <span className={eyebrow}>Your result</span>
        <h3 className="mt-1 font-display text-3xl font-semibold text-[var(--color-primary)]">{t.name}</h3>
        <p className="mt-1 font-body text-lg italic text-[var(--color-text-secondary)]">{t.tagline}</p>
        <p className="mt-3 font-body text-[var(--color-text-primary)]">{t.blurb}</p>
        <p className="mt-4 font-body">
          <span className={eyebrow}>Winning looks like</span>
          <br />
          <span className="font-display text-xl font-semibold text-[var(--color-primary)]">&ldquo;{t.winning}&rdquo;</span>
        </p>

        <p className={`mt-6 ${label}`}>Your card, to start</p>
        <CardRow pick={t.anchor} anchor />
        <p className={`mt-5 ${label}`}>Also consider</p>
        {t.alsoConsider.map((p) => (
          <CardRow key={p.slug} pick={p} />
        ))}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/guides/best-first-card#${t.id}`}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] px-5 py-2.5 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            Full breakdown and why <span aria-hidden>&rarr;</span>
          </Link>
          <button
            type="button"
            onClick={() => { setAnswers([]); setShowOthers(false) }}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-background)] px-5 py-2.5 font-ui text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-primary)] transition hover:border-[var(--color-primary)]"
          >
            Retake quiz
          </button>
        </div>
      </div>

      {/* Other types, collapsed */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowOthers((v) => !v)}
          aria-expanded={showOthers}
          className="inline-flex items-center gap-1 font-ui text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)] underline-offset-4 hover:underline"
        >
          {showOthers ? 'Hide the other types' : 'Curious about the other types?'}
          <span aria-hidden className={showOthers ? 'inline-block rotate-180 transition-transform' : 'inline-block transition-transform'}>&darr;</span>
        </button>
        {showOthers && (
          <div className="mt-3 flex flex-col gap-2.5">
            {others.map((o) => (
              <Link
                key={o.id}
                href={`/guides/best-first-card#${o.id}`}
                className="block rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]"
              >
                <span className="font-display text-base font-semibold text-[var(--color-primary)]">{o.name}</span>
                <span className="mt-0.5 block font-body text-sm text-[var(--color-text-secondary)]">{o.tagline}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
