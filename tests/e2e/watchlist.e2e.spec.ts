import { test } from '../../fixtures/auth.fixtures';
import { ExplorePage } from '../../pages/ExplorePage';
import { WatchlistPage } from '../../pages/WatchlistPage';
import { PublicProfilePage } from '../../pages/PublicProfilePage';
import { LoginResponse } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { PrivacySettings, UserAdminResponse } from '../../models/user.model';
import { UsersApi } from '../../api/users.api';
import { AuthApi } from '../../api/auth.api';
import { buildFilmPayload } from '../../test-data/film.data';
import { buildSeriesPayload } from '../../test-data/series.data';
import { buildValidUserPayload } from '../../test-data/user.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { deleteFilmSafely, deleteSeriesSafely } from '../../utils/filmSeriesCleanup';

interface SecondVerifiedUser {
  id: number;
  token: string;
}

async function createSecondVerifiedUser(usersApi: UsersApi, authApi: AuthApi): Promise<SecondVerifiedUser> {
  const payload = buildValidUserPayload();
  const createResponse = await usersApi.createVerifiedUser(payload);
  const { id } = (await createResponse.json()) as UserAdminResponse;

  const loginResponse = await authApi.login({ username: payload.username, password: payload.password });
  const { token } = (await loginResponse.json()) as LoginResponse;

  return { id, token };
}

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

test.afterEach(async ({ filmsApi, seriesApi }) => {
  if (!createdFilm || !createdSeries) return;
  await deleteFilmSafely(filmsApi, createdFilm.id, adminToken);
  await deleteSeriesSafely(seriesApi, createdSeries.id, adminToken);
});

test(
  '[QA-134][E2E] Dodavanje i uklanjanje filma/serije sa watchlist-e putem MediaModal-a',
  { tag: ['@e2e', '@smoke'] },
  async ({ authenticatedPage }) => {
    const explorePage = new ExplorePage(authenticatedPage, genre);
    await explorePage.goto();
    await explorePage.openMediaDetails(createdFilm.posterUrl);

    await explorePage.mediaModal.toggleWatchlist();
    await explorePage.mediaModal.expectInWatchlist();

    await explorePage.mediaModal.toggleWatchlist();
    await explorePage.mediaModal.expectNotInWatchlist();
  },
);

test(
  '[QA-135][E2E] Označavanje stavke kao odgledane/neodgledane na sopstvenoj Watchlist stranici',
  { tag: ['@e2e', '@smoke'] },
  async ({ authenticatedPage, watchlistApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;
    await watchlistApi.add({ userId, filmId: createdFilm.id, seriesId: null }, token);

    const watchlistPage = new WatchlistPage(authenticatedPage);
    await watchlistPage.goto();

    await watchlistPage.toggleWatched();
    await watchlistPage.expectMarkedAsWatched();

    await watchlistPage.toggleWatched();
    await watchlistPage.expectMarkedAsUnwatched();
  },
);

test(
  '[QA-136][E2E] Pregled sopstvene watchlist stranice sa dodatim stavkama',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, watchlistApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;
    await watchlistApi.add({ userId, filmId: createdFilm.id, seriesId: null }, token);
    await watchlistApi.add({ userId, filmId: null, seriesId: createdSeries.id }, token);

    const watchlistPage = new WatchlistPage(authenticatedPage);
    await watchlistPage.goto();

    await watchlistPage.expectItemCount(2);
    await watchlistPage.expectItemVisible(createdFilm.title, createdFilm.year);
    await watchlistPage.expectItemVisible(createdSeries.title, createdSeries.year);
  },
);

test(
  '[QA-137][E2E] Prikaz popunjene watchlist-e na javnom profilu kada je vidljivost "everyone"',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, watchlistApi, authApi, usersApi }) => {
    const { id: secondUserId, token } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      const everyoneVisibilitySettings: PrivacySettings = {
        commentsVisibility: 'everyone',
        watchlistVisibility: 'everyone',
        ratingsVisibility: 'everyone',
        hideEmail: false,
        personalisedRecs: true,
      };
      await usersApi.updatePrivacySettings(secondUserId, everyoneVisibilitySettings, token);

      await watchlistApi.add({ userId: secondUserId, filmId: createdFilm.id, seriesId: null }, token);
      const seriesAddResponse = await watchlistApi.add({ userId: secondUserId, filmId: null, seriesId: createdSeries.id }, token);
      const { id: seriesWatchlistItemId } = await seriesAddResponse.json();
      await watchlistApi.markWatched(seriesWatchlistItemId, { watched: true }, token);

      const userResponse = await usersApi.getById(secondUserId, token);
      const userB = (await userResponse.json()) as UserAdminResponse;

      const publicProfilePage = new PublicProfilePage(authenticatedPage, userB);
      await publicProfilePage.goto(secondUserId);
      await publicProfilePage.openWatchlistTab();

      await publicProfilePage.expectWatchlistItemVisible(createdFilm.title);
      await publicProfilePage.expectWatchlistItemNotWatched(createdFilm.title);

      await publicProfilePage.expectWatchlistItemVisible(createdSeries.title);
      await publicProfilePage.expectWatchlistItemWatched(createdSeries.title);

      await publicProfilePage.expectWatchlistStatCount(2);
    } finally {
      await usersApi.deleteUser(secondUserId, token);
    }
  },
);

test(
  '[QA-138][E2E] Nemogućnost menjanja watched statusa tuđe stavke na javnom profilu',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, watchlistApi, authApi, usersApi }) => {
    const { id: secondUserId, token } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      const everyoneVisibilitySettings: PrivacySettings = {
        commentsVisibility: 'everyone',
        watchlistVisibility: 'everyone',
        ratingsVisibility: 'everyone',
        hideEmail: false,
        personalisedRecs: true,
      };
      await usersApi.updatePrivacySettings(secondUserId, everyoneVisibilitySettings, token);
      await watchlistApi.add({ userId: secondUserId, filmId: createdFilm.id, seriesId: null }, token);

      const userResponse = await usersApi.getById(secondUserId, token);
      const userB = (await userResponse.json()) as UserAdminResponse;

      const publicProfilePage = new PublicProfilePage(authenticatedPage, userB);
      await publicProfilePage.goto(secondUserId);
      await publicProfilePage.openWatchlistTab();

      await publicProfilePage.expectWatchlistItemVisible(createdFilm.title);
      await publicProfilePage.expectWatchlistItemsReadOnly();
    } finally {
      await usersApi.deleteUser(secondUserId, token);
    }
  },
);
