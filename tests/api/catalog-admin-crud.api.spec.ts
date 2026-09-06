import { test, expect } from '../../fixtures/api.fixtures';
import { LoginResponse } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { buildFilmPayload, buildFilmPayloadMissingTitle, buildFilmUpdatePayload } from '../../test-data/film.data';
import { buildSeriesPayload, buildSeriesUpdatePayload } from '../../test-data/series.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import {
  deleteFilmSafely,
  deleteSeriesSafely,
  deleteDuplicateFilmByTitleIfAny,
  deleteDuplicateSeriesByTitleIfAny,
} from '../../utils/filmSeriesCleanup';

let adminToken: string;
let genre: Genre;
let film: Film;
let series: Series;

test.beforeEach(async ({ authApi, genresApi, filmsApi, seriesApi }) => {
  const loginResponse = await authApi.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
  ({ token: adminToken } = (await loginResponse.json()) as LoginResponse);

  const genresResponse = await genresApi.getAll(adminToken);
  const genres: Genre[] = await genresResponse.json();
  genre = genres[0];

  const filmPayload = buildFilmPayload(genre.id);
  await filmsApi.create(filmPayload, adminToken);
  const allFilms: Film[] = await (await filmsApi.getAll(adminToken)).json();
  film = allFilms.find((f) => f.title === filmPayload.title)!;

  const seriesPayload = buildSeriesPayload(genre.id);
  await seriesApi.create(seriesPayload, adminToken);
  const allSeries: Series[] = await (await seriesApi.getAll(adminToken)).json();
  series = allSeries.find((s) => s.title === seriesPayload.title)!;
});

test.afterEach(async ({ filmsApi, seriesApi }) => {
  if (!film || !series) return;
  await deleteFilmSafely(filmsApi, film.id, adminToken);
  await deleteSeriesSafely(seriesApi, series.id, adminToken);
});

test(
  '[QA-68][API] Izmena i brisanje postojećeg filma/serije (Admin) - a) Update Film',
  { tag: ['@api', '@smoke'] },
  async ({ filmsApi }) => {
    const updatePayload = buildFilmUpdatePayload(genre.id);
    const response = await filmsApi.update(film.id, updatePayload, adminToken);

    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('Film successfully updated.');
  },
);

test(
  '[QA-68][API] Izmena i brisanje postojećeg filma/serije (Admin) - b) Update Series',
  { tag: ['@api', '@smoke'] },
  async ({ seriesApi }) => {
    const updatePayload = buildSeriesUpdatePayload(genre.id);
    const response = await seriesApi.update(series.id, updatePayload, adminToken);

    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('Series successfully updated');
  },
);

test(
  '[QA-68][API] Izmena i brisanje postojećeg filma/serije (Admin) - c) Delete Film',
  { tag: ['@api', '@smoke'] },
  async ({ filmsApi }) => {
    const response = await filmsApi.delete(film.id, adminToken);

    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('Film successfully deleted.');
  },
);

test(
  '[QA-68][API] Izmena i brisanje postojećeg filma/serije (Admin) - d) Delete Series',
  { tag: ['@api', '@smoke'] },
  async ({ seriesApi }) => {
    const response = await seriesApi.delete(series.id, adminToken);

    expect(response.status()).toBe(200);
    expect(await response.text()).toBe('Series deleted successfully');
  },
);

test(
  '[QA-71][API] Pristup admin CRUD akcijama nad filmom/serijom od strane regularnog korisnika - a) Create Film',
  { tag: ['@api', '@authorization'] },
  async ({ filmsApi, verifiedTestUser }) => {
    const payload = buildFilmPayload(genre.id);
    const response = await filmsApi.create(payload, verifiedTestUser.token);

    expect(response.status()).toBe(403);
    expect(await response.text()).toBe('');
  },
);

test(
  '[QA-71][API] Pristup admin CRUD akcijama nad filmom/serijom od strane regularnog korisnika - b) Update Film',
  { tag: ['@api', '@authorization'] },
  async ({ filmsApi, verifiedTestUser }) => {
    const payload = buildFilmUpdatePayload(genre.id);
    const response = await filmsApi.update(film.id, payload, verifiedTestUser.token);

    expect(response.status()).toBe(403);
    expect(await response.text()).toBe('');
  },
);

