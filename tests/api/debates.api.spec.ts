import { test, expect } from '../../fixtures/api.fixtures';
import { LoginResponse } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { DebatePost } from '../../models/debate.model';
import { buildFilmPayload } from '../../test-data/film.data';
import { buildSeriesPayload } from '../../test-data/series.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { deleteFilmSafely, deleteSeriesSafely } from '../../utils/filmSeriesCleanup';
import { deleteFilmDebatesIfAny, deleteSeriesDebatesIfAny } from '../../utils/debateCleanup';
import { buildValidUserPayload } from '../../test-data/user.data';
import { UsersApi } from '../../api/users.api';
import { AuthApi } from '../../api/auth.api';

interface SecondVerifiedUser {
  id: number;
  token: string;
}

async function createSecondVerifiedUser(usersApi: UsersApi, authApi: AuthApi): Promise<SecondVerifiedUser> {
  const payload = buildValidUserPayload();
  const createResponse = await usersApi.createVerifiedUser(payload);
  const { id }: { id: number } = await createResponse.json();

  const loginResponse = await authApi.login({ username: payload.username, password: payload.password });
  const { token }: LoginResponse = await loginResponse.json();

  return { id, token };
}

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
  '[QA-106][API] Kreiranje debate sa naslovom, tagovima i opcijom obeležavanja spojlera',
  { tag: ['@api', '@smoke'] },
  async ({ debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await test.step('a) Film', async () => {
      const response = await debatesApi.create(
        {
          title: 'Automated test debate for film.',
          content: 'Automated test debate content for film.',
          parentId: null,
          filmId: createdFilm.id,
          seriesId: null,
          tags: ['Spoiler', 'Theory'],
          isSpoiler: true,
        },
        userId,
        token,
      );

      expect.soft(response.status()).toBe(200);
      const body: DebatePost = await response.json();
      expect.soft(body.title).toBe('Automated test debate for film.');
      expect.soft(body.content).toBe('Automated test debate content for film.');
      expect.soft(body.parentId).toBeNull();
      expect.soft(body.userId).toBe(userId);
      expect.soft(body.filmId).toBe(createdFilm.id);
      expect.soft(body.seriesId).toBeNull();
      expect.soft(body.tags).toEqual(['Spoiler', 'Theory']);
      expect.soft(body.isSpoiler).toBe(true);
      expect.soft(body.viewCount).toBe(0);
      expect.soft(body.likesCount).toBe(0);
      expect.soft(body.replyCount).toBe(0);
      expect.soft(body.isLikedByUser).toBe(false);
      expect.soft(body.replies).toEqual([]);

      const getResponse = await debatesApi.getById(body.id);
      expect.soft(getResponse.status()).toBe(200);
      const fetched: DebatePost = await getResponse.json();
      expect.soft(fetched.id).toBe(body.id);
    });

    await test.step('b) Series', async () => {
      const response = await debatesApi.create(
        {
          title: 'Automated test debate for series.',
          content: 'Automated test debate content for series.',
          parentId: null,
          filmId: null,
          seriesId: createdSeries.id,
          tags: ['Ending'],
          isSpoiler: false,
        },
        userId,
        token,
      );

      expect.soft(response.status()).toBe(200);
      const body: DebatePost = await response.json();
      expect.soft(body.title).toBe('Automated test debate for series.');
      expect.soft(body.content).toBe('Automated test debate content for series.');
      expect.soft(body.parentId).toBeNull();
      expect.soft(body.userId).toBe(userId);
      expect.soft(body.filmId).toBeNull();
      expect.soft(body.seriesId).toBe(createdSeries.id);
      expect.soft(body.tags).toEqual(['Ending']);
      expect.soft(body.isSpoiler).toBe(false);
      expect.soft(body.viewCount).toBe(0);
      expect.soft(body.likesCount).toBe(0);
      expect.soft(body.replyCount).toBe(0);
      expect.soft(body.isLikedByUser).toBe(false);
      expect.soft(body.replies).toEqual([]);

      const getResponse = await debatesApi.getById(body.id);
      expect.soft(getResponse.status()).toBe(200);
      const fetched: DebatePost = await getResponse.json();
      expect.soft(fetched.id).toBe(body.id);
    });
  },
);

