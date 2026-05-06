import Link from "next/link";
import type { AlertWithPrograms } from "@/utils/supabase/queries";
import { daysUntilEndOfDay } from "@/lib/alertExpiry";

interface Props {
  alerts: AlertWithPrograms[];
  /** Total active alerts beyond the visible set; renders as a "+N more" pill. */
  overflowCount: number;
}

const NEW_WINDOW_MS = 48 * 60 * 60 * 1000;

// One solid color per alert type for the leading dot. Solid hex so it renders
// regardless of Tailwind JIT scanning (the strip mounts pre-hydration). Keep
// in sync with TYPE_BADGE in alert detail/list pages — the dot is the
// at-a-glance category cue.
const TYPE_DOT: Record<string, string> = {
  // Earning & bonuses
  signup_bonus: "#9333ea",          // purple-600
  transfer_bonus: "#7c3aed",        // violet-600
  referral_bonus: "#a855f7",        // purple-500
  milestone_bonus: "#4f46e5",       // indigo-600
  shopping_portal_bonus: "#0d9488", // teal-600
  dining_bonus: "#f97316",          // orange-500
  point_purchase: "#0891b2",        // cyan-600
  // Redemptions
  award_availability: "#2563eb",    // blue-600
  award_sale: "#1d4ed8",            // blue-700
  sweet_spot: "#16a34a",            // green-600
  companion_pass: "#15803d",        // green-700
  // Card offers
  limited_time_offer: "#dc2626",    // red-600
  retention_offer: "#e11d48",       // rose-600
  card_credit: "#059669",           // emerald-600
  card_refresh: "#7c3aed",          // violet-600
  // Status
  status_promo: "#ea580c",          // orange-600
  // Warnings
  glitch: "#ca8a04",                // yellow-600
  devaluation: "#b91c1c",           // red-700
  fee_change: "#dc2626",            // red-600
  // Program changes
  program_change: "#d97706",        // amber-600
  partner_change: "#d97706",
  category_change: "#d97706",
  earn_rate_change: "#d97706",
  status_change: "#d97706",
  policy_change: "#d97706",
  // News
  industry_news: "#64748b",         // slate-500
};

function dotColor(type: string): string {
  return TYPE_DOT[type] ?? "#64748b";
}

function isNew(publishedAt: string | null): boolean {
  if (!publishedAt) return false;
  return Date.now() - new Date(publishedAt).getTime() <= NEW_WINDOW_MS;
}

interface ExpiryPill {
  label: string;
  tone: "evergreen" | "soon" | "today" | "default";
}

function expiryPill(endDate: string | null): ExpiryPill {
  if (!endDate) return { label: "Evergreen", tone: "evergreen" };
  const days = daysUntilEndOfDay(endDate);
  if (days === null) return { label: "Evergreen", tone: "evergreen" };
  if (days < 0) return { label: "Ended", tone: "default" };
  if (days === 0) return { label: "Ends today", tone: "today" };
  if (days === 1) return { label: "1 day left", tone: "today" };
  if (days <= 7) return { label: `${days} days left`, tone: "soon" };
  if (days <= 60) return { label: `${days} days left`, tone: "default" };
  const fmt = new Date(endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return { label: `Ends ${fmt}`, tone: "default" };
}

const PILL_CLASS: Record<ExpiryPill["tone"], string> = {
  today: "bg-red-600 text-white",
  soon: "bg-red-100 text-red-700",
  default: "bg-slate-100 text-slate-600",
  evergreen: "bg-violet-100 text-violet-700",
};

export default function RedAlertBar({ alerts, overflowCount }: Props) {
  if (alerts.length === 0) return null;

  return (
    <section
      aria-label="Hot alerts"
      className="border-y border-red-200 bg-red-50"
    >
      <div className="rg-container px-6 md:px-8">
        <div className="flex items-center gap-3 py-2.5 md:gap-5 md:py-3">
          <span
            aria-hidden
            className="shrink-0 font-ui text-[11px] font-bold uppercase tracking-[0.15em] text-red-700"
          >
            🔥 Hot Alerts
          </span>

          <div className="flex flex-1 items-center gap-2 overflow-x-auto md:gap-3">
            {alerts.map((alert) => {
              const pill = expiryPill(alert.end_date);
              const fresh = isNew(alert.published_at);
              return (
                <Link
                  key={alert.id}
                  href={`/alerts/${alert.slug}`}
                  className={`group flex shrink-0 items-center gap-2 rounded-full border bg-white px-3 py-1.5 font-ui text-xs transition hover:border-red-400 hover:bg-red-50 ${
                    alert.is_hot
                      ? "border-amber-400 ring-1 ring-amber-300"
                      : "border-red-200"
                  }`}
                  title={alert.title}
                >
                  {/* Type dot — at-a-glance category cue */}
                  <span
                    aria-hidden
                    className="shrink-0 h-2 w-2 rounded-full"
                    style={{ backgroundColor: dotColor(alert.type) }}
                  />

                  {/* Hot star — manual editorial flag */}
                  {alert.is_hot && (
                    <span
                      aria-label="Featured"
                      className="shrink-0 font-ui text-[10px] font-bold text-amber-600"
                    >
                      ★
                    </span>
                  )}

                  {/* NEW pill — published in last 48h */}
                  {fresh && (
                    <span className="shrink-0 rounded-sm bg-amber-400 px-1 py-px font-ui text-[9px] font-bold uppercase tracking-wider text-amber-900">
                      New
                    </span>
                  )}

                  {/* Title — full, no truncation. Chip is variable width. */}
                  <span className="font-medium text-[var(--color-text-primary)] group-hover:text-red-700">
                    {alert.title}
                  </span>

                  {/* Expiry / evergreen pill */}
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-ui text-[10px] font-semibold ${PILL_CLASS[pill.tone]}`}
                  >
                    {pill.label}
                  </span>
                </Link>
              );
            })}

            {/* Overflow pill — links to /alerts when there are more than the
                visible set. Volume signal so reader knows there's depth. */}
            {overflowCount > 0 && (
              <Link
                href="/alerts"
                className="shrink-0 rounded-full border border-red-300 bg-white px-3 py-1.5 font-ui text-xs font-semibold text-red-700 transition hover:bg-red-100"
              >
                +{overflowCount} more →
              </Link>
            )}
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
