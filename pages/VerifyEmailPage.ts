import { expect, Locator, Page, Request } from '@playwright/test';
import { UserEndpoints } from '../constants/api.constants';
import { getExpect } from '../utils/assert';

export class VerifyEmailPage {
  private readonly verificationCodeInput: Locator;
  private readonly verifyButton: Locator;
  private readonly emailVerifiedToast: Locator;
  private readonly verificationCodeRequiredToast: Locator;
  private readonly invalidOrExpiredCodeToast: Locator;
  private readonly verifyEmailRequests: Request[] = [];

  constructor(private readonly page: Page) {
    this.verificationCodeInput = page.getByLabel('Verification Code');
    this.verifyButton = page.getByRole('button', { name: 'Verify' });
    this.emailVerifiedToast = page.getByText('Email verified successfully!');
    this.verificationCodeRequiredToast = page.getByText('Please enter the verification code.');
    this.invalidOrExpiredCodeToast = page.getByText('Invalid or expired verification code.');

    this.page.on('request', (request) => {
      if (request.url().includes(UserEndpoints.VERIFY_EMAIL)) {
        this.verifyEmailRequests.push(request);
      }
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/verify-email');
  }

  async verify(verificationCode: string): Promise<void> {
    await this.verificationCodeInput.fill(verificationCode);
    await this.verifyButton.click();
  }

  async expectEmailVerifiedToastVisible(soft = false): Promise<void> {
    await getExpect(soft)(this.emailVerifiedToast).toBeVisible();
  }

  async expectRedirectToLogin(): Promise<void> {
    await this.page.waitForURL('/login');
  }

  async expectVerificationCodeRequiredToastVisible(): Promise<void> {
    await expect(this.verificationCodeRequiredToast).toBeVisible();
  }

  async expectInvalidOrExpiredCodeToastVisible(soft = false): Promise<void> {
    await getExpect(soft)(this.invalidOrExpiredCodeToast).toBeVisible();
  }

  async expectStillOnVerifyEmailPage(soft = false): Promise<void> {
    await getExpect(soft)(this.page).toHaveURL('/verify-email');
  }

  async expectNoVerifyEmailRequestSent(): Promise<void> {
    expect(this.verifyEmailRequests).toHaveLength(0);
  }
}
