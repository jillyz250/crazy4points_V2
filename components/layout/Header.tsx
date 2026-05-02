"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BLOG_CATEGORIES } from "@/lib/blog/categories";
import type { ResourceNavCounts } from "@/utils/supabase/queries";

const toolsItems = [
  { label: "Alliance Explorer", comingSoon: false, href: "/tools/alliances" },
  { label: "Card Benefits Search", comingSoon: true, href: null },
  { label: "Decision Engine", comingSoon: false, href: "/decision-engine" },
  { label: "Transfer Bonus Tracker", comingSoon: true, href: null },
  { label: "Transfer Partner Map", comingSoon: true, href: null },
];

const RESOURCE_ITEMS: { label: string; key: keyof ResourceNavCounts; href: string }[] = [
  { label: "Airlines", key: "airline", href: "/programs?type=airline" },
  { label: "Alliances", key: "alliance", href: "/programs?type=alliance" },
  { label: "Hotels", key: "hotel", href: "/programs?type=hotel" },
  { label: "Credit Cards", key: "credit_card", href: "/programs?type=credit_card" },
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
  const [toolsOpen, setToolsOpen] = useState(false);
  // Mobile-only — desktop dropdown uses CSS hover via group-hover.
  const [blogOpen, setBlogOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border-soft)] bg-[var(--color-background)]">
      <div className="rg-container px-6 md:px-8">
        <div className="flex h-20 items-center justify-between">
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
                width={130}
                height={40}
                priority
                className="h-auto w-[140px] md:w-[180px]"
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

            {/* Tools dropdown */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 font-ui !text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
              >
                Tools
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="invisible absolute left-0 top-full z-50 w-60 pt-2 group-hover:visible">
                <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] py-1 shadow-[var(--shadow-soft)]">
                  {toolsItems.map((item) =>
                    item.comingSoon ? (
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
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Resources dropdown — auto-links per category when count > 0,
                greys out otherwise. Counts come from the (site) layout. */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 font-ui !text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
              >
                Resources
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="invisible absolute left-0 top-full z-50 w-60 pt-2 group-hover:visible">
                <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] py-1 shadow-[var(--shadow-soft)]">
                  {RESOURCE_ITEMS.map((item) => {
                    const count = resourceCounts[item.key] ?? 0;
                    return count > 0 ? (
                      <Link
                        key={item.label}
                        href={item.href}
                        className="flex items-center px-4 py-2.5 font-ui text-xs font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span
                        key={item.label}
                        className="flex items-center justify-between px-4 py-2.5 font-ui text-xs text-[var(--color-text-secondary)] opacity-50"
                      >
                        {item.label}
                        <span className="ml-3 shrink-0 rounded bg-[var(--color-background-soft)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                          Coming Soon
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Blog dropdown — mirrors Tools pattern. Hover-triggered on
                desktop via group-hover; mobile expanded inline below. */}
            <div className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 font-ui !text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
              >
                Blog
                <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {/* right-0 (not left-0) so the 240px panel doesn't overflow
                  the viewport at md (Blog is the rightmost dropdown). */}
              <div className="invisible absolute right-0 top-full z-50 w-60 pt-2 group-hover:visible">
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

            <Link
              href="/newsletter"
              className="group relative font-ui text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
            >
              Newsletter
              <span className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-[var(--color-accent)] transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {/* Two-part CTA — lg+ only. Hidden at md (768-1024px) where the
                desktop nav already fills the row; the Decision Engine link
                lives in the Tools dropdown there. */}
            <div className="hidden lg:inline-flex items-center gap-2">
              <span className="font-display text-[13px] italic tracking-wide text-[var(--color-primary)]">
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
            toolsItems.map((item) =>
              item.comingSoon ? (
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
              )
            )}

          {/* Mobile Resources — same auto-link rule as desktop */}
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
              const count = resourceCounts[item.key] ?? 0;
              return count > 0 ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-[44px] items-center border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-8 font-ui text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  key={item.label}
                  className="flex min-h-[44px] items-center justify-between border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-8 font-ui text-sm text-[var(--color-text-secondary)] opacity-50"
                >
                  {item.label}
                  <span className="ml-3 shrink-0 rounded bg-[var(--color-border-soft)] px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
                    Coming Soon
                  </span>
                </span>
              );
            })}

          {/* Mobile Blog — expandable list like Tools */}
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

          <Link
            href="/newsletter"
            onClick={() => setMenuOpen(false)}
            className="flex min-h-[44px] items-center border-b border-[var(--color-border-soft)] px-6 font-ui text-sm font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)]"
          >
            Newsletter
          </Link>
        </nav>
      )}
    </header>
  );
}
