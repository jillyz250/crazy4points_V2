/**
 * Referral / affiliate links surfaced across the site. Single source of truth
 * so the same link + disclosure is used everywhere (footer, homepage callout,
 * newsletter). Referral links must render with rel="nofollow sponsored".
 */
export const CAPITAL_ONE_SHOPPING = {
  name: "Capital One Shopping",
  url: "https://capitaloneshopping.com/r/fbb06dea-66ec-4402-b5bd-5419fc2e5e36",
  /** Modest, accurate description of the free tool. */
  blurb:
    "A free tool that automatically finds coupon codes and compares prices while you check out online.",
  disclosure: "Referral link. We may earn a reward when you sign up, at no cost to you.",
} as const;
