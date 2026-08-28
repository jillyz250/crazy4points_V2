import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'
import { GuideJsonLd } from '@/components/guides/GuideJsonLd'
import GuideNewsletterCTA from '@/components/guides/GuideNewsletterCTA'

export const metadata: Metadata = {
  title: 'How to Spot an Elevated Welcome Offer',
  description:
    'Issuers raise credit card welcome offers above their usual level a few times a year. Learn how to tell an elevated offer from the everyday one, when to apply versus wait, and the catches to check first.',
  alternates: { canonical: 'https://www.crazy4points.com/guides/how-to-spot-an-elevated-welcome-offer' },
  openGraph: {
    title: 'How to Spot an Elevated Welcome Offer',
    description:
      'How to tell an elevated welcome offer from the standard one, when to apply versus wait, and the terms to check before you do.',
    url: 'https://www.crazy4points.com/guides/how-to-spot-an-elevated-welcome-offer',
    type: 'article',
    siteName: 'crazy4points',
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 86400

const h2 = 'mt-12 font-display text-2xl font-semibold text-[var(--color-primary)]'
const p = 'mt-4 font-body text-[var(--color-text-primary)]'
const li = 'font-body text-[var(--color-text-primary)]'

function Callout({ children, tone = 'soft' }: { children: React.ReactNode; tone?: 'soft' | 'warn' }) {
  const border = tone === 'warn' ? 'var(--color-accent)' : 'var(--color-primary)'
  return (
    <div
      style={{
        background: 'var(--color-background-soft)',
        border: '1px solid var(--color-border-soft)',
        borderLeft: `4px solid ${border}`,
        borderRadius: 'var(--radius-card)',
        padding: '1rem 1.25rem',
        margin: '1.25rem 0',
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text-primary)',
        lineHeight: 1.55,
      }}
    >
      {children}
    </div>
  )
}

export default function Page() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '60rem' }}>
        <p className="font-ui text-sm font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          <Link href="/guides" className="hover:text-[var(--color-primary)]">Guides</Link> · Cards &amp; Points
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          How to Spot an Elevated Welcome Offer
        </h1>
        <GuideDateline slug="how-to-spot-an-elevated-welcome-offer" />
        <GuideJsonLd slug="how-to-spot-an-elevated-welcome-offer" />

        <p className={p}>
          Every credit card has a welcome offer, the points, miles, or perks you get for signing up and meeting a
          spending requirement. What most people miss is that this offer is a moving target. A few times a year, issuers
          elevate it above its usual level, and that elevated version can be worth far more than the everyday one.
          Learning to spot the difference is one of the highest-value skills in this hobby, because the same card, same
          annual fee, and same effort can hand you a much bigger head start depending on the week you apply.
        </p>

        <h2 className={h2}>What &ldquo;elevated&rdquo; actually means</h2>
        <p className={p}>
          An elevated offer is simply a welcome offer that sits above the card&apos;s standard, always-available level. It
          usually shows up in one of two ways, and sometimes both at once:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li className={li}>
            <strong>A higher headline number.</strong> The card that normally gives its baseline points total is
            temporarily offering meaningfully more.
          </li>
          <li className={li}>
            <strong>Bonus perks stacked on top.</strong> Extra value layered onto the points: a statement credit, a free
            night certificate, a companion certificate, elevated earning for the first few months, or a waived first-year
            annual fee.
          </li>
        </ul>
        <Callout>
          <strong>&ldquo;Elevated&rdquo; is always relative to that card&apos;s own normal offer.</strong> A number that
          looks big on one card might be its standard deal, while a smaller-looking bump on another card might be an
          all-time high. You are comparing the card to itself, not to other cards.
        </Callout>

        <h2 className={h2}>How to tell an offer is elevated</h2>
        <p className={p}>Run through this quick checklist before you apply:</p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li className={li}>
            <strong>Look for limited-time language.</strong> Words like &ldquo;limited-time,&rdquo;
            &ldquo;increased,&rdquo; or &ldquo;special,&rdquo; or a countdown or expiration date, are the issuer telling
            you this is not the everyday offer.
          </li>
          <li className={li}>
            <strong>Compare it to the card&apos;s usual offer.</strong> If you have seen this card before at a lower
            number, and it is suddenly higher, that is your signal. This is exactly the comparison crazy4points does for
            you (more below).
          </li>
          <li className={li}>
            <strong>Check whether perks were added.</strong> Sometimes the points number stays flat but a statement
            credit or free night gets added. That is still an elevated offer, just in a different currency.
          </li>
          <li className={li}>
            <strong>Confirm it on the issuer&apos;s own page.</strong> Always verify the exact terms on the bank&apos;s
            official application page, never a third-party summary. The offer you see can depend on how you got there.
          </li>
        </ul>

        <h2 className={h2}>When to apply now vs wait</h2>
        <p className={p}>
          This is the judgment call, and the honest answer is that nobody can time it perfectly. Two principles help:
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li className={li}>
            <strong>A near-record offer is usually a &ldquo;now.&rdquo;</strong> If an offer is at or near the highest you
            have ever seen for that card, waiting rarely pays off. Offers cycle, but there is no guarantee a better one is
            coming, and no guarantee it will arrive before you want the points.
          </li>
          <li className={li}>
            <strong>A clear lull can justify patience,</strong> but only if you do not need the points soon. If the
            current offer looks low for that card and you have flexibility, it can be worth waiting for the next bump.
          </li>
        </ul>
        <Callout tone="warn">
          <strong>Remember the bird-in-hand rule.</strong> A good offer you can actually use beats a great offer that may
          never arrive. &ldquo;It will come back&rdquo; is a hope, not a plan.
        </Callout>

        <h2 className={h2}>The catches to check first</h2>
        <p className={p}>An elevated headline is only worth it if you can actually clear the terms. Before you apply, confirm:</p>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li className={li}>
            <strong>The spending requirement and the time window.</strong> Elevated offers sometimes ask for more spend,
            or the same spend in a tighter window. Make sure it fits your real budget, not a stretch.
          </li>
          <li className={li}>
            <strong>The annual fee.</strong> Factor the first-year fee, or whether it is waived, into whether the offer is
            truly a win.
          </li>
          <li className={li}>
            <strong>Whether you are even eligible.</strong> Some issuers limit how often you can earn a welcome offer on
            the same card. American Express, for example, commonly states you may not be eligible if you currently have or
            have previously had that card. Some banks also weigh how many new cards you have opened recently. Read the
            eligibility language before you count on the bonus.
          </li>
        </ul>

        <h2 className={h2}>How crazy4points tracks elevated offers for you</h2>
        <p className={p}>
          You do not have to memorize every card&apos;s normal number. That is the work we do in the background. When a
          card&apos;s welcome offer jumps above its baseline, we flag it: every card page shows the standard offer with a
          line through it and an <strong>&ldquo;Elevated offer&rdquo;</strong> badge the moment the current deal beats it,
          so you can see at a glance that now is a better-than-usual time to apply. When a jump is worth acting on, we also
          publish it as an alert and feature it in the newsletter.
        </p>
        <Callout>
          See the elevated offers we have flagged lately on our{' '}
          <Link href="/alerts" className="font-semibold text-[var(--color-primary)] underline">alerts page</Link>, and
          browse every card&apos;s current offer in the{' '}
          <Link href="/cards" className="font-semibold text-[var(--color-primary)] underline">Card Explorer</Link>.
        </Callout>

        <h2 className={h2}>Quick answers</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li className={li}>
            <strong>Is a bigger welcome offer always the better card?</strong> No. A huge offer on a card whose ongoing
            perks you will not use can be worth less than a smaller offer on a card that fits your travel. The offer is the
            head start, not the whole race.
          </li>
          <li className={li}>
            <strong>Do elevated offers come back?</strong> Often, but not on a schedule you can count on. Treat &ldquo;it
            will come back&rdquo; as a hope, not a plan.
          </li>
          <li className={li}>
            <strong>Where do elevated offers show up?</strong> On the issuer&apos;s own site, in targeted emails or mail,
            and sometimes as public limited-time promotions. Always confirm the terms on the official application page.
          </li>
        </ul>

        <GuideNewsletterCTA />
      </div>
    </main>
  )
}
