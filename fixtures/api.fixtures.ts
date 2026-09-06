import { test as base, expect, request, APIRequestContext } from '@playwright/test';
import { API_BASE_URL } from '../constants/api.constants';
import { MAILTRAP_API_BASE_URL, MAILTRAP_API_TOKEN } from '../constants/mailtrap.constants';
import { UsersApi } from '../api/users.api';
import { MailboxApi } from '../api/mailbox.api';
import { AuthApi } from '../api/auth.api';
import { FilmsApi } from '../api/films.api';
import { SeriesApi } from '../api/series.api';
import { GenresApi } from '../api/genres.api';
import { RatingsApi } from '../api/ratings.api';
import { CommentsApi } from '../api/comments.api';
import { DebatesApi } from '../api/debates.api';
import { WatchlistApi } from '../api/watchlist.api';
import { buildValidUserPayload } from '../test-data/user.data';
import { CreateUserRequest } from '../models/user.model';
import { LoginResponse } from '../models/auth.model';

interface VerifiedTestUser {
  payload: CreateUserRequest;
  id: number;
  token: string;
}

interface ApiFixtures {
  apiRequestContext: APIRequestContext;
  usersApi: UsersApi;
  authApi: AuthApi;
  filmsApi: FilmsApi;
  seriesApi: SeriesApi;
  genresApi: GenresApi;
  ratingsApi: RatingsApi;
  commentsApi: CommentsApi;
  debatesApi: DebatesApi;
  watchlistApi: WatchlistApi;
  mailtrapRequestContext: APIRequestContext;
  mailboxApi: MailboxApi;
  verifiedTestUser: VerifiedTestUser;
}

export const test = base.extend<ApiFixtures>({
  apiRequestContext: async ({}, use) => {
    const context = await request.newContext({
      baseURL: API_BASE_URL,
      ignoreHTTPSErrors: true,
    });
    await use(context);
    await context.dispose();
  },

  usersApi: async ({ apiRequestContext }, use) => {
    await use(new UsersApi(apiRequestContext));
  },

  authApi: async ({ apiRequestContext }, use) => {
    await use(new AuthApi(apiRequestContext));
  },

  filmsApi: async ({ apiRequestContext }, use) => {
    await use(new FilmsApi(apiRequestContext));
  },

  seriesApi: async ({ apiRequestContext }, use) => {
    await use(new SeriesApi(apiRequestContext));
  },

  genresApi: async ({ apiRequestContext }, use) => {
    await use(new GenresApi(apiRequestContext));
  },

  ratingsApi: async ({ apiRequestContext }, use) => {
    await use(new RatingsApi(apiRequestContext));
  },

  commentsApi: async ({ apiRequestContext }, use) => {
    await use(new CommentsApi(apiRequestContext));
  },

  debatesApi: async ({ apiRequestContext }, use) => {
    await use(new DebatesApi(apiRequestContext));
  },

  watchlistApi: async ({ apiRequestContext }, use) => {
    await use(new WatchlistApi(apiRequestContext));
  },

  mailtrapRequestContext: async ({}, use) => {
    const context = await request.newContext({
      baseURL: MAILTRAP_API_BASE_URL,
      extraHTTPHeaders: { 'Api-Token': MAILTRAP_API_TOKEN },
    });
    await use(context);
    await context.dispose();
  },

  mailboxApi: async ({ mailtrapRequestContext }, use) => {
    await use(new MailboxApi(mailtrapRequestContext));
  },

  verifiedTestUser: async ({ usersApi, authApi }, use) => {
    const payload = buildValidUserPayload();
    const createResponse = await usersApi.createVerifiedUser(payload);
    const { id }: { id: number } = await createResponse.json();

    const loginResponse = await authApi.login({ username: payload.username, password: payload.password });
    const { token }: LoginResponse = await loginResponse.json();

    await use({ payload, id, token });

    await usersApi.deleteUser(id, token);
  },
});

export { expect };
