import { test, expect } from '../../fixtures/api.fixtures';

test(
  '[QA-36][API] Pristup zaštićenom endpoint-u bez tokena',
  { tag: ['@api'] },
  async ({ usersApi }) => {
    const arbitraryUserId = 1;

    const response = await usersApi.getById(arbitraryUserId);

    expect(response.status()).toBe(401);
    expect(await response.text()).toBe('');
  },
);

test(
  '[QA-37][API] Pristup zaštićenom endpoint-u sa nevalidnim tokenom',
  { tag: ['@api'] },
  async ({ usersApi }) => {
    const arbitraryUserId = 1;

    const response = await usersApi.getById(arbitraryUserId, 'not-a-valid-jwt-token');

    expect(response.status()).toBe(401);
    expect(await response.text()).toBe('');
  },
);
