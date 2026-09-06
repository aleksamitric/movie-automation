import { test } from '../../fixtures/auth.fixtures';
import { ExplorePage } from '../../pages/ExplorePage';
import { DebatesPage } from '../../pages/DebatesPage';
import { DebateDetailPage } from '../../pages/DebateDetailPage';
import { PublicProfilePage } from '../../pages/PublicProfilePage';
import { LoginResponse } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { DebatePost } from '../../models/debate.model';
import { buildFilmPayload } from '../../test-data/film.data';
import { buildSeriesPayload } from '../../test-data/series.data';
import { buildValidUserPayload } from '../../test-data/user.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { deleteFilmSafely, deleteSeriesSafely } from '../../utils/filmSeriesCleanup';
import { deleteFilmDebatesIfAny, deleteSeriesDebatesIfAny } from '../../utils/debateCleanup';

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

test.afterEach(async ({ debatesApi }) => {
  if (!createdFilm || !createdSeries) return;
  await deleteFilmDebatesIfAny(debatesApi, createdFilm.id, adminToken);
  await deleteSeriesDebatesIfAny(debatesApi, createdSeries.id, adminToken);
});

test.afterEach(async ({ filmsApi, seriesApi }) => {
  if (!createdFilm || !createdSeries) return;
  await deleteFilmSafely(filmsApi, createdFilm.id, adminToken);
  await deleteSeriesSafely(seriesApi, createdSeries.id, adminToken);
});

test(
  '[QA-118][E2E] Kreiranje debate putem forme sa naslovom, tagovima i opcijom obeležavanja spojlera',
  { tag: ['@e2e', '@smoke'] },
  async ({ authenticatedPage }) => {
    await test.step('a) Kreiranje sa /debates stranice (bez unapred izabranog filma)', async () => {
      const debatesPage = new DebatesPage(authenticatedPage);
      await debatesPage.goto();
      await debatesPage.openCreateDebateModal();

      const title = 'Automated E2E debate from list page.';
      await debatesPage.createDebateModal.create(title, 'Automated E2E debate content.', ['Theory'], true);

      await debatesPage.expectDebateTitleVisible(title);
    });

    await test.step('b) Kreiranje iz MediaModal-a filma ("Start a Debate", film unapred popunjen)', async () => {
      const explorePage = new ExplorePage(authenticatedPage, genre);
      await explorePage.goto();
      await explorePage.openMediaDetails(createdFilm.posterUrl);
      await explorePage.mediaModal.openCreateDebateModal();

      const title = 'Automated E2E debate from media modal.';
      await explorePage.mediaModal.createDebateModal.create(title, 'Automated E2E debate content from film modal.');

      const debatesPage = new DebatesPage(authenticatedPage);
      await debatesPage.goto();
      await debatesPage.expectDebateLinkedToMedia(title, createdFilm.title);
    });
  },
);

