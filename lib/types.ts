export interface SanityAlert {
  _id: string
  title: string
  slug: { current: string }
  summary: string
  type: string
  programs: string[]
  actionType: string
  startDate: string
  endDate: string | null
  publishedAt: string
  confidenceLevel: string
  impactScore: number
  impactJustification: string
  valueScore: number
  rarityScore?: number
  isApproved: boolean
  approvedAt?: string
  source?: string
  relatedAlerts?: Array<{
    _id: string
    title: string
    slug: { current: string }
    summary: string
    type: string
  }>
}
