import { expect, Locator, Page } from '@playwright/test';

export class SearchPage {
  private readonly searchInput: Locator;
  private readonly moviesTypeFilterButton: Locator;
  private readonly seriesTypeFilterButton: Locator;
  private readonly genreSelect: Locator;
  private readonly sortSelect: Locator;

  constructor(private readonly page: Page) {
    this.searchInput = page.getByRole('textbox', { name: 'Search movies & series…', exact: true });
    this.moviesTypeFilterButton = page.locator('button:text-is("All") ~ button:text-is("Movies")');
    this.seriesTypeFilterButton = page.locator('button:text-is("All") ~ button:text-is("Series")');
    this.genreSelect = page.locator('span:text-is("Genre") + select');
    this.sortSelect = page.locator('span:text-is("Sort") + select');
  }

  private resultCardLocator(title: string): Locator {
    return this.page
      .locator('div')
      .filter({ has: this.page.getByText(title, { exact: true }) })
      .filter({ has: this.page.getByText(/^(Movie|Series)$/) })
      .last();
  }

  async goto(): Promise<void> {
    await this.page.goto('/search');
  }

  async searchByTitle(text: string): Promise<void> {
    await this.searchInput.fill(text);
  }

  async filterByGenre(genreName: string): Promise<void> {
    await this.genreSelect.selectOption(genreName);
  }

  async filterByMovies(): Promise<void> {
    await this.moviesTypeFilterButton.click();
  }

  async filterBySeries(): Promise<void> {
    await this.seriesTypeFilterButton.click();
  }

  async sortByTopRated(): Promise<void> {
    await this.sortSelect.selectOption({ label: 'Top rated' });
  }

  async expectResultVisible(title: string): Promise<void> {
    await expect(this.resultCardLocator(title)).toBeVisible();
  }

  async expectResultHidden(title: string): Promise<void> {
    await expect(this.resultCardLocator(title)).toBeHidden();
  }

  async expectResultsCountMessage(expectedCount: number): Promise<void> {
    const suffix = expectedCount === 1 ? 'result' : 'results';
    await expect(this.page.getByText(`${expectedCount} ${suffix}`, { exact: true })).toBeVisible();
  }

  async expectRatedBefore(higherRatedTitle: string, lowerRatedTitle: string): Promise<void> {
    const higherBox = await this.resultCardLocator(higherRatedTitle).boundingBox();
    const lowerBox = await this.resultCardLocator(lowerRatedTitle).boundingBox();

    expect(higherBox).not.toBeNull();
    expect(lowerBox).not.toBeNull();
    expect(higherBox!.y).toBeLessThan(lowerBox!.y);
  }
}
