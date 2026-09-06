import { test, expect } from '../../fixtures/api.fixtures';
import { buildValidUserPayload } from '../../test-data/user.data';
import { LoginResponse, LoginErrorResponse } from '../../models/auth.model';

test(
  '[QA-27][API] Prijava sa validnim kredencijalima',
  { tag: ['@api', '@smoke'] },
  async ({ usersApi, authApi, verifiedTestUser }) => {
    const loginResponse = await authApi.login({
      username: verifiedTestUser.payload.username,
      password: verifiedTestUser.payload.password,
    });

    expect(loginResponse.status()).toBe(200);

    const loginBody: LoginResponse = await loginResponse.json();
    expect(loginBody.token).toBeDefined();

    const getUserResponse = await usersApi.getById(verifiedTestUser.id, loginBody.token);

    expect(getUserResponse.status()).toBe(200);
  },
);

test(
  '[QA-28][API] Prijava sa pogrešnom lozinkom ili nepostojećim username-om',
  { tag: ['@api'] },
  async ({ authApi, verifiedTestUser }) => {
    await test.step('a) Postojeći username, pogrešna lozinka', async () => {
      const loginResponse = await authApi.login({ username: verifiedTestUser.payload.username, password: 'WrongPassword1!' });

      expect.soft(loginResponse.status()).toBe(401);
      expect.soft(await loginResponse.text()).toBe('Invalid username or password.');
    });

    await test.step('b) Username koji ne postoji, proizvoljna lozinka', async () => {
      const loginResponse = await authApi.login({
        username: `nonexistent_user_${Date.now()}`,
        password: 'AnyPassword1!',
      });

      expect.soft(loginResponse.status()).toBe(401);
      expect.soft(await loginResponse.text()).toBe('Invalid username or password.');
    });
  },
);

test(
  '[QA-29][API] Prijava korisnika čiji email nije verifikovan',
  { tag: ['@api'] },
  async ({ usersApi, authApi }) => {
    const user = buildValidUserPayload();
    await usersApi.createUser(user);

    const loginResponse = await authApi.login({ username: user.username, password: user.password });

    expect(loginResponse.status()).toBe(401);

    const loginBody: LoginErrorResponse = await loginResponse.json();
    expect(loginBody.message).toBe('Email not verified. Please verify your email before logging in.');
  },
);

test(
  '[QA-30][API] Prijava na deaktiviran (soft-deleted) nalog',
  { tag: ['@api'] },
  async ({ usersApi, authApi, verifiedTestUser }) => {
    const softDeleteResponse = await usersApi.softDelete(verifiedTestUser.id, verifiedTestUser.token);
    expect(softDeleteResponse.status()).toBe(200);

    const loginResponse = await authApi.login({
      username: verifiedTestUser.payload.username,
      password: verifiedTestUser.payload.password,
    });

    expect(loginResponse.status()).toBe(401);

    const loginBody: LoginErrorResponse = await loginResponse.json();
    expect(loginBody.message).toBe('This account has been deactivated.');
  },
);

test(
  '[QA-31][API] Prijava bez prosleđene lozinke',
  { tag: ['@api'] },
  async ({ authApi, verifiedTestUser }) => {
    const loginResponse = await authApi.login({ username: verifiedTestUser.payload.username, password: '' });

    expect(loginResponse.status()).toBe(401);
    expect(await loginResponse.text()).toBe('Invalid username or password.');
  },
);
