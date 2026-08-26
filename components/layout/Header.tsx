"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ResourceNavCounts } from "@/utils/supabase/queries";
import GlobalSearch from "./GlobalSearch";

/**
 * Accessible desktop dropdown.
 *
 * Previously these menus opened on CSS :hover only, so keyboard and screen
 * reader users could not reach Tools or Resources AT ALL — that's most of the
 * site's navigation. Open state now lives in React and is driven by hover
 * (mouse), focus (keyboard tab), and focus-on-tap (touch), so `aria-expanded`
 * always matches what's actually on screen. Escape closes.
 */
function NavDropdown({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        // Keep open while focus moves between the trigger and its menu items.
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        // `!` important is required: an unlayered `button { color: inherit }`
        // reset outranks Tailwind's layered utilities, so without it these
        // triggers render inherited near-black instead of the intended colors.
        className={`flex items-center gap-1 font-ui !text-xs font-medium uppercase tracking-[0.14em] transition-colors hover:!text-[var(--color-primary)] ${
          active ? "!text-[var(--color-primary)]" : "!text-[var(--color-text-secondary)]"
        }`}
      >
        {label}
        <svg
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className={`absolute left-0 top-full z-50 w-72 pt-2 ${open ? "visible" : "invisible"}`}>
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border-soft)] bg-[var(--color-background)] py-1 shadow-[var(--shadow-soft)]">
          {children}
        </div>
      </div>
    </div>
  );
}

// "Tools" menu — the live tools, plus My Wallet (Coming Soon). Program
// directories live under Resources.
const toolsMenu: { label: string; href: string; comingSoon?: boolean }[] = [
  { label: "Decision Engine", href: "/decision-engine" },
  { label: "Credit Card Explorer", href: "/cards" },
  { label: "Alliance Explorer", href: "/tools/alliances" },
  { label: "Sweet Spots", href: "/sweet-spots" },
  { label: "Experiences Finder", href: "/experiences" },
  { label: "Sweepstakes", href: "/sweepstakes" },
  { label: "Shopping Portals", href: "/tools/shopping-portals" },
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
  { label: "Newsletter", href: "/newsletter" },
  { label: "Blog", href: "/blog" },
  { label: "Points Hub", href: "/hub", comingSoon: true },
  // Guides — editorial reference pages. The dropdown lists CATEGORIES (bounded),
  // not individual guides (unbounded); each anchors into the /guides hub, which
  // is driven by lib/guides.ts. Add a guide there, not here.
  { label: "Guides", heading: true, href: "/guides" },
  { label: "Getting Started", href: "/guides#getting-started" },
  { label: "Airlines & Flying", href: "/guides#airlines" },
  { label: "Hotels & Stays", href: "/guides#hotels" },
  { label: "Cards & Points", href: "/guides#cards" },
];


