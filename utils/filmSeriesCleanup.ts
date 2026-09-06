import { expect } from '@playwright/test';
import { FilmsApi } from '../api/films.api';
import { SeriesApi } from '../api/series.api';
import { Film } from '../models/film.model';
import { Series } from '../models/series.model';

export async function deleteFilmSafely(filmsApi: FilmsApi, id: number, token: string): Promise<void> {
  await expect(async () => {
    await filmsApi.delete(id, token);
    expect((await filmsApi.getById(id)).status()).toBe(404);
  }).toPass();
}

export async function deleteSeriesSafely(seriesApi: SeriesApi, id: number, token: string): Promise<void> {
  await expect(async () => {
    await seriesApi.delete(id, token);
    expect((await seriesApi.getById(id)).status()).toBe(404);
  }).toPass();
}

export async function deleteDuplicateFilmByTitleIfAny(
  filmsApi: FilmsApi,
  title: string,
  excludedId: number,
  token: string,
): Promise<void> {
  const allFilms: Film[] = await (await filmsApi.getAll(token)).json();
  const duplicate = allFilms.find((f) => f.title === title && f.id !== excludedId);
  if (duplicate) {
    await deleteFilmSafely(filmsApi, duplicate.id, token);
  }
}

export async function deleteDuplicateSeriesByTitleIfAny(
  seriesApi: SeriesApi,
  title: string,
  excludedId: number,
  token: string,
): Promise<void> {
  const allSeries: Series[] = await (await seriesApi.getAll(token)).json();
  const duplicate = allSeries.find((s) => s.title === title && s.id !== excludedId);
  if (duplicate) {
    await deleteSeriesSafely(seriesApi, duplicate.id, token);
  }
}
