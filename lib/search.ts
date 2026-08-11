import type { Locale } from "./i18n/locales";
import type { Translate } from "./i18n/translate";
import { toMedia, toPerson } from "./media";
import {
  fallbackPrefix,
  relevance,
  RELEVANCE_FLOOR,
} from "./search-ranking";
import { searchMedia, searchPeople } from "./tmdb";
import type { Media, Person } from "./types";

export type SearchHit =
  | { kind: "media"; score: number; media: Media }
  | { kind: "person"; score: number; person: Person };

export interface UnifiedSearch {
  /** Films, séries et personnes mêlés, du plus pertinent au moins pertinent. */
  hits: SearchHit[];
  /**
   * Requête réellement utilisée quand celle qui a été tapée ne donnait rien.
   * `null` quand la recherche a abouti du premier coup — l'interface ne prévient
   * que si elle a corrigé quelque chose.
   */
  corrected: string | null;
  totalMedia: number;
  totalPeople: number;
}

export function hitKey(hit: SearchHit): string {
  return hit.kind === "media"
    ? `${hit.media.type}-${hit.media.id}`
    : `person-${hit.person.id}`;
}

export function hitLabel(hit: SearchHit): string {
  return hit.kind === "media" ? hit.media.title : hit.person.name;
}

interface Pass {
  hits: SearchHit[];
  totalMedia: number;
  totalPeople: number;
}

/**
 * Un aller-retour TMDB, scoré contre `ranked`.
 *
 * Les deux requêtes sont distinctes : `lookup` est ce qu'on envoie à TMDB,
 * `ranked` est ce que la personne a réellement tapé. Elles ne coïncident pas
 * lors du rattrapage sur préfixe, où l'on cherche « interste » mais où l'on
 * classe toujours contre « intersteller ».
 */
async function runPass(
  locale: Locale,
  t: Translate,
  lookup: string,
  ranked: string,
): Promise<Pass> {
  const [media, people] = await Promise.all([
    searchMedia(locale, lookup),
    searchPeople(locale, lookup),
  ]);

  const hits: SearchHit[] = [];

  for (const item of media.results) {
    const converted = toMedia(item);
    const score = relevance(ranked, converted.title, item.popularity);
    if (score < RELEVANCE_FLOOR) continue;
    hits.push({ kind: "media", score, media: converted });
  }

  for (const item of people.results) {
    if (!item.profile_path) continue;
    const score = relevance(ranked, item.name, item.popularity);
    if (score < RELEVANCE_FLOOR) continue;
    hits.push({ kind: "person", score, person: toPerson(item, t) });
  }

  hits.sort((a, b) => b.score - a.score);

  return {
    hits,
    totalMedia: media.total_results,
    totalPeople: people.total_results,
  };
}

/**
 * Recherche unique mêlant titres et personnes.
 *
 * Quand la requête ne renvoie rien d'assez proche, une seconde passe repart
 * d'un préfixe : les fautes de frappe se logent rarement dans les premières
 * lettres. Les résultats de ce rattrapage restent classés contre la requête
 * d'origine, sans quoi « interste » ferait remonter n'importe quel titre
 * commençant pareil.
 */
export async function unifiedSearch(
  locale: Locale,
  t: Translate,
  query: string,
): Promise<UnifiedSearch> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return { hits: [], corrected: null, totalMedia: 0, totalPeople: 0 };
  }

  const direct = await runPass(locale, t, trimmed, trimmed);
  if (direct.hits.length > 0) {
    return { ...direct, corrected: null };
  }

  const prefix = fallbackPrefix(trimmed);
  if (!prefix) {
    return { ...direct, corrected: null };
  }

  const retry = await runPass(locale, t, prefix, trimmed);
  if (retry.hits.length === 0) {
    return { ...direct, corrected: null };
  }

  return { ...retry, corrected: hitLabel(retry.hits[0]) };
}
