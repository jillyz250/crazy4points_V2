import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // Underscore -> kebab-case slug migration (programs.slug normalization).
      // Permanent (308) so any inbound links / indexed URLs keep their SEO juice
      // when transferred to the new path.
      { source: '/programs/air_france', destination: '/programs/air-france', permanent: true },
      { source: '/programs/flying_blue', destination: '/programs/flying-blue', permanent: true },
    ]
  },
};

export default nextConfig;
