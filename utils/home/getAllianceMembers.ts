import type { SupabaseClient } from "@supabase/supabase-js";

// Clean airline display names keyed by the member program_slug used in
// programs.member_programs. Membership itself comes from the DB (source of
// truth); this map only tidies the labels (the stored names are loyalty-program
// style, e.g. "American AAdvantage", and some slugs don't resolve at all).
const AIRLINE_NAMES: Record<string, string> = {
  // oneworld
  atmos: "Alaska Airlines", aa: "American Airlines", "ba-avios": "British Airways",
  cathay: "Cathay Pacific", "fiji-airways": "Fiji Airways", finnair: "Finnair",
  iberia: "Iberia", jal: "Japan Airlines", malaysia: "Malaysia Airlines",
  "oman-air": "Oman Air", qantas: "Qantas", qatar: "Qatar Airways",
  "royal-air-maroc": "Royal Air Maroc", "royal-jordanian": "Royal Jordanian", srilankan: "SriLankan Airlines",
  // SkyTeam
  aerolineas: "Aerolineas Argentinas", aeromexico: "Aeromexico", air_europa: "Air Europa",
  "air-france": "Air France", china_airlines: "China Airlines", china_eastern: "China Eastern",
  delta: "Delta Air Lines", garuda: "Garuda Indonesia", kenya_airways: "Kenya Airways",
  klm: "KLM", korean_air: "Korean Air", mea: "Middle East Airlines", sas: "SAS",
  saudia: "Saudia", tarom: "TAROM", vietnam_airlines: "Vietnam Airlines",
  "virgin-atlantic": "Virgin Atlantic", xiamen: "Xiamen Airlines",
  // Star Alliance
  aegean: "Aegean Airlines", "air-canada": "Air Canada", air_china: "Air China",
  air_india: "Air India", air_new_zealand: "Air New Zealand", ana: "ANA",
  asiana: "Asiana Airlines", austrian: "Austrian Airlines", avianca: "Avianca",
  brussels: "Brussels Airlines", copa: "Copa Airlines", croatia: "Croatia Airlines",
  egyptair: "EgyptAir", ethiopian: "Ethiopian Airlines", eva_air: "EVA Air",
  ita: "ITA Airways", lot: "LOT Polish Airlines", lufthansa: "Lufthansa",
  shenzhen: "Shenzhen Airlines", singapore_airlines: "Singapore Airlines", saa: "South African Airways",
  swiss: "SWISS", tap: "TAP Air Portugal", thai: "Thai Airways",
  turkish_airlines: "Turkish Airlines", united: "United Airlines",
};

function cleanName(slug: string): string {
  return AIRLINE_NAMES[slug] ?? slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Member airline names per alliance slug, sorted A–Z. Membership from the DB. */
export async function getAllianceMembers(supabase: SupabaseClient): Promise<Record<string, string[]>> {
  const { data } = await supabase.from("programs").select("slug, member_programs").eq("type", "alliance");
  const out: Record<string, string[]> = {};
  for (const a of (data ?? []) as Array<{ slug: string; member_programs: Array<{ program_slug?: string }> | null }>) {
    const names = (a.member_programs ?? [])
      .map((m) => (m.program_slug ? cleanName(m.program_slug) : null))
      .filter((n): n is string => !!n);
    out[a.slug] = Array.from(new Set(names)).sort((x, y) => x.localeCompare(y));
  }
  return out;
}
