import { expect, Locator, Page } from '@playwright/test';
import { getExpect } from '../utils/assert';

export interface ExpectedPublicProfileUser {
  username: string;
  email: string;
}

export class PublicProfilePage {
  private readonly usernameHandle: Locator;
  private readonly avatarInitial: Locator;
  private readonly emailText: Locator;
  private readonly reviewsTabButton: Locator;
  private readonly debatesTabButton: Locator;
  private readonly watchlistTabButton: Locator;
  private readonly reviewsEmptyState: Locator;
  private readonly debatesEmptyState: Locator;
  private readonly watchlistEmptyState: Locator;
  private readonly reviewsPrivateState: Locator;
  private readonly watchlistPrivateState: Locator;
  private readonly rightPanel: Locator;
  private readonly statsWatchlistValue: Locator;

  constructor(private readonly page: Page, expectedUser: ExpectedPublicProfileUser) {
    const escapedUsername = expectedUser.username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this.usernameHandle = page.locator('div').filter({ hasText: new RegExp(`^@${escapedUsername}$`) });
    this.avatarInitial = page.getByText(expectedUser.username[0].toUpperCase(), { exact: true });
    this.emailText = page.getByText(expectedUser.email, { exact: true });
    this.reviewsTabButton = page.getByRole('button', { name: 'Reviews' });
    this.debatesTabButton = page.getByRole('button', { name: 'Debates' });
    this.watchlistTabButton = page.getByRole('button', { name: 'Watchlist' });
    this.reviewsEmptyState = page.getByText('No reviews yet.', { exact: true });
    this.debatesEmptyState = page.getByText('No debates to show.', { exact: true });
    this.watchlistEmptyState = page.getByText('Watchlist is empty.', { exact: true });
    this.reviewsPrivateState = page.getByText('Reviews are private.', { exact: true });
    this.watchlistPrivateState = page.getByText('Watchlist is private.', { exact: true });
    this.rightPanel = this.watchlistTabButton.locator('xpath=../..');
    this.statsWatchlistValue = page
      .getByText('Stats', { exact: true })
      .locator('xpath=..')
      .getByText('Watchlist', { exact: true })
      .locator('xpath=following-sibling::*[1]');
  }

  async goto(userId: number): Promise<void> {
    await this.page.goto(`/user/${userId}`);
  }

  async openDebatesTab(): Promise<void> {
    await this.debatesTabButton.click();
  }

  async openWatchlistTab(): Promise<void> {
    await this.watchlistTabButton.click();
  }

  async expectUsernameVisible(): Promise<void> {
    await expect(this.usernameHandle).toBeVisible();
  }

  async expectAvatarInitialVisible(): Promise<void> {
    await expect(this.avatarInitial).toBeVisible();
  }

  async expectEmailVisible(): Promise<void> {
    await expect(this.emailText).toBeVisible();
  }

  async expectEmailHidden(): Promise<void> {
    await expect(this.emailText).toBeHidden();
  }

  async expectReviewsTabContentVisible(): Promise<void> {
    await expect(this.reviewsEmptyState).toBeVisible();
  }

  async expectDebatesTabContentVisible(): Promise<void> {
    await expect(this.debatesEmptyState).toBeVisible();
  }

  async expectWatchlistTabContentVisible(): Promise<void> {
    await expect(this.watchlistEmptyState).toBeVisible();
  }

  async expectReviewsPrivate(soft = false): Promise<void> {
    await getExpect(soft)(this.reviewsPrivateState).toBeVisible();
  }

  async expectWatchlistPrivate(soft = false): Promise<void> {
    await getExpect(soft)(this.watchlistPrivateState).toBeVisible();
  }

  async expectRedirectToProfile(): Promise<void> {
    await this.page.waitForURL('/profile');
  }

  async expectSpoilerContentBlurred(content: string, soft = false): Promise<void> {
    await getExpect(soft)(this.page.getByText(content, { exact: true })).not.toHaveCSS('filter', 'none');
  }

  async expectWatchlistItemVisible(title: string, soft = false): Promise<void> {
    await getExpect(soft)(this.rightPanel.getByText(title, { exact: true })).toBeVisible();
  }

  async expectWatchlistItemWatched(title: string, soft = false): Promise<void> {
    await getExpect(soft)(this.watchlistTile(title).getByText('✓ Watched', { exact: true })).toBeVisible();
  }

  async expectWatchlistItemNotWatched(title: string, soft = false): Promise<void> {
    await getExpect(soft)(this.watchlistTile(title).getByText('✓ Watched', { exact: true })).not.toBeVisible();
  }

  async expectWatchlistStatCount(count: number, soft = false): Promise<void> {
    await getExpect(soft)(this.statsWatchlistValue).toHaveText(String(count));
  }

  async expectWatchlistItemsReadOnly(soft = false): Promise<void> {
    const assert = getExpect(soft);
    await assert(this.rightPanel.getByRole('button', { name: /Mark as watched|✓ Watched/ })).toHaveCount(0);
    await assert(this.rightPanel.getByRole('button', { name: '✕' })).toHaveCount(0);
  }

  private watchlistTile(title: string): Locator {
    return this.rightPanel.getByText(title, { exact: true }).locator('xpath=..');
  }
}