/**
 * Classement de recherche, sans dépendance : utilisable côté serveur comme
 * côté client, et testable sans réseau.
 *
 * TMDB ne renvoie pas de score comparable entre `/search/multi` et
 * `/search/person` : un film et une personne arrivent de deux appels distincts,
 * chacun trié dans son coin. Pour les mêler dans une seule liste il faut un
 * score maison, calculé sur des données que les deux partagent — le libellé et
 * la popularité.
 */

/** Minuscules, sans accents, ponctuation réduite à des espaces. */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

/**
 * Distance de Levenshtein, bornée : au-delà de `limit` la valeur exacte
 * n'intéresse personne, on s'arrête. Deux lignes de tampon suffisent, la
 * matrice complète serait du gaspillage.
 */
export function editDistance(a: string, b: string, limit = 8): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  let current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let best = current[0];

    for (let j = 1; j <= b.length; j += 1) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, substitution);
      if (current[j] < best) best = current[j];
    }

    // Toute la ligne dépasse déjà la borne : les suivantes ne redescendront pas.
    if (best > limit) return limit + 1;

    const swap = previous;
    previous = current;
    current = swap;
  }

  return previous[b.length];
}

/**
 * Ressemblance entre une requête et un libellé, entre 0 et 1.
 *
 * Trois cas se cumulent mal et sont donc traités séparément, du plus fort au
 * plus faible : le libellé commence par la requête (frappe en cours), un de ses
 * mots commence par la requête (« nolan » dans « Christopher Nolan »), ou il
 * faut tolérer des fautes et mesurer la distance.
 */
export function similarity(query: string, label: string): number {
  const q = normalize(query);
  const l = normalize(label);
  if (q.length === 0 || l.length === 0) return 0;
  if (q === l) return 1;

  if (l.startsWith(q)) {
    // D'autant meilleur que la requête couvre le libellé.
    return 0.9 + 0.1 * (q.length / l.length);
  }

  if (l.split(" ").some((word) => word.startsWith(q))) return 0.85;

  if (l.includes(q)) return 0.8;

  const distance = editDistance(q, l);
  const longest = Math.max(q.length, l.length);
  const ratio = 1 - distance / longest;

  /**
   * Sur une requête courte, une faute pèse énormément dans le ratio : « ete »
   * contre « été » tomberait sous le plancher. On ne retient donc la distance
   * que si elle reste petite dans l'absolu.
   */
  const tolerance = q.length <= 4 ? 1 : q.length <= 8 ? 2 : 3;
  if (distance <= tolerance) return Math.max(ratio, 0.7);

  return Math.max(ratio, 0);
}

/**
 * Popularité TMDB ramenée entre 0 et 1. L'échelle brute est très étalée
 * (quelques titres à plusieurs centaines, la masse sous 10) : le logarithme
 * évite qu'une poignée de blockbusters écrase tout le reste.
 */
export function popularityScore(popularity: number | undefined): number {
  if (!popularity || popularity <= 0) return 0;
  return Math.min(Math.log10(popularity + 1) / 3, 1);
}

/** Poids de la ressemblance face à la popularité dans le score final. */
const SIMILARITY_WEIGHT = 0.75;

/**
 * En dessous, le résultat n'a plus de rapport visible avec ce qui a été tapé :
 * mieux vaut ne rien montrer qu'un titre au hasard.
 */
export const RELEVANCE_FLOOR = 0.34;

export function relevance(
  query: string,
  label: string,
  popularity: number | undefined,
): number {
  return (
    SIMILARITY_WEIGHT * similarity(query, label) +
    (1 - SIMILARITY_WEIGHT) * popularityScore(popularity)
  );
}

/**
 * Requête raccourcie servant de seconde chance quand la première ne donne
 * rien. Les fautes de frappe se logent rarement dans les premières lettres :
 * en n'en gardant qu'un préfixe, on retombe souvent sur le bon titre, qu'on
 * reclasse ensuite contre la requête entière.
 *
 * `null` quand la requête est trop courte pour qu'un préfixe veuille dire
 * quelque chose.
 */
export function fallbackPrefix(query: string): string | null {
  const trimmed = query.trim();
  if (trimmed.length < 6) return null;
  const length = Math.max(4, Math.ceil(trimmed.length * 0.6));
  if (length >= trimmed.length) return null;
  return trimmed.slice(0, length);
}
