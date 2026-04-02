import Link from "next/link";
import { dailyAlerts, ALERTS_DATE, type DailyAlert, type AlertColor } from "@/data/daily-alerts";

// Full literal class names required — Tailwind v4 JIT does not support string interpolation
const colorMap: Record<AlertColor, { border: string; badge: string }> = {
  red:    { border: "border-l-red-500",    badge: "bg-red-50 text-red-700" },
  orange: { border: "border-l-orange-400", badge: "bg-orange-50 text-orange-700" },
  yellow: { border: "border-l-yellow-400", badge: "bg-yellow-50 text-yellow-700" },
  green:  { border: "border-l-green-500",  badge: "bg-green-50 text-green-700" },
  purple: { border: "border-l-[var(--color-primary)]", badge: "bg-[var(--color-background-soft)] text-[var(--color-primary)]" },
  blue:   { border: "border-l-blue-500",   badge: "bg-blue-50 text-blue-700" },
};

function formatAlertDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  return `${months[month - 1]} ${day}, ${year}`;
}

export default function DailyAlerts() {
  const topAlerts = dailyAlerts.slice(0, 4);

  return (
    <section className="border-b border-[var(--color-border-soft)] bg-[var(--color-background)] py-6">
      <div className="rg-container">

        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="font-display text-lg font-semibold text-[var(--color-primary)]">
              Top Alerts
            </h2>
            <span className="font-ui text-xs text-[var(--color-text-secondary)] tracking-wide">
              Updated {formatAlertDate(ALERTS_DATE)}
            </span>
          </div>
          <Link
            href="/daily-brief"
            className="font-ui text-xs font-medium uppercase tracking-[0.1em] text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
          >
            View Daily Brief →
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-2 md:overflow-visible md:pb-0 lg:grid-cols-4">
          {topAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>

      </div>
    </section>
  );
}

function AlertCard({ alert }: { alert: DailyAlert }) {
  const colors = colorMap[alert.color];

  const card = (
    <div
      className={`flex min-w-[260px] flex-col gap-2 rounded-r-lg border-l-4 bg-white px-4 py-3 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md md:min-w-0 ${colors.border}`}
    >
      <span
        className={`self-start rounded-full px-2 py-0.5 font-ui text-[10px] font-semibold uppercase tracking-[0.1em] ${colors.badge}`}
      >
        {alert.tag}
      </span>

      <h3 className="font-display text-sm font-semibold leading-snug text-[var(--color-text-primary)]">
        {alert.title}
      </h3>

      <p className="mt-auto font-body text-xs text-[var(--color-text-secondary)]">
        {alert.deadline}
      </p>

      {alert.href && (
        <span className="font-ui text-[10px] font-medium tracking-wide text-[var(--color-primary)]">
          See details →
        </span>
      )}
    </div>
  );

  if (alert.href) {
    return (
      <Link href={alert.href} className="block">
        {card}
      </Link>
    );
  }
  return card;
}
