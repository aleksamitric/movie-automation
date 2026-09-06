export interface CommentCreateFilmRequest {
  userId: number;
  filmId: number;
  text: string;
}

export interface CommentCreateSeriesRequest {
  userId: number;
  seriesId: number;
  text: string;
}

export interface CommentUpdateRequest {
  text: string;
}

export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  userId: number;
  username: string;
  filmId: number | null;
  seriesId: number | null;
}
