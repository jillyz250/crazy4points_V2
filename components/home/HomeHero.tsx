import Link from "next/link";

export default function HomeHero() {
  return (
    <section className="bg-gradient-to-b from-white to-purple-50/30 py-24 md:py-32">
      <div className="rg-container px-6 md:px-8">
        <div className="mx-auto flex min-h-[20rem] max-w-3xl flex-col items-center justify-center space-y-6 rounded-2xl border border-purple-100 bg-[var(--color-background)] px-8 py-16 text-center shadow-sm md:space-y-8">
          <p className="text-xs uppercase tracking-widest text-purple-500/70">
            SMART TRAVEL WITH POINTS
          </p>
          <h1 className="font-display text-5xl leading-tight text-[var(--color-primary)] md:text-6xl lg:text-7xl">
            Because paying full price is overrated.
          </h1>
          <p className="max-w-xl text-lg text-gray-600 md:text-xl">
            Turn everyday spending into flights, hotels, and trips you actually want — without the complexity.
          </p>
          <Link
            href="/decision-engine"
            className="inline-flex rounded-md bg-[var(--color-accent)] px-6 py-3 font-ui text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-text-primary)] transition hover:scale-105 hover:bg-[#c49f2f]"
          >
            Start Here
          </Link>
        </div>
      </div>
    </section>
  );
}
