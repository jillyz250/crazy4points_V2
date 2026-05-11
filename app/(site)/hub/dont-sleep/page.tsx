import type { Metadata } from 'next'
import ComingSoonHero from '@/components/hub/ComingSoonHero'

export const metadata: Metadata = {
  title: "Don't Sleep On These — coming soon — crazy4points",
  description:
    'Living sweet spots — the best redemptions in 2026, with survival odds and what might kill them.',
  alternates: { canonical: 'https://www.crazy4points.com/hub/dont-sleep' },
}

export default function Page() {
  return (
    <ComingSoonHero
      toolName="Don't Sleep On These"
      question="What are 2026's best redemptions, and which ones might not survive the year?"
      description="A living list of the best redemptions in points and miles right now — not a stale blog post from 2022. Each sweet spot gets a survival health score and what could kill it. So you know whether to book now or wait."
      whatItWillDo={[
        "Curated top 10-12 sweet spots, refreshed continuously",
        "Each has a health score: Stable / At risk / On life support",
        "'Why this still works' explainer per sweet spot",
        "'What might kill it' — devaluation flags, partnership changes, IT migrations",
        "Optionally filter by your wallet to see only the ones you can book",
      ]}
      tag="dont-sleep"
    />
  )
}
