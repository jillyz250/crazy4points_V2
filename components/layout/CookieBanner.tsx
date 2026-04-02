"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ConsentState = "accepted" | "declined" | null;

export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("c4p_cookie_consent") as ConsentState;
    if (!stored) {
      // Small delay so banner doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    setConsent(stored);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("c4p_cookie_consent", "accepted");
    setConsent("accepted");
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("c4p_cookie_consent", "declined");
    setConsent("declined");
    setVisible(false);
  };

  if (!visible || consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border-soft)] bg-white px-6 py-5 shadow-[0_-4px_24px_rgba(26,26,26,0.08)] md:bottom-6 md:left-6 md:right-auto md:max-w-md md:rounded-xl md:border"
    >
      <p className="font-ui text-sm font-semibold text-[var(--color-primary)]">
        🍪 We use cookies
      </p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        We use cookies for analytics and affiliate tracking to improve your
        experience. You can accept all cookies or decline non-essential ones.{" "}
        <Link
          href="/cookie-policy"
          className="underline underline-offset-2 hover:text-[var(--color-primary)]"
        >
          Learn more
        </Link>
        .
      </p>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleAccept}
          className="rg-btn-primary px-5 py-2 text-xs"
        >
          Accept all
        </button>
        <button
          onClick={handleDecline}
          className="rg-btn-secondary px-5 py-2 text-xs"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
