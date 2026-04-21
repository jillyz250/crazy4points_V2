import HomeHeroV2 from "@/components/home/HomeHeroV2";
import RedAlertBar from "@/components/home/RedAlertBar";
import { createAdminClient } from "@/utils/supabase/server";
import { getActiveAlerts, type AlertWithPrograms } from "@/utils/supabase/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preview — Homepage v2",
  robots: { index: false, follow: false },
};

const MAX_RED_ALERTS = 5;

function daysUntil(endDate: string | null): number | null {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function selectRedAlerts(alerts: AlertWithPrograms[]): AlertWithPrograms[] {
  const critical: AlertWithPrograms[] = [];
  const urgent: AlertWithPrograms[] = [];
  const rest: AlertWithPrograms[] = [];

  for (const a of alerts) {
    const d = daysUntil(a.end_date);
    if (d !== null && d >= 0 && d <= 1) critical.push(a);
    else if (d !== null && d >= 0 && d <= 7) urgent.push(a);
    else rest.push(a);
  }

  const picked = [...critical, ...urgent, ...rest];
  const seen = new Set<string>();
  const deduped: AlertWithPrograms[] = [];
  for (const a of picked) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    deduped.push(a);
    if (deduped.length >= MAX_RED_ALERTS) break;
  }
  return deduped;
}

export default async function PreviewHomePage() {
  const supabase = createAdminClient();
  const active = await getActiveAlerts(supabase);

  const lastUpdated = active.length > 0
    ? active.reduce((latest, a) =>
        a.updated_at > latest ? a.updated_at : latest, active[0].updated_at)
    : null;

  const redAlerts = selectRedAlerts(active);

  return (
    <>
      <div className="bg-yellow-100 px-4 py-2 text-center font-ui text-xs uppercase tracking-widest text-yellow-900">
        Preview route — not linked from site navigation
      </div>
      <HomeHeroV2 lastUpdated={lastUpdated} />
      <RedAlertBar alerts={redAlerts} />
    </>
  );
}
