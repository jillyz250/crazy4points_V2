import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "About — crazy4points",
  description: "Meet the person behind crazy4points — a travel rewards enthusiast helping you earn more and travel smarter.",
};

export default function AboutPage() {
  return (
    <section className="rg-major-section !pt-8">
      <div className="rg-container">
        <div className="flex flex-col items-center gap-10 md:flex-row md:items-start md:gap-16">

          {/* Photo */}
          <div className="shrink-0">
            <Image
              src="/images/jill_photo.jpg"
              alt="Jill, founder of crazy4points"
              width={240}
              height={240}
              priority
              className="h-[200px] w-[200px] rounded-full object-cover object-top shadow-[var(--shadow-soft)] md:h-[240px] md:w-[240px]"
            />
          </div>

          {/* Bio */}
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl font-bold text-[var(--color-primary)] md:text-5xl">
              About Me
            </h1>

            <div className="mt-4" />

            <p className="mt-4 font-body text-base leading-relaxed text-[var(--color-text-primary)]">
              Hi, I&rsquo;m Jill. Somewhere between saving a few hundred dollars on a cruise by getting the credit card, and a free lie flat seat to Europe on United, I became completely obsessed with miles and points.
            </p>

            <p className="mt-4 font-body text-base leading-relaxed text-[var(--color-text-primary)]">
              Over the years I have used points to visit places like Napa, France, Greece, Jamaica, the Bahamas and Arizona. Sometimes premium cabins and luxury hotels, other times smart economy trips that punched way above their price. The goal has always been the same. Get more than you paid for.
            </p>

            <p className="mt-4 font-body text-base leading-relaxed text-[var(--color-text-primary)]">
              Friends and family come to me when they want to take a better trip than they thought was possible. I enjoy the research and the strategy and the satisfaction of finding opportunities most people miss.
            </p>

            <p className="mt-4 font-body text-base leading-relaxed text-[var(--color-text-primary)]">
              I bought the Crazy4Points domain more than fifteen years ago. Life got busy and the idea sat on the shelf. Now that my kids are older and AI has changed what is possible, it finally feels like the right time to build the site I always imagined.
            </p>

            <p className="mt-4 font-body text-base leading-relaxed text-[var(--color-text-primary)]">
              Crazy4Points is built on everything I have learned. Real strategies. Practical tools. A clear and simple approach to using points, miles and credit card benefits in a way that actually works.
            </p>

            <div className="mt-4" />

            <p className="mt-4 font-body text-base font-bold italic leading-relaxed text-[var(--color-text-primary)]">
              I never pay full price for travel. You don&rsquo;t have to either.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
