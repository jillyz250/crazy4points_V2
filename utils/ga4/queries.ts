import { getGa4Client, getGa4PropertyPath } from './client'

export type DateRange = { startDate: string; endDate: string } // YYYY-MM-DD or 'NdaysAgo' / 'today'

export type ActiveUsersDay = { date: string; activeUsers: number }
export type KeyEventRow = { eventName: string; eventCount: number; users: number }
export type CityRow = { city: string; country: string; activeUsers: number }
export type PageRow = { pagePath: string; views: number; avgEngagementSeconds: number }
export type Totals = {
  activeUsers: number
  newUsers: number
  sessions: number
  screenPageViews: number
  averageSessionDuration: number
  engagementRate: number
}

/** Run all dashboard queries in parallel. Returns null fields on individual query failure so the page still renders. */
export async function fetchAnalyticsDashboard(range: DateRange) {
  const [totals, daily, events, cities, pages] = await Promise.allSettled([
    getTotals(range),
    getActiveUsersByDay(range),
    getKeyEvents(range),
    getTopCities(range),
    getTopPages(range),
  ])

  return {
    totals: totals.status === 'fulfilled' ? totals.value : null,
    daily: daily.status === 'fulfilled' ? daily.value : [],
    events: events.status === 'fulfilled' ? events.value : [],
    cities: cities.status === 'fulfilled' ? cities.value : [],
    pages: pages.status === 'fulfilled' ? pages.value : [],
    errors: [totals, daily, events, cities, pages]
      .filter((r) => r.status === 'rejected')
      .map((r) => (r as PromiseRejectedResult).reason?.message || 'unknown'),
  }
}

export async function getTotals(range: DateRange): Promise<Totals> {
  const [resp] = await getGa4Client().runReport({
    property: getGa4PropertyPath(),
    dateRanges: [range],
    metrics: [
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'engagementRate' },
    ],
  })
  const row = resp.rows?.[0]
  const v = (i: number) => Number(row?.metricValues?.[i]?.value ?? 0)
  return {
    activeUsers: v(0),
    newUsers: v(1),
    sessions: v(2),
    screenPageViews: v(3),
    averageSessionDuration: v(4),
    engagementRate: v(5),
  }
}

export async function getActiveUsersByDay(range: DateRange): Promise<ActiveUsersDay[]> {
  const [resp] = await getGa4Client().runReport({
    property: getGa4PropertyPath(),
    dateRanges: [range],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    limit: 365,
  })
  return (resp.rows ?? []).map((r) => ({
    date: r.dimensionValues?.[0]?.value ?? '',
    activeUsers: Number(r.metricValues?.[0]?.value ?? 0),
  }))
}

export async function getKeyEvents(range: DateRange): Promise<KeyEventRow[]> {
  const [resp] = await getGa4Client().runReport({
    property: getGa4PropertyPath(),
    dateRanges: [range],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 25,
  })
  return (resp.rows ?? []).map((r) => ({
    eventName: r.dimensionValues?.[0]?.value ?? '',
    eventCount: Number(r.metricValues?.[0]?.value ?? 0),
    users: Number(r.metricValues?.[1]?.value ?? 0),
  }))
}

export async function getTopCities(range: DateRange): Promise<CityRow[]> {
  const [resp] = await getGa4Client().runReport({
    property: getGa4PropertyPath(),
    dateRanges: [range],
    dimensions: [{ name: 'city' }, { name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 25,
  })
  return (resp.rows ?? []).map((r) => ({
    city: r.dimensionValues?.[0]?.value ?? '',
    country: r.dimensionValues?.[1]?.value ?? '',
    activeUsers: Number(r.metricValues?.[0]?.value ?? 0),
  }))
}

export async function getTopPages(range: DateRange): Promise<PageRow[]> {
  const [resp] = await getGa4Client().runReport({
    property: getGa4PropertyPath(),
    dateRanges: [range],
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'userEngagementDuration' }, { name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 25,
  })
  return (resp.rows ?? []).map((r) => {
    const views = Number(r.metricValues?.[0]?.value ?? 0)
    const engagementSec = Number(r.metricValues?.[1]?.value ?? 0)
    const users = Number(r.metricValues?.[2]?.value ?? 0)
    return {
      pagePath: r.dimensionValues?.[0]?.value ?? '',
      views,
      avgEngagementSeconds: users > 0 ? engagementSec / users : 0,
    }
  })
}
