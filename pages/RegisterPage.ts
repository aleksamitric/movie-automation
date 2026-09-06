import { expect, Locator, Page } from '@playwright/test';
import { CreateUserRequest } from '../models/user.model';

export class RegisterPage {
  private readonly usernameInput: Locator;
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly signUpButton: Locator;
  private readonly accountCreatedToast: Locator;
  private readonly invalidPasswordToast: Locator;
  private readonly errorToast: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.locator('input[name="username"]');
    this.firstNameInput = page.locator('input[name="firstName"]');
    this.lastNameInput = page.locator('input[name="lastName"]');
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.getByLabel('Password', { exact: true });
    this.confirmPasswordInput = page.getByLabel('Confirm Password', { exact: true });
    this.signUpButton = page.getByRole('button', { name: 'Sign Up' });
    this.accountCreatedToast = page.getByText('Account created! Check your email for the verification code.');
    this.invalidPasswordToast = page.getByText(
      'Password must be at least 6 characters with an uppercase letter, a number, and a special character.',
    );
    this.errorToast = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/register');
  }

  async register(user: CreateUserRequest): Promise<void> {
    await this.usernameInput.fill(user.username);
    await this.firstNameInput.fill(user.firstName);
    await this.lastNameInput.fill(user.lastName);
    await this.emailInput.fill(user.email);
    await this.passwordInput.fill(user.password);
    await this.confirmPasswordInput.fill(user.confirmPassword);
    await this.signUpButton.click();
  }

  async expectAccountCreatedToastVisible(): Promise<void> {
    await expect(this.accountCreatedToast).toBeVisible();
  }

  async expectRedirectToVerifyEmail(): Promise<void> {
    await this.page.waitForURL('/verify-email');
  }

  async expectInvalidPasswordToastVisible(): Promise<void> {
    await expect(this.invalidPasswordToast).toBeVisible();
  }

  async expectStillOnRegisterPage(): Promise<void> {
    await expect(this.page).toHaveURL('/register');
  }

  async expectErrorToastVisible(): Promise<void> {
    await expect(this.errorToast).toBeVisible();
  }
}
