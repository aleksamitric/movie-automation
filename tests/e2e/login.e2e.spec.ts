import { test } from '../../fixtures/api.fixtures';
import { buildValidUserPayload } from '../../test-data/user.data';
import { LoginPage } from '../../pages/LoginPage';

let loginPage: LoginPage;

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  await loginPage.goto();
});

test(
  '[QA-32][E2E] Uspešna prijava sa validnim kredencijalima',
  { tag: ['@e2e', '@smoke'] },
  async ({ verifiedTestUser }) => {
    await loginPage.login({ username: verifiedTestUser.payload.username, password: verifiedTestUser.payload.password });

    await loginPage.expectLoggedInToastVisible();
    await loginPage.expectRedirectToHome();
  },
);

test(
  '[QA-33][E2E] Prijava sa pogrešnom lozinkom ili nepostojećim username-om',
  { tag: ['@e2e'] },
  async ({ verifiedTestUser }) => {
    await test.step('a) Postojeći username, pogrešna lozinka', async () => {
      await loginPage.login({ username: verifiedTestUser.payload.username, password: 'WrongPassword1!' });

      await loginPage.expectInvalidCredentialsToastCount(1, true);
      await loginPage.expectStillOnLoginPage(true);
    });

    await test.step('b) Username koji ne postoji', async () => {
      await loginPage.login({ username: `nonexistent_user_${Date.now()}`, password: 'AnyPassword1!' });

      await loginPage.expectInvalidCredentialsToastCount(2, true);
      await loginPage.expectStillOnLoginPage(true);
    });
  },
);

test(
  '[QA-34][E2E] Prijava neverifikovanog korisnika',
  { tag: ['@e2e'] },
  async ({ usersApi }) => {
    const user = buildValidUserPayload();
    await usersApi.createUser(user);

    await loginPage.login({ username: user.username, password: user.password });

    await loginPage.expectEmailNotVerifiedToastVisible();
    await loginPage.expectStillOnLoginPage();
  },
);

test(
  '[QA-35][E2E] Prijava na deaktiviran nalog',
  { tag: ['@e2e'] },
  async ({ usersApi, verifiedTestUser }) => {
    await usersApi.softDelete(verifiedTestUser.id, verifiedTestUser.token);

    await loginPage.login({ username: verifiedTestUser.payload.username, password: verifiedTestUser.payload.password });

    await loginPage.expectAccountDeactivatedToastVisible();
    await loginPage.expectStillOnLoginPage();
  },
);
