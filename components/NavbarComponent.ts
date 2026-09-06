import { Locator, Page } from '@playwright/test';
import { getExpect } from '../utils/assert';

export class NavbarComponent {
  private readonly addMovieLink: Locator;

  constructor(private readonly page: Page) {
    this.addMovieLink = page.getByRole('link', { name: 'Add Movie' });
  }

  async expectAddMovieLinkVisible(soft = false): Promise<void> {
    await getExpect(soft)(this.addMovieLink).toBeVisible();
  }

  async expectAddMovieLinkHidden(soft = false): Promise<void> {
    await getExpect(soft)(this.addMovieLink).toBeHidden();
  }
}
