import { INTL_LOCALE, type Locale } from "./i18n/locales";
import { plural, type MessageKey, type Translate } from "./i18n/translate";
import type {
  Episode,
  Media,
  MediaDetails,
  MediaType,
  Person,
  PersonDetails,
  Season,
  TmdbCastMember,
  TmdbEpisode,
  TmdbListItem,
  TmdbMovieDetails,
  TmdbPersonDetails,
  TmdbPersonCredit,
  TmdbPersonListItem,
  TmdbSeasonSummary,
  TmdbTvDetails,
  TmdbVideo,
  TmdbWatchCountry,
  WatchInfo,
  WatchOfferKind,
} from "./types";

const IMAGE_BASE = "https://image.tmdb.org/t/p";

type TmdbImageSize =
  | "w185"
  | "w300"
  | "w342"
  | "w500"
  | "w780"
  | "w1280"
  | "original";

export function tmdbImage(path: string, size: TmdbImageSize): string {
  return `${IMAGE_BASE}/${size}${path}`;
}

export interface FormatContext {
  locale: Locale;
  t: Translate;
}

function formatDate(date: string | undefined | null, locale: Locale): string | null {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: "long",
  }).format(parsed);
}

/**
 * Une date absente vaut « sortie » : TMDB en manque souvent sur les titres
 * anciens ou confidentiels, et il vaut mieux laisser lire que bloquer à tort.
 */
export function isReleased(date: string | undefined | null): boolean {
  if (!date) return true;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now();
}

function formatRuntime(minutes: number | null, t: Translate): string | null {
  if (!minutes) return null;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return t("media.runtimeMinutes", { minutes: remaining });
  return t("media.runtime", {
    hours,
    minutes: String(remaining).padStart(2, "0"),
  });
}

export function toMedia(item: TmdbListItem, fallbackType?: MediaType): Media {
  const isMovie = "title" in item;
  const date = isMovie ? item.release_date : item.first_air_date;
  return {
    id: item.id,
    type: item.media_type ?? fallbackType ?? (isMovie ? "movie" : "tv"),
    title: isMovie ? item.title : item.name,
    year: date ? date.slice(0, 4) : null,
    overview: item.overview,
    poster: item.poster_path,
    backdrop: item.backdrop_path,
    rating: item.vote_average,
    votes: item.vote_count,
  };
}

function pickTrailer(videos: TmdbVideo[]): string | null {
  const youtube = videos.filter((video) => video.site === "YouTube");
  const best =
    youtube.find((video) => video.type === "Trailer" && video.official) ??
    youtube.find((video) => video.type === "Trailer") ??
    youtube.find((video) => video.type === "Teaser") ??
    youtube[0];
  return best?.key ?? null;
}

function toCast(cast: TmdbCastMember[]) {
  return cast.slice(0, 12).map((member) => ({
    id: member.id,
    name: member.name,
    character: member.character,
    profile: member.profile_path,
  }));
}

function toRecommendations(
  items: TmdbListItem[],
  fallbackType: MediaType,
): Media[] {
  return items
    .filter((item) => item.poster_path)
    .slice(0, 12)
    .map((item) => toMedia(item, fallbackType));
}

export const WATCH_REGION = "FR";

const OFFER_KINDS: WatchOfferKind[] = [
  "flatrate",
  "free",
  "ads",
  "rent",
  "buy",
];

function toWatchInfo(
  results: Record<string, TmdbWatchCountry | undefined> | undefined,
): WatchInfo | null {
  const country = results?.[WATCH_REGION];
  if (!country) return null;

  const offers = OFFER_KINDS.flatMap((kind) => {
    const providers = country[kind];
    if (!providers?.length) return [];
    return [
      {
        kind,
        providers: providers
          .toSorted((a, b) => a.display_priority - b.display_priority)
          .map((provider) => ({
            id: provider.provider_id,
            name: provider.provider_name,
            logo: provider.logo_path,
          })),
      },
    ];
  });

  return offers.length > 0 ? { link: country.link, offers } : null;
}

function toSeasons(seasons: TmdbSeasonSummary[]): Season[] {
  return seasons
    .filter((season) => season.season_number > 0 && season.episode_count > 0)
    .map((season) => ({
      number: season.season_number,
      name: season.name,
      episodeCount: season.episode_count,
    }));
}

export function toEpisode(episode: TmdbEpisode, ctx: FormatContext): Episode {
  const facts = [
    formatDate(episode.air_date, ctx.locale),
    formatRuntime(episode.runtime, ctx.t),
  ].filter((fact): fact is string => fact !== null);

  return {
    number: episode.episode_number,
    title: episode.name,
    overview: episode.overview,
    still: episode.still_path,
    facts,
    rating: episode.vote_average,
    runtime: episode.runtime,
    released: isReleased(episode.air_date),
  };
}

