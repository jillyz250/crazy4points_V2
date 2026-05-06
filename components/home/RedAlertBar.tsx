import Link from "next/link";
import type { AlertWithPrograms } from "@/utils/supabase/queries";
import { daysUntilEndOfDay } from "@/lib/alertExpiry";

interface Props {
  alerts: AlertWithPrograms[];
  /** Total active alerts beyond the visible set; renders as a "+N more" pill. */
  overflowCount: number;
}

// Category pill per alert type. Label + color pair, kept in sync with the
// TYPE_BADGE map on the alert detail page so the same alert reads the same
// way wherever it appears. Pills always show; one per chip. The right-side
// urgency pill is layered on top of this for time-sensitive alerts.
const TYPE_PILL: Record<string, { label: string; cls: string }> = {
  // Earning & bonuses
  signup_bonus:          { label: "Sign-Up Bonus",  cls: "bg-purple-100 text-purple-700" },
  transfer_bonus:        { label: "Transfer Bonus", cls: "bg-violet-100 text-violet-700" },
  referral_bonus:        { label: "Referral",       cls: "bg-purple-100 text-purple-600" },
  milestone_bonus:       { label: "Milestone",      cls: "bg-indigo-100 text-indigo-700" },
  shopping_portal_bonus: { label: "Portal Bonus",   cls: "bg-teal-100 text-teal-700" },
  dining_bonus:          { label: "Dining",         cls: "bg-orange-100 text-orange-600" },
  point_purchase:        { label: "Buy Points",     cls: "bg-cyan-100 text-cyan-700" },
  // Redemptions
  award_availability:    { label: "Award Space",    cls: "bg-blue-100 text-blue-700" },
  award_sale:            { label: "Award Sale",     cls: "bg-blue-100 text-blue-800" },
  sweet_spot:            { label: "Sweet Spot",     cls: "bg-green-100 text-green-700" },
  companion_pass:        { label: "Companion Pass", cls: "bg-green-100 text-green-800" },
  // Card offers
  limited_time_offer:    { label: "Limited Offer",  cls: "bg-red-100 text-red-700" },
  retention_offer:       { label: "Retention",      cls: "bg-rose-100 text-rose-700" },
  card_credit:           { label: "Card Credit",    cls: "bg-emerald-100 text-emerald-700" },
  card_refresh:          { label: "Card Refresh",   cls: "bg-violet-100 text-violet-700" },
  // Status
  status_promo:          { label: "Status Promo",   cls: "bg-orange-100 text-orange-700" },
  // Warnings
  glitch:                { label: "Glitch",         cls: "bg-yellow-100 text-yellow-800" },
  devaluation:           { label: "Devaluation",    cls: "bg-red-100 text-red-800" },
  fee_change:            { label: "Fee Change",     cls: "bg-red-100 text-red-700" },
  // Program changes
  program_change:        { label: "Program Change", cls: "bg-amber-100 text-amber-700" },
  partner_change:        { label: "Partner Change", cls: "bg-amber-100 text-amber-700" },
  category_change:       { label: "Category Move",  cls: "bg-amber-100 text-amber-700" },
  earn_rate_change:      { label: "Earn Rate",      cls: "bg-amber-100 text-amber-700" },
  status_change:         { label: "Status Change",  cls: "bg-amber-100 text-amber-700" },
  policy_change:         { label: "Policy Change",  cls: "bg-amber-100 text-amber-700" },
  // News
  industry_news:         { label: "News",           cls: "bg-slate-100 text-slate-600" },
};

function categoryPill(type: string): { label: string; cls: string } {
  return TYPE_PILL[type] ?? { label: type.replace(/_/g, " "), cls: "bg-slate-100 text-slate-600" };
}

// "Published today" is calendar-day exact in America/New_York (the editorial
// timezone). The NEW pill drops the day after publication — not 48h, not
// 24h since publish, but the moment the calendar date rolls over in NY.
// Reader checking at 8am on day-after sees no NEW pill regardless of when
// the alert dropped the prior evening.
const NY_TZ = "America/New_York";
function ymdInTz(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
function isPublishedToday(publishedAt: string | null): boolean {
  if (!publishedAt) return false;
  return ymdInTz(new Date(publishedAt)) === ymdInTz(new Date());
}

interface ExpiryPill {
  label: string;
  tone: "soon" | "today" | "default";
}

// Returns null when there is no end_date — chips for evergreen alerts have
// no right-side pill, by design (asymmetry helps time-sensitive alerts pop).
function expiryPill(endDate: string | null): ExpiryPill | null {
  if (!endDate) return null;
  const days = daysUntilEndOfDay(endDate);
  if (days === null) return null;
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
              const expiry = expiryPill(alert.end_date);
              const fresh = isPublishedToday(alert.published_at);
              const cat = categoryPill(alert.type);
              return (
                <Link
                  key={alert.id}
                  href={`/alerts/${alert.slug}`}
                  className="group flex shrink-0 items-center gap-2 rounded-full border border-red-200 bg-white px-3 py-1.5 font-ui text-xs transition hover:border-red-400 hover:bg-red-50"
                  title={alert.title}
                >
                  {/* NEW pill — only on day-of-publish (NY calendar). Drops
                      the moment the date rolls over the next morning. */}
                  {fresh && (
                    <span className="shrink-0 rounded-sm bg-amber-400 px-1.5 py-px font-ui text-[9px] font-bold uppercase tracking-wider text-amber-900">
                      New
                    </span>
                  )}

                  {/* Category pill — always present, color-coded per type */}
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-ui text-[10px] font-semibold ${cat.cls}`}
                  >
                    {cat.label}
                  </span>

                  {/* Title — full, no truncation. Chip is variable width. */}
                  <span className="font-medium text-[var(--color-text-primary)] group-hover:text-red-700">
                    {alert.title}
                  </span>

                  {/* Right-side urgency pill — only when end_date is set.
                      Evergreen alerts have no right pill (clean chip). */}
                  {expiry && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 font-ui text-[10px] font-semibold ${PILL_CLASS[expiry.tone]}`}
                    >
                      {expiry.label}
                    </span>
                  )}
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
