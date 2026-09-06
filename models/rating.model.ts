export interface RatingCreateFilmRequest {
  userId: number;
  filmId: number;
  value: number;
}

export interface RatingCreateSeriesRequest {
  userId: number;
  seriesId: number;
  value: number;
}

export interface RatingUpdateRequest {
  value: number;
}

export interface Rating {
  id: number;
  userId: number;
  filmId: number | null;
  seriesId: number | null;
  value: number;
}
