import { redirect } from 'next/navigation'

/**
 * Phase 4 — /admin/alerts is now an alias for the unified /admin/drafts hub.
 * The list lives at /admin/drafts; this page redirects with format=alert so
 * old bookmarks + muscle memory keep working.
 *
 * The edit + new routes (/admin/alerts/[id]/edit, /admin/alerts/new) stay
 * intact — they're already variant-shaped after Wave 3a.
 */
export default function AdminAlertsRedirect() {
  redirect('/admin/drafts?format=alert')
}
