import { CAPITAL_ONE_SHOPPING as C } from "@/lib/referrals";

function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3h2.2l2.1 11.4a1.6 1.6 0 0 0 1.6 1.3h8.4a1.6 1.6 0 0 0 1.6-1.2L21.5 7H6" />
    </svg>
  );
}

/**
 * Recommended-tool callout for Capital One Shopping (a referral link).
 * `card` = the rich version (homepage periodic callout); `compact` = a slim
 * line for the footer. Both carry the FTC disclosure and rel="nofollow sponsored".
 */
export default function CapOneShoppingCallout({ variant = "card" }: { variant?: "card" | "compact" }) {
  if (variant === "compact") {
    return (
      <div className="max-w-sm">
        <a
          href={C.url}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="group inline-flex items-center gap-2 font-ui text-sm font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)]"
        >
          <CartIcon className="h-4 w-4" />
          Save on shopping with {C.name}
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
        </a>
        <p className="mt-1 font-body text-[11px] leading-snug text-[var(--color-text-secondary)] opacity-80">{C.disclosure}</p>
      </div>
    );
  }

  return (
    <div
      className="flex items-start gap-4 rounded-[var(--radius-card)] border border-[var(--color-border-soft)] p-5 shadow-[var(--shadow-soft)] md:p-6"
      style={{ background: "linear-gradient(135deg, #FBF4DD 0%, var(--color-background) 60%)" }}
    >
      <span
        aria-hidden
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.25)]"
        style={{ background: "linear-gradient(140deg, #D4AF37, #B8912F)" }}
      >
        <CartIcon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="font-ui text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[var(--color-accent)]">Money-saving tip</p>
        <h3 className="mt-1 font-display text-lg font-semibold text-[var(--color-primary)]">
          Save on everyday shopping with {C.name}
        </h3>
        <p className="mt-1.5 max-w-prose font-body text-sm text-[var(--color-text-secondary)]">{C.blurb}</p>
        <a
          href={C.url}
          target="_blank"
          rel="nofollow sponsored noopener"
          className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-[var(--radius-ui)] bg-[var(--color-primary)] px-5 font-ui text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)]"
        >
          Try it free <span aria-hidden>&rarr;</span>
        </a>
        <p className="mt-2 font-body text-[11px] text-[var(--color-text-secondary)] opacity-80">{C.disclosure}</p>
      </div>
    </div>
  );
}
