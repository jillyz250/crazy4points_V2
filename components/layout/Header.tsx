"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BLOG_CATEGORIES } from "@/lib/blog/categories";
import type { ResourceNavCounts } from "@/utils/supabase/queries";

// "Tools" menu — the live tools, plus My Wallet (Coming Soon). Program
// directories live under Resources.
const toolsMenu: { label: string; href: string; comingSoon?: boolean }[] = [
  { label: "Decision Engine", href: "/decision-engine" },
  { label: "Credit Card Explorer", href: "/cards" },
  { label: "Alliance Explorer", href: "/tools/alliances" },
  { label: "My Wallet", href: "/wallet", comingSoon: true },
];

// Resources — content/reference + the interactive/editorial finders that used to
// live under Tools. Program directories carry a live count and gate to "Coming
// Soon" when empty; plain links (no key) always render; an explicit comingSoon
// flag covers tools that aren't built yet (e.g. FNC Fit).
const RESOURCE_ITEMS: {
  label: string;
  key?: keyof ResourceNavCounts;
  href?: string;
  comingSoon?: boolean;
  heading?: boolean; // bold non-link section label (e.g. "Guides")
}[] = [
  // Program directories (live via their counts) + the Points Hub (coming soon).
  // The hub finders (Best Way to Book, Where Can I Go, FNC Fit) now live INSIDE
  // the Points Hub, so they're off the nav.
  { label: "Airlines", key: "airline", href: "/programs?type=airline" },
  { label: "Hotels", key: "hotel", href: "/programs?type=hotel" },
  { label: "Alliances", key: "alliance", href: "/programs?type=alliance" },
  { label: "Experiences", href: "/experiences" },
  { label: "Newsletter", href: "/newsletter" },
  { label: "Points Hub", href: "/hub", comingSoon: true },
  // Guides — editorial reference pages.
  { label: "Guides", heading: true },
  { label: "Best Rate Guarantee", href: "/guides/hotel-best-rate-guarantees" },
];

// BLOG dropdown items — mirrors the editorial taxonomy in
// lib/blog/categories.ts. "All Posts" first, then the 6 categories in
// the order defined there. Each links to /blog?category=<slug>; the
// blog index page already handles that filter param.
const blogItems: { label: string; href: string }[] = [
  { label: "All Posts", href: "/blog" },
  ...BLOG_CATEGORIES.map((c) => ({
    label: c.label,
    href: `/blog?category=${c.slug}`,
  })),
];


