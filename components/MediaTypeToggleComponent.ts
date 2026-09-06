import { Locator, Page } from '@playwright/test';

export class MediaTypeToggleComponent {
  private readonly moviesToggleButton: Locator;
  private readonly seriesToggleButton: Locator;

  constructor(page: Page) {
    this.moviesToggleButton = page.getByRole('button', { name: 'Movies', exact: true });
    this.seriesToggleButton = page.getByRole('button', { name: 'Series', exact: true });
  }

  async switchToMovies(): Promise<void> {
    await this.moviesToggleButton.click();
  }

  async switchToSeries(): Promise<void> {
    await this.seriesToggleButton.click();
  }
}
