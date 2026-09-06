export interface WatchlistAddRequest {
  userId: number;
  filmId: number | null;
  seriesId: number | null;
}

export interface WatchlistMarkWatchedRequest {
  watched: boolean;
}

export interface WatchlistItem {
  id: number;
  type: string;
  filmId: number | null;
  seriesId: number | null;
  title: string;
  year: number;
  duration: string | null;
  seasons: number | null;
  rating: number;
  votesText: string;
  description: string;
  director: string;
  stars: string[];
  posterUrl: string;
  watched: boolean;
  addedAt: string;
  genres: string[];
}
