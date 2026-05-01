import HomeHeroV2 from "@/components/home/HomeHeroV2";
import RedAlertBar from "@/components/home/RedAlertBar";
import { createAdminClient } from "@/utils/supabase/server";
import { getActiveAlerts, type AlertWithPrograms } from "@/utils/supabase/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "crazy4points — Travel Smarter. Earn More. Go Farther.",
  description:
    "Alerts on the points moves actually worth caring about. We track the chaos so you don't have to.",
};

const MAX_HOT_ALERTS = 5;
const FRESH_WINDOW_MS = 48 * 60 * 60 * 1000;

// Hot alerts = editorially featured (is_hot) OR freshly published (<48h).
// Featured sort before fresh. Within each bucket, sort by EXPIRY URGENCY:
// soonest end_date first, undated last, recency as tie-break. The alert
// expiring today should land at position #1.
function selectHotAlerts(alerts: AlertWithPrograms[]): AlertWithPrograms[] {
  const now = Date.now();
  const featured: AlertWithPrograms[] = [];
  const fresh: AlertWithPrograms[] = [];

  for (const a of alerts) {
    if (a.is_hot) {
      featured.push(a);
      continue;
    }
    const pub = a.published_at ? new Date(a.published_at).getTime() : null;
    if (pub !== null && now - pub <= FRESH_WINDOW_MS) fresh.push(a);
  }

  const byExpirySoonest = (x: AlertWithPrograms, y: AlertWithPrograms) => {
    const xt = x.end_date ? new Date(x.end_date).getTime() : null;
    const yt = y.end_date ? new Date(y.end_date).getTime() : null;
    if (xt === null && yt === null) {
      // Both undated → newer-published first
      const xp = x.published_at ? new Date(x.published_at).getTime() : 0;
      const yp = y.published_at ? new Date(y.published_at).getTime() : 0;
      return yp - xp;
    }
    if (xt === null) return 1; // undated → bottom of bucket
    if (yt === null) return -1;
    if (xt !== yt) return xt - yt; // soonest expiry first
    // Same end_date → newer-published first
    const xp = x.published_at ? new Date(x.published_at).getTime() : 0;
    const yp = y.published_at ? new Date(y.published_at).getTime() : 0;
    return yp - xp;
  };
  featured.sort(byExpirySoonest);
  fresh.sort(byExpirySoonest);

  const seen = new Set<string>();
  const deduped: AlertWithPrograms[] = [];
  for (const a of [...featured, ...fresh]) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    deduped.push(a);
    if (deduped.length >= MAX_HOT_ALERTS) break;
  }
  return deduped;
}

export default async function HomePage() {
  const supabase = createAdminClient();
  const active = await getActiveAlerts(supabase);

  const lastUpdated = active.length > 0
    ? active.reduce((latest, a) =>
        a.updated_at > latest ? a.updated_at : latest, active[0].updated_at)
    : null;

  const hotAlerts = selectHotAlerts(active);

  return (
    <>
      <RedAlertBar alerts={hotAlerts} />
      <HomeHeroV2 lastUpdated={lastUpdated} />
    </>
  );
}
