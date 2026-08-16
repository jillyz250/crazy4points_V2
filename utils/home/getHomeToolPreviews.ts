import type { SupabaseClient } from "@supabase/supabase-js";

export type DestPreview = { title: string; country: string | null; vibe: string | null; image_url: string };
export type CardPreview = { name: string; network: string | null; issuer: string; currency: string | null };

/**
 * Real preview data for the homepage tool showcase blocks:
 *  - 3 photographed destinations (Decision Engine block), skipping high travel
 *    advisories, deduped by country for variety.
 *  - 3 recognizable transferable-points cards from 3 different issuers
 *    (Card Explorer block).
 * No fabricated numbers — destinations carry no single points figure, so the
 * block shows the destination + vibe, not an invented cost.
 */
export async function getHomeToolPreviews(
  supabase: SupabaseClient,
): Promise<{ destinations: DestPreview[]; cards: CardPreview[] }> {
  const [dRes, cRes] = await Promise.all([
    supabase
      .from("destinations")
      .select("title, country, vibe, image_url, advisory_level, summary_short")
      .not("image_url", "is", null)
      .limit(60),
    supabase
      .from("credit_cards")
      .select("name, network, annual_fee_usd, issuer:issuers!issuer_id(name), currency:programs!currency_program_id(name)")
      .eq("is_active", true)
      .not("currency_program_id", "is", null)
      .order("annual_fee_usd", { ascending: false, nullsFirst: false })
      .limit(30),
  ]);

  const seenCountry = new Set<string>();
  const destinations: DestPreview[] = [];
  for (const d of (dRes.data ?? []) as Array<Record<string, unknown>>) {
    const lvl = d.advisory_level as number | null;
    if (lvl != null && lvl >= 3) continue;
    if (!d.summary_short) continue;
    const country = (d.country as string) ?? null;
    if (country && seenCountry.has(country)) continue;
    if (country) seenCountry.add(country);
    destinations.push({ title: d.title as string, country, vibe: (d.vibe as string) ?? null, image_url: d.image_url as string });
    if (destinations.length >= 3) break;
  }

  const seenIssuer = new Set<string>();
  const cards: CardPreview[] = [];
  for (const c of (cRes.data ?? []) as Array<Record<string, unknown>>) {
    const issuer = (c.issuer as { name?: string } | null)?.name;
    if (!issuer || seenIssuer.has(issuer)) continue;
    seenIssuer.add(issuer);
    cards.push({
      name: c.name as string,
      network: (c.network as string) ?? null,
      issuer,
      currency: (c.currency as { name?: string } | null)?.name ?? null,
    });
    if (cards.length >= 3) break;
  }

  return { destinations, cards };
}
