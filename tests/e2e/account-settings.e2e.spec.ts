import { test } from '../../fixtures/auth.fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { AccountSettingsPage } from '../../pages/AccountSettingsPage';
import { HomePage } from '../../pages/HomePage';

test.describe('Password', () => {
  let loginPage: LoginPage;
  let accountSettingsPage: AccountSettingsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    loginPage = new LoginPage(authenticatedPage);
    accountSettingsPage = new AccountSettingsPage(authenticatedPage);
    await accountSettingsPage.goto();
  });

  test(
    '[QA-48][E2E] Uspešna promena lozinke kroz Account Settings',
    { tag: ['@e2e', '@smoke'] },
    async ({ authenticatedPage, verifiedTestUser }) => {
      const newPassword = 'AccountSettingsNew1!Zx9';

      await accountSettingsPage.changePassword(verifiedTestUser.payload.password, newPassword, newPassword);
      await accountSettingsPage.expectPasswordChangedToastVisible();

      const homePage = new HomePage(authenticatedPage);
      await homePage.avatarMenu.logout();
      await homePage.avatarMenu.expectLoggedOutToastVisible();

      await loginPage.login({ username: verifiedTestUser.payload.username, password: newPassword });
      await loginPage.expectLoggedInToastVisible();
      await loginPage.expectRedirectToHome();
    },
  );

  test(
    '[QA-49][E2E] Promena lozinke kada se nova lozinka i potvrda ne poklapaju',
    { tag: ['@e2e'] },
    async ({ verifiedTestUser }) => {
      await accountSettingsPage.changePassword(verifiedTestUser.payload.password, 'SomeNewPassword1!', 'DifferentPassword1!');
      await accountSettingsPage.expectPasswordMismatchToastVisible();
    },
  );
});

test.describe('Email', () => {
  let accountSettingsPage: AccountSettingsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    accountSettingsPage = new AccountSettingsPage(authenticatedPage);
    await accountSettingsPage.goto();
  });

  test(
    '[QA-52][E2E] Uspešna izmena email adrese kroz Account Settings',
    { tag: ['@e2e', '@smoke'] },
    async () => {
      const newEmail = `updated.${Date.now()}@example.com`;

      await accountSettingsPage.updateEmail(newEmail);
      await accountSettingsPage.expectEmailUpdatedToastVisible();
    },
  );
});

test.describe('Danger Zone', () => {
  let accountSettingsPage: AccountSettingsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    accountSettingsPage = new AccountSettingsPage(authenticatedPage);
    await accountSettingsPage.goto();
  });

  test(
    '[QA-54][E2E] Uspešna deaktivacija naloga kroz Danger Zone',
    { tag: ['@e2e', '@smoke'] },
    async () => {
      await accountSettingsPage.deactivateAccount();

      await accountSettingsPage.expectAccountDeactivatedToastVisible();
      await accountSettingsPage.expectSessionClearedFromLocalStorage();
      await accountSettingsPage.expectRedirectToLogin();
    },
  );
});