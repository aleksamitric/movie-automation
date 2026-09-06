import { APIRequestContext, APIResponse } from '@playwright/test';
import { RatingEndpoints } from '../constants/api.constants';
import { RatingCreateFilmRequest, RatingCreateSeriesRequest, RatingUpdateRequest } from '../models/rating.model';

export class RatingsApi {
  constructor(private readonly request: APIRequestContext) {}

  async createForFilm(payload: RatingCreateFilmRequest, token?: string): Promise<APIResponse> {
    return this.request.post(RatingEndpoints.CREATE_FOR_FILM, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data: payload,
    });
  }

  async createForSeries(payload: RatingCreateSeriesRequest, token?: string): Promise<APIResponse> {
    return this.request.post(RatingEndpoints.CREATE_FOR_SERIES, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      data: payload,
    });
  }

  async getAll(token: string): Promise<APIResponse> {
    return this.request.get(RatingEndpoints.GET_ALL, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getById(id: number): Promise<APIResponse> {
    return this.request.get(RatingEndpoints.getById(id));
  }

  async updateRating(id: number, payload: RatingUpdateRequest, token: string): Promise<APIResponse> {
    return this.request.put(RatingEndpoints.updateRating(id), {
      headers: { Authorization: `Bearer ${token}` },
      data: payload,
    });
  }

  async deleteRating(id: number, token: string): Promise<APIResponse> {
    return this.request.delete(RatingEndpoints.deleteRating(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getByFilmId(filmId: number): Promise<APIResponse> {
    return this.request.get(RatingEndpoints.getByFilmId(filmId));
  }

  async getBySeriesId(seriesId: number): Promise<APIResponse> {
    return this.request.get(RatingEndpoints.getBySeriesId(seriesId));
  }

  async getByUserId(userId: number): Promise<APIResponse> {
    return this.request.get(RatingEndpoints.getByUserId(userId));
  }

  async getUserFilmRating(userId: number, filmId: number): Promise<APIResponse> {
    return this.request.get(RatingEndpoints.getUserFilmRating(userId, filmId));
  }

  async getUserSeriesRating(userId: number, seriesId: number): Promise<APIResponse> {
    return this.request.get(RatingEndpoints.getUserSeriesRating(userId, seriesId));
  }
}
