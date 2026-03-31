import HomeHero from "@/components/home/HomeHero";
import FeaturedDestinations from "@/components/home/FeaturedDestinations";
import FeaturedDeals from "@/components/home/FeaturedDeals";
import FeaturedGuides from "@/components/home/FeaturedGuides";
import CTASection from "@/components/home/CTASection";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "crazy4points — Travel Smarter. Earn More. Go Farther.",
  description:
    "Real-time transfer bonuses, sweet spots, and a ranked action plan for your Chase, Amex, Citi, and Capital One points. The intelligent travel rewards platform.",
};

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <FeaturedDestinations />
      <FeaturedDeals />
      <FeaturedGuides />
      <CTASection />
    </>
  );
}
