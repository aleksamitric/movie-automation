import { test, expect } from '../../fixtures/api.fixtures';
import { LoginResponse, JwtPayload } from '../../models/auth.model';
import { Genre } from '../../models/genre.model';
import { Film } from '../../models/film.model';
import { Series } from '../../models/series.model';
import { Comment } from '../../models/comment.model';
import { buildFilmPayload } from '../../test-data/film.data';
import { buildSeriesPayload } from '../../test-data/series.data';
import { ADMIN_TEST_USERNAME, ADMIN_TEST_PASSWORD } from '../../constants/test-accounts.constants';
import { decodeJwtPayload } from '../../utils/jwt';
import { deleteFilmRatingIfAny, deleteSeriesRatingIfAny } from '../../utils/ratingCleanup';
import { deleteFilmCommentsIfAny, deleteSeriesCommentsIfAny } from '../../utils/commentCleanup';
import { deleteFilmSafely, deleteSeriesSafely } from '../../utils/filmSeriesCleanup';

const RATING_VALUE = 8;
const COMMENT_TEXT = 'Automated test comment.';

let adminToken: string;
let adminUserId: number;
let genre: Genre;
let film: Film;
let series: Series;
let filmComment: Comment;
let seriesComment: Comment;

test.beforeEach(async ({ authApi, genresApi, filmsApi, seriesApi, ratingsApi, commentsApi }) => {
  const loginResponse = await authApi.login({ username: ADMIN_TEST_USERNAME, password: ADMIN_TEST_PASSWORD });
  ({ token: adminToken } = (await loginResponse.json()) as LoginResponse);
  adminUserId = Number(decodeJwtPayload<JwtPayload>(adminToken).userId);

  const genresResponse = await genresApi.getAll(adminToken);
  const genres: Genre[] = await genresResponse.json();
  genre = genres[0];

  const filmPayload = buildFilmPayload(genre.id);
  await filmsApi.create(filmPayload, adminToken);
  const allFilms: Film[] = await (await filmsApi.getAll(adminToken)).json();
  film = allFilms.find((f) => f.title === filmPayload.title)!;

  const seriesPayload = buildSeriesPayload(genre.id);
  await seriesApi.create(seriesPayload, adminToken);
  const allSeries: Series[] = await (await seriesApi.getAll(adminToken)).json();
  series = allSeries.find((s) => s.title === seriesPayload.title)!;

  await ratingsApi.createForFilm({ userId: adminUserId, filmId: film.id, value: RATING_VALUE }, adminToken);
  await ratingsApi.createForSeries({ userId: adminUserId, seriesId: series.id, value: RATING_VALUE }, adminToken);

  await commentsApi.createForFilm({ userId: adminUserId, filmId: film.id, text: COMMENT_TEXT }, adminToken);
  const filmComments: Comment[] = await (await commentsApi.getByFilmId(film.id)).json();
  filmComment = filmComments[0];

  await commentsApi.createForSeries({ userId: adminUserId, seriesId: series.id, text: COMMENT_TEXT }, adminToken);
  const seriesComments: Comment[] = await (await commentsApi.getBySeriesId(series.id)).json();
  seriesComment = seriesComments[0];
});

test.afterEach(async ({ filmsApi, seriesApi, ratingsApi, commentsApi }) => {
  if (!film || !series) return;
  await deleteFilmRatingIfAny(ratingsApi, adminUserId, film.id, adminToken);
  await deleteSeriesRatingIfAny(ratingsApi, adminUserId, series.id, adminToken);
  await deleteFilmCommentsIfAny(commentsApi, film.id, adminToken);
  await deleteSeriesCommentsIfAny(commentsApi, series.id, adminToken);

  await deleteFilmSafely(filmsApi, film.id, adminToken);
  await deleteSeriesSafely(seriesApi, series.id, adminToken);
});

test(
  '[QA-69][API] Brisanje filma/serije koji ima postojeću ocenu',
  { tag: ['@api'] },
  async ({ filmsApi, seriesApi, ratingsApi }) => {
    await test.step('a) Film', async () => {
      const response = await filmsApi.delete(film.id, adminToken);

      expect.soft(response.status()).toBe(200);
      expect.soft(await response.text()).toBe('Film successfully deleted.');

      expect.soft((await filmsApi.getById(film.id)).status()).toBe(404);
      expect.soft((await ratingsApi.getUserFilmRating(adminUserId, film.id)).status()).toBe(404);
    });

    await test.step('b) Series', async () => {
      const response = await seriesApi.delete(series.id, adminToken);

      expect.soft(response.status()).toBe(200);
      expect.soft(await response.text()).toBe('Series deleted successfully');

      expect.soft((await seriesApi.getById(series.id)).status()).toBe(404);
      expect.soft((await ratingsApi.getUserSeriesRating(adminUserId, series.id)).status()).toBe(404);
    });
  },
);

test(
  '[QA-70][API] Brisanje filma/serije koji ima postojeći komentar',
  { tag: ['@api'] },
  async ({ filmsApi, seriesApi, commentsApi }) => {
    await test.step('a) Film', async () => {
      const response = await filmsApi.delete(film.id, adminToken);

      expect.soft(response.status()).toBe(200);
      expect.soft(await response.text()).toBe('Film successfully deleted.');

      expect.soft((await filmsApi.getById(film.id)).status()).toBe(404);
      expect.soft((await commentsApi.getById(filmComment.id)).status()).toBe(404);
    });

    await test.step('b) Series', async () => {
      const response = await seriesApi.delete(series.id, adminToken);

      expect.soft(response.status()).toBe(200);
      expect.soft(await response.text()).toBe('Series deleted successfully');

      expect.soft((await seriesApi.getById(series.id)).status()).toBe(404);
      expect.soft((await commentsApi.getById(seriesComment.id)).status()).toBe(404);
    });
  },
);
