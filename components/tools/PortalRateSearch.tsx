"use client";

import { useState } from "react";

// Deep-link a store search to Cashback Monitor's store page, which aggregates
// live per-portal rates for 40+ portals. We provide the search + our referral
// portals; the live per-store rates come from the aggregator (no scraping).
function storeSlug(q: string): string {
  return q
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("-");
}

export default function PortalRateSearch() {
  const [q, setQ] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    window.open(`https://cashbackmonitor.com/cashback-store/${encodeURIComponent(storeSlug(t))}/`, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] p-5 shadow-[var(--shadow-soft)] md:p-6"
      style={{ background: "linear-gradient(135deg, #F1E7F8 0%, var(--color-background) 62%)" }}
    >
      <p className="font-display text-lg font-semibold text-[var(--color-primary)]">Which portal pays the most today?</p>
      <p className="mt-1 font-body text-sm text-[var(--color-text-secondary)]">
        Rates change daily and vary by store. Search a store to see a live side-by-side of 40+ portals.
      </p>
      <form onSubmit={go} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a store, e.g. Nike"
          aria-label="Store to compare portal rates for"
          className="min-w-0 flex-1 rounded-[var(--radius-ui)] border border-[var(--color-border-soft)] bg-[var(--color-background)] px-4 py-3 font-body text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <button
          type="submit"
          className="inline-flex min-h-[46px] shrink-0 items-center justify-center gap-2 rounded-[var(--radius-ui)] px-5 font-ui text-sm font-bold transition hover:brightness-110"
          style={{ background: "var(--color-primary)", color: "#ffffff" }}
        >
          Compare portals <span aria-hidden>&rarr;</span>
        </button>
      </form>
      <p className="mt-2 font-body text-[11px] text-[var(--color-text-secondary)] opacity-80">
        Opens a live comparison on Cashback Monitor (a third-party rate tracker). Then shop through your pick below.
      </p>
    </div>
  );
}
