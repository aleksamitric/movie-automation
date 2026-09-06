import { expect, Locator, Page } from '@playwright/test';

export class UnauthorizedPage {
  private readonly loginRequiredHeading: Locator;
  private readonly signInRequiredMessage: Locator;
  private readonly loginButton: Locator;

  constructor(private readonly page: Page) {
    this.loginRequiredHeading = page.getByText('Login Required', { exact: true });
    this.signInRequiredMessage = page.getByText(
      /You need to be signed in to access this page\.\s*Please log in and try again\./,
    );
    this.loginButton = page.getByRole('button', { name: 'Log In' });
  }

  async clickLoginButton(): Promise<void> {
    await this.loginButton.click();
  }

  async expectRedirectToUnauthorized(): Promise<void> {
    await this.page.waitForURL('/unauthorized');
  }

  async expectLoginRequiredHeadingVisible(): Promise<void> {
    await expect(this.loginRequiredHeading).toBeVisible();
  }

  async expectSignInRequiredMessageVisible(): Promise<void> {
    await expect(this.signInRequiredMessage).toBeVisible();
  }

  async expectRedirectToLogin(): Promise<void> {
    await this.page.waitForURL('/login');
  }
}
