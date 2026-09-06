import { test, expect } from '../../fixtures/api.fixtures';

test(
  '[QA-50][API] Izmena email adrese sa validnom, novom vrednošću',
  { tag: ['@api', '@smoke'] },
  async ({ usersApi, verifiedTestUser }) => {
    const newEmail = `updated.${Date.now()}@example.com`;

    const updateResponse = await usersApi.updateEmail(verifiedTestUser.id, { email: newEmail }, verifiedTestUser.token);

    expect(updateResponse.status()).toBe(200);
    expect(await updateResponse.text()).toBe('Email updated.');
  },
);

test(
  '[QA-51][API] Izmena email adrese sa nevalidnim formatom',
  { tag: ['@api'] },
  async ({ usersApi, verifiedTestUser }) => {
    const updateResponse = await usersApi.updateEmail(
      verifiedTestUser.id,
      { email: 'invalid-email-format' },
      verifiedTestUser.token,
    );
    const body = await updateResponse.json();

    expect(updateResponse.status()).toBe(400);
    expect(body.errors).toHaveProperty('Email');
  },
);