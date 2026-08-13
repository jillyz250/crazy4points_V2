import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Underscore -> kebab-case slug migration (programs.slug normalization).
      // Permanent (308) so any inbound links / indexed URLs keep their SEO juice
      // when transferred to the new path.
      { source: '/programs/air_france', destination: '/programs/air-france', permanent: true },
      { source: '/programs/flying_blue', destination: '/programs/flying-blue', permanent: true },
      // Migration 276 — second batch of underscore -> kebab renames.
      { source: '/programs/bank_of_america', destination: '/programs/bank-of-america', permanent: true },
      { source: '/programs/capital_one', destination: '/programs/capital-one', permanent: true },
      { source: '/programs/wells_fargo', destination: '/programs/wells-fargo', permanent: true },
      { source: '/programs/aleutian_airways', destination: '/programs/aleutian-airways', permanent: true },
      { source: '/programs/cape_air', destination: '/programs/cape-air', permanent: true },
      { source: '/programs/contour_airlines', destination: '/programs/contour-airlines', permanent: true },
      { source: '/programs/hainan_airlines', destination: '/programs/hainan-airlines', permanent: true },
      { source: '/programs/kenmore_air', destination: '/programs/kenmore-air', permanent: true },
      { source: '/programs/mokulele_airlines', destination: '/programs/mokulele-airlines', permanent: true },
      { source: '/programs/oman_air', destination: '/programs/oman-air', permanent: true },
      { source: '/programs/porter_airlines', destination: '/programs/porter-airlines', permanent: true },
      { source: '/programs/southern_airways_express', destination: '/programs/southern-airways-express', permanent: true },
      { source: '/programs/bahia_principe', destination: '/programs/bahia-principe', permanent: true },
      { source: '/programs/best_western', destination: '/programs/best-western', permanent: true },
      { source: '/programs/club_med', destination: '/programs/club-med', permanent: true },
      { source: '/programs/disney_vacation_club', destination: '/programs/disney-vacation-club', permanent: true },
      { source: '/programs/gha_discovery', destination: '/programs/gha-discovery', permanent: true },
      { source: '/programs/leading_hotels', destination: '/programs/leading-hotels', permanent: true },
      { source: '/programs/radisson_americas', destination: '/programs/radisson-americas', permanent: true },
      { source: '/programs/shangri_la', destination: '/programs/shangri-la', permanent: true },
      { source: '/programs/expedia_one_key', destination: '/programs/expedia-one-key', permanent: true },
      { source: '/programs/star_alliance', destination: '/programs/star-alliance', permanent: true },
      { source: '/cards/hilton-honors-aspire', destination: '/cards/amex-hilton-honors-aspire', permanent: true },
      // Guide slug rename: "how-to-transfer-points" oversold a step-by-step it
      // is not; renamed to the explainer it actually is.
      { source: '/guides/how-to-transfer-points', destination: '/guides/how-points-transfers-work', permanent: true },
    ]
  },
};

export default nextConfig;
