import { test, expect } from '../../fixtures/api.fixtures';
import { LoginErrorResponse } from '../../models/auth.model';

test(
  '[QA-53][API] Deaktivacija sopstvenog naloga',
  { tag: ['@api', '@smoke'] },
  async ({ usersApi, authApi, verifiedTestUser }) => {
    const softDeleteResponse = await usersApi.softDelete(verifiedTestUser.id, verifiedTestUser.token);
    expect(softDeleteResponse.status()).toBe(200);
    expect(await softDeleteResponse.text()).toBe('Account deactivated.');

    const deactivatedLoginResponse = await authApi.login({
      username: verifiedTestUser.payload.username,
      password: verifiedTestUser.payload.password,
    });
    expect(deactivatedLoginResponse.status()).toBe(401);

    const deactivatedLoginBody: LoginErrorResponse = await deactivatedLoginResponse.json();
    expect(deactivatedLoginBody.message).toBe('This account has been deactivated.');
  },
);