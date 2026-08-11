import type { NextConfig } from "next";

/**
 * En-têtes appliqués à toutes les réponses.
 *
 * La CSP se limite ici à `frame-ancestors` : elle empêche l'encadrement de
 * l'application (donc le détournement de clic sur les écrans d'administration)
 * sans risquer de casser les scripts et styles en ligne générés par Next. Une
 * CSP complète demande un nonce propagé depuis le proxy, à traiter à part.
 */
const SECURITY_HEADERS = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        /**
         * Le jeton de réinitialisation voyage dans l'URL : aucun `Referer` ne
         * doit sortir de cette page, même vers notre propre origine.
         */
        source: "/reset-password",
        headers: [
          ...SECURITY_HEADERS,
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
  async redirects() {
    return [{ source: "/register", destination: "/login", permanent: false }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;
