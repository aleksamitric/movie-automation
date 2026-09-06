import { test, expect } from '../../fixtures/api.fixtures';
import { LoginResponse } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { Comment } from '../../models/comment.model';
import { buildFilmPayload } from '../../test-data/film.data';
import { buildSeriesPayload } from '../../test-data/series.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { deleteFilmSafely, deleteSeriesSafely } from '../../utils/filmSeriesCleanup';
import { deleteFilmCommentsIfAny, deleteSeriesCommentsIfAny } from '../../utils/commentCleanup';
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
  '[QA-91][API] Kreiranje komentara za film/seriju sa validnim tekstom',
  { tag: ['@api', '@smoke'] },
  async ({ commentsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await test.step('a) Film', async () => {
      const text = 'Automated test comment for film.';
      const response = await commentsApi.createForFilm({ userId, filmId: createdFilm.id, text }, token);

      expect.soft(response.status()).toBe(200);
      expect.soft(await response.text()).toBe('Comment added successfully.');

      const filmCommentsResponse = await commentsApi.getByFilmId(createdFilm.id);
      expect.soft(filmCommentsResponse.status()).toBe(200);
      const comments: Comment[] = await filmCommentsResponse.json();
      expect.soft(comments.some((c) => c.text === text && c.userId === userId)).toBe(true);
    });

    await test.step('b) Series', async () => {
      const text = 'Automated test comment for series.';
      const response = await commentsApi.createForSeries({ userId, seriesId: createdSeries.id, text }, token);

      expect.soft(response.status()).toBe(200);
      expect.soft(await response.text()).toBe('Comment added successfully.');

      const seriesCommentsResponse = await commentsApi.getBySeriesId(createdSeries.id);
      expect.soft(seriesCommentsResponse.status()).toBe(200);
      const comments: Comment[] = await seriesCommentsResponse.json();
      expect.soft(comments.some((c) => c.text === text && c.userId === userId)).toBe(true);
    });
  },
);