test(
  '[QA-71][API] Pristup admin CRUD akcijama nad filmom/serijom od strane regularnog korisnika - c) Delete Film',
  { tag: ['@api', '@authorization'] },
  async ({ filmsApi, verifiedTestUser }) => {
    const response = await filmsApi.delete(film.id, verifiedTestUser.token);

    expect(response.status()).toBe(403);
    expect(await response.text()).toBe('');
  },
);

test(
  '[QA-71][API] Pristup admin CRUD akcijama nad filmom/serijom od strane regularnog korisnika - d) Create Series',
  { tag: ['@api', '@authorization'] },
  async ({ seriesApi, verifiedTestUser }) => {
    const payload = buildSeriesPayload(genre.id);
    const response = await seriesApi.create(payload, verifiedTestUser.token);

    expect(response.status()).toBe(403);
    expect(await response.text()).toBe('');
  },
);

test(
  '[QA-72][API] Kreiranje filma bez naslova (Title)',
  { tag: ['@api'] },
  async ({ filmsApi }) => {
    const payload = buildFilmPayloadMissingTitle(genre.id);

    const response = await filmsApi.createWithPayload(payload, adminToken);
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.errors).toHaveProperty('Title');
  },
);

test(
  '[QA-73][API] Kreiranje filma/serije sa već postojećim naslovom',
  { tag: ['@api'] },
  async ({ filmsApi, seriesApi }) => {
    await test.step('a) Film', async () => {
      const payload = { ...buildFilmPayload(genre.id), title: film.title };

      try {
        const response = await filmsApi.create(payload, adminToken);

        expect.soft(response.status()).toBe(400);

        const body = await response.json();
        expect.soft(body.errors).toHaveProperty('Title');
      } finally {
        await deleteDuplicateFilmByTitleIfAny(filmsApi, film.title, film.id, adminToken);
      }
    });

    await test.step('b) Series', async () => {
      const payload = { ...buildSeriesPayload(genre.id), title: series.title };

      try {
        const response = await seriesApi.create(payload, adminToken);

        expect.soft(response.status()).toBe(400);

        const body = await response.json();
        expect.soft(body.errors).toHaveProperty('Title');
      } finally {
        await deleteDuplicateSeriesByTitleIfAny(seriesApi, series.title, series.id, adminToken);
      }
    });
  },
);

test(
  '[QA-74][API] Izmena i brisanje nepostojećeg filma/serije - a) Update Film',
  { tag: ['@api'] },
  async ({ filmsApi }) => {
    await filmsApi.delete(film.id, adminToken);

    const updatePayload = buildFilmUpdatePayload(genre.id);
    const response = await filmsApi.update(film.id, updatePayload, adminToken);

    expect(response.status()).toBe(404);
  },
);

test(
  '[QA-74][API] Izmena i brisanje nepostojećeg filma/serije - b) Update Series',
  { tag: ['@api'] },
  async ({ seriesApi }) => {
    await seriesApi.delete(series.id, adminToken);

    const updatePayload = buildSeriesUpdatePayload(genre.id);
    const response = await seriesApi.update(series.id, updatePayload, adminToken);

    expect(response.status()).toBe(404);
  },
);

test(
  '[QA-74][API] Izmena i brisanje nepostojećeg filma/serije - c) Delete Film',
  { tag: ['@api'] },
  async ({ filmsApi }) => {
    await filmsApi.delete(film.id, adminToken);

    const response = await filmsApi.delete(film.id, adminToken);

    expect(response.status()).toBe(404);
  },
);

test(
  '[QA-74][API] Izmena i brisanje nepostojećeg filma/serije - d) Delete Series',
  { tag: ['@api'] },
  async ({ seriesApi }) => {
    await seriesApi.delete(series.id, adminToken);

    const response = await seriesApi.delete(series.id, adminToken);

    expect(response.status()).toBe(404);
  },
);
