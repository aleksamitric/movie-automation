import { getRequiredEnvVar } from '../utils/env';

export const API_BASE_URL = getRequiredEnvVar('API_BASE_URL');

export const UserEndpoints = {
  CREATE_USER: '/api/User/CreateUser',
  CREATE_TEST_USER: '/api/User/CreateTestUser',
  VERIFY_EMAIL: '/api/User/verify-email',
  GET_ALL: '/api/User/GetAll',
  getById: (id: number): string => `/api/User/GetByID/${id}`,
  softDelete: (id: number): string => `/api/User/SoftDelete/${id}`,
  deleteUser: (id: number): string => `/api/User/DeleteUser/${id}`,
  changePassword: (id: number): string => `/api/User/ChangePassword/${id}`,
  updateEmail: (id: number): string => `/api/User/UpdateEmail/${id}`,
  privacySettings: (id: number): string => `/api/User/PrivacySettings/${id}`,
} as const;

export const AuthEndpoints = {
  LOGIN: '/api/Auth/login',
} as const;

export const GenreEndpoints = {
  GET_ALL: '/api/Genre/GetAll',
} as const;

export const FilmEndpoints = {
  CREATE: '/api/Film/CreateFilm',
  GET_ALL: '/api/Film/GetAll',
  GROUPED_BY_GENRE: '/api/Film/GroupedByGenre',
  ORDERED_BY_TIME_ADDED: '/api/Film/OrderedByTimeAdded',
  TRENDING: '/api/Film/trending',
  getById: (id: number): string => `/api/Film/GetByID/${id}`,
  updateFilm: (id: number): string => `/api/Film/UpdateFilm/${id}`,
  deleteFilm: (id: number): string => `/api/Film/DeleteFilm/${id}`,
} as const;

export const RatingEndpoints = {
  CREATE_FOR_FILM: '/api/Rating/CreateRatingForFilm',
  CREATE_FOR_SERIES: '/api/Rating/CreateRatingForSeries',
  GET_ALL: '/api/Rating/GetAll',
  getById: (id: number): string => `/api/Rating/GetByID/${id}`,
  updateRating: (id: number): string => `/api/Rating/UpdateRating/${id}`,
  deleteRating: (id: number): string => `/api/Rating/DeleteRating/${id}`,
  getByFilmId: (filmId: number): string => `/api/Rating/film/${filmId}`,
  getBySeriesId: (seriesId: number): string => `/api/Rating/series/${seriesId}`,
  getByUserId: (userId: number): string => `/api/Rating/user/${userId}`,
  getUserFilmRating: (userId: number, filmId: number): string => `/api/Rating/user/${userId}/film/${filmId}`,
  getUserSeriesRating: (userId: number, seriesId: number): string => `/api/Rating/user/${userId}/series/${seriesId}`,
} as const;

export const CommentEndpoints = {
  CREATE_FOR_FILM: '/api/Comment/CreateCommentForFilm',
  CREATE_FOR_SERIES: '/api/Comment/CreateCommentForSeries',
  GET_ALL: '/api/Comment/GetAll',
  getById: (id: number): string => `/api/Comment/GetByID/${id}`,
  updateComment: (id: number): string => `/api/Comment/UpdateComment/${id}`,
  deleteComment: (id: number): string => `/api/Comment/DeleteComment/${id}`,
  getByFilmId: (filmId: number): string => `/api/Comment/film/${filmId}`,
  getBySeriesId: (seriesId: number): string => `/api/Comment/series/${seriesId}`,
  getByUserId: (userId: number): string => `/api/Comment/user/${userId}`,
} as const;

export const DebateEndpoints = {
  CREATE: '/api/Debate/Create',
  GET_ALL: '/api/Debate',
  getById: (id: number): string => `/api/Debate/${id}`,
  getByFilmId: (filmId: number): string => `/api/Debate/film/${filmId}`,
  getBySeriesId: (seriesId: number): string => `/api/Debate/series/${seriesId}`,
  deleteDebate: (id: number): string => `/api/Debate/Delete/${id}`,
  like: (postId: number): string => `/api/Debate/like/${postId}`,
  incrementView: (id: number): string => `/api/Debate/view/${id}`,
} as const;

export const WatchlistEndpoints = {
  ADD: '/api/Watchlist/Add',
  getByUserId: (userId: number): string => `/api/Watchlist/GetByUserId/${userId}`,
  remove: (id: number): string => `/api/Watchlist/Remove/${id}`,
  markWatched: (id: number): string => `/api/Watchlist/MarkWatched/${id}`,
} as const;

export const SeriesEndpoints = {
  CREATE: '/api/Series/CreateFilm',
  GET_ALL: '/api/Series/GetAll',
  GROUPED_BY_GENRE: '/api/Series/GroupedByGenre',
  ORDERED_BY_TIME_ADDED: '/api/Series/OrderedByTimeAdded',
  TRENDING: '/api/Series/trending',
  getById: (id: number): string => `/api/Series/GetByID/${id}`,
  updateSeries: (id: number): string => `/api/Series/UpdateSeries/${id}`,
  deleteSeries: (id: number): string => `/api/Series/DeleteSeries/${id}`,
} as const;
