import { expect, Locator, Page } from '@playwright/test';

export class AvatarMenuComponent {
  private readonly accountMenuButton: Locator;
  private readonly logoutMenuItem: Locator;
  private readonly loggedOutToast: Locator;

  constructor(private readonly page: Page) {
    this.accountMenuButton = page.getByRole('button', { name: 'Account settings' });
    this.logoutMenuItem = page.getByRole('menuitem', { name: 'Logout' });
    this.loggedOutToast = page.getByText('Logged out.');
  }

  async logout(): Promise<void> {
    await this.accountMenuButton.click();
    await this.logoutMenuItem.click();
  }

  async expectLoggedOutToastVisible(): Promise<void> {
    await expect(this.loggedOutToast).toBeVisible();
  }

  async expectSessionClearedFromLocalStorage(): Promise<void> {
    const session = await this.page.evaluate(() => ({
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
    }));

    expect(session.token).toBeNull();
    expect(session.user).toBeNull();
  }
}
