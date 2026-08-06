import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { playfair, lato, montserrat } from "@/lib/fonts";
import { SITE_URL } from "@/lib/constants";
import ConsentScripts from "@/components/layout/ConsentScripts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "crazy4points — Travel Smarter. Earn More. Go Farther.",
    template: "%s | crazy4points",
  },
  description:
    "The intelligent travel rewards platform. Track transfer bonuses, find sweet spots, and get a ranked action plan for your points and miles — right now.",
  metadataBase: new URL(SITE_URL),
  // Default social-share card (Open Graph + Twitter). Pages that don't set
  // their own openGraph inherit this, so every shared link (newsletter, alerts,
  // programs) gets a clean branded preview instead of whatever Facebook scrapes.
  openGraph: {
    type: "website",
    siteName: "crazy4points",
    title: "crazy4points — Travel Smarter. Earn More. Go Farther.",
    description:
      "Track transfer bonuses, find award sweet spots, and get a ranked action plan for your points and miles.",
    url: SITE_URL,
    images: [{ url: "/fb-brand-card.png", width: 1200, height: 630, alt: "crazy4points" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "crazy4points — Travel Smarter. Earn More. Go Farther.",
    description:
      "Track transfer bonuses, find award sweet spots, and get a ranked action plan for your points and miles.",
    images: ["/fb-brand-card.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
  },
  manifest: "/site.webmanifest",
  other: {
    "theme-color": "#6B2D8F",
    // Bing Webmaster Tools site verification
    "msvalidate.01": "59CBA5C640A0D6B3494E229BD761633E",
    // Legacy language meta tags for older SEO/GEO audit tools that don't read
    // the html lang attribute. Modern crawlers (Google/Bing/Anthropic/etc.)
    // already use <html lang="en">; these are belt-and-suspenders for tools
    // that pre-date HTML5.
    "language": "en-US",
    "content-language": "en-US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${lato.variable} ${montserrat.variable} h-full antialiased`}
    >
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          // Consent Mode defaults. Split posture, set BEFORE config so GA4 honors it:
          //   ANALYTICS = opt-out — granted unless the visitor explicitly declines
          //     (so GA4 sees everyone who doesn't opt out; declining still goes cookieless).
          //   ADVERTISING (ad_*) = opt-in — granted only after an explicit accept
          //     (kept conservative; the more sensitive "sharing" signals).
          var __c4p_consent = null;
          try { __c4p_consent = localStorage.getItem('c4p_cookie_consent'); } catch (e) {}
          var __c4p_declined = __c4p_consent === 'declined';
          var __c4p_accepted = __c4p_consent === 'accepted';
          var __c4p_analytics = __c4p_declined ? 'denied' : 'granted';
          var __c4p_ads = __c4p_accepted ? 'granted' : 'denied';
          gtag('consent', 'default', {
            ad_storage: __c4p_ads,
            ad_user_data: __c4p_ads,
            ad_personalization: __c4p_ads,
            analytics_storage: __c4p_analytics,
          });
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA4_ID}');
        `}
      </Script>
      {/*
        Meta (Facebook) Pixel is NOT loaded here. It is injected by
        <ConsentScripts /> only after the visitor explicitly accepts cookies,
        so Facebook's script is never even fetched for non-consenting visitors.
        No noscript fallback: it cannot be consent-gated without JS, so firing
        it unconditionally would defeat the opt-in model.
      */}
      <body className="min-h-full flex flex-col bg-[var(--color-background)] text-[var(--color-text-primary)]">
        <ConsentScripts />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
