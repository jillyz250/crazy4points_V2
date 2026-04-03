// Sanity Content Lake client using native fetch — no @sanity/client dependency needed.
// Set NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET in your .env.local.
// If your dataset is private, also set SANITY_API_TOKEN.

export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
  const token = process.env.SANITY_API_TOKEN

  if (!projectId) {
    console.warn('NEXT_PUBLIC_SANITY_PROJECT_ID is not set — returning empty result')
    return [] as unknown as T
  }

  const encodedQuery = encodeURIComponent(query)
  const paramString = Object.entries(params)
    .map(([k, v]) => `$${k}=${encodeURIComponent(JSON.stringify(v))}`)
    .join('&')

  const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${encodedQuery}${paramString ? `&${paramString}` : ''}`

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, {
    headers,
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    console.error(`Sanity fetch failed: ${res.status} ${res.statusText}`)
    return [] as unknown as T
  }

  const json = await res.json()
  return json.result as T
}
