import type { Metadata } from "next";
import { SHOPPING_PORTALS, PORTAL_GROUPS, PORTAL_DISCLOSURE, HOT_PORTAL_OFFERS, type ShoppingPortal } from "@/lib/shoppingPortals";
import PortalRateSearch from "@/components/tools/PortalRateSearch";

export const metadata: Metadata = {
  title: "Shopping Portals — Earn Points & Cash Back Online | Crazy4Points",
  description:
    "The shopping portals we use to earn cash back and airline miles on everyday online purchases — including Rakuten (convert to Amex points), Capital One Shopping, and the major airline portals.",
  alternates: { canonical: "https://www.crazy4points.com/tools/shopping-portals" },
};

function PortalCard({ p }: { p: ShoppingPortal }) {
  return (
    <div
      className="relative flex flex-col gap-2 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] p-5 pl-6 shadow-[var(--shadow-soft)] transition-transform duration-200 hover:-translate-y-0.5"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-1.5" style={{ background: p.accent }} />
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-lg font-semibold text-[var(--color-primary)]">{p.name}</h3>
        {p.referral && (
          <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 font-ui text-[0.6rem] font-bold uppercase tracking-wide text-[var(--color-text-primary)]">
            Referral
          </span>
        )}
      </div>
      <p className="font-ui text-xs font-semibold uppercase tracking-[0.06em]" style={{ color: p.accent }}>
        Earns: {p.earns}
      </p>
      <p className="font-body text-sm text-[var(--color-text-secondary)]">{p.note}</p>
      <a
        href={p.url}
        target="_blank"
        rel={p.referral ? "nofollow sponsored noopener" : "noopener noreferrer"}
        className="mt-1 inline-flex min-h-[44px] w-fit items-center gap-2 rounded-[var(--radius-ui)] px-5 font-ui text-sm font-bold transition hover:brightness-110"
        style={{
          background: `linear-gradient(160deg, color-mix(in srgb, ${p.accent} 68%, #ffffff) 0%, ${p.accent} 62%)`,
          color: "#ffffff",
          boxShadow: `0 6px 16px -6px ${p.accent}`,
        }}
      >
        {p.referral ? "Sign up" : "Visit portal"} <span aria-hidden>&rarr;</span>
      </a>
    </div>
  );
}

export default function ShoppingPortalsPage() {
  return (
    <div className="rg-container px-6 py-12 md:px-8 md:py-16">
      <header className="max-w-2xl">
        <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">Tools</p>
        <h1 className="mt-2">Shopping Portals</h1>
        <p className="mt-3 font-body text-[1.0625rem] leading-relaxed text-[var(--color-text-secondary)]">
          A shopping portal is a free middle step: click through it on your way to a store you were already going to
          shop, and you earn cash back or airline miles on top of your card rewards. Below are the ones we actually
          use. Our favorite move: earn cash back with <strong>Rakuten</strong> and convert it to{" "}
          <strong>Amex Membership Rewards points</strong>.
        </p>
      </header>

      <div className="mt-8">
        <PortalRateSearch />
      </div>

      {HOT_PORTAL_OFFERS.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-[var(--color-primary)] md:text-2xl">Hot portal offers this week</h2>
          <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">Elevated rates we've spotted. Verify the current rate on the portal before you shop.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {HOT_PORTAL_OFFERS.map((o, i) => (
              <a
                key={`${o.portal}-${o.store}-${i}`}
                href={o.url}
                target="_blank"
                rel={o.referral ? "nofollow sponsored noopener" : "noopener noreferrer"}
                className="flex flex-col gap-1 rounded-[var(--radius-card)] border border-[var(--color-accent)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-0.5"
              >
                <span className="font-ui text-[0.6rem] font-bold uppercase tracking-wide text-[var(--color-accent)]">{o.rate} · {o.portal}</span>
                <span className="font-display text-base font-semibold text-[var(--color-primary)]">{o.store}</span>
                <span className="font-body text-sm text-[var(--color-text-secondary)]">{o.earns}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex flex-col gap-10">
        {PORTAL_GROUPS.map((g) => {
          const items = SHOPPING_PORTALS.filter((p) => p.group === g.key);
          if (items.length === 0) return null;
          return (
            <section key={g.key}>
              <h2 className="font-display text-xl font-semibold text-[var(--color-primary)] md:text-2xl">{g.label}</h2>
              <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">{g.blurb}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {items.map((p) => (
                  <PortalCard key={p.name} p={p} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-10 max-w-3xl font-body text-xs leading-relaxed text-[var(--color-text-secondary)] opacity-80">
        {PORTAL_DISCLOSURE}
      </p>
    </div>
  );
}
