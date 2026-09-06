import { test } from '../../fixtures/auth.fixtures';
import { UnauthorizedPage } from '../../pages/UnauthorizedPage';
import { LoginPage } from '../../pages/LoginPage';
import { HomePage } from '../../pages/HomePage';

let unauthorizedPage: UnauthorizedPage;

test.beforeEach(async ({ page }) => {
  unauthorizedPage = new UnauthorizedPage(page);
  await page.goto('/home');
});

test(
  '[QA-39][E2E] Pristup zaštićenoj ruti bez tokena redirect na /unauthorized',
  { tag: ['@e2e'] },
  async () => {
    await unauthorizedPage.expectRedirectToUnauthorized();
    await unauthorizedPage.expectLoginRequiredHeadingVisible();
    await unauthorizedPage.expectSignInRequiredMessageVisible();

    await unauthorizedPage.clickLoginButton();
    await unauthorizedPage.expectRedirectToLogin();
  },
);

test(
  '[QA-40][E2E] Logout uklanja sesiju i povratak na zaštićenu rutu nakon logout-a vodi na /login',
  { tag: ['@e2e'] },
  async ({ authenticatedPage }) => {
    const loginPage = new LoginPage(authenticatedPage);
    const homePage = new HomePage(authenticatedPage);

    await homePage.avatarMenu.logout();

    await homePage.avatarMenu.expectLoggedOutToastVisible();
    await homePage.avatarMenu.expectSessionClearedFromLocalStorage();
    await loginPage.expectStillOnLoginPage();

    await authenticatedPage.goBack();
    await loginPage.expectStillOnLoginPage();
  },
);
