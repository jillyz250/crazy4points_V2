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
// Featured sort before fresh. Within each bucket, most-recent first.
// Expiry urgency lives on individual alert cards, not here.
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

  const byPubDesc = (x: AlertWithPrograms, y: AlertWithPrograms) => {
    const xt = x.published_at ? new Date(x.published_at).getTime() : 0;
    const yt = y.published_at ? new Date(y.published_at).getTime() : 0;
    return yt - xt;
  };
  featured.sort(byPubDesc);
  fresh.sort(byPubDesc);

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
