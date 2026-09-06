import { test, expect } from '../../fixtures/api.fixtures';
import { LoginResponse } from '../../models/auth.model';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';

test(
  '[QA-41][API] Pristup admin-only endpoint-u u zavisnosti od role',
  { tag: ['@api', '@authorization'] },
  async ({ authApi, usersApi, verifiedTestUser }) => {
    await test.step('a) Admin nalog', async () => {
      const loginResponse = await authApi.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
      const { token } = (await loginResponse.json()) as LoginResponse;

      const getAllResponse = await usersApi.getAll(token);

      expect.soft(getAllResponse.status()).toBe(200);
      const body = await getAllResponse.json();
      expect.soft(Array.isArray(body)).toBe(true);
    });

    await test.step('b) Regularan korisnik', async () => {
      const getAllResponse = await usersApi.getAll(verifiedTestUser.token);

      expect.soft(getAllResponse.status()).toBe(403);
      expect.soft(await getAllResponse.text()).toBe('');
    });
  },
);
