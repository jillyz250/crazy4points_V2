import { CAPITAL_ONE_SHOPPING } from "./referrals";

export type PortalGroup = "flexible" | "airline";

export interface ShoppingPortal {
  name: string;
  /** What you earn — kept qualitative (rates vary by store + change often). */
  earns: string;
  note: string;
  url: string;
  /** True → our personal referral link (render rel="nofollow sponsored" + a tag). */
  referral?: boolean;
  group: PortalGroup;
  /** Brand-ish accent for the card rail. */
  accent: string;
}

// Single source of truth for the Shopping Portals page. Add a portal by adding
// one row. Referral rows use Jill's personal link; airline portals are the
// official public portals (no referral).
export const SHOPPING_PORTALS: ShoppingPortal[] = [
  {
    group: "flexible",
    name: "Rakuten",
    earns: "Cash back, or Amex Membership Rewards points",
    note: "Take your cash back as a check or PayPal, or send it to Amex points instead.",
    url: "https://www.rakuten.com/r/JC250E?eeid=28187",
    referral: true,
    accent: "#6B2D8F",
  },
  {
    group: "flexible",
    name: CAPITAL_ONE_SHOPPING.name,
    earns: "Cash back",
    note: "Free tool that auto-applies coupon codes and compares prices at checkout.",
    url: CAPITAL_ONE_SHOPPING.url,
    referral: true,
    accent: "#004977",
  },
  {
    group: "airline",
    name: "Southwest Rapid Rewards Shopping",
    earns: "Rapid Rewards points",
    note: "Earn Southwest points on online purchases at hundreds of stores.",
    url: "https://rapidrewardsshopping.southwest.com",
    accent: "#304CB2",
  },
  {
    group: "airline",
    name: "United MileagePlus Shopping",
    earns: "MileagePlus miles",
    note: "Earn United miles on online purchases at hundreds of stores.",
    url: "https://www.mileageplusshopping.com",
    accent: "#0033A0",
  },
  {
    group: "airline",
    name: "AAdvantage eShopping",
    earns: "AAdvantage miles",
    note: "Earn American miles on online purchases at hundreds of stores.",
    url: "https://www.aadvantageeshopping.com",
    accent: "#0078D2",
  },
  {
    group: "airline",
    name: "Delta SkyMiles Shopping",
    earns: "SkyMiles",
    note: "Earn Delta miles on online purchases at hundreds of stores.",
    url: "https://www.skymilesshopping.com",
    accent: "#9B1631",
  },
  {
    group: "airline",
    name: "Alaska Mileage Plan Shopping",
    earns: "Mileage Plan miles",
    note: "Earn Alaska miles on online purchases at hundreds of stores.",
    url: "https://www.mileageplanshopping.com",
    accent: "#01426A",
  },
];

export const PORTAL_GROUPS: { key: PortalGroup; label: string; blurb: string }[] = [
  { key: "flexible", label: "Cash & flexible points", blurb: "Shop through these and earn cash back you can keep or move to points." },
  { key: "airline", label: "Airline miles", blurb: "Log in with your frequent-flyer account and earn miles on everyday online shopping." },
];

// Curated "hot portal offers this week" — elevated rates worth calling out.
// Kept as a hand-vetted list (every rate verified before it goes in) rather
// than a scraper; the section auto-hides when empty. Add an entry when a real,
// current elevated offer is confirmed.
export interface HotPortalOffer {
  portal: string;
  store: string;
  /** Verified, current rate — qualitative is fine ("10x", "up to 15%"). */
  rate: string;
  earns: string;
  url: string;
  /** ISO date the offer ends, if known — used for an urgency pill. */
  ends?: string;
  referral?: boolean;
}
export const HOT_PORTAL_OFFERS: HotPortalOffer[] = [];

export const PORTAL_DISCLOSURE =
  'Rows marked "Referral" use our personal referral link and may earn us a reward when you sign up, at no cost to you. Portal earn rates change by store and over time, so check the portal for the current rate before you shop.';
