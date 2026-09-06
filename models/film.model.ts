import { Genre } from './genre.model';

export interface FilmCreateRequest {
  title: string;
  description: string;
  year: number;
  genreId: number[];
  director: string;
  duration: number;
  posterUrl: string;
  landscapeUrl: string;
}

export interface FilmUpdateRequest extends FilmCreateRequest {}

export interface Film {
  id: number;
  title: string;
  description: string;
  year: number;
  duration: number;
  director: string;
  posterUrl: string;
  landscapeUrl: string;
  createdAt: string;
  rating: number | null;
  genres: Genre[];
}

export interface FilmGenreGroup {
  genre: Genre;
  films: Film[];
}
