import { test } from '../../fixtures/auth.fixtures';
import { ExplorePage } from '../../pages/ExplorePage';
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

const RATING_VALUE = 8;

test.describe('Prikaz detalja filma/serije u modalu', () => {
  let adminToken: string;
  let adminUserId: number;
  let genre: Genre;
  let createdFilm: Film;
  let createdSeries: Series;

  test.beforeEach(async ({ authApi, genresApi, filmsApi, seriesApi, ratingsApi }) => {
    const loginResponse = await authApi.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
    ({ token: adminToken } = (await loginResponse.json()) as LoginResponse);
    adminUserId = Number(decodeJwtPayload<JwtPayload>(adminToken).userId);

    const genresResponse = await genresApi.getAll(adminToken);
    const genres: Genre[] = await genresResponse.json();
    genre = genres[0];

    const filmPayload = buildFilmPayload(genre.id);
    await filmsApi.create(filmPayload, adminToken);
    const allFilms: Film[] = await (await filmsApi.getAll(adminToken)).json();
    createdFilm = allFilms.find((film) => film.title === filmPayload.title)!;

    const seriesPayload = buildSeriesPayload(genre.id);
    await seriesApi.create(seriesPayload, adminToken);
    const allSeries: Series[] = await (await seriesApi.getAll(adminToken)).json();
    createdSeries = allSeries.find((series) => series.title === seriesPayload.title)!;

    await ratingsApi.createForFilm({ userId: adminUserId, filmId: createdFilm.id, value: RATING_VALUE }, adminToken);
    await ratingsApi.createForSeries({ userId: adminUserId, seriesId: createdSeries.id, value: RATING_VALUE }, adminToken);
  });

  test.afterEach(async ({ filmsApi, seriesApi, ratingsApi }) => {
    if (!createdFilm || !createdSeries) return;
    await deleteFilmRatingIfAny(ratingsApi, adminUserId, createdFilm.id, adminToken);
    await deleteSeriesRatingIfAny(ratingsApi, adminUserId, createdSeries.id, adminToken);

    await deleteFilmSafely(filmsApi, createdFilm.id, adminToken);
    await deleteSeriesSafely(seriesApi, createdSeries.id, adminToken);
  });

  test(
    '[QA-66][E2E] Prikaz detalja filma/serije u modalu',
    { tag: ['@e2e', '@smoke'] },
    async ({ authenticatedPage }) => {
      const explorePage = new ExplorePage(authenticatedPage, genre);

      await test.step('a) Film', async () => {
        await explorePage.goto();
        await explorePage.openMediaDetails(createdFilm.posterUrl);

        await explorePage.mediaModal.expectFilmDetailsVisible(createdFilm, RATING_VALUE, true);

        await explorePage.mediaModal.close();
      });

      await test.step('b) Series', async () => {
        await explorePage.mediaTypeToggle.switchToSeries();
        await explorePage.openMediaDetails(createdSeries.posterUrl);

        await explorePage.mediaModal.expectSeriesDetailsVisible(createdSeries, RATING_VALUE, true);
      });
    },
  );
});

test(
  '[QA-67][E2E] Prikaz poruke o grešci u modalu za detalje filma/serije za nepostojeći ID',
  { tag: ['@e2e'] },
  async ({ authApi, genresApi, filmsApi, authenticatedPage }) => {
    const loginResponse = await authApi.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
    const { token: adminToken } = (await loginResponse.json()) as LoginResponse;

    const genresResponse = await genresApi.getAll(adminToken);
    const genres: Genre[] = await genresResponse.json();
    const genre = genres[0];

    const filmPayload = buildFilmPayload(genre.id);
    await filmsApi.create(filmPayload, adminToken);
    const allFilms: Film[] = await (await filmsApi.getAll(adminToken)).json();
    const createdFilm = allFilms.find((film) => film.title === filmPayload.title)!;

    try {
      const explorePage = new ExplorePage(authenticatedPage, genre);
      await explorePage.goto();
      await explorePage.expectMediaCardVisible(createdFilm.posterUrl);

      await filmsApi.delete(createdFilm.id, adminToken);

      await explorePage.openMediaDetails(createdFilm.posterUrl);

      await explorePage.mediaModal.expectNotFoundMessageVisible();
    } finally {
      await deleteFilmSafely(filmsApi, createdFilm.id, adminToken);
    }
  },
);