test(
  '[QA-92][API] Izmena postojećeg komentara od strane vlasnika',
  { tag: ['@api', '@smoke'] },
  async ({ commentsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const originalText = 'Original comment text.';
    await commentsApi.createForFilm({ userId, filmId: createdFilm.id, text: originalText }, token);
    const filmComments: Comment[] = await (await commentsApi.getByFilmId(createdFilm.id)).json();
    const { id: commentId } = filmComments.find((c) => c.text === originalText)!;

    const updatedText = 'Updated comment text.';
    const response = await commentsApi.update(commentId, { text: updatedText }, token);

    expect.soft(response.status()).toBe(200);
    expect.soft(await response.text()).toBe('Comment successfully updated.');

    const getResponse = await commentsApi.getById(commentId);
    const comment: Comment = await getResponse.json();
    expect.soft(comment.text).toBe(updatedText);
  },
);

test(
  '[QA-93][API] Brisanje postojećeg komentara od strane vlasnika',
  { tag: ['@api', '@smoke'] },
  async ({ commentsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const text = 'Comment to be deleted.';
    await commentsApi.createForFilm({ userId, filmId: createdFilm.id, text }, token);
    const filmComments: Comment[] = await (await commentsApi.getByFilmId(createdFilm.id)).json();
    const { id: commentId } = filmComments.find((c) => c.text === text)!;

    const deleteResponse = await commentsApi.delete(commentId, token);
    expect.soft(deleteResponse.status()).toBe(200);
    expect.soft(await deleteResponse.text()).toBe('Comment successfully deleted.');

    const getResponse = await commentsApi.getById(commentId);
    expect.soft(getResponse.status()).toBe(404);
  },
);

test(
  '[QA-94][API] Pregled svih komentara za film/seriju',
  { tag: ['@api'] },
  async ({ commentsApi, verifiedTestUser, usersApi, authApi }) => {
    const { id: firstUserId, token: firstUserToken } = verifiedTestUser;
    const { id: secondUserId, token: secondUserToken } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      await test.step('a) Film', async () => {
        await commentsApi.createForFilm({ userId: firstUserId, filmId: createdFilm.id, text: 'First user film comment.' }, firstUserToken);
        await commentsApi.createForFilm({ userId: secondUserId, filmId: createdFilm.id, text: 'Second user film comment.' }, secondUserToken);

        const response = await commentsApi.getByFilmId(createdFilm.id);

        expect.soft(response.status()).toBe(200);
        const comments: Comment[] = await response.json();
        expect.soft(comments.some((c) => c.userId === firstUserId && c.text === 'First user film comment.')).toBe(true);
        expect.soft(comments.some((c) => c.userId === secondUserId && c.text === 'Second user film comment.')).toBe(true);
      });

      await test.step('b) Series', async () => {
        await commentsApi.createForSeries({ userId: firstUserId, seriesId: createdSeries.id, text: 'First user series comment.' }, firstUserToken);
        await commentsApi.createForSeries({ userId: secondUserId, seriesId: createdSeries.id, text: 'Second user series comment.' }, secondUserToken);

        const response = await commentsApi.getBySeriesId(createdSeries.id);

        expect.soft(response.status()).toBe(200);
        const comments: Comment[] = await response.json();
        expect.soft(comments.some((c) => c.userId === firstUserId && c.text === 'First user series comment.')).toBe(true);
        expect.soft(comments.some((c) => c.userId === secondUserId && c.text === 'Second user series comment.')).toBe(true);
      });
    } finally {
      await usersApi.deleteUser(secondUserId, secondUserToken);
    }
  },
);

test(
  '[QA-95][API] Preuzimanje pojedinačnog komentara po ID-ju',
  { tag: ['@api'] },
  async ({ commentsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const text = 'Comment for GetByID lookup.';
    await commentsApi.createForFilm({ userId, filmId: createdFilm.id, text }, token);
    const filmComments: Comment[] = await (await commentsApi.getByFilmId(createdFilm.id)).json();
    const { id: commentId } = filmComments.find((c) => c.text === text)!;

    await test.step('a) Validan, postojeći ID', async () => {
      const response = await commentsApi.getById(commentId);

      expect.soft(response.status()).toBe(200);
      const comment: Comment = await response.json();
      expect.soft(comment.id).toBe(commentId);
      expect.soft(comment.userId).toBe(userId);
      expect.soft(comment.text).toBe(text);
    });

    await test.step('b) Nepostojeći ID', async () => {
      const response = await commentsApi.getById(999999);
      expect.soft(response.status()).toBe(404);
    });
  },
);

test(
  '[QA-96][API] Pregled komentara po korisniku',
  { tag: ['@api'] },
  async ({ commentsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const filmCommentText = 'User comment for film.';
    const seriesCommentText = 'User comment for series.';
    await commentsApi.createForFilm({ userId, filmId: createdFilm.id, text: filmCommentText }, token);
    await commentsApi.createForSeries({ userId, seriesId: createdSeries.id, text: seriesCommentText }, token);

    const response = await commentsApi.getByUserId(userId);

    expect.soft(response.status()).toBe(200);
    const comments: Comment[] = await response.json();
    expect.soft(comments.some((c) => c.text === filmCommentText && c.filmId === createdFilm.id)).toBe(true);
    expect.soft(comments.some((c) => c.text === seriesCommentText && c.seriesId === createdSeries.id)).toBe(true);
  },
);

test(
  '[QA-97][API] Preuzimanje svih komentara od strane administratora',
  { tag: ['@api', '@authorization'] },
  async ({ commentsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const text = 'Comment visible via GetAll.';
    await commentsApi.createForFilm({ userId, filmId: createdFilm.id, text }, token);

    await test.step('a) Admin', async () => {
      const response = await commentsApi.getAll(adminToken);

      expect.soft(response.status()).toBe(200);
      const comments: Comment[] = await response.json();
      expect.soft(comments.some((c) => c.userId === userId && c.text === text)).toBe(true);
    });

    await test.step('b) Regularan korisnik', async () => {
      const response = await commentsApi.getAll(token);
      expect.soft(response.status()).toBe(403);
    });
  },
);

test(
  '[QA-98][API] Kreiranje komentara bez autentifikacije',
  { tag: ['@api', '@authorization'] },
  async ({ commentsApi }) => {
    await test.step('a) Film', async () => {
      const response = await commentsApi.createForFilm({ userId: 1, filmId: createdFilm.id, text: 'No auth film comment.' });
      expect.soft(response.status()).toBe(401);
    });

    await test.step('b) Series', async () => {
      const response = await commentsApi.createForSeries({ userId: 1, seriesId: createdSeries.id, text: 'No auth series comment.' });
      expect.soft(response.status()).toBe(401);
    });
  },
);

test(
  '[QA-99][API] Kreiranje komentara sa praznim tekstom',
  { tag: ['@api'] },
  async ({ commentsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const response = await commentsApi.createForFilm({ userId, filmId: createdFilm.id, text: '' }, token);
    expect.soft(response.status()).toBe(400);

    const filmComments: Comment[] = await (await commentsApi.getByFilmId(createdFilm.id)).json();
    expect.soft(filmComments.some((c) => c.userId === userId && c.text === '')).toBe(false);
  },
);

test(
  '[QA-100][API] Kreiranje komentara za nepostojeći film/seriju',
  { tag: ['@api'] },
  async ({ commentsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;
    const nonExistentId = 999999;

    await test.step('a) Film', async () => {
      const response = await commentsApi.createForFilm({ userId, filmId: nonExistentId, text: 'Comment for nonexistent film.' }, token);
      expect.soft(response.status()).toBe(400);

      const getResponse = await commentsApi.getByFilmId(nonExistentId);
      const comments: Comment[] = await getResponse.json();
      expect.soft(comments.some((c) => c.userId === userId)).toBe(false);
    });

    await test.step('b) Series', async () => {
      const response = await commentsApi.createForSeries({ userId, seriesId: nonExistentId, text: 'Comment for nonexistent series.' }, token);
      expect.soft(response.status()).toBe(400);

      const getResponse = await commentsApi.getBySeriesId(nonExistentId);
      const comments: Comment[] = await getResponse.json();
      expect.soft(comments.some((c) => c.userId === userId)).toBe(false);
    });
  },
);

test(
  '[QA-101][API] Izmena i brisanje tuđeg komentara od strane regularnog korisnika - a) Update',
  { tag: ['@api', '@authorization'] },
  async ({ commentsApi, verifiedTestUser, usersApi, authApi }) => {
    const { id: ownerId, token: ownerToken } = verifiedTestUser;
    const { id: otherUserId, token: otherUserToken } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      const originalText = 'Owner comment text.';
      await commentsApi.createForFilm({ userId: ownerId, filmId: createdFilm.id, text: originalText }, ownerToken);
      const filmComments: Comment[] = await (await commentsApi.getByFilmId(createdFilm.id)).json();
      const { id: commentId } = filmComments.find((c) => c.text === originalText)!;

      const response = await commentsApi.update(commentId, { text: 'Hijacked text.' }, otherUserToken);
      expect.soft(response.status()).toBe(403);

      const afterResponse = await commentsApi.getById(commentId);
      const afterComment: Comment = await afterResponse.json();
      expect.soft(afterComment.text).toBe(originalText);
    } finally {
      await usersApi.deleteUser(otherUserId, otherUserToken);
    }
  },
);

test(
  '[QA-101][API] Izmena i brisanje tuđeg komentara od strane regularnog korisnika - b) Delete',
  { tag: ['@api', '@authorization'] },
  async ({ commentsApi, verifiedTestUser, usersApi, authApi }) => {
    const { id: ownerId, token: ownerToken } = verifiedTestUser;
    const { id: otherUserId, token: otherUserToken } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      const text = 'Owner comment to protect from deletion.';
      await commentsApi.createForFilm({ userId: ownerId, filmId: createdFilm.id, text }, ownerToken);
      const filmComments: Comment[] = await (await commentsApi.getByFilmId(createdFilm.id)).json();
      const { id: commentId } = filmComments.find((c) => c.text === text)!;

      const response = await commentsApi.delete(commentId, otherUserToken);
      expect.soft(response.status()).toBe(403);

      const afterResponse = await commentsApi.getById(commentId);
      expect.soft(afterResponse.status()).toBe(200);
    } finally {
      await usersApi.deleteUser(otherUserId, otherUserToken);
    }
  },
);

test(
  '[QA-102][API] Izmena i brisanje nepostojećeg komentara - a) Update',
  { tag: ['@api'] },
  async ({ commentsApi, verifiedTestUser }) => {
    const response = await commentsApi.update(999999, { text: 'Updated text.' }, verifiedTestUser.token);
    expect.soft(response.status()).toBe(404);
  },
);

test(
  '[QA-102][API] Izmena i brisanje nepostojećeg komentara - b) Delete',
  { tag: ['@api'] },
  async ({ commentsApi, verifiedTestUser }) => {
    const response = await commentsApi.delete(999999, verifiedTestUser.token);
    expect.soft(response.status()).toBe(404);
  },
);

test(
  '[QA-103][API] Ograničenje učestalosti kreiranja komentara za isti film/seriju',
  { tag: ['@api'] },
  async ({ commentsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const firstResponse = await commentsApi.createForFilm({ userId, filmId: createdFilm.id, text: 'First comment.' }, token);
    expect.soft(firstResponse.status()).toBe(200);

    const secondResponse = await commentsApi.createForFilm({ userId, filmId: createdFilm.id, text: 'Second comment immediately after.' }, token);
    expect.soft(secondResponse.status()).toBe(400);
    expect.soft(await secondResponse.text()).toBe('You can only post comment every 2 minutes');

    const thirdResponse = await commentsApi.createForSeries({ userId, seriesId: createdSeries.id, text: 'Comment on a different title.' }, token);
    expect.soft(thirdResponse.status()).toBe(200);
  },
);
