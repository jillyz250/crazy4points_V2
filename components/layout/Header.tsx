import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { label: "Deals", href: "/deals" },
  { label: "Guides", href: "/guides" },
  { label: "Tools", href: "/tools" },
  { label: "About", href: "/about" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border-soft)] bg-[var(--color-background)]">
      <div className="rg-container px-6 md:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/crazy4points-logo.png"
              alt="Crazy4Points logo"
              width={140}
              height={44}
              priority
              className="h-auto w-[100px] md:w-[130px]"
            />
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative font-ui text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-[var(--color-accent)] transition-transform duration-200 group-hover:scale-x-100" />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/decision-engine"
              className="hidden rounded-md bg-[var(--color-accent)] px-4 py-2.5 font-ui text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-primary)] transition-colors hover:bg-[#c49f2f] md:inline-flex"
            >
              Decision Engine
            </Link>

            <button
              type="button"
              className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
              aria-label="Open menu"
              aria-expanded="false"
            >
              <span className="block h-0.5 w-6 rounded-full bg-[var(--color-text-primary)]" />
              <span className="block h-0.5 w-6 rounded-full bg-[var(--color-text-primary)]" />
              <span className="block h-0.5 w-4 self-end rounded-full bg-[var(--color-text-primary)]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