/** Départements TMDB (toujours en anglais) vers les clés de traduction. */
const DEPARTMENT_KEYS: Record<string, MessageKey> = {
  Acting: "person.department.Acting",
  Directing: "person.department.Directing",
  Writing: "person.department.Writing",
  Production: "person.department.Production",
  Sound: "person.department.Sound",
  Camera: "person.department.Camera",
  Editing: "person.department.Editing",
  Art: "person.department.Art",
  "Costume & Make-Up": "person.department.CostumeMakeUp",
  "Visual Effects": "person.department.VisualEffects",
  Crew: "person.department.Crew",
};

function departmentLabel(department: string | null, t: Translate): string | null {
  if (!department) return null;
  const key = DEPARTMENT_KEYS[department];
  return key ? t(key) : department;
}

function creditToMedia(credit: TmdbPersonCredit): Media {
  const isMovie = credit.media_type === "movie";
  const date = isMovie ? credit.release_date : credit.first_air_date;
  return {
    id: credit.id,
    type: credit.media_type,
    title: (isMovie ? credit.title : credit.name) ?? "—",
    year: date ? date.slice(0, 4) : null,
    overview: credit.overview,
    poster: credit.poster_path,
    backdrop: credit.backdrop_path,
    rating: credit.vote_average,
    votes: credit.vote_count,
    role: credit.character || credit.job || undefined,
  };
}

/** Un même titre peut revenir plusieurs fois (rôles ou postes multiples). */
function dedupeCredits(credits: TmdbPersonCredit[]): Media[] {
  const seen = new Map<string, Media>();
  for (const credit of credits) {
    const key = `${credit.media_type}:${credit.id}`;
    if (!seen.has(key)) seen.set(key, creditToMedia(credit));
  }
  return [...seen.values()];
}

function byYearDesc(a: Media, b: Media): number {
  return Number(b.year ?? 0) - Number(a.year ?? 0);
}

export function toPerson(item: TmdbPersonListItem, t: Translate): Person {
  return {
    id: item.id,
    name: item.name,
    profile: item.profile_path,
    department: departmentLabel(item.known_for_department ?? null, t),
  };
}

const KNOWN_FOR_COUNT = 12;

export function toPersonDetails(
  details: TmdbPersonDetails,
  ctx: FormatContext,
): PersonDetails {
  const cast = dedupeCredits(details.combined_credits?.cast ?? []);
  const crew = dedupeCredits(details.combined_credits?.crew ?? []);

  const facts = [
    departmentLabel(details.known_for_department, ctx.t),
    formatDate(details.birthday, ctx.locale),
    details.deathday ? `† ${formatDate(details.deathday, ctx.locale)}` : null,
    details.place_of_birth,
  ].filter((fact): fact is string => Boolean(fact));

  return {
    id: details.id,
    name: details.name,
    profile: details.profile_path,
    department: departmentLabel(details.known_for_department, ctx.t),
    biography: details.biography,
    facts,
    known: cast
      .filter((media) => media.poster)
      .toSorted((a, b) => b.votes - a.votes)
      .slice(0, KNOWN_FOR_COUNT),
    filmography: cast.toSorted(byYearDesc),
    crew: crew.toSorted(byYearDesc),
  };
}

export function toMovieDetails(
  details: TmdbMovieDetails,
  ctx: FormatContext,
): MediaDetails {
  const facts = [
    formatDate(details.release_date, ctx.locale),
    formatRuntime(details.runtime, ctx.t),
  ].filter((fact): fact is string => fact !== null);

  return {
    ...toMedia(details, "movie"),
    genres: details.genres,
    released: isReleased(details.release_date),
    releaseDate: formatDate(details.release_date, ctx.locale),
    originalTitle: details.original_title,
    tagline: details.tagline || null,
    facts,
    trailerKey: pickTrailer(details.videos.results),
    cast: toCast(details.credits.cast),
    recommendations: toRecommendations(details.recommendations.results, "movie"),
    watch: toWatchInfo(details["watch/providers"]?.results),
    seasons: [],
    runtime: details.runtime,
  };
}

export function toTvDetails(
  details: TmdbTvDetails,
  ctx: FormatContext,
): MediaDetails {
  const facts = [
    formatDate(details.first_air_date, ctx.locale),
    details.number_of_seasons > 0
      ? plural(ctx.t, "media.seasonCount", details.number_of_seasons)
      : null,
    details.number_of_episodes > 0
      ? plural(ctx.t, "media.episodeCount", details.number_of_episodes)
      : null,
  ].filter((fact): fact is string => fact !== null);

  return {
    ...toMedia(details, "tv"),
    genres: details.genres,
    released: isReleased(details.first_air_date),
    releaseDate: formatDate(details.first_air_date, ctx.locale),
    originalTitle: details.original_name,
    tagline: details.tagline || null,
    facts,
    trailerKey: pickTrailer(details.videos.results),
    cast: toCast(details.credits.cast),
    recommendations: toRecommendations(details.recommendations.results, "tv"),
    watch: toWatchInfo(details["watch/providers"]?.results),
    seasons: toSeasons(details.seasons ?? []),
    runtime: null,
  };
}
