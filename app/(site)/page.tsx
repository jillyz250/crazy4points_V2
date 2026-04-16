import HomeHero from "@/components/home/HomeHero";
import DailyAlerts from "@/components/home/DailyAlerts";
import FeaturedDestinations from "@/components/home/FeaturedDestinations";
import FeaturedDeals from "@/components/home/FeaturedDeals";
import FeaturedGuides from "@/components/home/FeaturedGuides";
import CTASection from "@/components/home/CTASection";
import { createAdminClient } from "@/utils/supabase/server";
import { getHomepageAlerts, getActiveAlerts } from "@/utils/supabase/queries";
import type { AlertWithPrograms } from "@/utils/supabase/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "crazy4points — Travel Smarter. Earn More. Go Farther.",
  description:
    "Real-time transfer bonuses, sweet spots, and a ranked action plan for your Chase, Amex, Citi, and Capital One points. The intelligent travel rewards platform.",
};

export default async function HomePage() {
  const supabase = createAdminClient();
  const [pinnedSlots, allActive] = await Promise.all([
    getHomepageAlerts(supabase),
    getActiveAlerts(supabase),
  ]);

  // Build the 4 homepage alerts: pinned slots first, fill gaps with top scored
  const pinnedAlerts = pinnedSlots
    .sort((a, b) => a.slot_number - b.slot_number)
    .map((s) => s.alerts)
    .filter((a): a is AlertWithPrograms => a !== null);

  const pinnedIds = new Set(pinnedAlerts.map((a) => a.id));

  const fallbacks = [...allActive]
    .filter((a) => !pinnedIds.has(a.id))
    .sort((a, b) =>
      (b.impact_score + b.value_score + b.rarity_score) -
      (a.impact_score + a.value_score + a.rarity_score)
    );

  const topAlerts = [...pinnedAlerts, ...fallbacks].slice(0, 4);

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
