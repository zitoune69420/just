/**
 * En-têtes de cache des routes publiques adossées à TMDB.
 *
 * Le cache de données de Next évite déjà de redemander la même chose à TMDB,
 * mais il n'évite pas l'aller-retour réseau : chaque changement de genre ou de
 * page rappelle la route. Ces en-têtes laissent le navigateur resservir sa
 * propre copie, ce qui rend instantanés le retour arrière et la navigation
 * dans une grille déjà parcourue.
 *
 * `private` est délibéré : la langue vient d'un cookie, donc deux comptes
 * peuvent recevoir des réponses différentes pour une même adresse. Un cache
 * partagé les confondrait. `Vary: Cookie` verrouille la même chose côté
 * navigateur — changer de langue change le cookie, donc l'entrée en cache, et
 * la réponse est redemandée au lieu d'être resservie dans l'ancienne langue.
 */
export function cacheHeaders(seconds: number): Record<string, string> {
  return {
    "Cache-Control": `private, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`,
    Vary: "Cookie",
  };
}
