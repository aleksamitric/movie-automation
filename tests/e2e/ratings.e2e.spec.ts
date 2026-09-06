import { test } from '../../fixtures/auth.fixtures';
import { ExplorePage } from '../../pages/ExplorePage';
import { LoginResponse } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { buildFilmPayload } from '../../test-data/film.data';
import { buildSeriesPayload } from '../../test-data/series.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { deleteFilmRatingIfAny, deleteSeriesRatingIfAny } from '../../utils/ratingCleanup';
import { deleteFilmSafely, deleteSeriesSafely } from '../../utils/filmSeriesCleanup';

let adminToken: string;
let genre: Genre;
let createdFilm: Film;
let createdSeries: Series;

test.beforeEach(async ({ authApi, genresApi, filmsApi, seriesApi }) => {
  const loginResponse = await authApi.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
  ({ token: adminToken } = (await loginResponse.json()) as LoginResponse);

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
});

test.afterEach(async ({ ratingsApi, verifiedTestUser }) => {
  if (!createdFilm || !createdSeries) return;
  await deleteFilmRatingIfAny(ratingsApi, verifiedTestUser.id, createdFilm.id, verifiedTestUser.token);
  await deleteSeriesRatingIfAny(ratingsApi, verifiedTestUser.id, createdSeries.id, verifiedTestUser.token);
});

test.afterEach(async ({ filmsApi, seriesApi }) => {
  if (!createdFilm || !createdSeries) return;
  await deleteFilmSafely(filmsApi, createdFilm.id, adminToken);
  await deleteSeriesSafely(seriesApi, createdSeries.id, adminToken);
});

test(
  '[QA-77][E2E] Ocenjivanje filma/serije putem zvezdica u modalu',
  { tag: ['@e2e', '@smoke'] },
  async ({ authenticatedPage }) => {
    const explorePage = new ExplorePage(authenticatedPage, genre);
    await explorePage.goto();

    await test.step('a) Film - prvo ocenjivanje', async () => {
      await explorePage.openMediaDetails(createdFilm.posterUrl);
      await explorePage.mediaModal.rate(7);
      await explorePage.mediaModal.expectYourRatingText(7);
    });

    await test.step('c) Već ocenjen naslov - klik na zvezdice nema efekta', async () => {
      await explorePage.mediaModal.rate(3);
      await explorePage.mediaModal.expectYourRatingText(7);
      await explorePage.mediaModal.close();
    });

    await test.step('b) Series - prvo ocenjivanje', async () => {
      await explorePage.mediaTypeToggle.switchToSeries();
      await explorePage.openMediaDetails(createdSeries.posterUrl);
      await explorePage.mediaModal.rate(9);
      await explorePage.mediaModal.expectYourRatingText(9);
    });
  },
);
