import { FilmCreateRequest, FilmUpdateRequest } from '../models/film.model';

export function buildFilmPayload(genreId: number): FilmCreateRequest {
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  return {
    title: `Test Film ${uniqueSuffix}`,
    description: 'Automated test film.',
    year: 2020,
    genreId: [genreId],
    director: 'Test Director',
    duration: 120,
    posterUrl: `https://placehold.co/300x450.jpg?text=${uniqueSuffix}`,
    landscapeUrl: `https://placehold.co/1280x720.jpg?text=${uniqueSuffix}`,
  };
}

export function buildFilmPayloadMissingTitle(genreId: number): Partial<FilmCreateRequest> {
  const payload: Partial<FilmCreateRequest> = { ...buildFilmPayload(genreId) };
  delete payload.title;
  return payload;
}

export interface MovieFormInput {
  title: string;
  releaseYear: string;
  duration: string;
  director: string;
  genreName: string | null;
  description: string;
  posterUrl: string;
  landscapeUrl: string;
}

export function buildMovieFormInput(genreName: string): MovieFormInput {
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  return {
    title: `UI Test Movie ${uniqueSuffix}`,
    releaseYear: '2020',
    duration: '120',
    director: 'Test Director',
    genreName,
    description: 'Automated UI test movie.',
    posterUrl: `https://placehold.co/300x450.jpg?text=${uniqueSuffix}`,
    landscapeUrl: `https://placehold.co/1280x720.jpg?text=${uniqueSuffix}`,
  };
}

export function buildMovieFormInputWithOverrides(genreName: string, overrides: Partial<MovieFormInput>): MovieFormInput {
  return { ...buildMovieFormInput(genreName), ...overrides };
}

export function buildFilmUpdatePayload(genreId: number): FilmUpdateRequest {
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  return {
    title: `Updated Test Film ${uniqueSuffix}`,
    description: 'Updated automated test film.',
    year: 2021,
    genreId: [genreId],
    director: 'Updated Test Director',
    duration: 130,
    posterUrl: `https://placehold.co/300x450.jpg?text=${uniqueSuffix}`,
    landscapeUrl: `https://placehold.co/1280x720.jpg?text=${uniqueSuffix}`,
  };
}
