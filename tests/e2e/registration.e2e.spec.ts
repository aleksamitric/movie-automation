import { test } from '@playwright/test';
import { RegisterPage } from '../../pages/RegisterPage';
import { buildValidUserPayload, buildUserPayloadWithOverrides } from '../../test-data/user.data';

let registerPage: RegisterPage;

test.beforeEach(async ({ page }) => {
  registerPage = new RegisterPage(page);
  await registerPage.goto();
});

test('[QA-18][E2E] Uspešna registracija sa validnim podacima', { tag: ['@e2e', '@smoke'] }, async () => {
  const user = buildValidUserPayload();

  await registerPage.register(user);

  await registerPage.expectAccountCreatedToastVisible();
  await registerPage.expectRedirectToVerifyEmail();
});

test(
  '[QA-19][E2E] Registracija sa lozinkom koja ne zadovoljava očekivani format',
  { tag: ['@e2e'] },
  async () => {
    const user = buildUserPayloadWithOverrides({ password: 'Abcde1', confirmPassword: 'Abcde1' });

    await registerPage.register(user);

    await registerPage.expectInvalidPasswordToastVisible();
    await registerPage.expectStillOnRegisterPage();
  },
);

test(
  '[QA-20][E2E] Registracija sa praznim obaveznim poljem',
  { tag: ['@e2e'] },
  async () => {
    const user = buildUserPayloadWithOverrides({ username: '' });

    await registerPage.register(user);

    await registerPage.expectErrorToastVisible();
    await registerPage.expectStillOnRegisterPage();
  },
);
