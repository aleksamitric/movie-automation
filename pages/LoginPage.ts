import { expect, Locator, Page } from '@playwright/test';
import { LoginRequest } from '../models/auth.model';
import { getExpect } from '../utils/assert';

export class LoginPage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly loggedInToast: Locator;
  private readonly invalidCredentialsToast: Locator;
  private readonly toast: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.loginButton = page.getByRole('button', { name: 'Login' });
    this.loggedInToast = page.getByText('Logged in successfully.');
    this.invalidCredentialsToast = page.getByText('Invalid username or password.');
    this.toast = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async login(credentials: LoginRequest): Promise<void> {
    await this.usernameInput.fill(credentials.username);
    await this.passwordInput.fill(credentials.password);
    await this.loginButton.click();
  }

  async expectLoggedInToastVisible(soft = false): Promise<void> {
    await getExpect(soft)(this.loggedInToast).toBeVisible();
  }

  async expectRedirectToHome(): Promise<void> {
    await this.page.waitForURL('/home');
  }

  async expectStillOnLoginPage(soft = false): Promise<void> {
    await getExpect(soft)(this.page).toHaveURL('/login');
  }

  async expectInvalidCredentialsToastVisible(soft = false): Promise<void> {
    await getExpect(soft)(this.invalidCredentialsToast).toBeVisible();
  }

  async expectInvalidCredentialsToastCount(count: number, soft = false): Promise<void> {
    await getExpect(soft)(this.invalidCredentialsToast).toHaveCount(count);
  }

  async expectEmailNotVerifiedToastVisible(): Promise<void> {
    await expect(this.toast).toHaveText('Email not verified. Please verify your email before logging in.');
  }

  async expectAccountDeactivatedToastVisible(): Promise<void> {
    await expect(this.toast).toHaveText('This account has been deactivated.');
  }
}
