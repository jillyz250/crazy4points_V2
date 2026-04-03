import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch } from '@/lib/sanityClient'
import { getAlertBySlug } from '@/lib/queries'
import type { SanityAlert } from '@/lib/types'
import { computeFinalScore } from '@/lib/scoring'
import AlertDetail from '@/components/alerts/AlertDetail'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const alert = await sanityFetch<SanityAlert | null>(getAlertBySlug, { slug })

  if (!alert || !alert.isApproved) {
    return { title: 'Alert Not Found — crazy4points' }
  }

  return {
    title: `${alert.title} — crazy4points`,
    description: alert.summary,
    alternates: {
      canonical: `https://crazy4points.com/alerts/${slug}`,
    },
    openGraph: {
      title: alert.title,
      description: alert.summary,
      url: `https://crazy4points.com/alerts/${slug}`,
      type: 'article',
    },
  }
}

export default async function AlertDetailPage({ params }: Props) {
  const { slug } = await params
  const alert = await sanityFetch<SanityAlert | null>(getAlertBySlug, { slug })

  if (!alert || !alert.isApproved) {
    notFound()
  }

  const finalScore = computeFinalScore(alert)

  return <AlertDetail alert={alert} finalScore={finalScore} />
}
