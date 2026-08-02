/** Formes brutes renvoyées par l'API TMDB (sous-ensemble utilisé par l'app). */

export type MediaType = "movie" | "tv";

export interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbListItemBase {
  id: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
}

export interface TmdbMovieListItem extends TmdbListItemBase {
  media_type?: "movie";
  title: string;
  release_date?: string;
}

export interface TmdbTvListItem extends TmdbListItemBase {
  media_type?: "tv";
  name: string;
  first_air_date?: string;
}

export type TmdbListItem = TmdbMovieListItem | TmdbTvListItem;

export interface TmdbPaginated<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

interface TmdbDetailsBase extends TmdbListItemBase {
  genres: TmdbGenre[];
  tagline: string | null;
  videos: { results: TmdbVideo[] };
  credits: { cast: TmdbCastMember[] };
  recommendations: TmdbPaginated<TmdbListItem>;
}

export interface TmdbMovieDetails extends TmdbDetailsBase {
  title: string;
  release_date?: string;
  runtime: number | null;
}

export interface TmdbTvDetails extends TmdbDetailsBase {
  name: string;
  first_air_date?: string;
  number_of_seasons: number;
  number_of_episodes: number;
}

/** Formes normalisées consommées par les composants UI. */

export interface Media {
  id: number;
  type: MediaType;
  title: string;
  year: string | null;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  rating: number;
  votes: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile: string | null;
}

export interface MediaDetails extends Media {
  genres: TmdbGenre[];
  tagline: string | null;
  /** Métadonnées affichables, ex. ["12 juin 2024", "2 h 15"] ou ["3 saisons", "24 épisodes"]. */
  facts: string[];
  trailerKey: string | null;
  cast: CastMember[];
  recommendations: Media[];
}
