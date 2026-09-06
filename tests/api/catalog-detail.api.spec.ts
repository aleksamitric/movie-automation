import { test, expect } from '../../fixtures/api.fixtures';
import { LoginResponse } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
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

test(
  '[QA-60][API] Preuzimanje pojedinačnog filma/serije po ID-ju',
  { tag: ['@api', '@smoke'] },
  async ({ filmsApi, seriesApi }) => {
    await test.step('a) Film - validan, postojeći ID', async () => {
      const response = await filmsApi.getById(createdFilm.id);

      expect.soft(response.status()).toBe(200);
      const film: Film = await response.json();
      expect.soft(film).toEqual(createdFilm);
    });

    await test.step('b) Series - validan, postojeći ID', async () => {
      const response = await seriesApi.getById(createdSeries.id);

      expect.soft(response.status()).toBe(200);
      const series: Series = await response.json();
      expect.soft(series).toEqual(createdSeries);
    });

    await test.step('c) Film - nepostojeći ID', async () => {
      await filmsApi.delete(createdFilm.id, adminToken);

      const response = await filmsApi.getById(createdFilm.id);

      expect.soft(response.status()).toBe(404);
      const body = await response.json();
      expect.soft(body).not.toHaveProperty('id');
      expect.soft(body).not.toHaveProperty('genres');
    });

    await test.step('d) Series - nepostojeći ID', async () => {
      await seriesApi.delete(createdSeries.id, adminToken);

      const response = await seriesApi.getById(createdSeries.id);

      expect.soft(response.status()).toBe(404);
      const body = await response.json();
      expect.soft(body).not.toHaveProperty('id');
      expect.soft(body).not.toHaveProperty('genres');
    });
  },
);
