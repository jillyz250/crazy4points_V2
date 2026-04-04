"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const toolsItems = [
  { label: "Transfer Bonus Tracker", comingSoon: true, href: null },
  { label: "Decision Engine", comingSoon: false, href: "/decision-engine" },
  { label: "Transfer Partner Map", comingSoon: true, href: null },
  { label: "Card Benefits Search", comingSoon: true, href: null },
];

const REEL_EMOJIS = ["✈️", "🌴", "🎰", "🗺️", "🧳"];

function SlotReel({ fast }: { fast: boolean }) {
  const [idx, setIdx] = useState(0);
  const [sliding, setSliding] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (!busyRef.current) {
        busyRef.current = true;
        setSliding(true);
      }
    }, fast ? 380 : 1150);
    return () => clearInterval(id);
  }, [fast]);

  function handleTransitionEnd() {
    setIdx((i) => (i + 1) % REEL_EMOJIS.length);
    setSliding(false);
    busyRef.current = false;
  }

  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        width: "1.35rem",
        height: "1.2rem",
        overflow: "hidden",
        verticalAlign: "middle",
      }}
    >
      <span
        onTransitionEnd={handleTransitionEnd}
        style={{
          display: "flex",
          flexDirection: "column",
          height: "200%",
          transform: sliding ? "translateY(-50%)" : "translateY(0)",
          transition: sliding ? "transform 260ms ease-in-out" : "none",
        }}
      >
        <span
          style={{
            height: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.85rem",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {REEL_EMOJIS[idx]}
        </span>
        <span
          style={{
            height: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.85rem",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {REEL_EMOJIS[(idx + 1) % REEL_EMOJIS.length]}
        </span>
      </span>
    </span>
  );
}

export default function Header() {
  const [logoError, setLogoError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [spinFast, setSpinFast] = useState(false);

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

            <Link
              href="/newsletter"
              className="group relative font-ui text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
            >
              Newsletter
              <span className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-[var(--color-accent)] transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            {/* Slot machine CTA — desktop only */}
            <Link
              href="/decision-engine"
              onMouseEnter={() => setSpinFast(true)}
              onMouseLeave={() => setSpinFast(false)}
              className="hidden md:inline-flex items-center gap-2.5 rounded-lg border-2 border-[var(--color-accent)] bg-[var(--color-primary)] px-3.5 py-[0.45rem] font-ui text-[11px] font-bold uppercase tracking-[0.1em] text-white shadow-[0_3px_10px_rgba(107,45,143,0.4)] transition-shadow duration-200 hover:shadow-[0_5px_18px_rgba(107,45,143,0.6)]"
            >
              {/* Reel window */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "4px",
                  border: "1.5px solid rgba(212,175,55,0.7)",
                  background: "rgba(0,0,0,0.25)",
                  padding: "2px 5px",
                }}
              >
                <SlotReel fast={spinFast} />
              </span>
              Spin the Decision Engine
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
