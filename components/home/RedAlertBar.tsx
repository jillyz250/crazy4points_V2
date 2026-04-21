import Link from "next/link";
import type { AlertWithPrograms } from "@/utils/supabase/queries";

interface Props {
  alerts: AlertWithPrograms[];
}

function formatRemaining(endDate: string | null): string {
  if (!endDate) return "open";
  const diff = Math.ceil(
    (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return "ended";
  if (diff === 0) return "today";
  if (diff === 1) return "1d";
  if (diff <= 60) return `${diff}d`;
  return new Date(endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function RedAlertBar({ alerts }: Props) {
  if (alerts.length === 0) return null;

  return (
    <section
      aria-label="Red alerts"
      className="border-y border-red-200 bg-red-50"
    >
      <div className="rg-container px-6 md:px-8">
        <div className="flex items-center gap-4 py-3 md:gap-6">
          <span
            aria-hidden
            className="shrink-0 font-ui text-[11px] font-bold uppercase tracking-[0.15em] text-red-700"
          >
            🔥 Red Alerts
          </span>

          <div className="flex flex-1 items-center gap-2 overflow-x-auto md:gap-3">
            {alerts.map((alert) => (
              <Link
                key={alert.id}
                href={`/alerts/${alert.slug}`}
                className="group flex shrink-0 items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-1.5 font-ui text-xs transition hover:border-red-400 hover:bg-red-100"
              >
                <span className="max-w-[22ch] truncate font-medium text-[var(--color-text-primary)] group-hover:text-red-700 md:max-w-[30ch]">
                  {alert.title}
                </span>
                <span className="shrink-0 font-semibold text-red-600">
                  {formatRemaining(alert.end_date)}
                </span>
              </Link>
            ))}
          </div>

          <Link
            href="/alerts"
            className="hidden shrink-0 font-ui text-xs font-medium uppercase tracking-[0.1em] text-red-700 transition-colors hover:text-red-900 md:inline"
          >
            View all →
          </Link>
        </div>
      </div>
    </section>
  );
}
