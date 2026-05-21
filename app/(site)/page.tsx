import HomeHeroV2 from "@/components/home/HomeHeroV2";
import RedAlertBar from "@/components/home/RedAlertBar";
import { createAdminClient } from "@/utils/supabase/server";
import { selectAlertViewFromVariants, type AlertView } from "@/utils/content/alertView";
import { isAlertActiveET } from "@/lib/alerts/expiry";
import type { Metadata } from "next";

// Revalidate every 60s so the hot alerts bar can't go stale past a minute
// when an alert expires or is unpublished. Without this, the homepage was
// being statically rendered at build time and served from CDN until the
// next deploy — meaning expired alerts kept showing in the hot bar with
// 404'ing links.
// Homepage surfaces alerts; new ones publish throughout the day.
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
  // Phase 3 Wave 2 flip #6: hot alerts source from content_variants + topics
  // via the AlertView adapter. ET-based active filter applied client-side to
  // match legacy getActiveAlerts semantics exactly (the adapter's activeOnly
  // uses UTC `now()`, which differs from ET by 4–12h and would over/under-
  // exclude rows near the day boundary).
  const allPublished = await selectAlertViewFromVariants(supabase, { status: "published" });
  const active = allPublished.filter((a) => isAlertActiveET(a.end_date));

  const lastUpdated = active.length > 0
    ? active.reduce((latest, a) =>
        a.updated_at > latest ? a.updated_at : latest, active[0].updated_at)
    : null;

  const { visible: hotAlerts, overflowCount } = selectHotAlerts(active);

  return (
    <>
      <RedAlertBar alerts={hotAlerts} overflowCount={overflowCount} />
      <HomeHeroV2 lastUpdated={lastUpdated} />
    </>
  );
}
