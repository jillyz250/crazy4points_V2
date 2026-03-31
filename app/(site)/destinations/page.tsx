import DestinationCard, {
  type DestinationCardProps,
} from "@/components/destinations/DestinationCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Explore the best award travel destinations ranked by redemption value, transfer partner availability, and current bonuses.",
};

const destinations: DestinationCardProps[] = [
  {
    slug: "tokyo-japan",
    name: "Tokyo",
    country: "Japan",
    region: "Asia Pacific",
    pointsFrom: "35,000",
    program: "ANA",
    tag: "Sweet Spot",
    description:
      "One of the best-value international awards in points. Business class on ANA via Virgin Atlantic is a legendary sweet spot.",
  },
  {
    slug: "maldives",
    name: "Maldives",
    country: "Republic of Maldives",
    region: "Indian Ocean",
    pointsFrom: "60,000",
    program: "World of Hyatt",
    tag: "Luxury",
    description:
      "Overwater bungalows at top Hyatt properties still deliver extraordinary value for points travelers seeking once-in-a-lifetime stays.",
  },
  {
    slug: "paris-france",
    name: "Paris",
    country: "France",
    region: "Europe",
    pointsFrom: "50,000",
    program: "Air France/KLM",
    tag: "Editor's Pick",
    description:
      "Flying Blue promo awards regularly drop to 50k points round-trip. One of the best consistent values in transatlantic award travel.",
  },
  {
    slug: "maui-hawaii",
    name: "Maui",
    country: "Hawaii, USA",
    region: "Pacific",
    pointsFrom: "25,000",
    program: "Chase UR",
    tag: "Top Value",
    description:
      "Transfer Chase points to Hyatt and book luxury resort nights at a fraction of the cash rate. Consistently strong value.",
  },
  {
    slug: "bali-indonesia",
    name: "Bali",
    country: "Indonesia",
    region: "Asia Pacific",
    pointsFrom: "40,000",
    program: "Marriott Bonvoy",
    tag: "Popular",
    description:
      "Marriott Bonvoy properties across Bali offer compelling redemptions, especially during shoulder seasons with free night certificates.",
  },
  {
    slug: "rome-italy",
    name: "Rome",
    country: "Italy",
    region: "Europe",
    pointsFrom: "45,000",
    program: "Citi ThankYou",
    tag: "New Route",
    description:
      "ITA Airways partnerships with Citi and Capital One open up new Rome redemption options with improving availability.",
  },
  {
    slug: "cape-town-south-africa",
    name: "Cape Town",
    country: "South Africa",
    region: "Africa",
    pointsFrom: "55,000",
    program: "Amex MR",
    tag: "Hidden Gem",
    description:
      "Transfer Amex MR to Etihad or Air Canada for surprisingly low award rates to Cape Town, one of the most underbooked sweet spots.",
  },
  {
    slug: "kyoto-japan",
    name: "Kyoto",
    country: "Japan",
    region: "Asia Pacific",
    pointsFrom: "30,000",
    program: "World of Hyatt",
    tag: "Sweet Spot",
    description:
      "The Park Hyatt Kyoto is one of the best hotel redemptions on the planet. Transfer Chase UR to Hyatt for exceptional value.",
  },
];

const regions = ["All", "Asia Pacific", "Europe", "Indian Ocean", "Pacific", "Africa"];

export default function DestinationsPage() {
  return (
    <>
      {/* Page hero */}
      <section
        className="py-16 md:py-20"
        style={{
          background: "linear-gradient(135deg, var(--color-navy-dark) 0%, var(--color-navy) 100%)",
        }}
      >
        <div className="rg-container">
          <p className="rg-section-label mb-3">Explore the World Free</p>
          <h1
            className="font-display text-4xl md:text-5xl font-bold mb-4"
            style={{ color: "var(--color-white)" }}
          >
            Award Travel Destinations
          </h1>
          <div className="rg-gold-bar" />
          <p
            className="font-body text-lg mt-4 max-w-2xl"
            style={{ color: "var(--color-slate-light)" }}
          >
            Every destination ranked by redemption value, partner availability, and
            current transfer bonuses. Updated continuously.
          </p>
        </div>
      </section>

      {/* Filter bar — static placeholders */}
      <section className="bg-[var(--color-white)] border-b border-[var(--color-ivory-dark)] sticky top-20 z-40">
        <div className="rg-container">
          <div className="flex items-center gap-3 py-4 overflow-x-auto">
            <span className="font-ui text-xs uppercase tracking-widest text-[var(--color-slate)] shrink-0 mr-2">
              Region:
            </span>
            {regions.map((region) => (
              <button
                key={region}
                type="button"
                className={`font-ui text-xs font-600 uppercase tracking-wider px-4 py-2 rounded-full border transition-colors shrink-0 ${
                  region === "All"
                    ? "bg-[var(--color-navy)] text-white border-[var(--color-navy)]"
                    : "bg-transparent text-[var(--color-slate)] border-[var(--color-ivory-dark)] hover:border-[var(--color-navy)] hover:text-[var(--color-navy)]"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations grid */}
      <section className="rg-section bg-[var(--color-ivory)]">
        <div className="rg-container">
          <p className="font-ui text-sm text-[var(--color-slate)] mb-8">
            Showing <strong className="text-[var(--color-navy)]">{destinations.length}</strong> destinations
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {destinations.map((dest) => (
              <DestinationCard key={dest.slug} {...dest} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
