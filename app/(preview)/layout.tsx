import Footer from '@/components/layout/Footer'
import CookieBanner from '@/components/layout/CookieBanner'
import AnalyticsListener from '@/components/analytics/AnalyticsListener'

// Preview route group (Jill, 2026-09-05): homepage v2 owns its OWN translucent
// nav over the hero, so it must NOT render the standard site Header (that caused
// the double-nav). Keeps the footer + cookie banner so it still feels like a
// real page. URL is unchanged (route groups don't affect the path).
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <CookieBanner />
      <AnalyticsListener />
    </>
  )
}
