import { test } from '../../fixtures/auth.fixtures';
import { HomePage } from '../../pages/HomePage';
import { LoginResponse, JwtPayload } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { buildFilmPayload } from '../../test-data/film.data';
import { buildSeriesPayload } from '../../test-data/series.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { decodeJwtPayload } from '../../utils/jwt';
import { deleteFilmRatingIfAny, deleteSeriesRatingIfAny } from '../../utils/ratingCleanup';
import { deleteFilmSafely, deleteSeriesSafely } from '../../utils/filmSeriesCleanup';

let adminToken: string;
let adminUserId: number;
let film: Film;
let series: Series;

test.beforeEach(async ({ authApi, genresApi, filmsApi, seriesApi, ratingsApi }) => {
  const loginResponse = await authApi.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
  ({ token: adminToken } = (await loginResponse.json()) as LoginResponse);
  adminUserId = Number(decodeJwtPayload<JwtPayload>(adminToken).userId);

  const genresResponse = await genresApi.getAll(adminToken);
  const genres: Genre[] = await genresResponse.json();
  const genre = genres[0];

  const filmPayload = buildFilmPayload(genre.id);
  await filmsApi.create(filmPayload, adminToken);
  const allFilms: Film[] = await (await filmsApi.getAll(adminToken)).json();
  film = allFilms.find((f) => f.title === filmPayload.title)!;

  const seriesPayload = buildSeriesPayload(genre.id);
  await seriesApi.create(seriesPayload, adminToken);
  const allSeries: Series[] = await (await seriesApi.getAll(adminToken)).json();
  series = allSeries.find((s) => s.title === seriesPayload.title)!;

  await ratingsApi.createForFilm({ userId: adminUserId, filmId: film.id, value: 8 }, adminToken);
  await ratingsApi.createForSeries({ userId: adminUserId, seriesId: series.id, value: 8 }, adminToken);
});

test.afterEach(async ({ filmsApi, seriesApi, ratingsApi }) => {
  if (!film || !series) return;
  await deleteFilmRatingIfAny(ratingsApi, adminUserId, film.id, adminToken);
  await deleteSeriesRatingIfAny(ratingsApi, adminUserId, series.id, adminToken);

  await deleteFilmSafely(filmsApi, film.id, adminToken);
  await deleteSeriesSafely(seriesApi, series.id, adminToken);
});

test(
  '[QA-65][E2E] Prikaz trending sekcije na Home stranici',
  { tag: ['@e2e', '@smoke', '@flaky'] },
  async ({ authenticatedPage }) => {
    const homePage = new HomePage(authenticatedPage);
    await homePage.goto();

    await homePage.trendingSection.expectHeadingVisible();
    await homePage.trendingSection.expectAtLeastOneCardVisible();

    await homePage.mediaTypeToggle.switchToSeries();

    await homePage.trendingSection.expectHeadingVisible();
    await homePage.trendingSection.expectAtLeastOneCardVisible();
  },
);
