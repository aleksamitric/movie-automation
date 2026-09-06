import { SeriesCreateRequest, SeriesUpdateRequest } from '../models/series.model';

export function buildSeriesPayload(genreId: number): SeriesCreateRequest {
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  return {
    title: `Test Series ${uniqueSuffix}`,
    description: 'Automated test series.',
    year: 2020,
    seasons: 3,
    genreId: [genreId],
    director: 'Test Director',
    posterUrl: `https://placehold.co/300x450.jpg?text=${uniqueSuffix}`,
    landscapeUrl: `https://placehold.co/1280x720.jpg?text=${uniqueSuffix}`,
  };
}

export interface SeriesFormInput {
  title: string;
  releaseYear: string;
  seasons: string;
  director: string;
  genreName: string | null;
  description: string;
  posterUrl: string;
  landscapeUrl: string;
}

export function buildSeriesFormInput(genreName: string): SeriesFormInput {
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  return {
    title: `UI Test Series ${uniqueSuffix}`,
    releaseYear: '2020',
    seasons: '3',
    director: 'Test Director',
    genreName,
    description: 'Automated UI test series.',
    posterUrl: `https://placehold.co/300x450.jpg?text=${uniqueSuffix}`,
    landscapeUrl: `https://placehold.co/1280x720.jpg?text=${uniqueSuffix}`,
  };
}

export function buildSeriesUpdatePayload(genreId: number): SeriesUpdateRequest {
  const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  return {
    title: `Updated Test Series ${uniqueSuffix}`,
    description: 'Updated automated test series.',
    year: 2021,
    seasons: 4,
    genreId: [genreId],
    director: 'Updated Test Director',
    posterUrl: `https://placehold.co/300x450.jpg?text=${uniqueSuffix}`,
    landscapeUrl: `https://placehold.co/1280x720.jpg?text=${uniqueSuffix}`,
  };
}
