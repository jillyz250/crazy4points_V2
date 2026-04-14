import Link from "next/link";
import type { Alert, AlertType } from "@/utils/supabase/queries";

// Full literal class names required — Tailwind v4 JIT does not support string interpolation
type AlertColor = "red" | "orange" | "yellow" | "green" | "purple" | "blue";
type AlertTag = "Live Today" | "Expires Soon" | "Devaluation" | "New Deal" | "Sweet Spot" | "Watch";

const colorMap: Record<AlertColor, { border: string; badge: string }> = {
  red:    { border: "border-l-red-500",    badge: "bg-red-50 text-red-700" },
  orange: { border: "border-l-orange-400", badge: "bg-orange-50 text-orange-700" },
  yellow: { border: "border-l-yellow-400", badge: "bg-yellow-50 text-yellow-700" },
  green:  { border: "border-l-green-500",  badge: "bg-green-50 text-green-700" },
  purple: { border: "border-l-[var(--color-primary)]", badge: "bg-[var(--color-background-soft)] text-[var(--color-primary)]" },
  blue:   { border: "border-l-blue-500",   badge: "bg-blue-50 text-blue-700" },
};

const TYPE_META: Record<AlertType, { color: AlertColor; tag: AlertTag }> = {
  transfer_bonus:     { color: "green",  tag: "New Deal" },
  limited_time_offer: { color: "orange", tag: "Expires Soon" },
  award_availability: { color: "blue",   tag: "New Deal" },
  status_promo:       { color: "purple", tag: "New Deal" },
  glitch:             { color: "red",    tag: "Live Today" },
  devaluation:        { color: "red",    tag: "Devaluation" },
  program_change:     { color: "orange", tag: "Watch" },
  partner_change:     { color: "orange", tag: "Watch" },
  category_change:    { color: "yellow", tag: "Watch" },
  earn_rate_change:   { color: "orange", tag: "Devaluation" },
  status_change:      { color: "purple", tag: "Watch" },
  policy_change:      { color: "orange", tag: "Watch" },
  sweet_spot:         { color: "green",  tag: "Sweet Spot" },
  industry_news:      { color: "blue",   tag: "Watch" },
};

function formatDeadline(endDate: string | null): string {
  if (!endDate) return "✅ Ongoing";
  const end = new Date(endDate);
  const now = new Date();
  const daysLeft = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  if (daysLeft <= 3) return `🚨 Expires ${formatted} — ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`;
  if (daysLeft <= 14) return `⏰ Expires ${formatted} — ${daysLeft} days left`;
  return `⏳ Expires ${formatted}`;
}

function formatUpdatedDate(): string {
  const now = new Date();
  const months = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];
  return `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}

interface Props {
  alerts: Alert[];
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
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>

      </div>
    </section>
  );
}

function AlertCard({ alert }: { alert: Alert }) {
  const meta = TYPE_META[alert.type] ?? { color: "purple" as AlertColor, tag: "Watch" as AlertTag };
  const colors = colorMap[meta.color];
  const deadline = formatDeadline(alert.end_date);

  const card = (
    <div
      className={`flex min-w-[260px] flex-col gap-2 rounded-r-lg border-l-4 bg-white px-4 py-3 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-md md:min-w-0 ${colors.border}`}
    >
      <span
        className={`self-start rounded-full px-2 py-0.5 font-ui text-[10px] font-semibold uppercase tracking-[0.1em] ${colors.badge}`}
      >
        {meta.tag}
      </span>

      <h3 className="font-display text-sm font-semibold leading-snug text-[var(--color-text-primary)]">
        {alert.title}
      </h3>

      <p className="mt-auto font-body text-xs text-[var(--color-text-secondary)]">
        {deadline}
      </p>

      <span className="font-ui text-[10px] font-medium tracking-wide text-[var(--color-primary)]">
        See details →
      </span>
    </div>
  );

  return (
    <Link href={`/alerts/${alert.slug}`} className="block">
      {card}
    </Link>
  );
}
