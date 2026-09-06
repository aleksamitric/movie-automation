import { test } from '../../fixtures/api.fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { HomePage } from '../../pages/HomePage';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';

let loginPage: LoginPage;

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  await loginPage.goto();
});

test(
  '[QA-42][E2E] Vidljivost "Add Movie" linka u navigaciji u zavisnosti od role',
  { tag: ['@e2e', '@authorization'] },
  async ({ page, verifiedTestUser }) => {
    const homePage = new HomePage(page);

    await test.step('a) Admin nalog', async () => {
      await loginPage.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
      await loginPage.expectRedirectToHome();

      await homePage.navbar.expectAddMovieLinkVisible(true);

      await homePage.avatarMenu.logout();
    });

    await test.step('b) Regularan korisnik', async () => {
      await loginPage.goto();
      await loginPage.login({
        username: verifiedTestUser.payload.username,
        password: verifiedTestUser.payload.password,
      });
      await loginPage.expectRedirectToHome();

      await homePage.navbar.expectAddMovieLinkHidden(true);
    });
  },
);
