"use client";

import { useState } from "react";
import Link from "next/link";
import NewsletterSignup from "@/components/home/NewsletterSignup";

/**
 * Combined newsletter unit: a single newsletter "front page" preview with a
 * subscribe CTA at the bottom. Clicking the CTA opens the signup form in a
 * modal, so the section leads with the product (the issue) instead of a bare
 * form. Client component for the modal open/close state.
 */
export default function HomeNewsletterCard({
  title, issueLabel, dateLabel, kicker, slug,
}: {
  title: string; issueLabel: string; dateLabel: string; kicker: string | null; slug: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-[var(--color-primary)] py-14 md:py-20">
      <div className="rg-container px-6 md:px-8">
        <div className="mx-auto max-w-md text-center">
          <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "var(--color-accent)" }}>The insider list</p>
          <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl" style={{ color: "#ffffff" }}>Never miss a points move</h2>
        </div>

        {/* Newsletter front-page preview */}
        <div
          className="mx-auto mt-6 max-w-md overflow-hidden rounded-[var(--radius-card)]"
          style={{
            background: "#FBF8F1",
            backgroundImage: "repeating-linear-gradient(0deg, rgba(74,32,95,0.025) 0 1px, transparent 1px 28px)",
            boxShadow: "0 22px 48px -16px rgba(0,0,0,0.5)",
          }}
        >
          <div className="px-6 pt-5 pb-3 text-center" style={{ borderBottom: "3px double #C9A227" }}>
            <p className="font-ui text-[0.58rem] font-semibold uppercase tracking-[0.28em]" style={{ color: "#8A6A1E" }}>Crazy4Points presents</p>
            <p className="mt-1 font-display text-2xl font-bold tracking-tight" style={{ color: "var(--color-primary)" }}>The Insider List</p>
            <p className="mt-1.5 font-ui text-[0.6rem] uppercase tracking-[0.18em]" style={{ color: "#6B6470" }}>{issueLabel} &middot; {dateLabel}</p>
          </div>
          <div className="px-6 py-5">
            <p className="font-display text-xl font-bold leading-snug" style={{ color: "var(--color-primary)" }}>{title}</p>
            {kicker && <p className="mt-2 font-body text-sm" style={{ color: "#4A4A4A" }}>{kicker}</p>}
            <div className="mt-4 flex flex-col gap-2.5" style={{ borderTop: "1px solid #EAE2D2", paddingTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[10px] font-ui text-sm font-bold transition hover:brightness-105"
                style={{ background: "linear-gradient(135deg,#f0d488,#c99b30)", color: "#241704", boxShadow: "0 6px 16px -5px rgba(201,155,48,0.7)" }}
              >
                Get it free in your inbox
              </button>
              <Link href={`/newsletter/${slug}`} className="text-center font-ui text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                Read the full issue &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Subscribe to The Insider List"
        >
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute -right-3 -top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl leading-none shadow-md"
              style={{ color: "var(--color-primary)" }}
            >
              &times;
            </button>
            <div className="mb-3 text-center">
              <p className="font-display text-2xl font-bold" style={{ color: "#ffffff" }}>Join The Insider List</p>
              <p className="mt-1 font-body text-sm" style={{ color: "rgba(255,255,255,0.88)" }}>
                The best transfer bonuses, award sweet spots, and deals worth your miles, in your inbox.
              </p>
            </div>
            <NewsletterSignup source="homepage_newsletter_modal" />
          </div>
        </div>
      )}
    </section>
  );
}
