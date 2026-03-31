import Link from "next/link";

const navLinks = [
  { label: "Destinations", href: "/destinations" },
  { label: "Deals", href: "/deals" },
  { label: "Guides", href: "/guides" },
  { label: "Tools", href: "/tools" },
  { label: "About", href: "/about" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--color-white)] border-b border-[var(--color-border)]">
      <div className="rg-container">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <span className="font-display text-2xl font-bold text-[var(--color-text)] tracking-tight leading-none">
              crazy4
              <span className="text-[var(--color-primary)] group-hover:text-[var(--color-primary-dark)] transition-colors">
                points
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-ui text-sm font-semibold uppercase tracking-widest text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA + Mobile menu */}
          <div className="flex items-center gap-4">
            <Link
              href="/decision-engine"
              className="hidden md:inline-flex rg-btn-primary text-xs py-2.5 px-5"
            >
              Decision Engine
            </Link>

            {/* Mobile menu button — non-functional placeholder */}
            <button
              type="button"
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
              aria-label="Open menu"
              aria-expanded="false"
            >
              <span className="block w-6 h-0.5 bg-[var(--color-text)] rounded-full" />
              <span className="block w-6 h-0.5 bg-[var(--color-text)] rounded-full" />
              <span className="block w-4 h-0.5 bg-[var(--color-text)] rounded-full self-end" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
