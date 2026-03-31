export default function HomeHero() {
  return (
    <section className="bg-[var(--color-background-soft)] py-20">
      <div className="rg-container px-6 md:px-8">
        <div className="mx-auto flex min-h-[20rem] max-w-3xl flex-col items-center justify-center rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-background)] px-8 py-16 text-center">
          <h1 className="font-display text-4xl font-semibold text-[var(--color-primary)] md:text-5xl">
            Hero Section Placeholder
          </h1>
          <p className="mt-4 font-body text-base text-[var(--color-text-secondary)]">
            Placeholder text for hero content.
          </p>
        </div>
      </div>
    </section>
  );
}
