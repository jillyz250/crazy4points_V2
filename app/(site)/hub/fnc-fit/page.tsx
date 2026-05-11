import type { Metadata } from 'next'
import ComingSoonHero from '@/components/hub/ComingSoonHero'

export const metadata: Metadata = {
  title: 'Will My FNC Fit? — coming soon — crazy4points',
  description:
    'Can your Free Night Cert cover this hotel? Yes / yes-with-topup / no, in three seconds.',
  alternates: { canonical: 'https://www.crazy4points.com/hub/fnc-fit' },
}

export default function Page() {
  return (
    <ComingSoonHero
      toolName="Will My FNC Fit?"
      question="Can my 35k Marriott cert cover this hotel?"
      description="Three-second yes/no on whether your Free Night Cert covers the property you're eyeing — plus topup math and alternatives nearby that DO fit. Marriott's own UI for this is a disaster. We fix it."
      whatItWillDo={[
        "Pick your cert (Marriott 35k/50k/85k, Hyatt Cat 1-4 or 1-7, IHG, Hilton)",
        "Search by property name or city + brand",
        "Get a clear verdict: fits, fits with N points topup, or doesn't fit",
        "Value chip: 'Great use of a cert' / 'Fine' / 'You're wasting it'",
        "When it doesn't fit: 3 alternative properties nearby that do",
      ]}
      tag="fnc-fit"
    />
  )
}
