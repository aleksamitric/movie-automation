import { test } from '../../fixtures/auth.fixtures';
import { ProfilePage } from '../../pages/ProfilePage';
import { PublicProfilePage } from '../../pages/PublicProfilePage';
import { buildValidUserPayload } from '../../test-data/user.data';
import { LoginResponse } from '../../models/auth.model';
import { PrivacySettings, UserAdminResponse } from '../../models/user.model';
import { UsersApi } from '../../api/users.api';
import { AuthApi } from '../../api/auth.api';

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

test(
  '[QA-43][E2E] Prikaz sopstvenog profila sa osnovnim podacima',
  { tag: ['@e2e', '@smoke'] },
  async ({ authenticatedPage, usersApi, verifiedTestUser }) => {
    const userResponse = await usersApi.getById(verifiedTestUser.id, verifiedTestUser.token);
    const user = (await userResponse.json()) as UserAdminResponse;

    const profilePage = new ProfilePage(authenticatedPage, user);
    await profilePage.goto();

    await profilePage.expectFullNameVisible();
    await profilePage.expectUsernameVisible();
    await profilePage.expectWatchlistStatVisible();
    await profilePage.expectWatchedStatVisible();
    await profilePage.expectReviewsStatVisible();
    await profilePage.expectAverageRatingStatVisible();
  },
);

test(
  '[QA-44][E2E] Prikaz javnog profila drugog korisnika',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, authApi, usersApi }) => {
    const { id: secondUserId, token } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      const userResponse = await usersApi.getById(secondUserId, token);
      const userB = (await userResponse.json()) as UserAdminResponse;

      const publicProfilePage = new PublicProfilePage(authenticatedPage, userB);
      await publicProfilePage.goto(secondUserId);

      await publicProfilePage.expectUsernameVisible();
      await publicProfilePage.expectAvatarInitialVisible();

      await publicProfilePage.expectReviewsTabContentVisible();

      await publicProfilePage.openDebatesTab();
      await publicProfilePage.expectDebatesTabContentVisible();

      await publicProfilePage.openWatchlistTab();
      await publicProfilePage.expectWatchlistTabContentVisible();
    } finally {
      await usersApi.deleteUser(secondUserId, token);
    }
  },
);

test(
  '[QA-45][E2E] Poseta sopstvenog javnog profila redirektuje na /profile',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, usersApi, verifiedTestUser }) => {
    const userResponse = await usersApi.getById(verifiedTestUser.id, verifiedTestUser.token);
    const user = (await userResponse.json()) as UserAdminResponse;

    const publicProfilePage = new PublicProfilePage(authenticatedPage, user);
    await publicProfilePage.goto(verifiedTestUser.id);

    await publicProfilePage.expectRedirectToProfile();
  },
);

test(
  '[QA-57][E2E] Sakrivanje email adrese na javnom profilu kada je "Hide email" uključeno',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, authApi, usersApi }) => {
    const { id: secondUserId, token } = await createSecondVerifiedUser(usersApi, authApi);

    try {
      const hideEmailSettings: PrivacySettings = {
        commentsVisibility: 'everyone',
        watchlistVisibility: 'everyone',
        ratingsVisibility: 'everyone',
        hideEmail: true,
        personalisedRecs: true,
      };
      await usersApi.updatePrivacySettings(secondUserId, hideEmailSettings, token);

      const userResponse = await usersApi.getById(secondUserId, token);
      const userB = (await userResponse.json()) as UserAdminResponse;

      const publicProfilePage = new PublicProfilePage(authenticatedPage, userB);
      await publicProfilePage.goto(secondUserId);

      await publicProfilePage.expectUsernameVisible();
      await publicProfilePage.expectEmailHidden();
    } finally {
      await usersApi.deleteUser(secondUserId, token);
    }
  },
);

test(
  '[QA-58][E2E] Sakrivanje watchlist-e/ocena/komentara na javnom profilu kada je vidljivost "Only me"',
  { tag: ['@e2e'] },
  async ({ authenticatedPage, authApi, usersApi }) => {
    await test.step('a) CommentsVisibility = "onlyme" → tab Reviews', async () => {
      const { id: secondUserId, token } = await createSecondVerifiedUser(usersApi, authApi);

      try {
        const commentsPrivateSettings: PrivacySettings = {
          commentsVisibility: 'onlyme',
          watchlistVisibility: 'everyone',
          ratingsVisibility: 'everyone',
          hideEmail: true,
          personalisedRecs: true,
        };
        await usersApi.updatePrivacySettings(secondUserId, commentsPrivateSettings, token);

        const userResponse = await usersApi.getById(secondUserId, token);
        const userB = (await userResponse.json()) as UserAdminResponse;

        const publicProfilePage = new PublicProfilePage(authenticatedPage, userB);
        await publicProfilePage.goto(secondUserId);

        await publicProfilePage.expectReviewsPrivate(true);
      } finally {
        await usersApi.deleteUser(secondUserId, token);
      }
    });

    await test.step('b) WatchlistVisibility = "onlyme" → tab Watchlist', async () => {
      const { id: secondUserId, token } = await createSecondVerifiedUser(usersApi, authApi);

      try {
        const watchlistPrivateSettings: PrivacySettings = {
          commentsVisibility: 'everyone',
          watchlistVisibility: 'onlyme',
          ratingsVisibility: 'everyone',
          hideEmail: true,
          personalisedRecs: true,
        };
        await usersApi.updatePrivacySettings(secondUserId, watchlistPrivateSettings, token);

        const userResponse = await usersApi.getById(secondUserId, token);
        const userB = (await userResponse.json()) as UserAdminResponse;

        const publicProfilePage = new PublicProfilePage(authenticatedPage, userB);
        await publicProfilePage.goto(secondUserId);
        await publicProfilePage.openWatchlistTab();

        await publicProfilePage.expectWatchlistPrivate(true);
      } finally {
        await usersApi.deleteUser(secondUserId, token);
      }
    });

    await test.step('c) RatingsVisibility = "onlyme" → tab Reviews', async () => {
      const { id: secondUserId, token } = await createSecondVerifiedUser(usersApi, authApi);

      try {
        const ratingsPrivateSettings: PrivacySettings = {
          commentsVisibility: 'everyone',
          watchlistVisibility: 'everyone',
          ratingsVisibility: 'onlyme',
          hideEmail: true,
          personalisedRecs: true,
        };
        await usersApi.updatePrivacySettings(secondUserId, ratingsPrivateSettings, token);

        const userResponse = await usersApi.getById(secondUserId, token);
        const userB = (await userResponse.json()) as UserAdminResponse;

        const publicProfilePage = new PublicProfilePage(authenticatedPage, userB);
        await publicProfilePage.goto(secondUserId);

        await publicProfilePage.expectReviewsPrivate(true);
      } finally {
        await usersApi.deleteUser(secondUserId, token);
      }
    });
  },
);