import HomeHero from "@/components/home/HomeHero";
import DailyAlerts from "@/components/home/DailyAlerts";
import FeaturedDestinations from "@/components/home/FeaturedDestinations";
import FeaturedDeals from "@/components/home/FeaturedDeals";
import FeaturedGuides from "@/components/home/FeaturedGuides";
import CTASection from "@/components/home/CTASection";
import { createAdminClient } from "@/utils/supabase/server";
import { getActiveAlerts } from "@/utils/supabase/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "crazy4points — Travel Smarter. Earn More. Go Farther.",
  description:
    "Real-time transfer bonuses, sweet spots, and a ranked action plan for your Chase, Amex, Citi, and Capital One points. The intelligent travel rewards platform.",
};

export default async function HomePage() {
  const supabase = createAdminClient();
  const allAlerts = await getActiveAlerts(supabase);

  // Sort by composite score (impact + value + rarity), take top 4
  const topAlerts = [...allAlerts]
    .sort((a, b) =>
      (b.impact_score + b.value_score + b.rarity_score) -
      (a.impact_score + a.value_score + a.rarity_score)
    )
    .slice(0, 4);

  return (
    <>
      <DailyAlerts alerts={topAlerts} />
      <HomeHero />
      <FeaturedDestinations />
      <FeaturedDeals />
      <FeaturedGuides />
      <CTASection />
    </>
  );
}
