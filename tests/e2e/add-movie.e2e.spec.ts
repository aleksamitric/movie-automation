import { test, expect } from '../../fixtures/auth.fixtures';
import { LoginPage } from '../../pages/LoginPage';
import { AddMoviePage } from '../../pages/AddMoviePage';
import { LoginResponse } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { buildMovieFormInput, buildMovieFormInputWithOverrides } from '../../test-data/film.data';
import { buildSeriesFormInput } from '../../test-data/series.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { FilmEndpoints } from '../../constants/api.constants';
import { deleteFilmSafely, deleteSeriesSafely } from '../../utils/filmSeriesCleanup';

let adminToken: string;
let genre: Genre;
let addMoviePage: AddMoviePage;

test.beforeEach(async ({ page, authApi, genresApi }) => {
  const loginResponse = await authApi.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
  ({ token: adminToken } = (await loginResponse.json()) as LoginResponse);

  const genresResponse = await genresApi.getAll(adminToken);
  const genres: Genre[] = await genresResponse.json();
  genre = genres[0];

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
  await loginPage.expectRedirectToHome();

  addMoviePage = new AddMoviePage(page);
  await addMoviePage.goto();
});

test(
  '[QA-75][E2E] Kreiranje filma/serije kroz Add Movie formu, uspešno i sa praznim obaveznim poljima - a) Movie - validni podaci',
  { tag: ['@e2e', '@smoke'] },
  async ({ filmsApi }) => {
    const movie = buildMovieFormInput(genre.name);

    try {
      await addMoviePage.addMovie(movie);

      await addMoviePage.expectMovieAddedMessageVisible();
      await addMoviePage.expectFormReset();
    } finally {
      const allFilms: Film[] = await (await filmsApi.getAll(adminToken)).json();
      const createdFilm = allFilms.find((f) => f.title === movie.title);
      if (createdFilm) {
        await deleteFilmSafely(filmsApi, createdFilm.id, adminToken);
      }
    }
  },
);

test(
  '[QA-75][E2E] Kreiranje filma/serije kroz Add Movie formu, uspešno i sa praznim obaveznim poljima - b) Series - validni podaci',
  { tag: ['@e2e', '@smoke'] },
  async ({ seriesApi }) => {
    const series = buildSeriesFormInput(genre.name);

    try {
      await addMoviePage.addSeries(series);

      await addMoviePage.expectSeriesAddedMessageVisible();
      await addMoviePage.expectFormReset();
    } finally {
      const allSeries: Series[] = await (await seriesApi.getAll(adminToken)).json();
      const createdSeries = allSeries.find((s) => s.title === series.title);
      if (createdSeries) {
        await deleteSeriesSafely(seriesApi, createdSeries.id, adminToken);
      }
    }
  },
);

test(
  '[QA-75][E2E] Kreiranje filma/serije kroz Add Movie formu, uspešno i sa praznim obaveznim poljima',
  { tag: ['@e2e', '@smoke'] },
  async ({ page }) => {
    await test.step('c) Prazno Title', async () => {
      let createFilmRequestSent = false;
      await page.route(`**${FilmEndpoints.CREATE}`, async (route) => {
        createFilmRequestSent = true;
        await route.continue();
      });

      const movie = buildMovieFormInputWithOverrides(genre.name, { title: '' });
      await addMoviePage.addMovie(movie);

      await addMoviePage.expectTitleRequiredErrorVisible(true);
      expect.soft(createFilmRequestSent).toBe(false);
    });

    await test.step('d) Prazno Release year', async () => {
      let createFilmRequestSent = false;
      await page.route(`**${FilmEndpoints.CREATE}`, async (route) => {
        createFilmRequestSent = true;
        await route.continue();
      });

      const movie = buildMovieFormInputWithOverrides(genre.name, { releaseYear: '' });
      await addMoviePage.addMovie(movie);

      await addMoviePage.expectValidYearRequiredErrorVisible(true);
      expect.soft(createFilmRequestSent).toBe(false);
    });

    await test.step('e) Nije izabran nijedan žanr', async () => {
      let createFilmRequestSent = false;
      await page.route(`**${FilmEndpoints.CREATE}`, async (route) => {
        createFilmRequestSent = true;
        await route.continue();
      });

      const movie = buildMovieFormInputWithOverrides(genre.name, { genreName: null });
      await addMoviePage.addMovie(movie);

      await addMoviePage.expectSelectAtLeastOneGenreErrorVisible(true);
      expect.soft(createFilmRequestSent).toBe(false);
    });
  },
);
