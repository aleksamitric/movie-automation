import { expect, Locator, Page } from '@playwright/test';

export class TrendingSectionComponent {
  private readonly heading: Locator;
  private readonly cards: Locator;

  constructor(page: Page) {
    this.heading = page.getByRole('heading', { level: 2, name: 'Trending Now', exact: true });
    const wrapper = this.heading.locator('xpath=../..');
    this.cards = wrapper.locator('img[alt]');
  }

  async expectHeadingVisible(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async expectAtLeastOneCardVisible(): Promise<void> {
    await expect(this.cards.first()).toBeVisible();
  }
}
