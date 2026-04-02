export type AlertColor = "red" | "orange" | "yellow" | "green" | "purple" | "blue";
export type AlertTag = "Live Today" | "Expires Soon" | "Devaluation" | "New Deal" | "Sweet Spot" | "Watch";

export interface DailyAlert {
  id: string;
  color: AlertColor;
  tag: AlertTag;
  title: string;
  deadline: string;
  href?: string;
}

// Update this date each day (ISO format: YYYY-MM-DD)
export const ALERTS_DATE = "2026-04-02";

// Update this array each day with the top 3–4 alerts from the daily brief
export const dailyAlerts: DailyAlert[] = [
  {
    id: "united-earn-devaluation",
    color: "red",
    tag: "Live Today",
    title: "United MileagePlus non-cardholder earn drops to 3 MPD — effective now",
    deadline: "🚨 Live as of April 2, 2026",
    href: "/tools/transfer-bonus-tracker",
  },
  {
    id: "capital-one-venture-offer",
    color: "red",
    tag: "Expires Soon",
    title: "Capital One Venture: 75,000 miles + $250 travel credit — limited-time offer",
    deadline: "⏰ Expires April 13, 2026 — 11 days left",
    href: "/tools/transfer-bonus-tracker",
  },
  {
    id: "citi-transfer-rate-cut",
    color: "orange",
    tag: "Devaluation",
    title: "Citi ThankYou cuts transfer rates: Choice Privileges −25%, iPrefer −50% on April 19",
    deadline: "⏰ Current rates expire April 18, 2026 — 16 days left",
    href: "/tools/transfer-bonus-tracker",
  },
  {
    id: "citi-virgin-avianca-bonus",
    color: "orange",
    tag: "Expires Soon",
    title: "Citi ThankYou: 30% bonus to Virgin Atlantic + 25% bonus to Avianca LifeMiles",
    deadline: "⏳ Both bonuses expire April 18, 2026",
    href: "/tools/transfer-bonus-tracker",
  },
];
