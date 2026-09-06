import { test, expect } from '../../fixtures/api.fixtures';
import { LoginResponse } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { Rating } from '../../models/rating.model';
import { PrivacySettings } from '../../models/user.model';
import { buildFilmPayload } from '../../test-data/film.data';
import { buildSeriesPayload } from '../../test-data/series.data';
import { buildValidUserPayload } from '../../test-data/user.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { deleteFilmSafely, deleteSeriesSafely } from '../../utils/filmSeriesCleanup';
import { deleteFilmRatingIfAny, deleteSeriesRatingIfAny } from '../../utils/ratingCleanup';
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
  '[QA-76][API] Kreiranje ocene za film/seriju sa validnom vrednošću',
  { tag: ['@api', '@smoke'] },
  async ({ ratingsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await test.step('a) Film', async () => {
      const response = await ratingsApi.createForFilm({ userId, filmId: createdFilm.id, value: 7 }, token);

      expect.soft(response.status()).toBe(200);
      expect.soft(await response.text()).toBe('Rating added successfully.');

      const getResponse = await ratingsApi.getUserFilmRating(userId, createdFilm.id);
      expect.soft(getResponse.status()).toBe(200);
      const rating: Rating = await getResponse.json();
      expect.soft(rating.value).toBe(7);
    });

    await test.step('b) Series', async () => {
      const response = await ratingsApi.createForSeries({ userId, seriesId: createdSeries.id, value: 8 }, token);

      expect.soft(response.status()).toBe(200);
      expect.soft(await response.text()).toBe('Rating added successfully.');

      const getResponse = await ratingsApi.getUserSeriesRating(userId, createdSeries.id);
      expect.soft(getResponse.status()).toBe(200);
      const rating: Rating = await getResponse.json();
      expect.soft(rating.value).toBe(8);
    });
  },
);

