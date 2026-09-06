import { test } from '../../fixtures/auth.fixtures';
import { ExplorePage } from '../../pages/ExplorePage';
import { LoginPage } from '../../pages/LoginPage';
import { LoginResponse } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { PrivacySettings } from '../../models/user.model';
import { buildFilmPayload } from '../../test-data/film.data';
import { buildSeriesPayload } from '../../test-data/series.data';
import { buildValidUserPayload } from '../../test-data/user.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { deleteFilmCommentsIfAny, deleteSeriesCommentsIfAny } from '../../utils/commentCleanup';
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

test.afterEach(async ({ commentsApi }) => {
  if (!createdFilm || !createdSeries) return;
  await deleteFilmCommentsIfAny(commentsApi, createdFilm.id, adminToken);
  await deleteSeriesCommentsIfAny(commentsApi, createdSeries.id, adminToken);
});

test.afterEach(async ({ filmsApi, seriesApi }) => {
  if (!createdFilm || !createdSeries) return;
  await deleteFilmSafely(filmsApi, createdFilm.id, adminToken);
  await deleteSeriesSafely(seriesApi, createdSeries.id, adminToken);
});

test(
  '[QA-104][E2E] Objavljivanje komentara za film/seriju putem modala sa detaljima',
  { tag: ['@e2e', '@smoke'] },
  async ({ authenticatedPage }) => {
    const explorePage = new ExplorePage(authenticatedPage, genre);
    await explorePage.goto();

    await test.step('a) Film', async () => {
      await explorePage.openMediaDetails(createdFilm.posterUrl);
      await explorePage.mediaModal.postComment('Automated E2E comment for film.');
      await explorePage.mediaModal.expectCommentVisible('Automated E2E comment for film.');
      await explorePage.mediaModal.expectCommentInputEmpty();
      await explorePage.mediaModal.close();
    });

    await test.step('b) Series', async () => {
      await explorePage.mediaTypeToggle.switchToSeries();
      await explorePage.openMediaDetails(createdSeries.posterUrl);
      await explorePage.mediaModal.postComment('Automated E2E comment for series.');
      await explorePage.mediaModal.expectCommentVisible('Automated E2E comment for series.');
      await explorePage.mediaModal.expectCommentInputEmpty();
    });
  },
);

test(
  '[QA-105][E2E] Prikaz komentara u modalu sa detaljima filma/serije poštuje podešavanje privatnosti "Only Me"',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, usersApi, authApi, commentsApi }) => {
    const ownerPayload = buildValidUserPayload();
    const createOwnerResponse = await usersApi.createVerifiedUser(ownerPayload);
    const { id: ownerId }: { id: number } = await createOwnerResponse.json();
    const ownerLoginResponse = await authApi.login({ username: ownerPayload.username, password: ownerPayload.password });
    const { token: ownerToken }: LoginResponse = await ownerLoginResponse.json();

    try {
      const commentText = 'Comment visible only to its owner.';
      await commentsApi.createForFilm({ userId: ownerId, filmId: createdFilm.id, text: commentText }, ownerToken);

      const privacySettings: PrivacySettings = {
        commentsVisibility: 'onlyme',
        watchlistVisibility: 'everyone',
        ratingsVisibility: 'everyone',
        hideEmail: false,
        personalisedRecs: true,
      };
      await usersApi.updatePrivacySettings(ownerId, privacySettings, ownerToken);

      const explorePage = new ExplorePage(authenticatedPage, genre);
      await explorePage.goto();

      await test.step('a) Korisnik B ne vidi komentar korisnika A', async () => {
        await explorePage.openMediaDetails(createdFilm.posterUrl);
        await explorePage.mediaModal.expectCommentNotVisible(commentText);
        await explorePage.mediaModal.close();
      });

      await test.step('b) Korisnik A vidi sopstveni komentar', async () => {
        await explorePage.avatarMenu.logout();
        await explorePage.avatarMenu.expectLoggedOutToastVisible();

        const loginPage = new LoginPage(authenticatedPage);
        await loginPage.login({ username: ownerPayload.username, password: ownerPayload.password });
        await loginPage.expectRedirectToHome();

        await explorePage.goto();
        await explorePage.openMediaDetails(createdFilm.posterUrl);
        await explorePage.mediaModal.expectCommentVisible(commentText);
      });
    } finally {
      await usersApi.deleteUser(ownerId, ownerToken);
    }
  },
);
