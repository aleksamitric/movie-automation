import { test, expect } from '../../fixtures/api.fixtures';
import { buildValidUserPayload } from '../../test-data/user.data';
import { LoginResponse, LoginErrorResponse } from '../../models/auth.model';

test(
  '[QA-21][API] Verifikacija email adrese sa validnim tokenom',
  { tag: ['@api', '@smoke'] },
  async ({ usersApi, mailboxApi, authApi }) => {
    const user = buildValidUserPayload();
    await usersApi.createUser(user);

    const verificationToken = await mailboxApi.getVerificationCode(user.email);

    const verifyResponse = await usersApi.verifyEmail(verificationToken);

    expect(verifyResponse.status()).toBe(200);
    expect(await verifyResponse.text()).toBe('Email verified successfully!');

    const loginResponse = await authApi.login({ username: user.username, password: user.password });

    expect(loginResponse.status()).toBe(200);

    const loginBody: LoginResponse = await loginResponse.json();
    expect(loginBody.token).toBeDefined();
  },
);

test(
  '[QA-22][API] Verifikacija email adrese bez prosleđenog tokena',
  { tag: ['@api'] },
  async ({ usersApi, authApi }) => {
    const user = buildValidUserPayload();
    await usersApi.createUser(user);

    const verifyResponse = await usersApi.verifyEmail('');
    const verifyBody = await verifyResponse.json();

    expect(verifyResponse.status()).toBe(400);
    expect(verifyBody.errors.token).toContain('The token field is required.');

    const loginResponse = await authApi.login({ username: user.username, password: user.password });

    expect(loginResponse.status()).toBe(401);

    const loginBody: LoginErrorResponse = await loginResponse.json();
    expect(loginBody.message).toBe('Email not verified. Please verify your email before logging in.');
  },
);

test(
  '[QA-23][API] Verifikacija email adrese sa nevalidnim, nepostojećim ili već iskorišćenim tokenom',
  { tag: ['@api'] },
  async ({ usersApi, mailboxApi, authApi }) => {
    await test.step('a) Nevalidan/nepostojeći token', async () => {
      const user = buildValidUserPayload();
      await usersApi.createUser(user);

      const verifyResponse = await usersApi.verifyEmail('non-existent-verification-token');

      expect.soft(verifyResponse.status()).toBe(400);
      expect.soft(await verifyResponse.text()).toBe('Invalid or expired token.');

      const loginResponse = await authApi.login({ username: user.username, password: user.password });

      expect.soft(loginResponse.status()).toBe(401);

      const loginBody: LoginErrorResponse = await loginResponse.json();
      expect.soft(loginBody.message).toBe('Email not verified. Please verify your email before logging in.');
    });

    await test.step('b) Već iskorišćen token', async () => {
      const user = buildValidUserPayload();
      await usersApi.createUser(user);

      const verificationToken = await mailboxApi.getVerificationCode(user.email);

      const initialVerifyResponse = await usersApi.verifyEmail(verificationToken);
      expect.soft(initialVerifyResponse.status()).toBe(200);

      const reuseResponse = await usersApi.verifyEmail(verificationToken);

      expect.soft(reuseResponse.status()).toBe(400);
      expect.soft(await reuseResponse.text()).toBe('Invalid or expired token.');

      const loginResponse = await authApi.login({ username: user.username, password: user.password });

      expect.soft(loginResponse.status()).toBe(200);

      const loginBody: LoginResponse = await loginResponse.json();
      expect.soft(loginBody.token).toBeDefined();
    });
  },
);
