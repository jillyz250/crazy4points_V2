import type { Metadata } from 'next'
import Link from 'next/link'
import { GuideDateline } from '@/components/guides/GuideDateline'

export const metadata: Metadata = {
  title: "Having Trouble Adding Your Card to Paze? You're Not Alone",
  description:
    "Paze isn't like Apple Pay: you can't just type in a card number. You switch it on one card at a time inside the Chase app. Here's the 30-second fix, step by step.",
  alternates: { canonical: 'https://www.crazy4points.com/guides/how-to-add-your-card-to-paze' },
  openGraph: {
    title: "Having Trouble Adding Your Card to Paze? You're Not Alone",
    description:
      "Paze works one card at a time inside the Chase app, not by typing a card number. The 30-second fix, step by step.",
    url: 'https://www.crazy4points.com/guides/how-to-add-your-card-to-paze',
    type: 'article',
    siteName: 'crazy4points',
  },
  twitter: { card: 'summary_large_image' },
}

export const revalidate = 86400

function Callout({ children, tone = 'soft' }: { children: React.ReactNode; tone?: 'soft' | 'warn' }) {
  const border = tone === 'warn' ? 'var(--color-accent)' : 'var(--color-primary)'
  return (
    <div style={{ background: 'var(--color-background-soft)', border: '1px solid var(--color-border-soft)', borderLeft: `4px solid ${border}`, borderRadius: 'var(--radius-card)', padding: '1rem 1.25rem', margin: '1.25rem 0', fontFamily: 'var(--font-body)', color: 'var(--color-text-primary)', lineHeight: 1.55 }}>
      {children}
    </div>
  )
}

const h2 = 'mt-10 font-display text-2xl font-semibold text-[var(--color-primary)]'
const p = 'mt-4 font-body text-[var(--color-text-primary)]'

export default function AddCardToPazeGuide() {
  return (
    <main className="rg-major-section">
      <div className="rg-container rg-guide" style={{ maxWidth: '64rem' }}>
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-2.5 py-1 font-ui text-[0.6875rem] font-bold uppercase tracking-[0.08em] text-[#1A1A1A]">
          Guide &middot; Cards &amp; Payments
        </span>
        <h1 className="font-display text-3xl font-semibold text-[var(--color-primary)] md:text-4xl">
          Having Trouble Adding Your Card to Paze? You&rsquo;re Not Alone
        </h1>
        <GuideDateline slug="how-to-add-your-card-to-paze" />
        <p className="mt-4 font-body text-lg text-[var(--color-text-secondary)]">
          {"Here's the part nobody tells you: Paze isn't like Apple Pay. You can't just type in a card number and go. You switch it on one card at a time, inside the Chase app. Once you know that, it takes about 30 seconds."}
        </p>

        <Callout>
          <strong>What Paze is:</strong>{' '}
          {'a digital wallet built by the major banks for faster online checkout. Because your bank runs it, you turn it on from inside your bank app rather than typing card details into the wallet itself.'}
        </Callout>

        <h2 className={h2}>The 30-second fix</h2>
        <ol className="mt-3 flex flex-col gap-2 font-body text-[var(--color-text-primary)]" style={{ listStyle: 'decimal', paddingLeft: '1.25rem' }}>
          <li>Sign in to the <strong>Chase mobile app</strong>.</li>
          <li>Pick the <strong>card</strong> you want to add.</li>
          <li>Tap <strong>Manage Account</strong>, then <strong>Digital Wallets</strong>.</li>
          <li>Select <strong>Paze</strong>.</li>
          <li>Choose your card.</li>
          <li>Tap <strong>Activate Paze</strong> and accept the terms (if you haven&rsquo;t already).</li>
        </ol>

        <Callout tone="warn">
          <strong>The one thing that trips people up:</strong>{' '}
          {"there's no \"add a card\" screen where you type a number. If you're hunting for one, that's why it feels broken. It lives under Manage Account, one card at a time."}
        </Callout>

        <h2 className={h2}>Good to know</h2>
        <ul className="mt-3 flex flex-col gap-2 font-body text-[var(--color-text-primary)]" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
          <li><strong>One card at a time.</strong> Repeat the steps for each card you want available in Paze.</li>
          <li><strong>You accept the terms once.</strong> After the first activation, adding more cards is quicker.</li>
          <li><strong>It&rsquo;s for online checkout,</strong> so you&rsquo;ll see Paze as a payment option on participating websites, not in stores.</li>
        </ul>

        <p className="mt-10 font-body text-sm text-[var(--color-text-secondary)]">
          Steps reflect the Chase mobile app. Browse all <Link href="/guides" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>guides</Link> or our{' '}
          <Link href="/cards" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>card pages</Link>.
        </p>
      </div>
    </main>
  )
}
