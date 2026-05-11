import { BetaAnalyticsDataClient } from '@google-analytics/data'

/**
 * Returns a GA4 Data API client authed via service-account creds in env.
 * Required env:
 *   - GA4_PROPERTY_ID                (numeric property ID, NOT the G-XXXX measurement ID)
 *   - GA4_SERVICE_ACCOUNT_EMAIL      (client_email from the service account JSON)
 *   - GA4_SERVICE_ACCOUNT_KEY        (private_key from the JSON; literal \n sequences are converted to newlines)
 *
 * The service account must be granted "Viewer" on the GA4 property.
 */
export function getGa4Client(): BetaAnalyticsDataClient {
  const email = process.env.GA4_SERVICE_ACCOUNT_EMAIL
  const rawKey = process.env.GA4_SERVICE_ACCOUNT_KEY
  if (!email || !rawKey) {
    throw new Error('GA4 service-account env not set (GA4_SERVICE_ACCOUNT_EMAIL, GA4_SERVICE_ACCOUNT_KEY)')
  }
  // Vercel env vars don't preserve real newlines; the JSON private key contains \n escapes.
  const private_key = rawKey.replace(/\\n/g, '\n')
  return new BetaAnalyticsDataClient({
    credentials: { client_email: email, private_key },
  })
}

export function getGa4PropertyPath(): string {
  const id = process.env.GA4_PROPERTY_ID
  if (!id) throw new Error('GA4_PROPERTY_ID env not set')
  return `properties/${id}`
}

export function isGa4Configured(): boolean {
  return Boolean(
    process.env.GA4_PROPERTY_ID &&
      process.env.GA4_SERVICE_ACCOUNT_EMAIL &&
      process.env.GA4_SERVICE_ACCOUNT_KEY,
  )
}
