import { expect, Locator, Page } from '@playwright/test';
import { MovieFormInput } from '../test-data/film.data';
import { SeriesFormInput } from '../test-data/series.data';
import { getExpect } from '../utils/assert';

export class AddMoviePage {
  private readonly movieTabButton: Locator;
  private readonly seriesTabButton: Locator;
  private readonly titleInput: Locator;
  private readonly releaseYearInput: Locator;
  private readonly durationInput: Locator;
  private readonly seasonsInput: Locator;
  private readonly directorInput: Locator;
  private readonly descriptionInput: Locator;
  private readonly posterUrlInput: Locator;
  private readonly landscapeUrlInput: Locator;
  private readonly addMovieButton: Locator;
  private readonly addSeriesButton: Locator;
  private readonly movieAddedMessage: Locator;
  private readonly seriesAddedMessage: Locator;
  private readonly titleRequiredError: Locator;
  private readonly validYearRequiredError: Locator;
  private readonly selectAtLeastOneGenreError: Locator;

  constructor(private readonly page: Page) {
    this.movieTabButton = page.getByRole('button', { name: 'Movie', exact: true });
    this.seriesTabButton = page.locator('button:text-is("Movie") + button:text-is("Series")');
    this.titleInput = page.getByPlaceholder('e.g. Inception');
    this.releaseYearInput = page.getByPlaceholder('2010');
    this.durationInput = page.getByPlaceholder('148');
    this.seasonsInput = page.getByPlaceholder('e.g. 3');
    this.directorInput = page.getByPlaceholder('e.g. Christopher Nolan');
    this.descriptionInput = page.getByPlaceholder('Short description…');
    this.posterUrlInput = page.getByPlaceholder('https://… (tall/portrait — used in cards)');
    this.landscapeUrlInput = page.getByPlaceholder('https://… (wide/landscape — used in hero banner & modal)');
    this.addMovieButton = page.getByRole('button', { name: 'Add Movie' });
    this.addSeriesButton = page.getByRole('button', { name: 'Add Series' });
    this.movieAddedMessage = page.getByText('Movie added successfully!');
    this.seriesAddedMessage = page.getByText('Series added successfully!');
    this.titleRequiredError = page.getByText('Title is required.');
    this.validYearRequiredError = page.getByText('Valid year is required.');
    this.selectAtLeastOneGenreError = page.getByText('Select at least one genre.');
  }

  private genrePillLocator(genreName: string): Locator {
    return this.page.getByRole('button', { name: genreName });
  }

  async goto(): Promise<void> {
    await this.page.goto('/addMovie');
  }

  async addMovie(movie: MovieFormInput): Promise<void> {
    await this.movieTabButton.click();
    await this.titleInput.fill(movie.title);
    await this.releaseYearInput.fill(movie.releaseYear);
    await this.durationInput.fill(movie.duration);
    await this.directorInput.fill(movie.director);
    if (movie.genreName) {
      await this.genrePillLocator(movie.genreName).click();
    }
    await this.descriptionInput.fill(movie.description);
    await this.posterUrlInput.fill(movie.posterUrl);
    await this.landscapeUrlInput.fill(movie.landscapeUrl);
    await this.addMovieButton.click();
  }

  async addSeries(series: SeriesFormInput): Promise<void> {
    await this.seriesTabButton.click();
    await this.titleInput.fill(series.title);
    await this.releaseYearInput.fill(series.releaseYear);
    await this.seasonsInput.fill(series.seasons);
    await this.directorInput.fill(series.director);
    if (series.genreName) {
      await this.genrePillLocator(series.genreName).click();
    }
    await this.descriptionInput.fill(series.description);
    await this.posterUrlInput.fill(series.posterUrl);
    await this.landscapeUrlInput.fill(series.landscapeUrl);
    await this.addSeriesButton.click();
  }

  async expectMovieAddedMessageVisible(): Promise<void> {
    await expect(this.movieAddedMessage).toBeVisible();
  }

  async expectSeriesAddedMessageVisible(): Promise<void> {
    await expect(this.seriesAddedMessage).toBeVisible();
  }

  async expectFormReset(): Promise<void> {
    await expect(this.titleInput).toHaveValue('');
  }

  async expectTitleRequiredErrorVisible(soft = false): Promise<void> {
    await getExpect(soft)(this.titleRequiredError).toBeVisible();
  }

  async expectValidYearRequiredErrorVisible(soft = false): Promise<void> {
    await getExpect(soft)(this.validYearRequiredError).toBeVisible();
  }

  async expectSelectAtLeastOneGenreErrorVisible(soft = false): Promise<void> {
    await getExpect(soft)(this.selectAtLeastOneGenreError).toBeVisible();
  }
}
