import { LOCALE_COOKIE, toLocale } from "./i18n/locales";

/**
 * Cache navigateur des réponses TMDB, dans `localStorage`.
 *
 * Le cache de données de Next évite déjà de redemander la même chose à TMDB, et
 * `cacheHeaders` laisse le navigateur resservir une réponse récente. Ni l'un ni
 * l'autre ne survit à la fermeture de l'onglet : rouvrir le site le lendemain
 * rappelle nos routes pour des données qui n'ont pas bougé. `localStorage` tient
 * entre les sessions, ce qui est exactement ce qui manquait.
 *
 * On n'y met que du public — catalogue, recherche, épisodes. Jamais de
 * progression, de listes ni rien qui dépende du compte : `localStorage` survit à
 * la déconnexion et serait lisible par le compte suivant sur la même machine.
 */

/** Changer ce numéro périme tout l'existant, utile si la forme des données bouge. */
const PREFIX = "just:cache:1:";

/** Trois jours : au-delà, une affiche ou un synopsis corrigé ne remonterait plus. */
export const CACHE_TTL = 3 * 24 * 60 * 60 * 1000;

const MAX_TTL = 4 * 24 * 60 * 60 * 1000;

interface Entry<T> {
  /** Date d'expiration, en millisecondes epoch. */
  e: number;
  d: T;
}

/**
 * La langue fait partie de la clé : titres et synopsis sont traduits, resservir
 * l'entrée d'une autre langue afficherait la page dans la mauvaise.
 */
function currentLocale(): string {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]*)`),
  );
  return toLocale(match ? decodeURIComponent(match[1]) : undefined);
}

function fullKey(key: string): string {
  return `${PREFIX}${currentLocale()}:${key}`;
}

/**
 * Fait de la place quand le quota est atteint : les entrées périmées d'abord,
 * et à défaut la moitié qui expire le plus tôt. Renvoie `false` quand il n'y
 * avait rien à libérer — inutile de retenter l'écriture dans ce cas.
 */
function evict(): boolean {
  const now = Date.now();
  const mine: { key: string; expires: number }[] = [];

  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      const entry = JSON.parse(localStorage.getItem(key) ?? "") as Entry<never>;
      mine.push({ key, expires: entry?.e ?? 0 });
    } catch {
      // Entrée illisible : à jeter comme une périmée.
      mine.push({ key, expires: 0 });
    }
  }

  const stale = mine.filter((item) => item.expires < now);
  const doomed =
    stale.length > 0
      ? stale
      : mine
          .sort((a, b) => a.expires - b.expires)
          .slice(0, Math.ceil(mine.length / 2));

  for (const item of doomed) localStorage.removeItem(item.key);

  return doomed.length > 0;
}

export function readCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;

  try {
    const full = fullKey(key);
    const raw = localStorage.getItem(full);
    if (!raw) return null;

    const entry = JSON.parse(raw) as Entry<T>;
    if (typeof entry?.e !== "number" || entry.e <= Date.now()) {
      localStorage.removeItem(full);
      return null;
    }

    return entry.d;
  } catch {
    // Navigation privée, stockage désactivé, JSON corrompu : on refetch.
    return null;
  }
}

export function writeCache(
  key: string,
  value: unknown,
  ttlMs: number = CACHE_TTL,
): void {
  if (typeof window === "undefined") return;

  const entry: Entry<unknown> = {
    e: Date.now() + Math.min(ttlMs, MAX_TTL),
    d: value,
  };
  const raw = JSON.stringify(entry);

  try {
    localStorage.setItem(fullKey(key), raw);
  } catch {
    // Quota dépassé, seul échec qu'on sache traiter. Une seule reprise : si
    // elle échoue aussi, se passer de cache vaut mieux que vider le stockage.
    try {
      if (evict()) localStorage.setItem(fullKey(key), raw);
    } catch {}
  }
}
