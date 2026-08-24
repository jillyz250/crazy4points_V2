"use client";

import { useEffect, useState } from "react";
import CapOneShoppingCallout from "@/components/shared/CapOneShoppingCallout";

const KEY = "c4p_capone_shopping_dismissed_at";
const REAPPEAR_DAYS = 14;

/**
 * Homepage "periodic" reminder for Capital One Shopping. Shows the callout,
 * lets the reader dismiss it, and stays hidden for REAPPEAR_DAYS so it nudges
 * on occasion instead of nagging every visit. Renders nothing until we've
 * checked localStorage, to avoid a flash.
 */
export default function PeriodicCapOneCallout() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const dismissedAt = raw ? Number(raw) : 0;
      const ageDays = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (!dismissedAt || ageDays >= REAPPEAR_DAYS) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <section className="bg-[var(--color-background)] pb-12 md:pb-16">
      <div className="rg-container px-6 md:px-8">
        <div className="relative mx-auto max-w-3xl">
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.setItem(KEY, String(Date.now()));
              } catch {
                /* ignore */
              }
              setShow(false);
            }}
            aria-label="Dismiss this tip"
            className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full text-lg leading-none text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-background-soft)] hover:text-[var(--color-primary)]"
          >
            &times;
          </button>
          <CapOneShoppingCallout variant="card" />
        </div>
      </div>
    </section>
  );
}