test(
  '[QA-119][E2E] Interakcija sa pojedinačnom debatom putem UI-ja — odgovaranje i lajkovanje - a) Odgovaranje (reply)',
  { tag: ['@e2e', '@smoke'] },
  async ({ authenticatedPage, debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const createResponse = await debatesApi.create(
      { title: 'Debate for reply E2E.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
      userId,
      token,
    );
    const debate: DebatePost = await createResponse.json();

    const debateDetailPage = new DebateDetailPage(authenticatedPage);
    await debateDetailPage.goto(debate.id);

    const replyText = 'Automated E2E reply.';
    await debateDetailPage.postReply(replyText);
    await debateDetailPage.expectReplyVisible(replyText);
    await debateDetailPage.expectReplyTextareaEmpty();
  },
);

test(
  '[QA-119][E2E] Interakcija sa pojedinačnom debatom putem UI-ja — odgovaranje i lajkovanje - b) Lajkovanje i uklanjanje lajka',
  { tag: ['@e2e', '@smoke'] },
  async ({ authenticatedPage, debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const createResponse = await debatesApi.create(
      { title: 'Debate for like E2E.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
      userId,
      token,
    );
    const debate: DebatePost = await createResponse.json();

    const debateDetailPage = new DebateDetailPage(authenticatedPage);
    await debateDetailPage.goto(debate.id);

    await debateDetailPage.expectNotLiked(0);
    await debateDetailPage.toggleLike();
    await debateDetailPage.expectLiked(1);
    await debateDetailPage.toggleLike();
    await debateDetailPage.expectNotLiked(0);
  },
);

test(
  '[QA-120][E2E] Prikaz statistike pregleda i spojler sadržaja na stranici sa detaljima debate - a) Brojanje pregleda',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const createResponse = await debatesApi.create(
      { title: 'Debate for view count E2E.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
      userId,
      token,
    );
    const debate: DebatePost = await createResponse.json();

    const debateDetailPage = new DebateDetailPage(authenticatedPage);
    await debateDetailPage.goto(debate.id);

    await debateDetailPage.expectViewCount(debate.viewCount + 1);
  },
);

test(
  '[QA-120][E2E] Prikaz statistike pregleda i spojler sadržaja na stranici sa detaljima debate - b) Prikaz i otkrivanje spojler sadržaja',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;
    const content = 'Spoiler content that should be hidden by default.';

    const createResponse = await debatesApi.create(
      { title: 'Debate for spoiler reveal E2E.', content, parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: true },
      userId,
      token,
    );
    const debate: DebatePost = await createResponse.json();

    const debateDetailPage = new DebateDetailPage(authenticatedPage);
    await debateDetailPage.goto(debate.id);

    await debateDetailPage.expectSpoilerPromptVisible();
    await debateDetailPage.revealSpoiler();
    await debateDetailPage.expectSpoilerPromptNotVisible();
    await debateDetailPage.expectContentVisible(content);
  },
);

test(
  '[QA-122][E2E] Filtriranje liste debata po filmu/seriji putem "View all" linka iz modala sa detaljima',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const filmDebateResponse = await debatesApi.create(
      { title: 'Film debate for View all E2E.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
      userId,
      token,
    );
    const filmDebate: DebatePost = await filmDebateResponse.json();

    const seriesDebateResponse = await debatesApi.create(
      { title: 'Series debate for View all E2E.', content: 'Content.', parentId: null, filmId: null, seriesId: createdSeries.id, tags: [], isSpoiler: false },
      userId,
      token,
    );
    const seriesDebate: DebatePost = await seriesDebateResponse.json();

    const explorePage = new ExplorePage(authenticatedPage, genre);
    await explorePage.goto();
    await explorePage.openMediaDetails(createdFilm.posterUrl);
    await explorePage.mediaModal.openDebatesList();

    await authenticatedPage.waitForURL(`**/debates?filmId=${createdFilm.id}`);

    const debatesPage = new DebatesPage(authenticatedPage);
    await debatesPage.expectDebateTitleVisible(filmDebate.title!);
    await debatesPage.expectDebateTitleNotVisible(seriesDebate.title!);
  },
);

test(
  '[QA-123][E2E] Prikaz sadržaja debate označene kao spojler van stranice sa detaljima - a) Prikaz na listi debata',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;
    const content = 'Spoiler content shown on the debates list page.';

    await debatesApi.create(
      { title: 'Spoiler debate for list page E2E.', content, parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: true },
      userId,
      token,
    );

    const debatesPage = new DebatesPage(authenticatedPage);
    await debatesPage.goto();
    await debatesPage.expectSpoilerContentBlurred(content);
  },
);

test(
  '[QA-123][E2E] Prikaz sadržaja debate označene kao spojler van stranice sa detaljima - b) Prikaz na profilnom "Debates" tabu',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, debatesApi, usersApi, authApi }) => {
    const authorPayload = buildValidUserPayload();
    const createAuthorResponse = await usersApi.createVerifiedUser(authorPayload);
    const { id: authorId }: { id: number } = await createAuthorResponse.json();
    const authorLoginResponse = await authApi.login({ username: authorPayload.username, password: authorPayload.password });
    const { token: authorToken }: LoginResponse = await authorLoginResponse.json();

    try {
      const content = 'Spoiler content shown on the profile Debates tab.';
      await debatesApi.create(
        { title: 'Spoiler debate for profile tab E2E.', content, parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: true },
        authorId,
        authorToken,
      );

      const publicProfilePage = new PublicProfilePage(authenticatedPage, { username: authorPayload.username, email: authorPayload.email });
      await publicProfilePage.goto(authorId);
      await publicProfilePage.openDebatesTab();
      await publicProfilePage.expectSpoilerContentBlurred(content);
    } finally {
      await usersApi.deleteUser(authorId, authorToken);
    }
  },
);