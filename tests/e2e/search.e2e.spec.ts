import { test } from '../../fixtures/auth.fixtures';
import { SearchPage } from '../../pages/SearchPage';
import { LoginResponse, JwtPayload } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { buildFilmPayload } from '../../test-data/film.data';
import { buildSeriesPayload } from '../../test-data/series.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { decodeJwtPayload } from '../../utils/jwt';
import { deleteFilmRatingIfAny } from '../../utils/ratingCleanup';
import { deleteFilmSafely, deleteSeriesSafely } from '../../utils/filmSeriesCleanup';

let adminToken: string;
let adminUserId: number;
let genreA: Genre;
let genreB: Genre;
let filmA: Film;
let seriesA: Series;
let filmB: Film;

test.beforeEach(async ({ authApi, genresApi, filmsApi, seriesApi, ratingsApi }) => {
  const loginResponse = await authApi.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
  ({ token: adminToken } = (await loginResponse.json()) as LoginResponse);
  adminUserId = Number(decodeJwtPayload<JwtPayload>(adminToken).userId);

  const genresResponse = await genresApi.getAll(adminToken);
  const genres: Genre[] = await genresResponse.json();
  [genreA, genreB] = genres;

  const filmAPayload = buildFilmPayload(genreA.id);
  await filmsApi.create(filmAPayload, adminToken);
  const allFilms: Film[] = await (await filmsApi.getAll(adminToken)).json();
  filmA = allFilms.find((film) => film.title === filmAPayload.title)!;

  const seriesAPayload = buildSeriesPayload(genreA.id);
  await seriesApi.create(seriesAPayload, adminToken);
  const allSeries: Series[] = await (await seriesApi.getAll(adminToken)).json();
  seriesA = allSeries.find((series) => series.title === seriesAPayload.title)!;

  const filmBPayload = buildFilmPayload(genreB.id);
  await filmsApi.create(filmBPayload, adminToken);
  const allFilmsAfterB: Film[] = await (await filmsApi.getAll(adminToken)).json();
  filmB = allFilmsAfterB.find((film) => film.title === filmBPayload.title)!;

  await ratingsApi.createForFilm({ userId: adminUserId, filmId: filmA.id, value: 9 }, adminToken);
  await ratingsApi.createForFilm({ userId: adminUserId, filmId: filmB.id, value: 2 }, adminToken);
});

test.afterEach(async ({ filmsApi, seriesApi, ratingsApi }) => {
  if (!filmA || !seriesA || !filmB) return;
  await deleteFilmRatingIfAny(ratingsApi, adminUserId, filmA.id, adminToken);
  await deleteFilmRatingIfAny(ratingsApi, adminUserId, filmB.id, adminToken);

  await deleteFilmSafely(filmsApi, filmA.id, adminToken);
  await deleteSeriesSafely(seriesApi, seriesA.id, adminToken);
  await deleteFilmSafely(filmsApi, filmB.id, adminToken);
});

test(
  '[QA-63][E2E] Pretraga, filtriranje i sortiranje rezultata na /search stranici - a) Pretraga po nazivu',
  { tag: ['@e2e', '@smoke'] },
  async ({ authenticatedPage }) => {
    const searchPage = new SearchPage(authenticatedPage);
    await searchPage.goto();

    const uniqueSuffix = filmA.title.split(' ').pop()!.toUpperCase();
    await searchPage.searchByTitle(uniqueSuffix);

    await searchPage.expectResultVisible(filmA.title);
    await searchPage.expectResultsCountMessage(1);
  },
);

test(
  '[QA-63][E2E] Pretraga, filtriranje i sortiranje rezultata na /search stranici - b) Filtriranje po žanru',
  { tag: ['@e2e', '@smoke'] },
  async ({ authenticatedPage }) => {
    const searchPage = new SearchPage(authenticatedPage);
    await searchPage.goto();

    await searchPage.filterByGenre(genreA.name);

    await searchPage.expectResultVisible(filmA.title);
    await searchPage.expectResultVisible(seriesA.title);
    await searchPage.expectResultHidden(filmB.title);
  },
);

test(
  '[QA-63][E2E] Pretraga, filtriranje i sortiranje rezultata na /search stranici - c) Filtriranje po tipu sadržaja (Movies/Series)',
  { tag: ['@e2e', '@smoke'] },
  async ({ authenticatedPage }) => {
    const searchPage = new SearchPage(authenticatedPage);
    await searchPage.goto();

    await searchPage.filterByMovies();
    await searchPage.expectResultVisible(filmA.title);
    await searchPage.expectResultHidden(seriesA.title);

    await searchPage.filterBySeries();
    await searchPage.expectResultVisible(seriesA.title);
    await searchPage.expectResultHidden(filmA.title);
  },
);

test(
  '[QA-63][E2E] Pretraga, filtriranje i sortiranje rezultata na /search stranici - d) Sortiranje po oceni (Top rated)',
  { tag: ['@e2e', '@smoke'] },
  async ({ authenticatedPage }) => {
    const searchPage = new SearchPage(authenticatedPage);
    await searchPage.goto();

    await searchPage.sortByTopRated();

    await searchPage.expectRatedBefore(filmA.title, filmB.title);
  },
);
