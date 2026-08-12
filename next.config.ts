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
    /**
     * `fullscreen=*` est nécessaire, pas laxiste : sans mention explicite la
     * fonctionnalité retombe sur son défaut `self`, et une iframe d'origine
     * tierce — le lecteur — ne peut alors jamais recevoir la délégation, quoi
     * qu'on écrive dans son attribut `allow`.
     *
     * Ce n'est pas une autorisation accordée à tout le monde : l'en-tête
     * autorise seulement la délégation, c'est l'attribut `allow` de chaque
     * iframe qui décide réellement qui en profite.
     */
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), browsing-topics=(), fullscreen=*",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  /**
   * Profils propres au projet, pour les données TMDB qui ne bougent
   * pratiquement jamais : la liste des genres, une fiche de personne, les
   * épisodes d'une saison déjà diffusée. Les profils intégrés s'arrêtent à
   * `days`, ce qui fait redemander chaque jour des réponses identiques sur une
   * clé d'API facturée.
   */
  cacheLife: {
    /** Référentiel quasi figé : genres, biographies. */
    reference: {
      stale: 60 * 60 * 24 * 7,
      revalidate: 60 * 60 * 24 * 7,
      expire: 60 * 60 * 24 * 30,
    },
  },
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
      {
        /**
         * Seule route de l'application faite pour vivre dans une iframe : c'est
         * elle que le lecteur charge. La règle générale ci-dessus lui collait
         * `frame-ancestors 'none'` et `X-Frame-Options: DENY`, ce qui revenait à
         * interdire au navigateur d'afficher notre propre lecteur.
         *
         * On ne lève pas la protection, on la resserre sur la bonne cible :
         * `self` autorise nos pages à l'encadrer et personne d'autre.
         */
        source: "/api/stream",
        headers: [
          ...SECURITY_HEADERS,
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/register", destination: "/login", permanent: false },
      /**
       * `/movies` et `/series` ont fusionné sous une seule entrée de
       * navigation. Les adresses partagées avant la fusion restent valides.
       */
      { source: "/movies", destination: "/catalog", permanent: true },
      { source: "/series", destination: "/catalog?type=tv", permanent: true },
      /**
       * Le type a quitté le chemin pour la requête : la bascule ne navigue plus,
       * elle ne recharge que la grille. Les adresses de l'époque restent valides.
       */
      { source: "/catalog/movies", destination: "/catalog", permanent: true },
      {
        source: "/catalog/series",
        destination: "/catalog?type=tv",
        permanent: true,
      },
    ];
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
