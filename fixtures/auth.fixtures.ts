import { test as base, expect } from './api.fixtures';
import { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

interface AuthFixtures {
  authenticatedPage: Page;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page, verifiedTestUser }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login({ username: verifiedTestUser.payload.username, password: verifiedTestUser.payload.password });
    await loginPage.expectRedirectToHome();

    await use(page);
  },
});

export { expect };
