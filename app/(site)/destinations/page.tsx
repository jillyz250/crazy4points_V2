import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Destinations",
  description: "Award travel destinations ranked by redemption value and transfer partner availability.",
};

export default function DestinationsPage() {
  return (
    <>
      {/* Page header */}
      <section className="rg-section bg-[var(--color-bg-soft)] border-b border-[var(--color-border)]">
        <div className="rg-container">
          <p className="rg-section-label">Explore</p>
          <h1 className="rg-section-title">Destinations</h1>
          <div className="rg-accent-bar" />
          <p className="rg-section-subtitle">
            Award travel destinations — coming soon.
          </p>
        </div>
      </section>

      {/* Content placeholder */}
      <section className="rg-section bg-[var(--color-bg)]">
        <div className="rg-container">
          <div className="rg-placeholder h-96">
            Destinations Placeholder
          </div>
        </div>
      </section>
    </>
  );
}