export default function Header({
  resourceCounts,
}: {
  resourceCounts: ResourceNavCounts;
}) {
  const [logoError, setLogoError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Mobile-only expand state — desktop dropdowns manage their own (NavDropdown).
  const [toolsOpen, setToolsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  // Active-section highlighting so readers can see where they are.
  const pathname = usePathname();
  const isActive = (href?: string) => {
    if (!href) return false;
    const path = href.split("?")[0].split("#")[0];
    if (path === "/") return pathname === "/";
    return pathname === path || pathname.startsWith(`${path}/`);
  };
  const toolsActive = toolsMenu.some((i) => !i.comingSoon && isActive(i.href));
  const resourcesActive = RESOURCE_ITEMS.some((i) => !i.heading && !i.comingSoon && isActive(i.href));

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border-soft)] bg-[var(--color-background)]">
      {/* Skip link — first focusable element, so keyboard users can jump past
          the nav straight to the page content. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-ui)] focus:bg-[var(--color-primary)] focus:px-4 focus:py-2 focus:font-ui focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to content
      </a>
      <div className="rg-container px-6 md:px-8">
        {/* gap-* guarantees the nav and the CTA group can never collide — they
            were touching at ~860px before (0px gap). */}
        <div className="flex h-24 items-center justify-between gap-4 md:h-28 md:gap-6">
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
          <nav className="hidden items-center gap-6 md:flex lg:gap-8" aria-label="Main navigation">
            <Link
              href="/alerts"
              aria-current={isActive("/alerts") ? "page" : undefined}
              className="group relative font-ui text-xs font-semibold uppercase tracking-[0.14em] !text-[var(--color-alert)] transition-colors hover:text-[var(--color-primary)]"
            >
              Alerts
              <span
                className={`absolute -bottom-1 left-0 h-0.5 w-full origin-left bg-[var(--color-accent)] transition-transform duration-200 group-hover:scale-x-100 ${
                  isActive("/alerts") ? "scale-x-100" : "scale-x-0"
                }`}
              />
            </Link>

            {/* Tools dropdown — the live tools. Sits to the LEFT of Resources
                per the nav order. (No color dots.) */}
            <NavDropdown label="Tools" active={toolsActive}>
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
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`flex items-center px-4 py-2.5 font-ui text-xs font-medium hover:bg-[var(--color-background-soft)] hover:text-[var(--color-primary)] ${
                      isActive(item.href)
                        ? "bg-[var(--color-background-soft)] font-semibold text-[var(--color-primary)]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </NavDropdown>

            {/* Resources dropdown — program directories (Airlines / Hotels /
                Alliances) carry live counts; Points Hub is Coming Soon. Sits to
                the RIGHT of Tools. */}
            <NavDropdown label="Resources" active={resourcesActive}>
              {RESOURCE_ITEMS.map((item) => {
                if (item.heading) {
                  const headingClass =
                    "mt-1 border-t border-[var(--color-border-soft)] px-4 pb-1 pt-2 font-ui text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]";
                  return item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={`${headingClass} flex items-center justify-between gap-2 hover:text-[var(--color-primary)]`}
                    >
                      {item.label}
                      <span aria-hidden="true" className="text-[var(--color-primary)]">
                        &rarr;
                      </span>
                    </Link>
                  ) : (
                    <div key={item.label} className={headingClass}>
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
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`flex items-center px-4 py-2.5 font-ui text-xs font-medium hover:text-[var(--color-primary)] ${
                      isActive(item.href)
                        ? "bg-[var(--color-background-soft)] font-semibold text-[var(--color-primary)]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </NavDropdown>

          </nav>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            {/* Sitewide search — icon-only so it costs almost no header width
                (the bar collided at ~860px once before). Opens a modal; Cmd/Ctrl+K
                works from anywhere. */}
            <GlobalSearch />

            {/* Subscribe is now the PRIMARY sitewide CTA (gold), visible at every
                breakpoint including mobile, where the nav hides behind the
                hamburger. Growing the list beats a second competing button, and
                signup was previously three taps deep. */}
            <Link
              href="/newsletter"
              className="cta-engine-btn rg-tap-target inline-flex items-center whitespace-nowrap rounded-lg px-3.5 py-[0.45rem] font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-[#1A1A1A] md:px-5 md:text-xs"
            >
              {/* Full brand label on desktop; compact on mobile so the header
                  never crowds at ~375px. (No "Free" — reads cheap.) */}
              <span className="md:hidden">Insider List</span>
              <span className="hidden md:inline">The Insider List</span>
            </Link>

            {/* Decision Engine — secondary. Compact outline, lg+ only so it can
                never crowd the nav at md (it collided at ~860px). Still reachable
                everywhere via the Tools dropdown and the homepage tools band. */}
            <Link
              href="/decision-engine"
              className="hidden items-center whitespace-nowrap rounded-lg border border-[var(--color-primary)] px-3.5 font-ui text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white lg:inline-flex"
              style={{ minHeight: '40px' }}
            >
              Decision Engine
            </Link>

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
            aria-current={isActive("/alerts") ? "page" : undefined}
            className="flex min-h-[44px] items-center border-b border-[var(--color-border-soft)] px-6 font-ui text-sm font-semibold uppercase tracking-[0.14em] !text-[var(--color-alert)]"
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
                const hClass =
                  "border-b border-[var(--color-border-soft)] bg-[var(--color-background-soft)] px-6 pt-1 font-ui text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]";
                return item.href ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`${hClass} flex min-h-[44px] items-center justify-between hover:text-[var(--color-primary)]`}
                  >
                    {item.label}
                    <span aria-hidden="true" className="text-[var(--color-primary)]">
                      &rarr;
                    </span>
                  </Link>
                ) : (
                  <div
                    key={item.label}
                    className={`${hClass} flex min-h-[36px] items-center`}
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

        </nav>
      )}
    </header>
  );
}
