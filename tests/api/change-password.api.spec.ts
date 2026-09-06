import { test, expect } from '../../fixtures/api.fixtures';
import { LoginResponse } from '../../models/auth.model';

test(
  '[QA-46][API] Promena lozinke sa validnim podacima',
  { tag: ['@api', '@smoke'] },
  async ({ authApi, usersApi, verifiedTestUser }) => {
    const newPassword = 'PasswordTestNew1!Zx9';

    const changeResponse = await usersApi.changePassword(
      verifiedTestUser.id,
      { currentPassword: verifiedTestUser.payload.password, newPassword },
      verifiedTestUser.token,
    );
    expect(changeResponse.status()).toBe(200);
    expect(await changeResponse.text()).toBe('Password changed.');

    const newLoginResponse = await authApi.login({ username: verifiedTestUser.payload.username, password: newPassword });
    expect(newLoginResponse.status()).toBe(200);
    const newLoginBody = (await newLoginResponse.json()) as LoginResponse;
    expect(newLoginBody.token).toBeDefined();
  },
);

test(
  '[QA-47][API] Promena lozinke sa pogrešnom trenutnom lozinkom ili prekratkom novom lozinkom',
  { tag: ['@api'] },
  async ({ authApi, usersApi, verifiedTestUser }) => {
    await test.step('a) Netačna trenutna lozinka, validna nova lozinka', async () => {
      const changeResponse = await usersApi.changePassword(
        verifiedTestUser.id,
        { currentPassword: 'WrongCurrentPassword1!', newPassword: 'ValidNewPassword1!' },
        verifiedTestUser.token,
      );
      expect.soft(changeResponse.status()).toBe(400);
      expect.soft(await changeResponse.text()).toBe('Current password is incorrect.');

      const unchangedLoginResponse = await authApi.login({
        username: verifiedTestUser.payload.username,
        password: verifiedTestUser.payload.password,
      });
      expect.soft(unchangedLoginResponse.status()).toBe(200);
    });

    await test.step('b) Tačna trenutna lozinka, nova lozinka kraća od 6 karaktera', async () => {
      const changeResponse = await usersApi.changePassword(
        verifiedTestUser.id,
        { currentPassword: verifiedTestUser.payload.password, newPassword: 'Ab1!' },
        verifiedTestUser.token,
      );
      const body = await changeResponse.json();
      expect.soft(changeResponse.status()).toBe(400);
      expect.soft(body.errors).toHaveProperty('NewPassword');

      const unchangedLoginResponse = await authApi.login({
        username: verifiedTestUser.payload.username,
        password: verifiedTestUser.payload.password,
      });
      expect.soft(unchangedLoginResponse.status()).toBe(200);
    });
  },
);