import { RatingsApi } from '../api/ratings.api';
import { Rating } from '../models/rating.model';

export async function deleteFilmRatingIfAny(ratingsApi: RatingsApi, userId: number, filmId: number, token: string): Promise<void> {
  const response = await ratingsApi.getUserFilmRating(userId, filmId);
  if (response.status() === 200) {
    const rating: Rating = await response.json();
    await ratingsApi.deleteRating(rating.id, token);
  }
}

export async function deleteSeriesRatingIfAny(ratingsApi: RatingsApi, userId: number, seriesId: number, token: string): Promise<void> {
  const response = await ratingsApi.getUserSeriesRating(userId, seriesId);
  if (response.status() === 200) {
    const rating: Rating = await response.json();
    await ratingsApi.deleteRating(rating.id, token);
  }
}
