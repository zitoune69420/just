
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

export interface TmdbWatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface TmdbWatchCountry {
  link: string;
  flatrate?: TmdbWatchProvider[];
  free?: TmdbWatchProvider[];
  ads?: TmdbWatchProvider[];
  rent?: TmdbWatchProvider[];
  buy?: TmdbWatchProvider[];
}

interface TmdbDetailsBase extends TmdbListItemBase {
  genres: TmdbGenre[];
  tagline: string | null;
  videos: { results: TmdbVideo[] };
  credits: { cast: TmdbCastMember[] };
  recommendations: TmdbPaginated<TmdbListItem>;
  "watch/providers"?: {
    results?: Record<string, TmdbWatchCountry | undefined>;
  };
}

export interface TmdbMovieDetails extends TmdbDetailsBase {
  title: string;
  original_title: string;
  release_date?: string;
  runtime: number | null;
}

export interface TmdbSeasonSummary {
  season_number: number;
  name: string;
  episode_count: number;
}

export interface TmdbEpisode {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date?: string;
  runtime: number | null;
  vote_average: number;
}

export interface TmdbSeasonDetails {
  season_number: number;
  name: string;
  episodes: TmdbEpisode[];
}

export interface TmdbTvDetails extends TmdbDetailsBase {
  name: string;
  original_name: string;
  first_air_date?: string;
  number_of_seasons: number;
  number_of_episodes: number;
  seasons: TmdbSeasonSummary[];
}

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

export type WatchOfferKind = "flatrate" | "free" | "ads" | "rent" | "buy";

export interface WatchProvider {
  id: number;
  name: string;
  logo: string;
}

export interface WatchOffer {
  kind: WatchOfferKind;
  providers: WatchProvider[];
}

export interface WatchInfo {
  link: string;
  offers: WatchOffer[];
}

export interface Season {
  number: number;
  name: string;
  episodeCount: number;
}

export interface Episode {
  number: number;
  title: string;
  overview: string;
  still: string | null;
  facts: string[];
  rating: number;
}

export interface MediaDetails extends Media {
  genres: TmdbGenre[];
  originalTitle: string;
  tagline: string | null;
  facts: string[];
  trailerKey: string | null;
  cast: CastMember[];
  recommendations: Media[];
  watch: WatchInfo | null;
  seasons: Season[];
}
