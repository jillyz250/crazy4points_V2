'use client'

import { usePathname } from 'next/navigation'
import FooterNewsletterSignup from './FooterNewsletterSignup'

// The sitewide footer signup is suppressed on routes that already carry a
// dedicated, prominent newsletter signup — so no page shows two signup forms.
//   /              → homepage newsletter band
//   /newsletter*   → newsletter hub + issue pages have their own hero signup
//   /blog/*        → blog posts have an inline newsletter CTA
function isSuppressed(path: string): boolean {
  return (
    path === '/' ||
    path === '/newsletter' ||
    path.startsWith('/newsletter/') ||
    path.startsWith('/blog/')
  )
}

export default function FooterNewsletterGate() {
  const pathname = usePathname()
  if (isSuppressed(pathname)) return null

  return (
    <div className="border-b border-[var(--color-border-soft)] bg-[var(--color-background)]">
      <FooterNewsletterSignup />
    </div>
  )
}
