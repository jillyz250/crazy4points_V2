import type { Metadata } from 'next'
import ComingSoonHero from '@/components/hub/ComingSoonHero'

export const metadata: Metadata = {
  title: 'Earn Path — coming soon — crazy4points',
  description:
    'The fastest, cheapest, or easiest way to earn the miles you need for a specific trip.',
  alternates: { canonical: 'https://www.crazy4points.com/hub/earn-path' },
}

export default function Page() {
  return (
    <ComingSoonHero
      toolName="Earn Path"
      question="I need 70k Atmos for Hawaii. Fastest realistic way?"
      description="Pick a target currency and an amount. Get the fastest, cheapest, or easiest path to get there — using transfers, active bonuses, your existing balances, and card SUBs in that priority order."
      whatItWillDo={[
        "Enter the currency + amount you need",
        "Three buttons: Fastest / Cheapest / Easiest — three different paths",
        "Transfer bonuses surface first when relevant",
        "Card SUBs ranked by realistic time-to-earn, not just headline number",
        "Honest about timeline — no 'apply for these 5 cards' nonsense",
      ]}
      tag="earn-path"
    />
  )
}
