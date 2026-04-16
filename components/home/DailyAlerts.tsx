import Link from "next/link";
import type { AlertWithPrograms } from "@/utils/supabase/queries";
import AlertCardSB from "@/components/alerts/AlertCardSB";

function formatUpdatedDate(): string {
  const now = new Date();
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  return `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

interface Props {
  alerts: AlertWithPrograms[];
}

export default function DailyAlerts({ alerts }: Props) {
  return (
    <section className="border-b border-[var(--color-border-soft)] bg-[var(--color-background)] py-6">
      <div className="rg-container">

        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-lg font-semibold text-[var(--color-primary)]">
              Top Alerts
            </h2>
            <span className="font-ui text-xs text-[var(--color-text-secondary)] tracking-wide">
              Updated {formatUpdatedDate()}
            </span>
          </div>
          <Link
            href="/daily-brief"
            className="font-ui text-xs font-medium uppercase tracking-[0.1em] text-[var(--color-primary)] transition-colors hover:text-[var(--color-acc)]"
          >
            View Daily Brief →
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-4">
          {alerts.map((alert) => (
            <AlertCardSB key={alert.id} alert={alert} />
          ))}
        </div>

      </div>
    </section>
  );
}

