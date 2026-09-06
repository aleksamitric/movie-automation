import { expect, Locator, Page } from '@playwright/test';

export interface ExpectedProfileUser {
  firstName: string;
  lastName: string;
  username: string;
}

export class ProfilePage {
  private readonly fullNameHeading: Locator;
  private readonly usernameHandle: Locator;
  private readonly watchlistStatLabel: Locator;
  private readonly watchedStatLabel: Locator;
  private readonly reviewsStatLabel: Locator;
  private readonly avgRatingStatLabel: Locator;

  constructor(private readonly page: Page, expectedUser: ExpectedProfileUser) {
    this.fullNameHeading = page.getByRole('heading', {
      level: 2,
      name: `${expectedUser.firstName} ${expectedUser.lastName}`,
    });
    const escapedUsername = expectedUser.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this.usernameHandle = page.locator('div').filter({ hasText: new RegExp(`^@${escapedUsername}$`) });
    this.watchlistStatLabel = page.getByText('Watchlist', { exact: true }).first();
    this.watchedStatLabel = page.getByText('Watched', { exact: true }).first();
    this.reviewsStatLabel = page.getByText('Reviews', { exact: true }).first();
    this.avgRatingStatLabel = page.getByText('Avg Rating', { exact: true }).first();
  }

  async goto(): Promise<void> {
    await this.page.goto('/profile');
  }

  async expectFullNameVisible(): Promise<void> {
    await expect(this.fullNameHeading).toBeVisible();
  }

  async expectUsernameVisible(): Promise<void> {
    await expect(this.usernameHandle).toBeVisible();
  }

  async expectWatchlistStatVisible(): Promise<void> {
    await expect(this.watchlistStatLabel).toBeVisible();
  }

  async expectWatchedStatVisible(): Promise<void> {
    await expect(this.watchedStatLabel).toBeVisible();
  }

  async expectReviewsStatVisible(): Promise<void> {
    await expect(this.reviewsStatLabel).toBeVisible();
  }

  async expectAverageRatingStatVisible(): Promise<void> {
    await expect(this.avgRatingStatLabel).toBeVisible();
  }
}
