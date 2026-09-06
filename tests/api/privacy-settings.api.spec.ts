import { test, expect } from '../../fixtures/api.fixtures';
import { PrivacySettings } from '../../models/user.model';
import { buildValidUserPayload } from '../../test-data/user.data';

test(
  '[QA-55][API] Čitanje i izmena podešavanja privatnosti sa validnim vrednostima',
  { tag: ['@api', '@smoke'] },
  async ({ usersApi, verifiedTestUser }) => {
    const defaultSettingsResponse = await usersApi.getPrivacySettings(verifiedTestUser.id, verifiedTestUser.token);
    expect(defaultSettingsResponse.status()).toBe(200);
    const defaultSettings: PrivacySettings = await defaultSettingsResponse.json();
    expect(defaultSettings).toEqual({
      commentsVisibility: 'everyone',
      watchlistVisibility: 'everyone',
      ratingsVisibility: 'everyone',
      hideEmail: true,
      personalisedRecs: true,
    });

    const updatedSettings: PrivacySettings = {
      commentsVisibility: 'onlyme',
      watchlistVisibility: 'onlyme',
      ratingsVisibility: 'onlyme',
      hideEmail: true,
      personalisedRecs: false,
    };
    const updateResponse = await usersApi.updatePrivacySettings(verifiedTestUser.id, updatedSettings, verifiedTestUser.token);
    expect(updateResponse.status()).toBe(200);
    expect(await updateResponse.text()).toBe('Privacy settings updated.');

    const confirmSettingsResponse = await usersApi.getPrivacySettings(verifiedTestUser.id, verifiedTestUser.token);
    expect(confirmSettingsResponse.status()).toBe(200);
    const confirmedSettings: PrivacySettings = await confirmSettingsResponse.json();
    expect(confirmedSettings).toEqual(updatedSettings);
  },
);

test(
  '[QA-56][API] Izmena privacy podešavanja za korisnika koji ne postoji',
  { tag: ['@api'] },
  async ({ usersApi, verifiedTestUser }) => {
    const deletedUserPayload = buildValidUserPayload();
    const createResponse = await usersApi.createVerifiedUser(deletedUserPayload);
    const { id: deletedUserId }: { id: number } = await createResponse.json();
    await usersApi.deleteUser(deletedUserId, verifiedTestUser.token);

    const updateResponse = await usersApi.updatePrivacySettings(
      deletedUserId,
      {
        commentsVisibility: 'everyone',
        watchlistVisibility: 'everyone',
        ratingsVisibility: 'everyone',
        hideEmail: true,
        personalisedRecs: true,
      },
      verifiedTestUser.token,
    );

    expect(updateResponse.status()).toBe(404);
  },
);
