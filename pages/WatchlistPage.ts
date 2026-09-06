import { Locator, Page } from '@playwright/test';
import { getExpect } from '../utils/assert';

export class WatchlistPage {
  private readonly watchedButton: Locator;
  private readonly pageContainer: Locator;

  constructor(private readonly page: Page) {
    this.watchedButton = page.getByRole('button', { name: /Mark as watched|✓ Watched/ });
    this.pageContainer = page.getByRole('heading', { name: 'Watchlist', level: 2 }).locator('xpath=..');
  }

  async goto(): Promise<void> {
    await this.page.goto('/watchlist');
  }

  async toggleWatched(): Promise<void> {
    await this.watchedButton.click();
  }

  async expectMarkedAsWatched(soft = false): Promise<void> {
    const assert = getExpect(soft);
    await assert(this.watchedButton).toHaveText('✓ Watched');
    await assert(this.watchedButton).toHaveAttribute('title', 'Mark as unwatched');
  }

  async expectMarkedAsUnwatched(soft = false): Promise<void> {
    const assert = getExpect(soft);
    await assert(this.watchedButton).toHaveText('👁 Mark as watched');
    await assert(this.watchedButton).toHaveAttribute('title', 'Mark as watched');
  }

  async expectItemCount(count: number, soft = false): Promise<void> {
    await getExpect(soft)(this.watchedButton).toHaveCount(count);
  }

  async expectItemVisible(title: string, year: number, soft = false): Promise<void> {
    const assert = getExpect(soft);
    const row = this.itemRow(title);
    await assert(row).toBeVisible();
    await assert(row.getByText(String(year), { exact: true })).toBeVisible();
  }

  private itemRow(title: string): Locator {
    return this.pageContainer.getByRole('img', { name: title }).locator('xpath=../../..');
  }
}