test(
  '[QA-107][API] Odgovaranje na debatu (ugnježdeni replies)',
  { tag: ['@api', '@smoke'] },
  async ({ debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const rootResponse = await debatesApi.create(
      {
        title: 'Root debate for replies.',
        content: 'Root debate content.',
        parentId: null,
        filmId: createdFilm.id,
        seriesId: null,
        tags: [],
        isSpoiler: false,
      },
      userId,
      token,
    );
    const root: DebatePost = await rootResponse.json();

    let firstReply!: DebatePost;

    await test.step('a) Reply na root debatu', async () => {
      const response = await debatesApi.create(
        {
          title: null,
          content: 'Reply to root debate.',
          parentId: root.id,
          filmId: null,
          seriesId: null,
          tags: [],
          isSpoiler: false,
        },
        userId,
        token,
      );

      expect.soft(response.status()).toBe(200);
      firstReply = await response.json();
      expect.soft(firstReply.parentId).toBe(root.id);
      expect.soft(firstReply.title).toBeNull();
      expect.soft(firstReply.filmId).toBeNull();
      expect.soft(firstReply.seriesId).toBeNull();
      expect.soft(firstReply.tags).toEqual([]);
      expect.soft(firstReply.isSpoiler).toBe(false);
    });

    await test.step('b) Reply na reply (dvostruko ugnježdeno)', async () => {
      const response = await debatesApi.create(
        {
          title: null,
          content: 'Reply to the first reply.',
          parentId: firstReply.id,
          filmId: null,
          seriesId: null,
          tags: [],
          isSpoiler: false,
        },
        userId,
        token,
      );

      expect.soft(response.status()).toBe(200);
      const secondReply: DebatePost = await response.json();
      expect.soft(secondReply.parentId).toBe(firstReply.id);
      expect.soft(secondReply.title).toBeNull();

      const threadResponse = await debatesApi.getById(root.id);
      expect.soft(threadResponse.status()).toBe(200);
      const thread: DebatePost = await threadResponse.json();
      const nestedFirstReply = thread.replies.find((r) => r.id === firstReply.id);
      expect.soft(nestedFirstReply).toBeTruthy();
      expect.soft(nestedFirstReply?.replies.some((r) => r.id === secondReply.id)).toBe(true);
    });
  },
);

test(
  '[QA-108][API] Pregled i filtriranje liste debata — sortiranje i filtriranje po filmu/seriji',
  { tag: ['@api'] },
  async ({ debatesApi, verifiedTestUser, usersApi, authApi }) => {
    const { id: userId, token } = verifiedTestUser;
    const { id: secondUserId, token: secondToken } = await createSecondVerifiedUser(usersApi, authApi);
    let seriesDebate!: DebatePost;

    try {
      await test.step('a) Sortiranje — Newest', async () => {
        const olderResponse = await debatesApi.create(
          { title: 'Older debate.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
          userId,
          token,
        );
        const older: DebatePost = await olderResponse.json();

        const newerResponse = await debatesApi.create(
          { title: 'Newer debate.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
          userId,
          token,
        );
        const newer: DebatePost = await newerResponse.json();

        const response = await debatesApi.getAll({ sort: 'newest' });
        expect.soft(response.status()).toBe(200);
        const debates: DebatePost[] = await response.json();
        const newerIndex = debates.findIndex((d) => d.id === newer.id);
        const olderIndex = debates.findIndex((d) => d.id === older.id);
        expect.soft(newerIndex).toBeGreaterThanOrEqual(0);
        expect.soft(olderIndex).toBeGreaterThanOrEqual(0);
        expect.soft(newerIndex).toBeLessThan(olderIndex);
      });

      await test.step('b) Sortiranje — Most Liked', async () => {
        const lessLikedResponse = await debatesApi.create(
          { title: 'Less liked debate.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
          userId,
          token,
        );
        const lessLiked: DebatePost = await lessLikedResponse.json();

        const moreLikedResponse = await debatesApi.create(
          { title: 'More liked debate.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
          userId,
          token,
        );
        const moreLiked: DebatePost = await moreLikedResponse.json();

        await debatesApi.toggleLike(moreLiked.id, userId, token);
        await debatesApi.toggleLike(moreLiked.id, secondUserId, secondToken);

        const response = await debatesApi.getAll({ sort: 'mostliked' });
        expect.soft(response.status()).toBe(200);
        const debates: DebatePost[] = await response.json();
        const moreLikedIndex = debates.findIndex((d) => d.id === moreLiked.id);
        const lessLikedIndex = debates.findIndex((d) => d.id === lessLiked.id);
        expect.soft(moreLikedIndex).toBeGreaterThanOrEqual(0);
        expect.soft(lessLikedIndex).toBeGreaterThanOrEqual(0);
        expect.soft(moreLikedIndex).toBeLessThan(lessLikedIndex);
      });

      await test.step('c) Sortiranje — Most Commented', async () => {
        const lessCommentedResponse = await debatesApi.create(
          { title: 'Less commented debate.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
          userId,
          token,
        );
        const lessCommented: DebatePost = await lessCommentedResponse.json();

        const moreCommentedResponse = await debatesApi.create(
          { title: 'More commented debate.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
          userId,
          token,
        );
        const moreCommented: DebatePost = await moreCommentedResponse.json();

        await debatesApi.create(
          { title: null, content: 'Reply one.', parentId: moreCommented.id, filmId: null, seriesId: null, tags: [], isSpoiler: false },
          userId,
          token,
        );
        await debatesApi.create(
          { title: null, content: 'Reply two.', parentId: moreCommented.id, filmId: null, seriesId: null, tags: [], isSpoiler: false },
          userId,
          token,
        );

        const response = await debatesApi.getAll({ sort: 'mostcommented' });
        expect.soft(response.status()).toBe(200);
        const debates: DebatePost[] = await response.json();
        const moreCommentedIndex = debates.findIndex((d) => d.id === moreCommented.id);
        const lessCommentedIndex = debates.findIndex((d) => d.id === lessCommented.id);
        expect.soft(moreCommentedIndex).toBeGreaterThanOrEqual(0);
        expect.soft(lessCommentedIndex).toBeGreaterThanOrEqual(0);
        expect.soft(moreCommentedIndex).toBeLessThan(lessCommentedIndex);
      });

      await test.step('d) Sortiranje — Trending', async () => {
        const lowEngagementResponse = await debatesApi.create(
          { title: 'Low engagement debate.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
          userId,
          token,
        );
        const lowEngagement: DebatePost = await lowEngagementResponse.json();

        const highEngagementResponse = await debatesApi.create(
          { title: 'High engagement debate.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
          userId,
          token,
        );
        const highEngagement: DebatePost = await highEngagementResponse.json();

        await debatesApi.toggleLike(highEngagement.id, userId, token);
        await debatesApi.toggleLike(highEngagement.id, secondUserId, secondToken);
        await debatesApi.create(
          { title: null, content: 'Trending reply.', parentId: highEngagement.id, filmId: null, seriesId: null, tags: [], isSpoiler: false },
          userId,
          token,
        );

        const response = await debatesApi.getAll({ sort: 'trending' });
        expect.soft(response.status()).toBe(200);
        const debates: DebatePost[] = await response.json();
        const highIndex = debates.findIndex((d) => d.id === highEngagement.id);
        const lowIndex = debates.findIndex((d) => d.id === lowEngagement.id);
        expect.soft(highIndex).toBeGreaterThanOrEqual(0);
        expect.soft(lowIndex).toBeGreaterThanOrEqual(0);
        expect.soft(highIndex).toBeLessThan(lowIndex);
      });

      await test.step('e) Filtriranje po filmu', async () => {
        const filmDebateResponse = await debatesApi.create(
          { title: 'Film-only debate.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
          userId,
          token,
        );
        const filmDebate: DebatePost = await filmDebateResponse.json();

        const seriesDebateResponse = await debatesApi.create(
          { title: 'Series-only debate.', content: 'Content.', parentId: null, filmId: null, seriesId: createdSeries.id, tags: [], isSpoiler: false },
          userId,
          token,
        );
        seriesDebate = await seriesDebateResponse.json();

        const response = await debatesApi.getAll({ filmId: createdFilm.id });
        expect.soft(response.status()).toBe(200);
        const debates: DebatePost[] = await response.json();
        expect.soft(debates.every((d) => d.filmId === createdFilm.id)).toBe(true);
        expect.soft(debates.some((d) => d.id === filmDebate.id)).toBe(true);
        expect.soft(debates.some((d) => d.id === seriesDebate.id)).toBe(false);
      });

      await test.step('f) Filtriranje po seriji', async () => {
        const response = await debatesApi.getAll({ seriesId: createdSeries.id });
        expect.soft(response.status()).toBe(200);
        const debates: DebatePost[] = await response.json();
        expect.soft(debates.every((d) => d.seriesId === createdSeries.id)).toBe(true);
        expect.soft(debates.some((d) => d.id === seriesDebate.id)).toBe(true);
        expect.soft(debates.some((d) => d.filmId !== null)).toBe(false);
      });
    } finally {
      await usersApi.deleteUser(secondUserId, secondToken);
    }
  },
);

test(
  '[QA-109][API] Pregled pojedinačne debate (thread) sa ugnježdenim replies',
  { tag: ['@api', '@smoke'] },
  async ({ debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const rootResponse = await debatesApi.create(
      {
        title: 'Thread root debate.',
        content: 'Thread root content.',
        parentId: null,
        filmId: createdFilm.id,
        seriesId: null,
        tags: ['Theory'],
        isSpoiler: false,
      },
      userId,
      token,
    );
    const root: DebatePost = await rootResponse.json();

    const firstReplyResponse = await debatesApi.create(
      { title: null, content: 'First-level reply.', parentId: root.id, filmId: null, seriesId: null, tags: [], isSpoiler: false },
      userId,
      token,
    );
    const firstReply: DebatePost = await firstReplyResponse.json();

    const secondReplyResponse = await debatesApi.create(
      { title: null, content: 'Second-level reply.', parentId: firstReply.id, filmId: null, seriesId: null, tags: [], isSpoiler: false },
      userId,
      token,
    );
    const secondReply: DebatePost = await secondReplyResponse.json();

    const response = await debatesApi.getById(root.id, userId);

    expect.soft(response.status()).toBe(200);
    const thread: DebatePost = await response.json();

    expect.soft(thread.id).toBe(root.id);
    expect.soft(thread.title).toBe('Thread root debate.');
    expect.soft(thread.content).toBe('Thread root content.');
    expect.soft(thread.userId).toBe(userId);
    expect.soft(thread.username).toBe(verifiedTestUser.payload.username);
    expect.soft(thread.filmId).toBe(createdFilm.id);
    expect.soft(thread.seriesId).toBeNull();
    expect.soft(thread.tags).toEqual(['Theory']);
    expect.soft(thread.isSpoiler).toBe(false);
    expect.soft(thread.viewCount).toBe(0);
    expect.soft(thread.likesCount).toBe(0);
    expect.soft(thread.replyCount).toBe(1);
    expect.soft(thread.isLikedByUser).toBe(false);

    const nestedFirstReply = thread.replies.find((r) => r.id === firstReply.id);
    expect.soft(nestedFirstReply).toBeTruthy();
    expect.soft(nestedFirstReply?.content).toBe('First-level reply.');
    expect.soft(nestedFirstReply?.parentId).toBe(root.id);

    const nestedSecondReply = nestedFirstReply?.replies.find((r) => r.id === secondReply.id);
    expect.soft(nestedSecondReply).toBeTruthy();
    expect.soft(nestedSecondReply?.content).toBe('Second-level reply.');
    expect.soft(nestedSecondReply?.parentId).toBe(firstReply.id);
  },
);

test(
  '[QA-110][API] Lajkovanje i uklanjanje lajka objave (toggle)',
  { tag: ['@api', '@smoke'] },
  async ({ debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const createResponse = await debatesApi.create(
      { title: 'Debate to like.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
      userId,
      token,
    );
    const debate: DebatePost = await createResponse.json();

    const likeResponse = await debatesApi.toggleLike(debate.id, userId, token);
    expect.soft(likeResponse.status()).toBe(200);

    const afterLikeResponse = await debatesApi.getById(debate.id, userId);
    const afterLike: DebatePost = await afterLikeResponse.json();
    expect.soft(afterLike.isLikedByUser).toBe(true);
    expect.soft(afterLike.likesCount).toBe(1);

    const unlikeResponse = await debatesApi.toggleLike(debate.id, userId, token);
    expect.soft(unlikeResponse.status()).toBe(200);

    const afterUnlikeResponse = await debatesApi.getById(debate.id, userId);
    const afterUnlike: DebatePost = await afterUnlikeResponse.json();
    expect.soft(afterUnlike.isLikedByUser).toBe(false);
    expect.soft(afterUnlike.likesCount).toBe(0);
  },
);

test(
  '[QA-111][API] Brojanje pregleda debate',
  { tag: ['@api'] },
  async ({ debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const createResponse = await debatesApi.create(
      { title: 'Debate to view.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
      userId,
      token,
    );
    const debate: DebatePost = await createResponse.json();
    const initialViewCount = debate.viewCount;

    const response = await debatesApi.incrementView(debate.id);
    expect.soft(response.status()).toBe(204);

    const getResponse = await debatesApi.getById(debate.id);
    const afterView: DebatePost = await getResponse.json();
    expect.soft(afterView.viewCount).toBe(initialViewCount + 1);
  },
);

test(
  '[QA-112][API] Brisanje sopstvene debate i njenih replies',
  { tag: ['@api', '@smoke'] },
  async ({ debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const rootResponse = await debatesApi.create(
      { title: 'Debate to delete.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
      userId,
      token,
    );
    const root: DebatePost = await rootResponse.json();

    const replyResponse = await debatesApi.create(
      { title: null, content: 'Reply to be cascade-deleted.', parentId: root.id, filmId: null, seriesId: null, tags: [], isSpoiler: false },
      userId,
      token,
    );
    const reply: DebatePost = await replyResponse.json();

    const deleteResponse = await debatesApi.delete(root.id, token);
    expect.soft(deleteResponse.status()).toBe(204);

    const getRootResponse = await debatesApi.getById(root.id);
    expect.soft(getRootResponse.status()).toBe(404);

    const getReplyResponse = await debatesApi.getById(reply.id);
    expect.soft(getReplyResponse.status()).toBe(404);
  },
);

test(
  '[QA-113][API] Kreiranje debate bez autentifikacije',
  { tag: ['@api', '@authorization'] },
  async ({ debatesApi }) => {
    await test.step('a) Film', async () => {
      const response = await debatesApi.create(
        { title: 'No auth film debate.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
        1,
      );
      expect.soft(response.status()).toBe(401);
    });

    await test.step('b) Series', async () => {
      const response = await debatesApi.create(
        { title: 'No auth series debate.', content: 'Content.', parentId: null, filmId: null, seriesId: createdSeries.id, tags: [], isSpoiler: false },
        1,
      );
      expect.soft(response.status()).toBe(401);
    });
  },
);

test(
  '[QA-114][API] Kreiranje debate sa praznim tekstom',
  { tag: ['@api'] },
  async ({ debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const response = await debatesApi.create(
      { title: 'Empty content debate.', content: '', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
      userId,
      token,
    );
    expect.soft(response.status()).toBe(400);

    const filmDebatesResponse = await debatesApi.getByFilmId(createdFilm.id);
    const filmDebates: DebatePost[] = await filmDebatesResponse.json();
    expect.soft(filmDebates.some((d) => d.userId === userId && d.content === '')).toBe(false);
  },
);

test(
  '[QA-115][API] Odgovaranje na nepostojeću debatu',
  { tag: ['@api'] },
  async ({ debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;
    const nonExistentId = 999999;

    const response = await debatesApi.create(
      { title: null, content: 'Reply to a nonexistent parent.', parentId: nonExistentId, filmId: null, seriesId: null, tags: [], isSpoiler: false },
      userId,
      token,
    );
    expect.soft(response.status()).toBe(400);
  },
);

test(
  '[QA-116][API] Kreiranje debate za nepostojeći film/seriju',
  { tag: ['@api'] },
  async ({ debatesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;
    const nonExistentId = 999999;

    await test.step('a) Film', async () => {
      const response = await debatesApi.create(
        { title: 'Debate for nonexistent film.', content: 'Content.', parentId: null, filmId: nonExistentId, seriesId: null, tags: [], isSpoiler: false },
        userId,
        token,
      );
      expect.soft(response.status()).toBe(400);
    });

    await test.step('b) Series', async () => {
      const response = await debatesApi.create(
        { title: 'Debate for nonexistent series.', content: 'Content.', parentId: null, filmId: null, seriesId: nonExistentId, tags: [], isSpoiler: false },
        userId,
        token,
      );
      expect.soft(response.status()).toBe(400);
    });
  },
);

test(
  '[QA-117][API] Brisanje tuđe debate od strane regularnog korisnika',
  { tag: ['@api', '@authorization'] },
  async ({ debatesApi, verifiedTestUser, usersApi, authApi }) => {
    const { id: ownerId, token: ownerToken } = verifiedTestUser;
    const { id: otherUserId, token: otherUserToken } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      const createResponse = await debatesApi.create(
        { title: 'Owner debate to protect from deletion.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
        ownerId,
        ownerToken,
      );
      const debate: DebatePost = await createResponse.json();

      const response = await debatesApi.delete(debate.id, otherUserToken);
      expect.soft(response.status()).toBe(403);

      const afterResponse = await debatesApi.getById(debate.id);
      expect.soft(afterResponse.status()).toBe(200);
    } finally {
      await usersApi.deleteUser(otherUserId, otherUserToken);
    }
  },
);

test(
  '[QA-121][API] Filtriranje liste debata po korisniku',
  { tag: ['@api'] },
  async ({ debatesApi, verifiedTestUser, usersApi, authApi }) => {
    const { id: userAId, token: userAToken } = verifiedTestUser;
    const { id: userBId, token: userBToken } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      const debateAResponse = await debatesApi.create(
        { title: 'User A debate.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
        userAId,
        userAToken,
      );
      const debateA: DebatePost = await debateAResponse.json();

      const debateBResponse = await debatesApi.create(
        { title: 'User B debate.', content: 'Content.', parentId: null, filmId: createdFilm.id, seriesId: null, tags: [], isSpoiler: false },
        userBId,
        userBToken,
      );
      const debateB: DebatePost = await debateBResponse.json();

      const response = await debatesApi.getAll({ userId: userAId });
      expect.soft(response.status()).toBe(200);
      const debates: DebatePost[] = await response.json();
      expect.soft(debates.every((d) => d.userId === userAId)).toBe(true);
      expect.soft(debates.some((d) => d.id === debateA.id)).toBe(true);
      expect.soft(debates.some((d) => d.id === debateB.id)).toBe(false);
    } finally {
      await usersApi.deleteUser(userBId, userBToken);
    }
  },
);