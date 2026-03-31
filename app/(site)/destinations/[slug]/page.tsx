import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Destination",
  description: "Award travel destination guide.",
};

export default function DestinationDetailPage() {
  return (
    <>
      {/* Breadcrumb + header */}
      <section className="rg-section bg-[var(--color-bg-soft)] border-b border-[var(--color-border)]">
        <div className="rg-container">
          <nav className="flex items-center gap-2 text-xs font-ui mb-6" aria-label="Breadcrumb">
            <Link href="/" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">Home</Link>
            <span className="text-[var(--color-border)]">/</span>
            <Link href="/destinations" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">Destinations</Link>
            <span className="text-[var(--color-border)]">/</span>
            <span className="text-[var(--color-primary)]">Destination</span>
          </nav>
          <p className="rg-section-label">Destination</p>
          <h1 className="rg-section-title">Destination Detail</h1>
          <div className="rg-accent-bar" />
        </div>
      </section>

      {/* Content placeholder */}
      <section className="rg-section bg-[var(--color-bg)]">
        <div className="rg-container">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="rg-placeholder h-80">
                Destination Content Placeholder
              </div>
            </div>
            <aside>
              <div className="rg-placeholder h-64">
                Sidebar Placeholder
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Related placeholder */}
      <section className="rg-section bg-[var(--color-bg-soft)]">
        <div className="rg-container">
          <h2 className="rg-section-title mb-6">Related Destinations</h2>
          <div className="rg-placeholder h-48">
            Related Content Placeholder
          </div>
        </div>
      </section>
    </>
  );
}
