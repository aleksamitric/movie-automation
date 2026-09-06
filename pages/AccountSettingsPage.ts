import { expect, Locator, Page } from '@playwright/test';

export class AccountSettingsPage {
  private readonly emailInput: Locator;
  private readonly saveEmailButton: Locator;
  private readonly currentPasswordInput: Locator;
  private readonly newPasswordInput: Locator;
  private readonly confirmNewPasswordInput: Locator;
  private readonly updatePasswordButton: Locator;
  private readonly deactivateAccountButton: Locator;
  private readonly toast: Locator;
  private readonly accountDeactivatedToast: Locator;

  constructor(private readonly page: Page) {
    const passwordInputs = page.locator('input[type="password"]');
    this.emailInput = page.getByPlaceholder('your@email.com');
    this.saveEmailButton = page.getByRole('button', { name: 'Save changes' });
    this.currentPasswordInput = passwordInputs.nth(0);
    this.newPasswordInput = passwordInputs.nth(1);
    this.confirmNewPasswordInput = passwordInputs.nth(2);
    this.updatePasswordButton = page.getByRole('button', { name: 'Update password' });
    this.deactivateAccountButton = page.getByRole('button', { name: 'Deactivate account' });
    this.toast = page.getByRole('alert');
    this.accountDeactivatedToast = page.getByText('Account deactivated.');
  }

  async goto(): Promise<void> {
    await this.page.goto('/settings/account');
  }

  async updateEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.saveEmailButton.click();
  }

  async changePassword(currentPassword: string, newPassword: string, confirmNewPassword: string): Promise<void> {
    await this.currentPasswordInput.fill(currentPassword);
    await this.newPasswordInput.fill(newPassword);
    await this.confirmNewPasswordInput.fill(confirmNewPassword);
    await this.updatePasswordButton.click();
  }

  async deactivateAccount(): Promise<void> {
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.deactivateAccountButton.click();
  }

  async expectEmailUpdatedToastVisible(): Promise<void> {
    await expect(this.toast).toHaveText('Email updated successfully.');
  }

  async expectPasswordChangedToastVisible(): Promise<void> {
    await expect(this.toast).toHaveText('Password changed successfully.');
  }

  async expectPasswordMismatchToastVisible(): Promise<void> {
    await expect(this.toast).toHaveText('New passwords do not match.');
  }

  async expectAccountDeactivatedToastVisible(): Promise<void> {
    await expect(this.accountDeactivatedToast).toBeVisible();
  }

  async expectSessionClearedFromLocalStorage(): Promise<void> {
    const session = await this.page.evaluate(() => ({
      token: localStorage.getItem('token'),
      user: localStorage.getItem('user'),
    }));

    expect(session.token).toBeNull();
    expect(session.user).toBeNull();
  }

  async expectRedirectToLogin(): Promise<void> {
    await this.page.waitForURL('/login');
  }
}