test(
  '[QA-78][API] Ograničenje jedne ocene po korisniku po naslovu',
  { tag: ['@api'] },
  async ({ ratingsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await test.step('a) Film', async () => {
      await ratingsApi.createForFilm({ userId, filmId: createdFilm.id, value: 7 }, token);

      const response = await ratingsApi.createForFilm({ userId, filmId: createdFilm.id, value: 3 }, token);
      expect.soft(response.status()).toBe(400);
      expect.soft(await response.text()).toBe('You have already rated this film');

      const getResponse = await ratingsApi.getUserFilmRating(userId, createdFilm.id);
      const rating: Rating = await getResponse.json();
      expect.soft(rating.value).toBe(7);
    });

    await test.step('b) Series', async () => {
      await ratingsApi.createForSeries({ userId, seriesId: createdSeries.id, value: 6 }, token);

      const response = await ratingsApi.createForSeries({ userId, seriesId: createdSeries.id, value: 2 }, token);
      expect.soft(response.status()).toBe(400);
      expect.soft(await response.text()).toBe('You have already rated this series');

      const getResponse = await ratingsApi.getUserSeriesRating(userId, createdSeries.id);
      const rating: Rating = await getResponse.json();
      expect.soft(rating.value).toBe(6);
    });
  },
);

test(
  '[QA-79][API] Izmena postojeće ocene od strane vlasnika',
  { tag: ['@api', '@smoke'] },
  async ({ ratingsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await ratingsApi.createForFilm({ userId, filmId: createdFilm.id, value: 5 }, token);
    const existingRatingResponse = await ratingsApi.getUserFilmRating(userId, createdFilm.id);
    const { id: ratingId }: Rating = await existingRatingResponse.json();

    const response = await ratingsApi.updateRating(ratingId, { value: 9 }, token);

    expect.soft(response.status()).toBe(200);
    expect.soft(await response.text()).toBe('Rating successfully updated.');

    const getResponse = await ratingsApi.getById(ratingId);
    const rating: Rating = await getResponse.json();
    expect.soft(rating.value).toBe(9);
  },
);

test(
  '[QA-80][API] Brisanje postojeće ocene od strane vlasnika',
  { tag: ['@api', '@smoke'] },
  async ({ ratingsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await ratingsApi.createForFilm({ userId, filmId: createdFilm.id, value: 6 }, token);
    const existingRatingResponse = await ratingsApi.getUserFilmRating(userId, createdFilm.id);
    const { id: ratingId }: Rating = await existingRatingResponse.json();

    const deleteResponse = await ratingsApi.deleteRating(ratingId, token);
    expect.soft(deleteResponse.status()).toBe(200);
    expect.soft(await deleteResponse.text()).toBe('Rating successfully deleted.');

    const getResponse = await ratingsApi.getById(ratingId);
    expect.soft(getResponse.status()).toBe(404);
  },
);

test(
  '[QA-81][API] Pregled svih ocena za film/seriju',
  { tag: ['@api'] },
  async ({ ratingsApi, verifiedTestUser, usersApi, authApi }) => {
    const { id: firstUserId, token: firstUserToken } = verifiedTestUser;
    const { id: secondUserId, token: secondUserToken } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      await test.step('a) Film', async () => {
        await ratingsApi.createForFilm({ userId: firstUserId, filmId: createdFilm.id, value: 4 }, firstUserToken);
        await ratingsApi.createForFilm({ userId: secondUserId, filmId: createdFilm.id, value: 8 }, secondUserToken);

        const response = await ratingsApi.getByFilmId(createdFilm.id);

        expect.soft(response.status()).toBe(200);
        const ratings: Rating[] = await response.json();
        expect.soft(ratings.some((r) => r.userId === firstUserId && r.value === 4)).toBe(true);
        expect.soft(ratings.some((r) => r.userId === secondUserId && r.value === 8)).toBe(true);
      });

      await test.step('b) Series', async () => {
        await ratingsApi.createForSeries({ userId: firstUserId, seriesId: createdSeries.id, value: 5 }, firstUserToken);
        await ratingsApi.createForSeries({ userId: secondUserId, seriesId: createdSeries.id, value: 9 }, secondUserToken);

        const response = await ratingsApi.getBySeriesId(createdSeries.id);

        expect.soft(response.status()).toBe(200);
        const ratings: Rating[] = await response.json();
        expect.soft(ratings.some((r) => r.userId === firstUserId && r.value === 5)).toBe(true);
        expect.soft(ratings.some((r) => r.userId === secondUserId && r.value === 9)).toBe(true);
      });
    } finally {
      await deleteFilmRatingIfAny(ratingsApi, secondUserId, createdFilm.id, secondUserToken);
      await deleteSeriesRatingIfAny(ratingsApi, secondUserId, createdSeries.id, secondUserToken);
      await usersApi.deleteUser(secondUserId, secondUserToken);
    }
  },
);

test(
  '[QA-82][API] Preuzimanje pojedinačne ocene po ID-ju',
  { tag: ['@api'] },
  async ({ ratingsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await ratingsApi.createForFilm({ userId, filmId: createdFilm.id, value: 6 }, token);
    const existingRatingResponse = await ratingsApi.getUserFilmRating(userId, createdFilm.id);
    const { id: ratingId }: Rating = await existingRatingResponse.json();

    await test.step('a) Validan, postojeći ID', async () => {
      const response = await ratingsApi.getById(ratingId);

      expect.soft(response.status()).toBe(200);
      const rating: Rating = await response.json();
      expect.soft(rating.id).toBe(ratingId);
      expect.soft(rating.userId).toBe(userId);
      expect.soft(rating.value).toBe(6);
    });

    await test.step('b) Nepostojeći ID', async () => {
      const response = await ratingsApi.getById(999999);
      expect.soft(response.status()).toBe(404);
    });
  },
);

test(
  '[QA-83][API] Pregled ocena po korisniku',
  { tag: ['@api'] },
  async ({ ratingsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await ratingsApi.createForFilm({ userId, filmId: createdFilm.id, value: 3 }, token);
    await ratingsApi.createForSeries({ userId, seriesId: createdSeries.id, value: 7 }, token);

    await test.step('a) Sve ocene korisnika', async () => {
      const response = await ratingsApi.getByUserId(userId);

      expect.soft(response.status()).toBe(200);
      const ratings: Rating[] = await response.json();
      expect.soft(ratings.some((r) => r.filmId === createdFilm.id && r.value === 3)).toBe(true);
      expect.soft(ratings.some((r) => r.seriesId === createdSeries.id && r.value === 7)).toBe(true);
    });

    await test.step('b) Ocena korisnika za konkretan film', async () => {
      const response = await ratingsApi.getUserFilmRating(userId, createdFilm.id);

      expect.soft(response.status()).toBe(200);
      const rating: Rating = await response.json();
      expect.soft(rating.value).toBe(3);
    });

    await test.step('c) Ocena korisnika za konkretnu seriju', async () => {
      const response = await ratingsApi.getUserSeriesRating(userId, createdSeries.id);

      expect.soft(response.status()).toBe(200);
      const rating: Rating = await response.json();
      expect.soft(rating.value).toBe(7);
    });
  },
);

test(
  '[QA-84][API] Preuzimanje svih ocena od strane administratora',
  { tag: ['@api', '@authorization'] },
  async ({ ratingsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await ratingsApi.createForFilm({ userId, filmId: createdFilm.id, value: 5 }, token);

    await test.step('a) Admin', async () => {
      const response = await ratingsApi.getAll(adminToken);

      expect.soft(response.status()).toBe(200);
      const ratings: Rating[] = await response.json();
      expect.soft(ratings.some((r) => r.userId === userId && r.filmId === createdFilm.id)).toBe(true);
    });

    await test.step('b) Regularan korisnik', async () => {
      const response = await ratingsApi.getAll(token);
      expect.soft(response.status()).toBe(403);
    });
  },
);

test(
  '[QA-85][API] Kreiranje ocene bez autentifikacije',
  { tag: ['@api', '@authorization'] },
  async ({ ratingsApi }) => {
    await test.step('a) Film', async () => {
      const response = await ratingsApi.createForFilm({ userId: 1, filmId: createdFilm.id, value: 7 });
      expect.soft(response.status()).toBe(401);
    });

    await test.step('b) Series', async () => {
      const response = await ratingsApi.createForSeries({ userId: 1, seriesId: createdSeries.id, value: 7 });
      expect.soft(response.status()).toBe(401);
    });
  },
);

test(
  '[QA-86][API] Kreiranje ocene sa vrednošću van dozvoljenog opsega (1-10)',
  { tag: ['@api'] },
  async ({ ratingsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await test.step('a) Value = 0 (ispod donje granice)', async () => {
      const response = await ratingsApi.createForFilm({ userId, filmId: createdFilm.id, value: 0 }, token);

      expect.soft(response.status()).toBe(400);
      const body = await response.json();
      expect.soft(body.errors).toHaveProperty('Value');
    });

    await test.step('b) Value = 11 (iznad gornje granice)', async () => {
      const response = await ratingsApi.createForFilm({ userId, filmId: createdFilm.id, value: 11 }, token);

      expect.soft(response.status()).toBe(400);
      const body = await response.json();
      expect.soft(body.errors).toHaveProperty('Value');
    });
  },
);

test(
  '[QA-87][API] Kreiranje ocene za nepostojeći film/seriju',
  { tag: ['@api'] },
  async ({ ratingsApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;
    const nonExistentId = 999999;

    await test.step('a) Film', async () => {
      const response = await ratingsApi.createForFilm({ userId, filmId: nonExistentId, value: 5 }, token);
      expect.soft(response.status()).toBe(400);

      const getResponse = await ratingsApi.getUserFilmRating(userId, nonExistentId);
      expect.soft(getResponse.status()).toBe(404);
    });

    await test.step('b) Series', async () => {
      const response = await ratingsApi.createForSeries({ userId, seriesId: nonExistentId, value: 5 }, token);
      expect.soft(response.status()).toBe(400);

      const getResponse = await ratingsApi.getUserSeriesRating(userId, nonExistentId);
      expect.soft(getResponse.status()).toBe(404);
    });
  },
);

test(
  '[QA-88][API] Izmena i brisanje tuđe ocene od strane regularnog korisnika - a) Update',
  { tag: ['@api', '@authorization'] },
  async ({ ratingsApi, verifiedTestUser, usersApi, authApi }) => {
    const { id: ownerId, token: ownerToken } = verifiedTestUser;
    const { id: otherUserId, token: otherUserToken } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      await ratingsApi.createForFilm({ userId: ownerId, filmId: createdFilm.id, value: 4 }, ownerToken);
      const existingRatingResponse = await ratingsApi.getUserFilmRating(ownerId, createdFilm.id);
      const { id: ratingId }: Rating = await existingRatingResponse.json();

      const response = await ratingsApi.updateRating(ratingId, { value: 9 }, otherUserToken);
      expect.soft(response.status()).toBe(403);

      const afterResponse = await ratingsApi.getById(ratingId);
      const afterRating: Rating = await afterResponse.json();
      expect.soft(afterRating.value).toBe(4);
    } finally {
      await deleteFilmRatingIfAny(ratingsApi, ownerId, createdFilm.id, ownerToken);
      await usersApi.deleteUser(otherUserId, otherUserToken);
    }
  },
);

test(
  '[QA-88][API] Izmena i brisanje tuđe ocene od strane regularnog korisnika - b) Delete',
  { tag: ['@api', '@authorization'] },
  async ({ ratingsApi, verifiedTestUser, usersApi, authApi }) => {
    const { id: ownerId, token: ownerToken } = verifiedTestUser;
    const { id: otherUserId, token: otherUserToken } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      await ratingsApi.createForFilm({ userId: ownerId, filmId: createdFilm.id, value: 6 }, ownerToken);
      const existingRatingResponse = await ratingsApi.getUserFilmRating(ownerId, createdFilm.id);
      const { id: ratingId }: Rating = await existingRatingResponse.json();

      const response = await ratingsApi.deleteRating(ratingId, otherUserToken);
      expect.soft(response.status()).toBe(403);

      const afterResponse = await ratingsApi.getById(ratingId);
      expect.soft(afterResponse.status()).toBe(200);
    } finally {
      await deleteFilmRatingIfAny(ratingsApi, ownerId, createdFilm.id, ownerToken);
      await usersApi.deleteUser(otherUserId, otherUserToken);
    }
  },
);

test(
  '[QA-89][API] Izmena i brisanje nepostojeće ocene - a) Update',
  { tag: ['@api'] },
  async ({ ratingsApi, verifiedTestUser }) => {
    const response = await ratingsApi.updateRating(999999, { value: 5 }, verifiedTestUser.token);
    expect.soft(response.status()).toBe(404);
  },
);

test(
  '[QA-89][API] Izmena i brisanje nepostojeće ocene - b) Delete',
  { tag: ['@api'] },
  async ({ ratingsApi, verifiedTestUser }) => {
    const response = await ratingsApi.deleteRating(999999, verifiedTestUser.token);
    expect.soft(response.status()).toBe(404);
  },
);

test(
  '[QA-90][API] Pregled tuđih ocena uprkos podešenoj privatnosti "Only Me"',
  { tag: ['@api', '@authorization'] },
  async ({ ratingsApi, verifiedTestUser, usersApi }) => {
    const { id: userId, token } = verifiedTestUser;

    await ratingsApi.createForFilm({ userId, filmId: createdFilm.id, value: 6 }, token);

    const privacySettings: PrivacySettings = {
      commentsVisibility: 'everyone',
      watchlistVisibility: 'everyone',
      ratingsVisibility: 'onlyme',
      hideEmail: false,
      personalisedRecs: true,
    };
    await usersApi.updatePrivacySettings(userId, privacySettings, token);

    const response = await ratingsApi.getByUserId(userId);
    const ratings: Rating[] = response.status() === 200 ? await response.json() : [];

    expect.soft(ratings.some((r) => r.filmId === createdFilm.id)).toBe(false);
  },
);