export default function Header({
  resourceCounts,
}: {
  resourceCounts: ResourceNavCounts;
}) {
  const [logoError, setLogoError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Mobile-only expand state — desktop dropdowns use CSS hover via group-hover.
  const [toolsOpen, setToolsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [blogOpen, setBlogOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border-soft)] bg-[var(--color-background)]">
      <div className="rg-container px-6 md:px-8">
        <div className="flex h-24 items-center justify-between md:h-28">
          <Link href="/" className="flex items-center">
            {logoError ? (
              <span className="font-display text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                crazy4
                <span className="text-[var(--color-primary)]">points</span>
              </span>
            ) : (
              <Image
                src="/crazy4points-logo.png"
                alt="Crazy4Points logo"
                width={1317}
                height={509}
                priority
                className="h-[3.2rem] w-auto md:h-[4.8rem]"
                onError={() => setLogoError(true)}
              />
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            <Link
              href="/alerts"
              className="group relative font-ui text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:text-[var(--color-primary)] !text-red-600"
            >
              Alerts
              <span className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-[var(--color-accent)] transition-transform duration-200 group-hover:scale-x-100" />
            </Link>

            {/* Tools dropdown — the three live tools. Sits to the LEFT of
                Resources per the nav order. (No color dots.) */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 font-ui !text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
              >
                Tools
                <svg className="h-3 w-3 shrink-0 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="invisible absolute left-0 top-full z-50 w-72 pt-2 group-hover:visible">
                <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] py-1 shadow-[var(--shadow-soft)]">
                  {toolsMenu.map((item) =>
                    item.comingSoon ? (
                      <span
                        key={item.label}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 font-ui text-xs text-[var(--color-text-secondary)] opacity-60"
                      >
                        {item.label}
                        <span className="shrink-0 rounded bg-[var(--color-background-soft)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                          Coming Soon
                        </span>
                      </span>
                    ) : (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center px-4 py-2.5 font-ui text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-background-soft)] hover:text-[var(--color-primary)]"
                      >
                        {item.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Resources dropdown — program directories (Airlines / Hotels /
                Alliances) carry live counts; Points Hub is Coming Soon. Sits to
                the RIGHT of Tools. */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 font-ui !text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
              >
                Resources
                <svg className="h-3 w-3 shrink-0 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="invisible absolute left-0 top-full z-50 w-72 pt-2 group-hover:visible">
                <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] py-1 shadow-[var(--shadow-soft)]">
                  {RESOURCE_ITEMS.map((item) => {
                    if (item.heading) {
                      return (
                        <div
                          key={item.label}
                          className="mt-1 border-t border-[var(--color-border-soft)] px-4 pb-1 pt-2 font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]"
                        >
                          {item.label}
                        </div>
                      );
                    }
                    const count = item.key ? (resourceCounts[item.key] ?? 0) : 1;
                    const unavailable = item.comingSoon || count === 0;
                    return unavailable ? (
                      <span
                        key={item.label}
                        className="flex items-center justify-between px-4 py-2.5 font-ui text-xs text-[var(--color-text-secondary)] opacity-50"
                      >
                        {item.label}
                        <span className="ml-3 shrink-0 rounded bg-[var(--color-background-soft)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                          Coming Soon
                        </span>
                      </span>
                    ) : (
                      <Link
                        key={item.label}
                        href={item.href!}
                        className="flex items-center px-4 py-2.5 font-ui text-xs font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Blog dropdown — now its own top-level item (was folded into
                Resources). All Posts + the editorial categories. */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 font-ui !text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
              >
                Blog
                <svg className="h-3 w-3 shrink-0 transition-transform duration-200 group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* right-0 so the rightmost dropdown doesn't overflow the viewport. */}
              <div className="invisible absolute right-0 top-full z-50 w-56 pt-2 group-hover:visible">
                <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] py-1 shadow-[var(--shadow-soft)]">
                  {blogItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center px-4 py-2.5 font-ui text-xs font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          <div className="flex items-center gap-4">
            {/* Two-part CTA — md+ (the nav lightened up once Newsletter moved
                into Resources, so the button now fits at md). The "Spin the"
                prefix only shows at lg+ to save space at md. */}
            <div className="hidden md:inline-flex items-center gap-2">
              <span className="hidden font-display text-[13px] italic tracking-wide text-[var(--color-primary)] lg:inline">
                Spin the
              </span>
              <Link
                href="/decision-engine"
                className="cta-engine-btn rounded-lg px-4 py-[0.45rem] font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A]"
              >
                Decision Engine
              </Link>
            </div>

            <button
              type="button"
              className="flex h-11 w-11 flex-col items-center justify-center gap-1.5 text-[var(--color-text-primary)] md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="block h-0.5 w-6 bg-current" />
              <span className="block h-0.5 w-6 bg-current" />
              <span className="block h-0.5 w-6 bg-current" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav
          className="border-t border-[var(--color-border-soft)] bg-[var(--color-background)] md:hidden"
          aria-label="Mobile navigation"
        >
          <Link
            href="/alerts"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-[44px] items-center border-b border-[var(--color-border-soft)] px-6 font-ui text-sm font-semibold uppercase tracking-[0.14em] !text-red-600"
          >
            Alerts
          </Link>

          {/* Mobile Tools — the three live tools (no color dots), mirrors
              desktop order (left of Resources). */}
          <button
            type="button"
            className="flex min-h-[44px] w-full items-center justify-between border-b border-[var(--color-border-soft)] px-6 font-ui text-sm font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]"
            onClick={() => setToolsOpen((o) => !o)}
          >
            Tools
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={toolsOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>
          {toolsOpen &&
            toolsMenu.map((item) =>
              item.comingSoon ? (
                <span
                  key={item.label}
                  className="flex min-h-[44px] items-center justify-between border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-8 font-ui text-sm text-[var(--color-text-secondary)] opacity-60"
                >
                  {item.label}
                  <span className="ml-3 shrink-0 rounded bg-[var(--color-border-soft)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                    Coming Soon
                  </span>
                </span>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] items-center border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-8 font-ui text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                >
                  {item.label}
                </Link>
              )
            )}

          {/* Mobile Resources — Airlines / Hotels / Alliances + Points Hub. */}
          <button
            type="button"
            className="flex min-h-[44px] w-full items-center justify-between border-b border-[var(--color-border-soft)] px-6 font-ui text-sm font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]"
            onClick={() => setResourcesOpen((o) => !o)}
          >
            Resources
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={resourcesOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>
          {resourcesOpen &&
            RESOURCE_ITEMS.map((item) => {
              if (item.heading) {
                return (
                  <div
                    key={item.label}
                    className="flex min-h-[36px] items-center border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-6 pt-1 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]"
                  >
                    {item.label}
                  </div>
                );
              }
              const count = item.key ? (resourceCounts[item.key] ?? 0) : 1;
              const unavailable = item.comingSoon || count === 0;
              return unavailable ? (
                <span
                  key={item.label}
                  className="flex min-h-[44px] items-center justify-between border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-8 font-ui text-sm text-[var(--color-text-secondary)] opacity-50"
                >
                  {item.label}
                  <span className="ml-3 shrink-0 rounded bg-[var(--color-border-soft)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                    Coming Soon
                  </span>
                </span>
              ) : (
                <Link
                  key={item.label}
                  href={item.href!}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] items-center border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-8 font-ui text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                >
                  {item.label}
                </Link>
              );
            })}

          {/* Mobile Blog — now its own top-level item */}
          <button
            type="button"
            className="flex min-h-[44px] w-full items-center justify-between border-b border-[var(--color-border-soft)] px-6 font-ui text-sm font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]"
            onClick={() => setBlogOpen((o) => !o)}
          >
            Blog
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={blogOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
            </svg>
          </button>
          {blogOpen &&
            blogItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-[44px] items-center border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-8 font-ui text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
              >
                {item.label}
              </Link>
            ))}
        </nav>
      )}
    </header>
  );
}
