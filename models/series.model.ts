import { Genre } from './genre.model';

export interface SeriesCreateRequest {
  title: string;
  description: string;
  year: number;
  seasons: number;
  genreId: number[];
  director: string;
  posterUrl: string;
  landscapeUrl: string;
}

export interface SeriesUpdateRequest extends SeriesCreateRequest {}

export interface Series {
  id: number;
  title: string;
  description: string;
  year: number;
  seasons: number;
  director: string;
  posterUrl: string;
  landscapeUrl: string;
  createdAt: string;
  rating: number | null;
  genres: Genre[];
}

export interface SeriesGenreGroup {
  genre: Genre;
  series: Series[];
}
