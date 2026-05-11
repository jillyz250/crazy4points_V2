import type { Metadata } from 'next'
import ComingSoonHero from '@/components/hub/ComingSoonHero'

export const metadata: Metadata = {
  title: 'Where Can My Points Take Me? — coming soon — crazy4points',
  description:
    "Plug in your balances and discover real redemptions you can book today.",
  alternates: { canonical: 'https://www.crazy4points.com/hub/where-can-i-go' },
}

export default function Page() {
  return (
    <ComingSoonHero
      toolName="Where Can My Points Take Me?"
      question="I have 100k Amex MR sitting around. Inspire me."
      description="The discovery tool. Enter your points balances — Amex, Chase, Citi, Cap1, Bilt, plus airline programs — and we'll surface real redemptions you can actually book, ranked by realistic usefulness (not fantasy CPP)."
      whatItWillDo={[
        "Enter balances across transferable currencies and airline programs",
        "See 'use directly' redemptions you can pay for today",
        "See 'one transfer away' options you can unlock instantly",
        "Sorted by realistic value, not theoretical CPP math",
        "Future: mood-based filters (beach, lie-flat, no fuel surcharges, weekend)",
      ]}
      tag="where-can-i-go"
    />
  )
}
