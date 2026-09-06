import { test, expect } from '../../fixtures/api.fixtures';
import { LoginResponse } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film, FilmGenreGroup } from '../../models/film.model';
import { Series, SeriesGenreGroup } from '../../models/series.model';
import { buildFilmPayload } from '../../test-data/film.data';
import { buildSeriesPayload } from '../../test-data/series.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { deleteFilmSafely, deleteSeriesSafely } from '../../utils/filmSeriesCleanup';

let adminToken: string;
let createdFilm: Film;
let createdSeries: Series;

test.beforeEach(async ({ authApi, genresApi, filmsApi, seriesApi }) => {
  const loginResponse = await authApi.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
  ({ token: adminToken } = (await loginResponse.json()) as LoginResponse);

  const genresResponse = await genresApi.getAll(adminToken);
  const genres: Genre[] = await genresResponse.json();
  const genre = genres[0];

  const filmPayload = buildFilmPayload(genre.id);
  await filmsApi.create(filmPayload, adminToken);
  const allFilms: Film[] = await (await filmsApi.getAll(adminToken)).json();
  createdFilm = allFilms.find((film) => film.title === filmPayload.title)!;

  const seriesPayload = buildSeriesPayload(genre.id);
  await seriesApi.create(seriesPayload, adminToken);
  const allSeries: Series[] = await (await seriesApi.getAll(adminToken)).json();
  createdSeries = allSeries.find((series) => series.title === seriesPayload.title)!;
});

test.afterEach(async ({ filmsApi, seriesApi }) => {
  if (!createdFilm || !createdSeries) return;
  await deleteFilmSafely(filmsApi, createdFilm.id, adminToken);
  await deleteSeriesSafely(seriesApi, createdSeries.id, adminToken);
});

function expectDescendingByCreatedAt(items: Array<{ createdAt: string }>): void {
  const timestamps = items.map((item) => new Date(item.createdAt).getTime());
  const sortedDescending = [...timestamps].sort((a, b) => b - a);
  expect.soft(timestamps).toEqual(sortedDescending);
}

test(
  '[QA-59][API] Preuzimanje filmova i serija grupisanih po žanru i sortiranih po vremenu dodavanja',
  { tag: ['@api', '@smoke'] },
  async ({ filmsApi, seriesApi }) => {
    await test.step('a) Film - GroupedByGenre', async () => {
      const response = await filmsApi.getGroupedByGenre();

      expect.soft(response.status()).toBe(200);
      const groups: FilmGenreGroup[] = await response.json();
      const matchingGroup = groups.find((group) => group.genre.id === createdFilm.genres[0].id);

      expect.soft(matchingGroup).toBeDefined();
      expect.soft(matchingGroup?.films.some((film) => film.id === createdFilm.id)).toBe(true);
    });

    await test.step('b) Series - GroupedByGenre', async () => {
      const response = await seriesApi.getGroupedByGenre();

      expect.soft(response.status()).toBe(200);
      const groups: SeriesGenreGroup[] = await response.json();
      const matchingGroup = groups.find((group) => group.genre.id === createdSeries.genres[0].id);

      expect.soft(matchingGroup).toBeDefined();
      expect.soft(matchingGroup?.series.some((series) => series.id === createdSeries.id)).toBe(true);
    });

    await test.step('c) Film - OrderedByTimeAdded', async () => {
      const response = await filmsApi.getOrderedByTimeAdded();

      expect.soft(response.status()).toBe(200);
      const films: Film[] = await response.json();

      expect.soft(films.length).toBeLessThanOrEqual(10);
      expect.soft(films.some((film) => film.id === createdFilm.id)).toBe(true);
      expectDescendingByCreatedAt(films);
    });

    await test.step('d) Series - OrderedByTimeAdded', async () => {
      const response = await seriesApi.getOrderedByTimeAdded();

      expect.soft(response.status()).toBe(200);
      const series: Series[] = await response.json();

      expect.soft(series.length).toBeLessThanOrEqual(10);
      expect.soft(series.some((item) => item.id === createdSeries.id)).toBe(true);
      expectDescendingByCreatedAt(series);
    });
  },
);
