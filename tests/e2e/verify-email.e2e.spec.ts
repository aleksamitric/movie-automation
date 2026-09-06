import { test } from '../../fixtures/api.fixtures';
import { buildValidUserPayload } from '../../test-data/user.data';
import { VerifyEmailPage } from '../../pages/VerifyEmailPage';
import { LoginPage } from '../../pages/LoginPage';

test(
  '[QA-24][E2E] Uspešna verifikacija email adrese validnim kodom',
  { tag: ['@e2e', '@smoke'] },
  async ({ page, usersApi, mailboxApi }) => {
    const user = buildValidUserPayload();
    await usersApi.createUser(user);
    const verificationCode = await mailboxApi.getVerificationCode(user.email);

    const verifyEmailPage = new VerifyEmailPage(page);
    await verifyEmailPage.goto();
    await verifyEmailPage.verify(verificationCode);

    await verifyEmailPage.expectEmailVerifiedToastVisible();
    await verifyEmailPage.expectRedirectToLogin();

    const loginPage = new LoginPage(page);
    await loginPage.login({ username: user.username, password: user.password });

    await loginPage.expectLoggedInToastVisible();
    await loginPage.expectRedirectToHome();
  },
);

test(
  '[QA-25][E2E] Verifikacija sa praznim poljem za kod',
  { tag: ['@e2e'] },
  async ({ page }) => {
    const verifyEmailPage = new VerifyEmailPage(page);
    await verifyEmailPage.goto();

    await verifyEmailPage.verify('');

    await verifyEmailPage.expectVerificationCodeRequiredToastVisible();
    await verifyEmailPage.expectStillOnVerifyEmailPage();
    await verifyEmailPage.expectNoVerifyEmailRequestSent();
  },
);

test(
  '[QA-26][E2E] Verifikacija sa nevalidnim ili iskorišćenim kodom',
  { tag: ['@e2e'] },
  async ({ page, usersApi, mailboxApi }) => {
    const loginPage = new LoginPage(page);
    const verifyEmailPage = new VerifyEmailPage(page);

    await test.step('a) Nevalidan/nepostojeći kod', async () => {
      const user = buildValidUserPayload();
      await usersApi.createUser(user);

      await verifyEmailPage.goto();
      await verifyEmailPage.verify('non-existent-verification-code');

      await verifyEmailPage.expectInvalidOrExpiredCodeToastVisible(true);
      await verifyEmailPage.expectStillOnVerifyEmailPage(true);

      await loginPage.goto();
      await loginPage.login({ username: user.username, password: user.password });

      await loginPage.expectStillOnLoginPage(true);
    });

    await test.step('b) Već iskorišćen kod', async () => {
      const user = buildValidUserPayload();
      await usersApi.createUser(user);
      const verificationCode = await mailboxApi.getVerificationCode(user.email);

      await verifyEmailPage.goto();
      await verifyEmailPage.verify(verificationCode);
      await verifyEmailPage.expectEmailVerifiedToastVisible(true);
      await verifyEmailPage.expectRedirectToLogin();

      await verifyEmailPage.goto();
      await verifyEmailPage.verify(verificationCode);

      await verifyEmailPage.expectInvalidOrExpiredCodeToastVisible(true);
      await verifyEmailPage.expectStillOnVerifyEmailPage(true);

      await loginPage.goto();
      await loginPage.login({ username: user.username, password: user.password });

      await loginPage.expectLoggedInToastVisible(true);
      await loginPage.expectRedirectToHome();
    });
  },
);
