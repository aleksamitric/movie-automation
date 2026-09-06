import { expect, Locator, Page } from '@playwright/test';
import { Film } from '../models/film.model';
import { Series } from '../models/series.model';
import { formatDuration, formatSeasonsLabel } from '../utils/mediaFormatting';
import { getExpect } from '../utils/assert';
import { CreateDebateModalComponent } from './CreateDebateModalComponent';

export class MediaModalComponent {
  readonly createDebateModal: CreateDebateModalComponent;
  private readonly modalContainer: Locator;
  private readonly closeButton: Locator;
  private readonly title: Locator;
  private readonly commentInput: Locator;
  private readonly postCommentButton: Locator;
  private readonly startDebateButton: Locator;
  private readonly viewAllDebatesButton: Locator;
  private readonly watchlistButton: Locator;

  constructor(page: Page) {
    this.createDebateModal = new CreateDebateModalComponent(page);
    this.closeButton = page.getByRole('button', { name: '✕' });
    this.modalContainer = this.closeButton.locator('xpath=..');
    this.title = this.modalContainer.getByRole('heading', { level: 1 });
    this.commentInput = this.modalContainer.getByPlaceholder('Write a comment...');
    this.postCommentButton = this.modalContainer.getByRole('button', { name: 'Post' });
    this.startDebateButton = this.modalContainer.getByRole('button', { name: '+ Start a Debate' });
    this.viewAllDebatesButton = this.modalContainer.getByRole('button', { name: 'View all →' });
    this.watchlistButton = this.modalContainer.getByRole('button', { name: /Add to watchlist|Watchlisted/ });
  }

  async toggleWatchlist(): Promise<void> {
    await this.watchlistButton.click();
  }

  async expectInWatchlist(soft = false): Promise<void> {
    const assert = getExpect(soft);
    await assert(this.watchlistButton).toHaveText('Watchlisted');
    await assert(this.watchlistButton).toHaveAttribute('title', 'Remove from watchlist');
  }

  async expectNotInWatchlist(soft = false): Promise<void> {
    const assert = getExpect(soft);
    await assert(this.watchlistButton).toHaveText('Add to watchlist');
    await assert(this.watchlistButton).toHaveAttribute('title', 'Add to watchlist');
  }

  async close(): Promise<void> {
    await this.closeButton.click();
  }

  async openCreateDebateModal(): Promise<void> {
    await this.startDebateButton.click();
  }

  async openDebatesList(): Promise<void> {
    await this.viewAllDebatesButton.click();
  }

  async rate(value: number): Promise<void> {
    await this.starByValue(value).click();
  }

  async expectYourRatingText(value: number, soft = false): Promise<void> {
    await getExpect(soft)(this.modalContainer.getByText(`You rated this ${value}/10`, { exact: true })).toBeVisible();
  }

  async postComment(text: string): Promise<void> {
    await this.commentInput.fill(text);
    await this.postCommentButton.click();
  }

  async expectCommentVisible(text: string, soft = false): Promise<void> {
    await getExpect(soft)(this.modalContainer.getByText(text, { exact: true })).toBeVisible();
  }

  async expectCommentInputEmpty(soft = false): Promise<void> {
    await getExpect(soft)(this.commentInput).toHaveValue('');
  }

  async expectCommentNotVisible(text: string, soft = false): Promise<void> {
    await getExpect(soft)(this.modalContainer.getByText(text, { exact: true })).not.toBeVisible();
  }

  private starByValue(value: number): Locator {
    return this.modalContainer.getByTitle(`${value}/10`);
  }

  async expectNotFoundMessageVisible(): Promise<void> {
    await expect(this.modalContainer.getByText(/not found/i)).toBeVisible();
  }

  async expectFilmDetailsVisible(film: Film, averageRating: number, soft = false): Promise<void> {
    await this.expectCommonDetailsVisible(film, averageRating, soft);
    await getExpect(soft)(this.modalContainer.getByText(formatDuration(film.duration), { exact: true })).toBeVisible();
  }

  async expectSeriesDetailsVisible(series: Series, averageRating: number, soft = false): Promise<void> {
    await this.expectCommonDetailsVisible(series, averageRating, soft);
    await getExpect(soft)(
      this.modalContainer.getByText(formatSeasonsLabel(series.seasons), { exact: true }),
    ).toBeVisible();
  }

  private async expectCommonDetailsVisible(media: Film | Series, averageRating: number, soft = false): Promise<void> {
    const assert = getExpect(soft);
    await assert(this.title).toHaveText(media.title);
    await assert(this.modalContainer.getByRole('img', { name: media.title })).toBeVisible();
    await assert(this.modalContainer.getByText(String(media.year), { exact: true })).toBeVisible();
    await assert(this.modalContainer.getByText(`★ ${averageRating.toFixed(1)}`, { exact: true })).toBeVisible();
    await assert(this.modalContainer.getByText(media.director, { exact: true })).toBeVisible();
    await assert(this.modalContainer.getByText(media.description, { exact: true })).toBeVisible();

    for (const genre of media.genres) {
      await assert(this.modalContainer.getByText(genre.name, { exact: true })).toBeVisible();
    }
  }
}
