import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieBanner from "@/components/layout/CookieBanner";
import { createAdminClient } from "@/utils/supabase/server";
import { getResourceNavCounts } from "@/utils/supabase/queries";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createAdminClient();
  const resourceCounts = await getResourceNavCounts(supabase).catch(() => ({
    airline: 0,
    hotel: 0,
    alliance: 0,
    credit_card: 0,
  }));

  return (
    <>
      <Header resourceCounts={resourceCounts} />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
}
