import { test, expect } from '../../fixtures/api.fixtures';
import { LoginResponse } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { WatchlistItem } from '../../models/watchlist.model';
import { buildFilmPayload } from '../../test-data/film.data';
import { buildSeriesPayload } from '../../test-data/series.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { deleteFilmSafely, deleteSeriesSafely } from '../../utils/filmSeriesCleanup';
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
let usedGenre: Genre;

test.beforeEach(async ({ authApi, genresApi, filmsApi, seriesApi }) => {
  const loginResponse = await authApi.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
  ({ token: adminToken } = (await loginResponse.json()) as LoginResponse);

  const genresResponse = await genresApi.getAll(adminToken);
  const genres: Genre[] = await genresResponse.json();
  usedGenre = genres[0];

  const filmPayload = buildFilmPayload(usedGenre.id);
  await filmsApi.create(filmPayload, adminToken);
  const allFilms: Film[] = await (await filmsApi.getAll(adminToken)).json();
  createdFilm = allFilms.find((film) => film.title === filmPayload.title)!;

  const seriesPayload = buildSeriesPayload(usedGenre.id);
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
  '[QA-124][API] Dodavanje filma i serije na watchlist sa validnim podacima',
  { tag: ['@api', '@smoke'] },
  async ({ watchlistApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await test.step('a) Film', async () => {
      const response = await watchlistApi.add({ userId, filmId: createdFilm.id, seriesId: null }, token);

      expect.soft(response.status()).toBe(200);
      const body: WatchlistItem = await response.json();
      expect.soft(body.type).toBe('Film');
      expect.soft(body.filmId).toBe(createdFilm.id);
      expect.soft(body.seriesId).toBeNull();
      expect.soft(body.title).toBe(createdFilm.title);
      expect.soft(body.year).toBe(createdFilm.year);
      expect.soft(body.director).toBe(createdFilm.director);
      expect.soft(body.posterUrl).toBe(createdFilm.posterUrl);
      expect.soft(body.watched).toBe(false);
      expect.soft(body.addedAt).toBeTruthy();
      expect.soft(body.genres).toContain(usedGenre.name);

      const listResponse = await watchlistApi.getByUserId(userId, token);
      expect.soft(listResponse.status()).toBe(200);
      const list: WatchlistItem[] = await listResponse.json();
      expect.soft(list.some((item) => item.id === body.id && item.filmId === createdFilm.id)).toBe(true);
    });

    await test.step('b) Series', async () => {
      const response = await watchlistApi.add({ userId, filmId: null, seriesId: createdSeries.id }, token);

      expect.soft(response.status()).toBe(200);
      const body: WatchlistItem = await response.json();
      expect.soft(body.type).toBe('Series');
      expect.soft(body.filmId).toBeNull();
      expect.soft(body.seriesId).toBe(createdSeries.id);
      expect.soft(body.title).toBe(createdSeries.title);
      expect.soft(body.year).toBe(createdSeries.year);
      expect.soft(body.director).toBe(createdSeries.director);
      expect.soft(body.posterUrl).toBe(createdSeries.posterUrl);
      expect.soft(body.watched).toBe(false);
      expect.soft(body.addedAt).toBeTruthy();
      expect.soft(body.genres).toContain(usedGenre.name);

      const listResponse = await watchlistApi.getByUserId(userId, token);
      expect.soft(listResponse.status()).toBe(200);
      const list: WatchlistItem[] = await listResponse.json();
      expect.soft(list.some((item) => item.id === body.id && item.seriesId === createdSeries.id)).toBe(true);
    });
  },
);

test(
  '[QA-125][API] Uklanjanje stavke sa watchlist-e',
  { tag: ['@api', '@smoke'] },
  async ({ watchlistApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const addResponse = await watchlistApi.add({ userId, filmId: createdFilm.id, seriesId: null }, token);
    const { id: watchlistItemId }: WatchlistItem = await addResponse.json();

    const removeResponse = await watchlistApi.remove(watchlistItemId, token);
    expect(removeResponse.status()).toBe(200);

    const listResponse = await watchlistApi.getByUserId(userId, token);
    const list: WatchlistItem[] = await listResponse.json();
    expect(list.some((item) => item.id === watchlistItemId)).toBe(false);
  },
);

test(
  '[QA-126][API] Označavanje stavke watchlist-e kao odgledane i neodgledane',
  { tag: ['@api', '@smoke'] },
  async ({ watchlistApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const addResponse = await watchlistApi.add({ userId, filmId: createdFilm.id, seriesId: null }, token);
    const { id: watchlistItemId }: WatchlistItem = await addResponse.json();

    await test.step('a) Označavanje kao odgledano', async () => {
      const response = await watchlistApi.markWatched(watchlistItemId, { watched: true }, token);
      expect.soft(response.status()).toBe(200);
      const body: WatchlistItem = await response.json();
      expect.soft(body.watched).toBe(true);
    });

    await test.step('b) Označavanje kao neodgledano', async () => {
      const response = await watchlistApi.markWatched(watchlistItemId, { watched: false }, token);
      expect.soft(response.status()).toBe(200);
      const body: WatchlistItem = await response.json();
      expect.soft(body.watched).toBe(false);
    });
  },
);

test(
  '[QA-127][API] Pregled sopstvene watchlist-e',
  { tag: ['@api', '@smoke'] },
  async ({ watchlistApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await watchlistApi.add({ userId, filmId: createdFilm.id, seriesId: null }, token);
    await watchlistApi.add({ userId, filmId: null, seriesId: createdSeries.id }, token);

    const response = await watchlistApi.getByUserId(userId, token);
    expect(response.status()).toBe(200);
    const list: WatchlistItem[] = await response.json();

    const filmItem = list.find((item) => item.filmId === createdFilm.id);
    const seriesItem = list.find((item) => item.seriesId === createdSeries.id);

    expect(filmItem).toBeTruthy();
    expect(filmItem?.type).toBe('Film');
    expect(filmItem?.title).toBe(createdFilm.title);
    expect(filmItem?.watched).toBe(false);

    expect(seriesItem).toBeTruthy();
    expect(seriesItem?.type).toBe('Series');
    expect(seriesItem?.title).toBe(createdSeries.title);
    expect(seriesItem?.watched).toBe(false);
  },
);

test(
  '[QA-128][API] Odbijanje dodavanja duplikata na watchlist',
  { tag: ['@api'] },
  async ({ watchlistApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await test.step('a) Film', async () => {
      await watchlistApi.add({ userId, filmId: createdFilm.id, seriesId: null }, token);

      const response = await watchlistApi.add({ userId, filmId: createdFilm.id, seriesId: null }, token);
      expect.soft(response.status()).toBe(409);
      const body: { message: string } = await response.json();
      expect.soft(body.message).toBe('Film is already in your watchlist.');

      const list: WatchlistItem[] = await (await watchlistApi.getByUserId(userId, token)).json();
      expect.soft(list.filter((item) => item.filmId === createdFilm.id)).toHaveLength(1);
    });

    await test.step('b) Series', async () => {
      await watchlistApi.add({ userId, filmId: null, seriesId: createdSeries.id }, token);

      const response = await watchlistApi.add({ userId, filmId: null, seriesId: createdSeries.id }, token);
      expect.soft(response.status()).toBe(409);
      const body: { message: string } = await response.json();
      expect.soft(body.message).toBe('Series is already in your watchlist.');

      const list: WatchlistItem[] = await (await watchlistApi.getByUserId(userId, token)).json();
      expect.soft(list.filter((item) => item.seriesId === createdSeries.id)).toHaveLength(1);
    });
  },
);

test(
  '[QA-129][API] Odbijanje dodavanja stavke na watchlist bez prosleđenog filma ili serije',
  { tag: ['@api'] },
  async ({ watchlistApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    const response = await watchlistApi.add({ userId, filmId: null, seriesId: null }, token);
    expect(response.status()).toBe(409);
    const body: { message: string } = await response.json();
    expect(body.message).toBe('Either FilmId or SeriesId must be provided.');

    const list: WatchlistItem[] = await (await watchlistApi.getByUserId(userId, token)).json();
    expect(list).toHaveLength(0);
  },
);

test(
  '[QA-130][API] Interna greška servera pri dodavanju nepostojećeg filma/serije na watchlist',
  { tag: ['@api'] },
  async ({ watchlistApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;
    const nonExistentId = 999999;

    await test.step('a) Film', async () => {
      const response = await watchlistApi.add({ userId, filmId: nonExistentId, seriesId: null }, token);
      expect.soft(response.status()).toBe(404);

      const list: WatchlistItem[] = await (await watchlistApi.getByUserId(userId, token)).json();
      expect.soft(list.some((item) => item.filmId === nonExistentId)).toBe(false);
    });

    await test.step('b) Series', async () => {
      const response = await watchlistApi.add({ userId, filmId: null, seriesId: nonExistentId }, token);
      expect.soft(response.status()).toBe(404);

      const list: WatchlistItem[] = await (await watchlistApi.getByUserId(userId, token)).json();
      expect.soft(list.some((item) => item.seriesId === nonExistentId)).toBe(false);
    });
  },
);

test(
  '[QA-131][API] Izmena tuđe stavke sa watchlist-e bez provere vlasništva - a) Uklanjanje (Remove)',
  { tag: ['@api', '@authorization'] },
  async ({ watchlistApi, verifiedTestUser, usersApi, authApi }) => {
    const { id: ownerId, token: ownerToken } = verifiedTestUser;
    const { id: otherUserId, token: otherUserToken } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      const addResponse = await watchlistApi.add({ userId: ownerId, filmId: createdFilm.id, seriesId: null }, ownerToken);
      const { id: watchlistItemId }: WatchlistItem = await addResponse.json();

      const response = await watchlistApi.remove(watchlistItemId, otherUserToken);
      expect.soft(response.status()).toBe(403);

      const list: WatchlistItem[] = await (await watchlistApi.getByUserId(ownerId, ownerToken)).json();
      expect.soft(list.some((item) => item.id === watchlistItemId)).toBe(true);
    } finally {
      await usersApi.deleteUser(otherUserId, otherUserToken);
    }
  },
);

test(
  '[QA-131][API] Izmena tuđe stavke sa watchlist-e bez provere vlasništva - b) Označavanje kao odgledano (MarkWatched)',
  { tag: ['@api', '@authorization'] },
  async ({ watchlistApi, verifiedTestUser, usersApi, authApi }) => {
    const { id: ownerId, token: ownerToken } = verifiedTestUser;
    const { id: otherUserId, token: otherUserToken } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      const addResponse = await watchlistApi.add({ userId: ownerId, filmId: createdFilm.id, seriesId: null }, ownerToken);
      const { id: watchlistItemId }: WatchlistItem = await addResponse.json();

      const response = await watchlistApi.markWatched(watchlistItemId, { watched: true }, otherUserToken);
      expect.soft(response.status()).toBe(403);

      const list: WatchlistItem[] = await (await watchlistApi.getByUserId(ownerId, ownerToken)).json();
      const item = list.find((i) => i.id === watchlistItemId);
      expect.soft(item?.watched).toBe(false);
    } finally {
      await usersApi.deleteUser(otherUserId, otherUserToken);
    }
  },
);

test(
  '[QA-132][API] Pregled tuđe watchlist-e bez obzira na podešavanje privatnosti',
  { tag: ['@api', '@authorization'] },
  async ({ watchlistApi, verifiedTestUser, usersApi, authApi }) => {
    const { token: viewerToken } = verifiedTestUser;
    const { id: ownerId, token: ownerToken } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      await watchlistApi.add({ userId: ownerId, filmId: createdFilm.id, seriesId: null }, ownerToken);
      await usersApi.updatePrivacySettings(
        ownerId,
        { commentsVisibility: 'everyone', watchlistVisibility: 'onlyme', ratingsVisibility: 'everyone', hideEmail: false, personalisedRecs: true },
        ownerToken,
      );

      const response = await watchlistApi.getByUserId(ownerId, viewerToken);
      expect(response.status()).toBe(403);
    } finally {
      await usersApi.deleteUser(ownerId, ownerToken);
    }
  },
);

test(
  '[QA-133][API] Automatsko uklanjanje stavke sa watchlist-e nakon brisanja filma/serije',
  { tag: ['@api'] },
  async ({ watchlistApi, filmsApi, seriesApi, verifiedTestUser }) => {
    const { id: userId, token } = verifiedTestUser;

    await test.step('a) Film', async () => {
      const addResponse = await watchlistApi.add({ userId, filmId: createdFilm.id, seriesId: null }, token);
      const { id: watchlistItemId }: WatchlistItem = await addResponse.json();

      await deleteFilmSafely(filmsApi, createdFilm.id, adminToken);

      const list: WatchlistItem[] = await (await watchlistApi.getByUserId(userId, token)).json();
      expect.soft(list.some((item) => item.id === watchlistItemId)).toBe(false);
    });

    await test.step('b) Series', async () => {
      const addResponse = await watchlistApi.add({ userId, filmId: null, seriesId: createdSeries.id }, token);
      const { id: watchlistItemId }: WatchlistItem = await addResponse.json();

      await deleteSeriesSafely(seriesApi, createdSeries.id, adminToken);

      const list: WatchlistItem[] = await (await watchlistApi.getByUserId(userId, token)).json();
      expect.soft(list.some((item) => item.id === watchlistItemId)).toBe(false);
    });
  },
);
