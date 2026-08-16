import Link from "next/link";
import HomeHeroV2 from "@/components/home/HomeHeroV2";
import RedAlertBar from "@/components/home/RedAlertBar";
import HomeToolsBand from "@/components/home/HomeToolsBand";
import HomeExperiencesBlock from "@/components/home/HomeExperiencesBlock";
import FeaturedGuides from "@/components/home/FeaturedGuides";
import { getHomeExperiences } from "@/utils/experiences/getHomeExperiences";
import HomeNewsletterSubscribe from "@/components/home/HomeNewsletterSubscribe";
import AlertsGridSB from "@/components/alerts/AlertsGridSB";
import { createAdminClient } from "@/utils/supabase/server";
import { getPublicNewsletters } from "@/utils/content/publicNewsletters";
import { selectAlertViewFromVariants, type AlertView, type AlertViewWithPrograms } from "@/utils/content/alertView";
import { isAlertActiveET } from "@/lib/alerts/expiry";
import type { Metadata } from "next";

// Revalidate every 5 minutes so the hot alerts bar can't go badly stale when
// an alert expires or is unpublished. Without this, the homepage was being
// statically rendered at build time and served from CDN until the next deploy
// — meaning expired alerts kept showing in the hot bar with 404'ing links.
// 300s (not 60s) keeps regeneration cost low while staying fresh enough;
// the homepage surfaces alerts that publish throughout the day.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "crazy4points — Travel Smarter. Earn More. Go Farther.",
  description:
    "Daily alerts on transfer bonuses, sweet-spot redemptions, devaluations, and limited-time offers across airline, hotel, and credit card loyalty programs.",
};

const MAX_HOT_ALERTS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

// Combined-score hotness rank. Higher = surfaces first.
//   +100  is_hot (manual editorial pin)
//   +50   published in last 7 days ("just dropped")
//   +40   end_date ≤ 3 days ("expiring fast")
//   +25   end_date ≤ 7 days ("expiring soon")
//   +30   no end_date — evergreen floor so a fresh evergreen never buries
// Tie-break: published_at desc.
//
// Why a floor on evergreens: the previous sort treated undated alerts as
// "lowest urgency" and shoved them to the bottom. A just-published evergreen
// sweet-spot or partner addition (e.g. "Delta + Airbnb earn") had no way to
// surface against time-sensitive bonuses. With +30 floor, a fresh evergreen
// scores 50 + 30 = 80 — top of the bar, exactly where it belongs.
function hotnessScore(a: AlertView, now: number): number {
  let s = 0;
  if (a.is_hot) s += 100;
  if (a.published_at) {
    const ageMs = now - new Date(a.published_at).getTime();
    if (ageMs <= 7 * DAY_MS) s += 50;
  }
  if (a.end_date) {
    const remainingMs = new Date(a.end_date).getTime() - now;
    if (remainingMs <= 3 * DAY_MS) s += 40;
    else if (remainingMs <= 7 * DAY_MS) s += 25;
  } else {
    s += 30;
  }
  return s;
}

interface HotAlertSelection {
  visible: AlertView[];
  overflowCount: number;
}

function selectHotAlerts(alerts: AlertView[]): HotAlertSelection {
  const now = Date.now();
  const scored = alerts
    .map((a) => ({ a, s: hotnessScore(a, now) }))
    .filter((row) => row.s > 0)
    .sort((x, y) => {
      if (y.s !== x.s) return y.s - x.s;
      const xp = x.a.published_at ? new Date(x.a.published_at).getTime() : 0;
      const yp = y.a.published_at ? new Date(y.a.published_at).getTime() : 0;
      return yp - xp;
    });

  const visible = scored.slice(0, MAX_HOT_ALERTS).map((r) => r.a);
  const overflowCount = Math.max(0, alerts.length - visible.length);
  return { visible, overflowCount };
}

export default async function HomePage() {
  const supabase = createAdminClient();
  // Homepage Experiences block — 3 freshest photographed listings.
  const homeExperiences = await getHomeExperiences(supabase);
  // Phase 3 Wave 2 flip #6: hot alerts source from content_variants + topics
  // via the AlertView adapter. ET-based active filter applied client-side to
  // match legacy getActiveAlerts semantics exactly (the adapter's activeOnly
  // uses UTC `now()`, which differs from ET by 4–12h and would over/under-
  // exclude rows near the day boundary).
  const allPublished = await selectAlertViewFromVariants(supabase, { status: "published", withPrograms: true }) as AlertViewWithPrograms[];
  const active = allPublished.filter((a) => isAlertActiveET(a.end_date));

  const lastUpdated = active.length > 0
    ? active.reduce((latest, a) =>
        a.updated_at > latest ? a.updated_at : latest, active[0].updated_at)
    : null;

  // Suppressed alerts still publish (feed + program pages) but are kept off the
  // home hot-alerts bar — for niche / narrow-audience or historical records.
  const { visible: hotAlerts, overflowCount } = selectHotAlerts(
    active.filter((a) => !a.suppress_home_banner),
  );

  // Latest alerts — most recent published first. Kept small (3) and placed
  // below the tools band: the homepage leads with what you can DO, then shows
  // a light sample of what's happening. Depth lives at /alerts.
  const latestAlerts = [...active]
    .sort((a, b) => {
      const ap = a.published_at ? new Date(a.published_at).getTime() : 0;
      const bp = b.published_at ? new Date(b.published_at).getTime() : 0;
      return bp - ap;
    })
    .slice(0, 3);

  const latestIssue = (await getPublicNewsletters(supabase))[0] ?? null;

  return (
    <>
      <RedAlertBar alerts={hotAlerts} overflowCount={overflowCount} />
      <HomeHeroV2 lastUpdated={lastUpdated} />

      <HomeToolsBand />

      <HomeExperiencesBlock groups={homeExperiences} />

      <FeaturedGuides />

      {latestIssue && <HomeNewsletterSubscribe latest={latestIssue} />}

      {latestAlerts.length > 0 && (
        <section className="bg-[var(--color-background)] py-12 md:py-16">
          <div className="rg-container px-6 md:px-8">
            <div className="mb-7 flex items-baseline justify-between gap-4">
              <h2 className="font-display text-xl font-semibold text-[var(--color-primary)] md:text-2xl">
                Latest alerts
              </h2>
              <Link
                href="/alerts"
                className="shrink-0 font-ui text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
              >
                View all alerts &rarr;
              </Link>
            </div>
            <AlertsGridSB alerts={latestAlerts} />
          </div>
        </section>
      )}
    </>
  );
}
