import type { Metadata } from 'next'
import ComingSoonHero from '@/components/hub/ComingSoonHero'

export const metadata: Metadata = {
  title: 'Best Way to Book It — coming soon — crazy4points',
  description:
    'A route-first award booking tool. Punch in your trip, see every smart way to book it.',
  alternates: { canonical: 'https://www.crazy4points.com/hub/best-way-to-book' },
}

export default function Page() {
  return (
    <ComingSoonHero
      toolName="Best Way to Book It"
      question="I'm flying JFK to HNL. What's the smart move?"
      description="Punch in any route and we'll surface every smart way to book it with points — sorted by miles, with the cash co-pay and the catch up front. The flagship Hub tool."
      whatItWillDo={[
        "Type origin + destination airport codes — we'll figure out the rest",
        "See every program that can book the route, ranked cheapest miles first",
        "Cash fees, surcharges, and the gotchas inline ('BA fuel surcharges $700+')",
        "Optional Points Wallet — only show what you can actually book today",
        "'Where to search' guidance per row so you don't waste time on dead programs",
      ]}
      tag="best-way-to-book"
    />
  )
}
