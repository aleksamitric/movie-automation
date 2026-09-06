import { expect, Locator, Page } from '@playwright/test';
import { Genre } from '../models/genre.model';
import { MediaTypeToggleComponent } from '../components/MediaTypeToggleComponent';
import { MediaModalComponent } from '../components/MediaModalComponent';
import { AvatarMenuComponent } from '../components/AvatarMenuComponent';

export class ExplorePage {
  readonly mediaTypeToggle: MediaTypeToggleComponent;
  readonly mediaModal: MediaModalComponent;
  readonly avatarMenu: AvatarMenuComponent;
  private readonly genreRow: Locator;
  private readonly genreRowTitle: Locator;
  private readonly genreRowPosterCards: Locator;

  constructor(private readonly page: Page, genre: Genre) {
    this.mediaTypeToggle = new MediaTypeToggleComponent(page);
    this.mediaModal = new MediaModalComponent(page);
    this.avatarMenu = new AvatarMenuComponent(page);
    this.genreRow = page.locator(`#genre-${genre.id}`);
    this.genreRowTitle = this.genreRow.getByText(genre.name, { exact: true });
    this.genreRowPosterCards = this.genreRow.getByAltText('Poster');
  }

  async goto(): Promise<void> {
    await this.page.goto('/explore');
  }

  async expectGenreRowTitleVisible(): Promise<void> {
    await expect(this.genreRowTitle).toBeVisible();
  }

  async expectGenreRowHasAtLeastOneCard(): Promise<void> {
    await expect(this.genreRowPosterCards.first()).toBeVisible();
  }

  async expectMediaCardVisible(posterUrl: string): Promise<void> {
    await expect(this.posterByUrl(posterUrl)).toBeVisible();
  }

  async openMediaDetails(posterUrl: string): Promise<void> {
    await this.posterByUrl(posterUrl).click();
  }

  private posterByUrl(posterUrl: string): Locator {
    return this.genreRow.locator(`img[src="${posterUrl}"]`);
  }
}
